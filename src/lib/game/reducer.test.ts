import { describe, expect, it } from 'vitest';
import { manifestVersions, reducerVersion, rulesEdition, schemaVersion, type CanonicalEvent } from './protocol';
import { replayEvents } from './reducer';

function event(sequence: number, actorUid: string, type: string, payload: Record<string, unknown>): CanonicalEvent {
  const clientSeq = String(sequence).padStart(6, '0');
  return {
    id: `${actorUid}-${clientSeq}`,
    actorUid,
    clientSeq,
    createdAt: sequence,
    manifestVersions: { ...manifestVersions },
    payload,
    reducerVersion,
    rulesEdition,
    schemaVersion,
    type
  };
}

describe('room replay', () => {
  it('reconstructs ordered seats, configuration, and readiness from immutable events', () => {
    const projection = replayEvents([
      event(1, 'host', 'game/created', { roomCode: 'BAZAR', hostName: 'Ada', maxPlayers: 3, layout: 'short-path', mode: 'personal-screens' }),
      event(2, 'guest', 'player/joined', { name: 'Bora' }),
      event(3, 'guest', 'player/ready', { ready: true }),
      event(4, 'host', 'game/configured', { maxPlayers: 3, layout: 'long-path', mode: 'personal-screens' }),
      event(5, 'guest', 'player/ready', { ready: true })
    ]);

    expect(projection.room).toMatchObject({
      roomCode: 'BAZAR',
      layout: 'long-path',
      seats: [
        { name: 'Ada', ready: false },
        { name: 'Bora', ready: true }
      ]
    });
    expect(projection.acceptedEventIds).toHaveLength(5);
    expect(projection.diagnostics).toEqual([]);
    expect(projection.game).toBeNull();
  });

  it('sorts canonically and contains invalid, duplicate, and unauthorized events', () => {
    const created = event(1, 'host', 'game/created', { roomCode: 'BAZAR', hostName: 'Ada', maxPlayers: 2, layout: 'short-path', mode: 'personal-screens' });
    const projection = replayEvents([
      event(4, 'guest', 'game/configured', { maxPlayers: 5, layout: 'random', mode: 'shared-table' }),
      event(3, 'guest', 'player/joined', { name: 'Bora' }),
      created,
      created,
      event(5, 'third', 'player/joined', { name: 'Cem' })
    ]);

    expect(projection.room?.seats.map(({ name }) => name)).toEqual(['Ada', 'Bora']);
    expect(projection.acceptedEventIds).toHaveLength(2);
    expect(projection.diagnostics.map(({ reason }) => reason)).toEqual(['host-only', 'room-full']);
  });

  it('starts with every currently joined merchant when the open room is ready', () => {
    const projection = replayEvents([
      event(1, 'host', 'game/created', { roomCode: 'OPENR', hostName: 'Ada', maxPlayers: 5, layout: 'short-path', mode: 'shared-table' }),
      event(2, 'guest', 'player/joined', { name: 'Bora' }),
      event(3, 'host', 'player/ready', { ready: true }),
      event(4, 'guest', 'player/ready', { ready: true }),
      event(5, 'host', 'game/started', { seed: 'everyone-here' })
    ]);

    expect(projection.room).toMatchObject({ status: 'playing', maxPlayers: 5 });
    expect(projection.game?.players.map(({ name }) => name)).toEqual(['Ada', 'Bora']);
    expect(projection.acceptedEventIds).toHaveLength(5);
    expect(projection.diagnostics).toEqual([]);
  });

  it('lets a dedicated tabletop own an empty room and start its ready merchants', () => {
    const projection = replayEvents([
      event(1, 'table', 'game/created', { roomCode: 'TABLE', tabletopOwned: true, maxPlayers: 5, layout: 'short-path', mode: 'shared-table' }),
      event(2, 'ada', 'player/joined', { name: 'Ada' }),
      event(3, 'bora', 'player/joined', { name: 'Bora' }),
      event(4, 'ada', 'player/ready', { ready: true }),
      event(5, 'bora', 'player/ready', { ready: true }),
      event(6, 'table', 'game/started', { seed: 'table-owned' })
    ]);

    expect(projection.room).toMatchObject({ hostUid: 'table', tabletopOwned: true, status: 'playing' });
    expect(projection.game?.players.map(({ name }) => name)).toEqual(['Ada', 'Bora']);
    expect(projection.acceptedEventIds).toHaveLength(6);
    expect(projection.diagnostics).toEqual([]);
  });
});
