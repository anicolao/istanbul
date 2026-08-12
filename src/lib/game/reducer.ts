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
import {
  buyWheelbarrowExtension,
  collectPostOffice,
  isPlaceActionChoice,
  recallAssistants,
  resolveBlackMarket,
  resolveTeaHouse,
  sellAtMarket,
  tradeAtCaravansary,
  warehouseGood
} from './actions';
import { catchFamily, drawBonus, isEncounterChoice, relocateEncounter } from './encounters';
import type { Good } from './manifests';

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

  if (event.type === 'place/action-taken') {
    return applyPlaceAction(state, event);
  }

  if (event.type === 'encounter/resolved') {
    return applyEncounter(state, event);
  }

  if (event.type === 'turn/ended') {
    const game = state.game;
    const player = game.players[game.turnSeat];
    if (!['action', 'family-action', 'turn-end'].includes(game.phase) || event.actorUid !== player.uid) {
      reject(state, event, 'turn-cannot-end');
      return false;
    }
    if (game.phase === 'action' && beginEncounters(game)) return true;
    advanceTurn(game);
    return true;
  }

  reject(state, event, 'unknown-event-type');
  return false;
}

function applyPlaceAction(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const choice = event.payload.choice;
  const familyPending = game.phase === 'family-action' && game.pending?.kind === 'family-action' ? game.pending : null;
  const familyAction = familyPending !== null;
  if ((game.phase !== 'action' && !familyAction) || event.actorUid !== player.uid || !isPlaceActionChoice(choice)) {
    reject(state, event, 'invalid-place-action');
    return false;
  }
  const actionPlace = familyPending?.destination ?? player.merchantPlace;

  let summary: string | null = null;
  if (choice.kind === 'police-send') {
    if (actionPlace !== 12 || familyAction || player.familyPlace !== 12) {
      reject(state, event, 'police-unavailable');
      return false;
    }
    player.familyPlace = choice.destination;
    game.lastAction = { playerUid: player.uid, place: 12, kind: choice.kind, summary: `Sent the family member to Place ${choice.destination}.` };
    game.pending = { kind: 'family-action', destination: choice.destination };
    game.phase = 'family-action';
    return true;
  } else if (choice.kind === 'wainwright-buy') {
    if (actionPlace !== 1) {
      reject(state, event, 'wainwright-unavailable');
      return false;
    }
    summary = buyWheelbarrowExtension(game, player);
    if (!summary) { reject(state, event, 'wainwright-unavailable'); return false; }
  } else if (choice.kind === 'warehouse-fill') {
    if (warehouseGood(actionPlace) !== choice.good) {
      reject(state, event, 'wrong-warehouse');
      return false;
    }
    player.goods[choice.good] = player.capacity;
    summary = `Filled ${choice.good} to capacity ${player.capacity}.`;
  } else if (choice.kind === 'fountain-recall') {
    if (actionPlace !== 7) {
      reject(state, event, 'invalid-fountain-recall');
      return false;
    }
    summary = recallAssistants(player, choice.assistantPlaces);
    if (!summary) { reject(state, event, 'invalid-fountain-recall'); return false; }
  } else if (choice.kind === 'post-office-collect') {
    if (actionPlace !== 5) { reject(state, event, 'post-office-unavailable'); return false; }
    summary = collectPostOffice(game, player);
  } else if (choice.kind === 'caravansary-trade') {
    if (actionPlace !== 6) { reject(state, event, 'caravansary-unavailable'); return false; }
    summary = tradeAtCaravansary(game, player, choice.drawSources, choice.discardCardId);
    if (!summary) { reject(state, event, 'invalid-caravansary-trade'); return false; }
  } else if (choice.kind === 'market-sell') {
    if (actionPlace !== 10 && actionPlace !== 11) {
      reject(state, event, 'market-unavailable');
      return false;
    }
    summary = sellAtMarket(game, player, actionPlace, choice.slotIndexes);
    if (!summary) { reject(state, event, 'invalid-market-sale'); return false; }
  } else if (choice.kind === 'black-market-roll') {
    if (actionPlace !== 8) { reject(state, event, 'black-market-unavailable'); return false; }
    const dice = rollDice(createRandom(`${game.seed}:place-roll:${game.turnNumber}:8${familyAction ? ':family' : ''}`));
    const jewelryBefore = player.goods.jewelry;
    summary = resolveBlackMarket(player, choice.good, dice);
    game.lastRoll = { playerUid: player.uid, place: 8, dice, reward: player.goods.jewelry - jewelryBefore };
  } else {
    if (actionPlace !== 9) { reject(state, event, 'tea-house-unavailable'); return false; }
    const dice = rollDice(createRandom(`${game.seed}:place-roll:${game.turnNumber}:9${familyAction ? ':family' : ''}`));
    const liraBefore = player.lira;
    summary = resolveTeaHouse(player, choice.wager, dice);
    game.lastRoll = { playerUid: player.uid, place: 9, dice, declared: choice.wager, reward: player.lira - liraBefore };
  }

  game.lastAction = { playerUid: player.uid, place: actionPlace, kind: choice.kind, summary };
  game.pending = null;
  if (familyAction || !beginEncounters(game)) game.phase = 'turn-end';
  return true;
}

function applyEncounter(state: ReplayProjection, event: CanonicalEvent): boolean {
  const game = state.game!;
  const player = game.players[game.turnSeat];
  const pending = game.pending;
  const choice = event.payload.choice;
  if (game.phase !== 'encounters' || event.actorUid !== player.uid || pending?.kind !== 'encounters' || !isEncounterChoice(choice)) {
    reject(state, event, 'invalid-encounter');
    return false;
  }
  if (pending.governor === 'payment' && choice.kind !== 'governor-pay') {
    reject(state, event, 'governor-payment-required');
    return false;
  }

  let summary = '';
  let dice: [number, number] | undefined;
  let destination: number | undefined;
  if (choice.kind === 'catch-family') {
    if (!pending.familyUids.includes(choice.familyUid)) { reject(state, event, 'family-not-present'); return false; }
    const result = catchFamily(game, player, choice.familyUid, choice.reward);
    if (!result) { reject(state, event, 'invalid-family-reward'); return false; }
    pending.familyUids = pending.familyUids.filter((uid) => uid !== choice.familyUid);
    summary = result;
  } else if (choice.kind === 'governor-visit') {
    if (pending.governor !== 'available') { reject(state, event, 'governor-unavailable'); return false; }
    if (!choice.accept) {
      pending.governor = null;
      summary = 'Declined the Governor; the token remained in place.';
    } else {
      const card = drawBonus(game, `governor:${game.turnNumber}`);
      if (!card) { reject(state, event, 'bonus-deck-empty'); return false; }
      player.bonusHand.push(card);
      pending.governor = 'payment';
      summary = 'Drew 1 Bonus card from the Governor; payment is now mandatory.';
    }
  } else if (choice.kind === 'governor-pay') {
    if (pending.governor !== 'payment') { reject(state, event, 'governor-payment-unavailable'); return false; }
    if (choice.payment === 'lira') {
      if (player.lira < 2) { reject(state, event, 'governor-payment-shortfall'); return false; }
      player.lira -= 2;
      summary = 'Paid the Governor 2 Lira';
    } else {
      const cardIndex = player.bonusHand.indexOf(choice.discardCardId ?? '');
      if (cardIndex < 0) { reject(state, event, 'governor-card-not-owned'); return false; }
      game.bonusDiscard.push(player.bonusHand.splice(cardIndex, 1)[0]);
      summary = 'Discarded 1 Bonus card for the Governor';
    }
    dice = relocateEncounter(game, 'governor');
    destination = game.governorPlace;
    pending.governor = null;
    summary += ` and relocated the token to Place ${destination}.`;
  } else if (!choice.accept) {
    if (!pending.smuggler) { reject(state, event, 'smuggler-unavailable'); return false; }
    pending.smuggler = false;
    summary = 'Declined the Smuggler; the token remained in place.';
  } else {
    if (!pending.smuggler || player.goods[choice.good] >= player.capacity) { reject(state, event, 'smuggler-unavailable'); return false; }
    player.goods[choice.good] += 1;
    if (choice.payment === 'lira') {
      if (player.lira < 2) { player.goods[choice.good] -= 1; reject(state, event, 'smuggler-payment-shortfall'); return false; }
      player.lira -= 2;
      summary = `Took 1 ${choice.good} and paid the Smuggler 2 Lira`;
    } else {
      const paymentGood = choice.paymentGood as Good;
      if (player.goods[paymentGood] < 1) { player.goods[choice.good] -= 1; reject(state, event, 'smuggler-good-unavailable'); return false; }
      player.goods[paymentGood] -= 1;
      summary = `Took 1 ${choice.good} and paid the Smuggler 1 ${paymentGood}`;
    }
    dice = relocateEncounter(game, 'smuggler');
    destination = game.smugglerPlace;
    pending.smuggler = false;
    summary += `; relocated the token to Place ${destination}.`;
  }

  game.encounterLog.push({ kind: choice.kind, summary, ...(dice ? { dice } : {}), ...(destination ? { destination } : {}) });
  if (pending.familyUids.length === 0 && pending.governor === null && !pending.smuggler) {
    game.pending = null;
    game.phase = 'turn-end';
  }
  return true;
}

function beginEncounters(game: NonNullable<ReplayProjection['game']>): boolean {
  const player = game.players[game.turnSeat];
  const place = player.merchantPlace;
  const familyUids = place === 12 ? [] : game.players
    .filter((candidate) => candidate.uid !== player.uid && candidate.familyPlace === place)
    .map(({ uid }) => uid);
  const governor = game.governorPlace === place ? 'available' as const : null;
  const smuggler = game.smugglerPlace === place;
  if (familyUids.length === 0 && governor === null && !smuggler) return false;
  game.pending = { kind: 'encounters', familyUids, governor, smuggler };
  game.phase = 'encounters';
  return true;
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
    game.phase !== 'merchant-payment' || event.actorUid !== player.uid || pending?.kind !== 'merchant-payment' ||
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
  game.encounterLog = [];
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
