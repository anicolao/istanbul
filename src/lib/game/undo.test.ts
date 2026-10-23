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
    expect(afterFillUndo.undoLog).toEqual([{ eventId: undoFill.id, targetEventId: filled.id, actorUid: 'host', label: 'warehouse fill', actionCount: 1 }]);

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

  it('rolls back an authored reversible suffix with one immutable event', () => {
    const moved = event(6, 'host', 'turn/moved', { destination: 4, assistantAction: 'drop' });
    const filled = event(7, 'host', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fruit' } });
    const rollback = event(8, 'host', 'action/undone', { targetEventId: moved.id });
    const projection = replayEvents([...startedGame(), moved, filled, rollback]);

    expect(projection.game).toMatchObject({ phase: 'movement', players: [{ merchantPlace: 7, goods: { fruit: 0 }, assistantsCarried: 4 }, {}] });
    expect(projection.acceptedEventIds).toHaveLength(8);
    expect(projection.undoLog).toEqual([{ eventId: rollback.id, targetEventId: moved.id, actorUid: 'host', label: 'move to Place 4', actionCount: 2 }]);
    expect(projection.gameLog.map(({ label, active }) => ({ label, active }))).toEqual([
      { label: 'move to Place 4', active: false },
      { label: 'warehouse fill', active: false }
    ]);
  });

  it('exposes only actions above revealed information as direct rollback targets', () => {
    const setup = startedGame();
    const moved = event(6, 'host', 'turn/moved', { destination: 9, assistantAction: 'drop' });
    const roll = event(7, 'host', 'place/action-taken', { choice: { kind: 'tea-house-wager', wager: 7 } });
    const declineGovernor = event(8, 'host', 'encounter/resolved', { choice: { kind: 'governor-visit', accept: false } });
    const projection = replayEvents([...setup, moved, roll, declineGovernor]);

    expect(projection.gameLog).toMatchObject([
      { eventId: moved.id, blockedReason: 'Cannot cross: dice were rolled', rollbackCount: 0 },
      { eventId: roll.id, barrierReason: 'dice were rolled', blockedReason: 'dice were rolled', rollbackCount: 0 },
      { eventId: declineGovernor.id, blockedReason: null, rollbackCount: 1, rollbackActorUids: ['host'] }
    ]);
    const restored = replayEvents([...setup, moved, roll, declineGovernor, event(9, 'host', 'action/undone', { targetEventId: declineGovernor.id })]);
    expect(restored.game).toMatchObject({ phase: 'encounters', lastRoll: { place: 9 } });
    expect(restored.undo).toMatchObject({ targetEventId: roll.id, blockedReason: 'dice were rolled' });
  });

  it('contains stale, unauthorized, and duplicate undo attempts deterministically', () => {
    const moved = event(6, 'host', 'turn/moved', { destination: 4, assistantAction: 'drop' });
    const filled = event(7, 'host', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fruit' } });
    const projection = replayEvents([
      ...startedGame(),
      moved,
      filled,
      event(8, 'host', 'action/undone', { targetEventId: 'missing-action' }),
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

for (const npc of ['governor', 'smuggler'] as const) {
  it(`${npc}: payment can be undone until a separate mandatory relocation roll`, () => {
    const setup = [
      ...startedGame().slice(0, -1),
      event(5, 'host', 'game/started', { seed: 'encounter-735' }),
      event(6, 'host', 'turn/moved', { destination: 2, assistantAction: 'drop' }),
      event(7, 'host', 'place/action-taken', { choice: { kind: 'warehouse-fill', good: 'fabric' } }),
      ...(npc === 'governor' ? [event(8, 'host', 'encounter/resolved', { choice: { kind: 'governor-visit', accept: true } })] : [])
    ];
    const before = replayEvents(setup);
    expect(before.diagnostics).toEqual([]);
    const card = before.game!.players[0].bonusHand.at(-1)!;
    const payment = event(9, 'host', 'encounter/resolved', { separateRelocation: true, choice: npc === 'governor'
      ? { kind: 'governor-pay', payment: 'card', discardCardId: card }
      : { kind: 'smuggler-trade', accept: true, good: 'jewelry', payment: 'good', paymentGood: 'fabric' } });
    const paid = replayEvents([...setup, payment]);
    expect(paid.diagnostics).toEqual([]);
    expect(paid.undo?.blockedReason).toBeNull();
    expect(paid.game!.pending).toMatchObject({ kind: 'encounters', relocation: npc });
    expect(paid.game![`${npc}Place`]).toBe(before.game![`${npc}Place`]);
    expect(paid.game!.encounterLog.at(-1)?.dice).toBeUndefined();
    const undone = replayEvents([...setup, payment, event(10, 'host', 'action/undone', { targetEventId: payment.id })]);
    expect(undone.diagnostics).toEqual([]);
    expect(undone.game).toEqual(before.game);
    const skipped = replayEvents([...setup, payment, event(10, 'host', 'turn/ended', { directAction: true })]);
    expect(skipped.acceptedEventIds).not.toContain('host-000010');
    expect(skipped.game!.pending).toMatchObject({ relocation: npc });
    const roll = event(10, 'host', 'encounter/resolved', { choice: { kind: `${npc}-roll` } });
    const rolled = replayEvents([...setup, payment, roll]);
    expect(rolled.diagnostics).toEqual([]);
    expect(rolled.game!.encounterLog.at(-1)?.dice).toHaveLength(2);
    expect(rolled.undo?.blockedReason).toContain('relocated by dice');
    const duplicate = replayEvents([...setup, payment, roll, event(11, 'host', 'encounter/resolved', { choice: { kind: `${npc}-roll` } })]);
    expect(duplicate.acceptedEventIds).not.toContain('host-000011');
    const blockedUndo = replayEvents([...setup, payment, roll, event(11, 'host', 'action/undone', { targetEventId: payment.id })]);
    expect(blockedUndo.acceptedEventIds).not.toContain('host-000011');
  });
}

describe('agreed rewinds across revealed information', () => {
  const rolledHistory = () => [
    ...startedGame(),
    event(6, 'host', 'turn/moved', { destination: 9, assistantAction: 'drop' }),
    event(7, 'host', 'place/action-taken', { choice: { kind: 'tea-house-wager', wager: 7 } })
  ];
  const request = () => event(8, 'host', 'undo/requested', { targetEventId: 'host-000007' });
  const vote = (approve: boolean) => event(9, 'guest', 'undo/voted', { requestId: 'host-000008', approve });

  it('leaves state untouched until all humans agree, then restores the exact pre-roll state', () => {
    const history = rolledHistory();
    const before = replayEvents(history.slice(0, -1));
    const rolled = replayEvents(history);
    expect(rolled.undo?.consentActorUids).toEqual(['host', 'guest']);
    const waiting = replayEvents([...history, request()]);
    expect(waiting.game).toEqual(rolled.game);
    expect(waiting.undoRequest).toMatchObject({ requiredUids: ['host', 'guest'], approvedUids: ['host'], actionCount: 1 });
    const restored = replayEvents([...history, request(), vote(true)]);
    expect(restored.diagnostics).toEqual([]);
    expect(restored.undoRequest).toBeFalsy();
    expect(restored.game).toEqual(before.game);
    expect(restored.gameLog.find(entry => entry.eventId === 'host-000007')?.active).toBe(false);
    const repeat = event(10, 'host', 'place/action-taken', { choice: { kind: 'tea-house-wager', wager: 7 } });
    expect(replayEvents([...history, request(), vote(true), repeat]).game!.lastRoll).toEqual(rolled.game!.lastRoll);
  });

  it('keeps the game intact on rejection or cancellation', () => {
    const history = rolledHistory();
    for (const resolution of [vote(false), event(9, 'host', 'undo/cancelled', { requestId: 'host-000008' })]) {
      const result = replayEvents([...history, request(), resolution]);
      expect(result.game).toEqual(replayEvents(history).game);
      expect(result.undoRequest).toBeFalsy();
      expect(result.diagnostics).toEqual([]);
    }
  });

  it('rejects forged, duplicate and stale votes', () => {
    const history = rolledHistory();
    for (const invalid of [
      event(9, 'host', 'undo/voted', { requestId: 'host-000008', approve: true }),
      event(9, 'host', 'undo/voted', { requestId: 'host-000008', voterUid: 'guest', approve: true }),
      event(9, 'outsider', 'undo/voted', { requestId: 'host-000008', approve: true }),
      event(9, 'guest', 'undo/voted', { requestId: 'wrong-request', approve: true })
    ]) {
      const result = replayEvents([...history, request(), invalid]);
      expect(result.acceptedEventIds).not.toContain(invalid.id);
      expect(result.undoRequest?.approvedUids).toEqual(['host']);
    }
    const nextAction = event(9, 'host', 'encounter/resolved', { choice: { kind: 'governor-visit', accept: false } });
    const staleVote = event(10, 'guest', 'undo/voted', { requestId: 'host-000008', approve: true });
    const stale = replayEvents([...history, request(), nextAction, staleVote]);
    expect(stale.acceptedEventIds).toContain(nextAction.id);
    expect(stale.acceptedEventIds).not.toContain(staleVote.id);
    expect(stale.undoRequest).toBeFalsy();
  });

  it('rewinds later players’ actions only with their agreement', () => {
    const history = [...rolledHistory(),
      event(8, 'host', 'turn/ended', { directAction: true }),
      event(9, 'guest', 'turn/moved', { destination: 4, assistantAction: 'drop', directAction: true }),
      event(10, 'host', 'undo/requested', { targetEventId: 'host-000007' })];
    const waiting = replayEvents(history);
    expect(waiting.diagnostics).toEqual([]);
    expect(waiting.undoRequest?.actionCount).toBe(3);
    const result = replayEvents([...history, event(11, 'guest', 'undo/voted', { requestId: 'host-000010', approve: true })]);
    expect(result.game).toEqual(replayEvents(rolledHistory().slice(0, -1)).game);
    expect(result.diagnostics).toEqual([]);
  });

  it('restores a drawn card to its original deck position', () => {
    const history = [...rolledHistory(), event(8, 'host', 'encounter/resolved', { choice: { kind: 'governor-visit', accept: true } })];
    const result = replayEvents([...history,
      event(9, 'host', 'undo/requested', { targetEventId: 'host-000008' }),
      event(10, 'guest', 'undo/voted', { requestId: 'host-000009', approve: true })]);
    expect(result.game).toEqual(replayEvents(history.slice(0, -1)).game);
    expect(result.diagnostics).toEqual([]);
  });
});

it('lets a shared tabletop collect each human vote without treating the display as a player', () => {
  const initial = replayEvents(startedGame());
  initial.room = { ...initial.room!, mode: 'shared-table', tabletopOwned: true, hostUid: 'table' };
  const history = [
    event(6, 'host', 'turn/moved', { destination: 9, assistantAction: 'drop' }),
    event(7, 'host', 'place/action-taken', { choice: { kind: 'tea-house-wager', wager: 7 } }),
    event(8, 'table', 'undo/requested', { targetEventId: 'host-000007' })
  ];
  const waiting = replayEvents(history, initial);
  expect(waiting.undoRequest?.requiredUids).toEqual(['host', 'guest']);
  expect(waiting.undoRequest?.approvedUids).toEqual([]);
  const one = event(9, 'table', 'undo/voted', { requestId: 'table-000008', voterUid: 'host', approve: true });
  const two = event(10, 'table', 'undo/voted', { requestId: 'table-000008', voterUid: 'guest', approve: true });
  expect(replayEvents([...history, one], initial).undoRequest?.approvedUids).toEqual(['host']);
  const result = replayEvents([...history, one, two], initial);
  expect(result.diagnostics).toEqual([]);
  expect(result.game).toEqual(replayEvents(history.slice(0, 1), initial).game);
});

it('requires only the human player’s agreement against a bot', () => {
  const initial = replayEvents(startedGame());
  initial.room!.seats[1].bot = true;
  const history = [
    event(6, 'host', 'turn/moved', { destination: 9, assistantAction: 'drop' }),
    event(7, 'host', 'place/action-taken', { choice: { kind: 'tea-house-wager', wager: 7 } })
  ];
  const result = replayEvents([...history, event(8, 'host', 'undo/requested', { targetEventId: 'host-000007' })], initial);
  expect(result.diagnostics).toEqual([]);
  expect(result.undoRequest).toBeFalsy();
  expect(result.game).toEqual(replayEvents(history.slice(0, 1), initial).game);
});

it('requires a current target and rejects overlapping requests', () => {
  const history = [...startedGame(),
    event(6, 'host', 'turn/moved', { destination: 9, assistantAction: 'drop' }),
    event(7, 'host', 'place/action-taken', { choice: { kind: 'tea-house-wager', wager: 7 } }),
    event(8, 'host', 'undo/requested', { targetEventId: 'host-000007' })];
  const overlap = replayEvents([...history, event(9, 'guest', 'undo/requested', { targetEventId: 'host-000006' })]);
  expect(overlap.undoRequest?.id).toBe('host-000008');
  expect(overlap.acceptedEventIds).not.toContain('guest-000009');
  const removed = [...history, event(9, 'guest', 'undo/voted', { requestId: 'host-000008', approve: true })];
  const stale = replayEvents([...removed, event(10, 'guest', 'undo/requested', { targetEventId: 'host-000007' })]);
  expect(stale.acceptedEventIds).not.toContain('guest-000010');
  expect(stale.game).toEqual(replayEvents(removed).game);
  // Reordered input and reloads reconstruct the same request, votes, and resulting history.
  expect(replayEvents([...removed].reverse())).toEqual(replayEvents(removed));
});
