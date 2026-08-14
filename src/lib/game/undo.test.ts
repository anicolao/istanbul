import { describe, expect, it } from 'vitest';
import { manifestVersions, reducerVersion, rulesEdition, schemaVersion, type CanonicalEvent } from './protocol';
import { replayEvents, revealedInformationReason } from './reducer';

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

function startedGame(): CanonicalEvent[] {
  return [
    event(1, 'host', 'game/created', { roomCode: 'UNDOS', hostName: 'Ada', maxPlayers: 2, layout: 'short-path', mode: 'personal-screens' }),
    event(2, 'guest', 'player/joined', { name: 'Bora' }),
    event(3, 'host', 'player/ready', { ready: true }),
    event(4, 'guest', 'player/ready', { ready: true }),
    event(5, 'host', 'game/started', { seed: 'move-desktop-4' })
  ];
}

describe('append-only undo replay', () => {
  it('walks backward through reversible actions while retaining both actions and undos in immutable history', () => {
    const moved = event(6, 'host', 'turn/moved', { destination: 4, assistantAction: 'drop' });
    const filled = event(7, 'host', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fruit' } });
    const undoFill = event(8, 'host', 'action/undone', { targetEventId: filled.id });
    const afterFillUndo = replayEvents([...startedGame(), moved, filled, undoFill]);

    expect(afterFillUndo.game).toMatchObject({
      phase: 'action',
      players: [{ merchantPlace: 4, assistantsCarried: 3, assistantsByPlace: { 4: 1 }, goods: { fruit: 0 } }, {}]
    });
    expect(afterFillUndo.acceptedEventIds).toHaveLength(8);
    expect(afterFillUndo.undo).toMatchObject({ targetEventId: moved.id, actorUid: 'host', label: 'move to Place 4', blockedReason: null });
    expect(afterFillUndo.undoLog).toEqual([{ eventId: undoFill.id, targetEventId: filled.id, actorUid: 'host', label: 'warehouse fill' }]);

    const undoMove = event(9, 'host', 'action/undone', { targetEventId: moved.id });
    const restored = replayEvents([...startedGame(), moved, filled, undoFill, undoMove]);
    expect(restored.game).toMatchObject({ phase: 'movement', turnNumber: 1, players: [{ merchantPlace: 7, assistantsCarried: 4, assistantsByPlace: {} }, {}] });
    expect(restored.acceptedEventIds).toHaveLength(9);
    expect(restored.undo).toBeNull();
    expect(restored.undoLog.map(({ targetEventId }) => targetEventId)).toEqual([filled.id, moved.id]);
    expect(restored.diagnostics).toEqual([]);
  });

  it('accepts a replacement action after undo instead of resurrecting the suppressed event', () => {
    const firstMove = event(6, 'host', 'turn/moved', { destination: 4, assistantAction: 'drop' });
    const undoMove = event(7, 'host', 'action/undone', { targetEventId: firstMove.id });
    const replacement = event(8, 'host', 'turn/moved', { destination: 2, assistantAction: 'drop' });
    const projection = replayEvents([...startedGame(), firstMove, undoMove, replacement]);

    expect(projection.game).toMatchObject({ phase: 'action', players: [{ merchantPlace: 2, assistantsByPlace: { 2: 1 } }, {}] });
    expect(projection.undo).toMatchObject({ targetEventId: replacement.id, label: 'move to Place 2' });
    expect(projection.acceptedEventIds).toHaveLength(8);
    expect(projection.diagnostics).toEqual([]);
  });

  it('contains stale, unauthorized, and duplicate undo attempts deterministically', () => {
    const moved = event(6, 'host', 'turn/moved', { destination: 4, assistantAction: 'drop' });
    const filled = event(7, 'host', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fruit' } });
    const projection = replayEvents([
      ...startedGame(),
      moved,
      filled,
      event(8, 'host', 'action/undone', { targetEventId: moved.id }),
      event(9, 'guest', 'action/undone', { targetEventId: filled.id }),
      event(10, 'host', 'action/undone', { targetEventId: filled.id }),
      event(11, 'host', 'action/undone', { targetEventId: filled.id })
    ]);

    expect(projection.game).toMatchObject({ phase: 'action', players: [{ merchantPlace: 4, goods: { fruit: 0 } }, {}] });
    expect(projection.diagnostics.map(({ reason }) => reason)).toEqual([
      'stale-undo-target',
      'undo-not-authorized',
      'stale-undo-target'
    ]);
    expect(projection.undoLog).toHaveLength(1);
  });

  it('locks the stream at Caravansary draws and dice rolls without mutating their revealed result', () => {
    const setup = startedGame();
    const startingCard = replayEvents(setup).game!.players[0].bonusHand[0];
    const movedToCaravansary = event(6, 'host', 'turn/moved', { destination: 6, assistantAction: 'drop' });
    const trade = event(7, 'host', 'place/action-taken', { choice: { kind: 'caravansary-trade', drawSources: ['deck', 'deck'], discardCardId: startingCard } });
    const drawProjection = replayEvents([...setup, movedToCaravansary, trade, event(8, 'host', 'action/undone', { targetEventId: trade.id })]);
    expect(drawProjection.game).toMatchObject({ phase: 'turn-end', players: [{ merchantPlace: 6, bonusHand: expect.any(Array) }, {}] });
    expect(drawProjection.game!.players[0].bonusHand).toHaveLength(2);
    expect(drawProjection.undo).toMatchObject({ targetEventId: trade.id, blockedReason: 'Bonus cards were revealed' });
    expect(drawProjection.diagnostics.map(({ reason }) => reason)).toEqual(['undo-revealed-information']);

    const movedToTeaHouse = event(6, 'host', 'turn/moved', { destination: 9, assistantAction: 'drop' });
    const roll = event(7, 'host', 'place/action-taken', { choice: { kind: 'tea-house-wager', wager: 7 } });
    const rollProjection = replayEvents([...setup, movedToTeaHouse, roll, event(8, 'host', 'action/undone', { targetEventId: roll.id })]);
    expect(rollProjection.game).toMatchObject({ lastRoll: { place: 9, dice: expect.any(Array) } });
    expect(rollProjection.undo).toMatchObject({ targetEventId: roll.id, blockedReason: 'dice were rolled' });
    expect(rollProjection.diagnostics.map(({ reason }) => reason)).toEqual(['undo-revealed-information']);
  });

  it('classifies every gameplay path that exposes a new card or die result', () => {
    const cases: Array<[CanonicalEvent, string | null]> = [
      [event(1, 'p', 'place/action-taken', { choice: { kind: 'market-sell' } }), null],
      [event(2, 'p', 'place/action-taken', { choice: { kind: 'caravansary-trade' } }), 'Bonus cards were revealed'],
      [event(3, 'p', 'place/action-taken', { choice: { kind: 'black-market-roll' } }), 'dice were rolled'],
      [event(4, 'p', 'place/action-taken', { choice: { kind: 'tea-house-wager' } }), 'dice were rolled'],
      [event(5, 'p', 'turn/merchant-paid', { neutralMerchantIds: ['neutral-1'] }), 'a neutral merchant was relocated by dice'],
      [event(6, 'p', 'encounter/resolved', { choice: { kind: 'catch-family', reward: 'bonus' } }), 'a Bonus card was drawn'],
      [event(7, 'p', 'encounter/resolved', { choice: { kind: 'governor-visit', accept: true } }), 'a Bonus card was drawn'],
      [event(8, 'p', 'encounter/resolved', { choice: { kind: 'governor-pay' } }), 'the Governor was relocated by dice'],
      [event(9, 'p', 'encounter/resolved', { choice: { kind: 'smuggler-trade', accept: true } }), 'the Smuggler was relocated by dice'],
      [event(10, 'p', 'mosque/ability-used', { choice: { kind: 'dice-adjust', adjustment: 'reroll' } }), 'a die was rerolled'],
      [event(11, 'p', 'mosque/ability-used', { choice: { kind: 'dice-adjust', adjustment: 'first-to-four' } }), null],
      [event(12, 'p', 'bonus/played', { choice: { kind: 'return-family', reward: 'bonus' } }), 'a Bonus card was drawn'],
      [event(13, 'p', 'bonus/played', { choice: { kind: 'gain-lira' } }), null]
    ];
    for (const [candidate, reason] of cases) expect(revealedInformationReason(candidate)).toBe(reason);
  });
});
