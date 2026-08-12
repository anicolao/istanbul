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

  reject(state, event, 'unknown-event-type');
  return false;
}

function isLayout(value: unknown): value is LayoutKind {
  return ['short-path', 'long-path', 'number-order', 'random'].includes(String(value));
}

function isMode(value: unknown): value is RoomMode {
  return value === 'personal-screens' || value === 'shared-table';
}
