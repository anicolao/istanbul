import type { GameSetup } from './setup';

export const schemaVersion = 1;
export const reducerVersion = 1;
export const rulesEdition = 'istanbul-2014-base';
export const maxRoomPlayers = 5;
export const manifestVersions = {
  places: 'istanbul-2014-base-v1',
  cards: 'istanbul-2014-base-v1',
  tiles: 'istanbul-2014-base-v1',
  random: 'xorshift32-v1'
} as const;

export type RoomMode = 'personal-screens' | 'shared-table';
export type LayoutKind = 'short-path' | 'long-path' | 'number-order' | 'random';
export type TablePosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const tablePositions: TablePosition[] = [1, 2, 3, 4, 5, 6, 7, 8];
export const tablePositionNames: Record<TablePosition, string> = {
  1: 'Top-left corner',
  2: 'Top edge',
  3: 'Top-right corner',
  4: 'Right edge',
  5: 'Bottom-right corner',
  6: 'Bottom edge',
  7: 'Bottom-left corner',
  8: 'Left edge'
};

export interface CanonicalEvent {
  id: string;
  actorUid: string;
  clientSeq: string;
  createdAt: number | null;
  manifestVersions: Record<string, string>;
  payload: Record<string, unknown>;
  reducerVersion: number;
  rulesEdition: string;
  schemaVersion: number;
  type: string;
}

export interface Seat {
  uid: string;
  name: string;
  ready: boolean;
  tablePosition?: TablePosition;
}

export interface RoomProjection {
  roomCode: string;
  hostUid: string;
  tabletopOwned?: boolean;
  status: 'lobby' | 'playing';
  seats: Seat[];
  maxPlayers: number;
  layout: LayoutKind;
  mode: RoomMode;
}

export interface ReplayProjection {
  room: RoomProjection | null;
  game: GameSetup | null;
  acceptedEventIds: string[];
  diagnostics: Array<{ eventId: string; reason: string }>;
  undo: {
    targetEventId: string;
    actorUid: string;
    actorUids: string[];
    label: string;
    blockedReason: string | null;
  } | null;
  undoLog: Array<{
    eventId: string;
    targetEventId: string;
    actorUid: string;
    label: string;
    actionCount: number;
  }>;
  gameLog: Array<{
    eventId: string;
    actorUid: string;
    ownerUid: string;
    label: string;
    summary: string;
    dice: [number, number] | null;
    turnNumber: number;
    epoch: number;
    active: boolean;
    barrierReason: string | null;
    blockedReason: string | null;
    rollbackCount: number;
    rollbackActorUids: string[];
  }>;
}

export const layoutNames: Record<LayoutKind, string> = {
  'short-path': 'Short Path',
  'long-path': 'Long Path',
  'number-order': 'Number Order',
  random: 'Seeded Random'
};

export const modeNames: Record<RoomMode, string> = {
  'personal-screens': 'Personal screens',
  'shared-table': 'Shared table'
};

export function isRoomCode(value: string): boolean {
  return /^[A-Z]{5}$/.test(value);
}

export function normalizeRoomCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
}

export function isTablePosition(value: unknown): value is TablePosition {
  return typeof value === 'number' && Number.isInteger(value) && tablePositions.includes(value as TablePosition);
}

export function isCanonicalEvent(value: unknown): value is CanonicalEvent {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<CanonicalEvent>;
  return (
    typeof event.id === 'string' &&
    typeof event.actorUid === 'string' &&
    typeof event.clientSeq === 'string' &&
    event.id === `${event.actorUid}-${event.clientSeq}` &&
    /^\d{6}$/.test(event.clientSeq) &&
    (event.createdAt === null || typeof event.createdAt === 'number') &&
    typeof event.payload === 'object' &&
    event.payload !== null &&
    event.schemaVersion === schemaVersion &&
    event.reducerVersion === reducerVersion &&
    event.rulesEdition === rulesEdition &&
    typeof event.manifestVersions === 'object' &&
    event.manifestVersions !== null &&
    event.manifestVersions.places === manifestVersions.places &&
    event.manifestVersions.cards === manifestVersions.cards &&
    event.manifestVersions.tiles === manifestVersions.tiles &&
    event.manifestVersions.random === manifestVersions.random &&
    typeof event.type === 'string' &&
    event.type.length > 0
  );
}

export function canonicalSort(events: CanonicalEvent[]): CanonicalEvent[] {
  return [...events].sort((left, right) => {
    if (left.createdAt === null && right.createdAt !== null) return 1;
    if (left.createdAt !== null && right.createdAt === null) return -1;
    if (left.createdAt !== right.createdAt) return (left.createdAt ?? 0) - (right.createdAt ?? 0);
    return left.id.localeCompare(right.id);
  });
}
