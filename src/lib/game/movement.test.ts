import { describe, expect, it } from 'vitest';
import { manifestVersions, reducerVersion, rulesEdition, schemaVersion, type CanonicalEvent } from './protocol';
import { gridDistance, legalDestinations } from './movement';
import { replayEvents } from './reducer';

function event(sequence: number, actorUid: string, type: string, payload: Record<string, unknown>): CanonicalEvent {
  const clientSeq = String(sequence).padStart(6, '0');
  return {
    id: `${actorUid}-${clientSeq}`, actorUid, clientSeq, createdAt: sequence,
    manifestVersions: { ...manifestVersions }, payload, reducerVersion, rulesEdition, schemaVersion, type
  };
}

function startedGame(): CanonicalEvent[] {
  return [
    event(1, 'host', 'game/created', { roomCode: 'ROUTE', hostName: 'Ada', maxPlayers: 2, layout: 'short-path', mode: 'personal-screens' }),
    event(2, 'guest', 'player/joined', { name: 'Bora' }),
    event(3, 'host', 'player/ready', { ready: true }),
    event(4, 'guest', 'player/ready', { ready: true }),
    event(5, 'host', 'game/started', { seed: 'move-desktop-4' })
  ];
}

describe('movement and the turn skeleton', () => {
  it('derives orthogonal one/two-space destinations with an available assistant', () => {
    const projection = replayEvents(startedGame());
    const game = projection.game!;
    expect(gridDistance(game.board, 7, 14)).toBe(2);
    expect(gridDistance(game.board, 7, 15)).toBe(3);
    expect(legalDestinations(game, game.players[0])).toEqual([5, 2, 14, 4, 12, 3, 6, 11, 9, 1]);
  });

  it('drops, pays players and neutral merchants, ends early, uses Fountain, and picks up', () => {
    const history = [
      ...startedGame(),
      event(6, 'host', 'turn/moved', { destination: 14, assistantAction: 'drop' }),
      event(7, 'host', 'turn/merchant-paid', { recipientUids: [], neutralMerchantIds: ['neutral-1'] }),
      event(8, 'host', 'turn/ended', {}),
      event(9, 'guest', 'turn/moved', { destination: 14, assistantAction: 'drop' }),
      event(10, 'guest', 'turn/merchant-paid', { recipientUids: ['host'], neutralMerchantIds: [] }),
      event(11, 'guest', 'turn/ended', {}),
      event(12, 'host', 'turn/moved', { destination: 2, assistantAction: 'drop' }),
      event(13, 'host', 'turn/ended', {}),
      event(14, 'guest', 'turn/moved', { destination: 2, assistantAction: 'drop' }),
      event(15, 'host', 'turn/moved', { destination: 7, assistantAction: 'fountain' }),
      event(16, 'host', 'turn/ended', {}),
      event(17, 'guest', 'turn/moved', { destination: 7, assistantAction: 'fountain' }),
      event(18, 'guest', 'turn/ended', {}),
      event(19, 'host', 'turn/moved', { destination: 2, assistantAction: 'pick-up' })
    ];
    const projection = replayEvents(history);
    const game = projection.game!;
    const [ada, bora] = game.players;

    expect(game.turnNumber).toBe(7);
    expect(game.turnSeat).toBe(0);
    expect(game.phase).toBe('action');
    expect(ada).toMatchObject({ merchantPlace: 2, assistantsCarried: 3, assistantsByPlace: { 14: 1 }, lira: 2 });
    expect(bora).toMatchObject({ merchantPlace: 7, assistantsCarried: 2, assistantsByPlace: { 2: 1, 14: 1 }, lira: 1 });
    expect(game.lastMovement).toMatchObject({ playerUid: 'host', from: 7, to: 2, assistantAction: 'pick-up', paymentBlocked: false });
    expect(game.neutralMerchants.find(({ id }) => id === 'neutral-1')?.place).not.toBe(14);
    expect(game.players.every((player) => player.assistantsCarried + player.assistantsInSupply + Object.values(player.assistantsByPlace).reduce((sum, count) => sum + count, 0) === 5)).toBe(true);
    expect(projection.diagnostics).toEqual([]);
  });

  it('contains out-of-turn, distant, mismatched-assistant, and premature-end events', () => {
    const projection = replayEvents([
      ...startedGame(),
      event(6, 'guest', 'turn/moved', { destination: 14, assistantAction: 'drop' }),
      event(7, 'host', 'turn/moved', { destination: 15, assistantAction: 'drop' }),
      event(8, 'host', 'turn/moved', { destination: 14, assistantAction: 'pick-up' }),
      event(9, 'host', 'turn/ended', {})
    ]);
    expect(projection.diagnostics.map(({ reason }) => reason)).toEqual([
      'invalid-movement', 'illegal-destination', 'illegal-destination', 'turn-cannot-end'
    ]);
    expect(projection.game).toMatchObject({ turnNumber: 1, phase: 'movement' });
  });
});
