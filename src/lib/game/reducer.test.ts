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
      event(2, 'ada', 'player/joined', { name: 'Ada', tablePosition: 6 }),
      event(3, 'bora', 'player/joined', { name: 'Bora', tablePosition: 2 }),
      event(4, 'ada', 'player/ready', { ready: true }),
      event(5, 'bora', 'player/ready', { ready: true }),
      event(6, 'table', 'game/started', { seed: 'table-owned' })
    ]);

    expect(projection.room).toMatchObject({ hostUid: 'table', tabletopOwned: true, status: 'playing' });
    expect(projection.room?.seats.map(({ name, tablePosition }) => ({ name, tablePosition }))).toEqual([
      { name: 'Bora', tablePosition: 2 },
      { name: 'Ada', tablePosition: 6 }
    ]);
    expect(projection.game?.players.map(({ name }) => name)).toEqual(['Bora', 'Ada']);
    expect(projection.acceptedEventIds).toHaveLength(6);
    expect(projection.diagnostics).toEqual([]);
  });

  it('lets the dedicated tabletop author public turns while cards remain player-authored', () => {
    const setup = [
      event(1, 'table', 'game/created', { roomCode: 'TABLE', tabletopOwned: true, maxPlayers: 5, layout: 'short-path', mode: 'shared-table' }),
      event(2, 'ada', 'player/joined', { name: 'Ada', tablePosition: 2 }),
      event(3, 'bora', 'player/joined', { name: 'Bora', tablePosition: 6 }),
      event(4, 'ada', 'player/ready', { ready: true }),
      event(5, 'bora', 'player/ready', { ready: true }),
      event(6, 'table', 'game/started', { seed: 'recovery-12' })
    ];
    const started = replayEvents(setup);
    const player = started.game!.players[started.game!.turnSeat];
    const other = started.game!.players[1 - started.game!.turnSeat];
    const projection = replayEvents([
      ...setup,
      event(7, 'table', 'turn/moved', { destination: 4, assistantAction: 'drop' }),
      event(8, other.uid, 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fruit' } }),
      event(9, 'table', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fruit' } }),
      event(10, 'table', 'bonus/played', { cardId: player.bonusHand[0], choice: { kind: 'gain-lira' } })
    ]);

    expect(projection.game).toMatchObject({ phase: 'turn-end', players: [{ merchantPlace: 4, goods: { fruit: 2 } }, {}] });
    expect(projection.acceptedEventIds).toHaveLength(8);
    expect(projection.diagnostics.map(({ reason }) => reason)).toEqual(['invalid-place-action', 'invalid-bonus-play']);
  });

  it('orders unique physical positions and gives legacy joins the first open position', () => {
    const projection = replayEvents([
      event(1, 'table', 'game/created', { roomCode: 'CLOCK', tabletopOwned: true, maxPlayers: 5, layout: 'short-path', mode: 'shared-table' }),
      event(2, 'ada', 'player/joined', { name: 'Ada', tablePosition: 8 }),
      event(3, 'bora', 'player/joined', { name: 'Bora', tablePosition: 3 }),
      event(4, 'cem', 'player/joined', { name: 'Cem', tablePosition: 8 }),
      event(5, 'derya', 'player/joined', { name: 'Derya' })
    ]);

    expect(projection.room?.seats.map(({ name, tablePosition }) => ({ name, tablePosition }))).toEqual([
      { name: 'Derya', tablePosition: 1 },
      { name: 'Bora', tablePosition: 3 },
      { name: 'Ada', tablePosition: 8 }
    ]);
    expect(projection.diagnostics.map(({ reason }) => reason)).toEqual(['invalid-table-position']);
  });
});
