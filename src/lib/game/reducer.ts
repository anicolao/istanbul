import {
  canonicalSort,
  isCanonicalEvent,
  isRoomCode,
  type CanonicalEvent,
  type LayoutKind,
  type ReplayProjection,
  type RoomMode
} from './protocol';
import { createSetup } from './setup';
import { createRandom, rollDice } from './random';
import { gridDistance, requiredAssistantAction, type AssistantAction } from './movement';

const emptyProjection = (): ReplayProjection => ({
  room: null,
  game: null,
  acceptedEventIds: [],
  diagnostics: []
});

function stringField(payload: Record<string, unknown>, field: string): string | null {
  const value = payload[field];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function reject(state: ReplayProjection, event: CanonicalEvent, reason: string) {
  state.diagnostics.push({ eventId: event.id, reason });
}

export function replayEvents(events: unknown[]): ReplayProjection {
  const state = emptyProjection();
  const seen = new Set<string>();
  const validEvents: CanonicalEvent[] = [];

  for (const value of events) {
    if (!isCanonicalEvent(value)) {
      const eventId = value && typeof value === 'object' && 'id' in value
        ? String(value.id)
        : 'malformed';
      state.diagnostics.push({ eventId, reason: 'invalid-envelope' });
    } else {
      validEvents.push(value);
    }
  }

  for (const event of canonicalSort(validEvents)) {
    if (seen.has(event.id)) continue;
    seen.add(event.id);
    const accepted = applyEvent(state, event);
    if (accepted) state.acceptedEventIds.push(event.id);
  }

  return state;
}

function applyEvent(state: ReplayProjection, event: CanonicalEvent): boolean {
  if (event.type === 'game/created') {
    if (state.room) {
      reject(state, event, 'room-already-created');
      return false;
    }
    const roomCode = stringField(event.payload, 'roomCode');
    const hostName = stringField(event.payload, 'hostName');
    const maxPlayers = event.payload.maxPlayers;
    const layout = event.payload.layout;
    const mode = event.payload.mode;
    if (
      !roomCode || !isRoomCode(roomCode) || !hostName ||
      typeof maxPlayers !== 'number' || maxPlayers < 2 || maxPlayers > 5 ||
      !isLayout(layout) || !isMode(mode)
    ) {
      reject(state, event, 'invalid-room-creation');
      return false;
    }
    state.room = {
      roomCode,
      hostUid: event.actorUid,
      status: 'lobby',
      seats: [{ uid: event.actorUid, name: hostName, ready: false }],
      maxPlayers,
      layout,
      mode
    };
    return true;
  }

  if (!state.room) {
    reject(state, event, 'room-not-created');
    return false;
  }

  if (event.type === 'player/joined') {
    const name = stringField(event.payload, 'name');
    if (state.room.status !== 'lobby' || !name || name.length > 24) {
      reject(state, event, 'invalid-player-name');
      return false;
    }
    if (state.room.seats.some((seat) => seat.uid === event.actorUid)) {
      reject(state, event, 'player-already-seated');
      return false;
    }
    if (state.room.seats.length >= state.room.maxPlayers) {
      reject(state, event, 'room-full');
      return false;
    }
    state.room.seats.push({ uid: event.actorUid, name, ready: false });
    return true;
  }

  if (event.type === 'game/configured') {
    if (state.room.status !== 'lobby' || event.actorUid !== state.room.hostUid) {
      reject(state, event, 'host-only');
      return false;
    }
    const maxPlayers = event.payload.maxPlayers;
    const layout = event.payload.layout;
    const mode = event.payload.mode;
    if (
      typeof maxPlayers !== 'number' || maxPlayers < state.room.seats.length || maxPlayers > 5 ||
      !isLayout(layout) || !isMode(mode)
    ) {
      reject(state, event, 'invalid-configuration');
      return false;
    }
    state.room.maxPlayers = maxPlayers;
    state.room.layout = layout;
    state.room.mode = mode;
    state.room.seats = state.room.seats.map((seat) => ({ ...seat, ready: false }));
    return true;
  }

  if (event.type === 'player/ready') {
    const seat = state.room.seats.find((candidate) => candidate.uid === event.actorUid);
    if (state.room.status !== 'lobby' || !seat || typeof event.payload.ready !== 'boolean') {
      reject(state, event, 'invalid-readiness');
      return false;
    }
    seat.ready = event.payload.ready;
    return true;
  }

  if (event.type === 'game/started') {
    const seed = stringField(event.payload, 'seed');
    if (
      state.room.status !== 'lobby' ||
      event.actorUid !== state.room.hostUid ||
      state.room.seats.length < 2 ||
      !state.room.seats.every(({ ready }) => ready) ||
      !seed || seed.length > 96
    ) {
      reject(state, event, 'invalid-game-start');
      return false;
    }
    state.game = createSetup(state.room, seed);
    state.room.status = 'playing';
    return true;
  }

  if (!state.game || state.room.status !== 'playing') {
    reject(state, event, 'game-not-playing');
    return false;
  }

  if (event.type === 'turn/moved') {
    return applyMovement(state, event);
  }

  if (event.type === 'turn/merchant-paid') {
    return applyMerchantPayment(state, event);
  }

  if (event.type === 'turn/ended') {
    const game = state.game;
    const player = game.players[game.turnSeat];
    if (game.phase !== 'action' || event.actorUid !== player.uid) {
      reject(state, event, 'turn-cannot-end');
      return false;
    }
    advanceTurn(game);
    return true;
  }

  reject(state, event, 'unknown-event-type');
  return false;
}

function applyMovement(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const destination = event.payload.destination;
  const assistantAction = event.payload.assistantAction;
  if (
    game.phase !== 'movement' || event.actorUid !== player.uid ||
    typeof destination !== 'number' || !Number.isInteger(destination) ||
    !isAssistantAction(assistantAction)
  ) {
    reject(state, event, 'invalid-movement');
    return false;
  }
  const distance = gridDistance(game.board, player.merchantPlace, destination);
  const requiredAction = requiredAssistantAction(player, destination);
  if (distance < 1 || distance > 2 || !requiredAction || assistantAction !== requiredAction) {
    reject(state, event, 'illegal-destination');
    return false;
  }

  const from = player.merchantPlace;
  const recipientUids = destination === 7 ? [] : game.players
    .filter((candidate) => candidate.uid !== player.uid && candidate.merchantPlace === destination)
    .map(({ uid }) => uid);
  const neutralMerchantIds = destination === 7 ? [] : game.neutralMerchants
    .filter(({ place }) => place === destination)
    .map(({ id }) => id);
  const paymentTotal = (recipientUids.length + neutralMerchantIds.length) * 2;

  player.merchantPlace = destination;
  if (assistantAction === 'drop') {
    player.assistantsCarried -= 1;
    player.assistantsByPlace[destination] = (player.assistantsByPlace[destination] ?? 0) + 1;
  } else if (assistantAction === 'pick-up') {
    player.assistantsCarried += 1;
    const remaining = (player.assistantsByPlace[destination] ?? 0) - 1;
    if (remaining === 0) delete player.assistantsByPlace[destination];
    else player.assistantsByPlace[destination] = remaining;
  }

  const paymentBlocked = player.lira < paymentTotal;
  game.lastMovement = { playerUid: player.uid, from, to: destination, distance, assistantAction, paymentTotal, paymentBlocked };
  if (paymentBlocked) {
    advanceTurn(game);
  } else if (paymentTotal > 0) {
    game.pending = { kind: 'merchant-payment', recipientUids, neutralMerchantIds, total: paymentTotal };
    game.phase = 'merchant-payment';
  } else {
    game.pending = null;
    game.phase = 'action';
  }
  return true;
}

function applyMerchantPayment(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const pending = game.pending;
  const recipientUids = stringArray(event.payload.recipientUids);
  const neutralMerchantIds = stringArray(event.payload.neutralMerchantIds);
  if (
    game.phase !== 'merchant-payment' || event.actorUid !== player.uid || !pending ||
    !recipientUids || !neutralMerchantIds ||
    recipientUids.join('|') !== pending.recipientUids.join('|') ||
    neutralMerchantIds.join('|') !== pending.neutralMerchantIds.join('|') ||
    player.lira < pending.total
  ) {
    reject(state, event, 'invalid-merchant-payment');
    return false;
  }
  player.lira -= pending.total;
  for (const uid of pending.recipientUids) game.players.find((candidate) => candidate.uid === uid)!.lira += 2;
  for (const id of pending.neutralMerchantIds) {
    const neutral = game.neutralMerchants.find((candidate) => candidate.id === id)!;
    const random = createRandom(`${game.seed}:neutral:${game.turnNumber}:${id}`);
    const dice = rollDice(random);
    neutral.place = dice[0] + dice[1];
  }
  game.pending = null;
  game.phase = 'action';
  return true;
}

function advanceTurn(game: NonNullable<ReplayProjection['game']>) {
  game.turnSeat = (game.turnSeat + 1) % game.players.length;
  game.turnNumber += 1;
  game.phase = 'movement';
  game.pending = null;
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string') ? value : null;
}

function isAssistantAction(value: unknown): value is AssistantAction {
  return value === 'drop' || value === 'pick-up' || value === 'fountain';
}

function isLayout(value: unknown): value is LayoutKind {
  return ['short-path', 'long-path', 'number-order', 'random'].includes(String(value));
}

function isMode(value: unknown): value is RoomMode {
  return value === 'personal-screens' || value === 'shared-table';
}
