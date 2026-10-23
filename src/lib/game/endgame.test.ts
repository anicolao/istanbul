import { describe, expect, it } from 'vitest';
import { finishFinalBonusSeat, markEndTrigger, rankPlayers, settleFinalBonuses } from './endgame';
import { fixture, eventFor } from '../../routes/dev/animations/scenarios';
import { applyEvent, replayEvents } from './reducer';
import { createSetup } from './setup';
import type { RoomProjection } from './protocol';

function room(playerCount: number): RoomProjection {
  return { roomCode: 'FINAL', hostUid: 'p0', status: 'playing', maxPlayers: playerCount, layout: 'short-path', mode: 'personal-screens', seats: Array.from({ length: playerCount }, (_, index) => ({ uid: `p${index}`, name: `Player ${index + 1}`, ready: true })) };
}

describe('official final round and ranking', () => {
  it('uses six rubies for two players and five for larger tables', () => {
    expect(createSetup(room(2), 'two').end.target).toBe(6);
    for (const count of [3, 4, 5]) expect(createSetup(room(count), `table-${count}`).end.target).toBe(5);
  });

  it('marks the first target reach without interrupting the current action', () => {
    const game = createSetup(room(3), 'trigger');
    game.players[1].rubies = 5;
    game.phase = 'turn-end';
    markEndTrigger(game);
    expect(game.end).toMatchObject({ triggeredByUid: 'p1', triggeredTurn: 1 });
    expect(game.phase).toBe('turn-end');
    game.players[2].rubies = 6;
    markEndTrigger(game);
    expect(game.end.triggeredByUid).toBe('p1');
  });

  it('ranks by rubies, Lira, goods, then unplayed Bonus cards and shares exact ties', () => {
    const game = createSetup(room(5), 'ranking');
    const [a, b, c, d, e] = game.players;
    for (const player of game.players) player.rubies = 5;
    a.lira = 9;
    b.lira = 8; b.goods.fabric = 2;
    c.lira = 8; c.goods.fabric = 1; c.goods.spice = 1; c.bonusHand.push('extra');
    d.lira = 8; d.goods.fabric = 1; d.goods.spice = 1; d.bonusHand = [];
    e.lira = 8; e.goods.fabric = 1; e.goods.spice = 1; e.bonusHand = [];
    expect(rankPlayers(game.players).map(({ uid, rank }) => [uid, rank])).toEqual([['p0', 1], ['p2', 2], ['p1', 3], ['p3', 4], ['p4', 4]]);
  });

  it('gives every seat one final direct-resource window before computing winners', () => {
    const game = createSetup(room(3), 'final-window');
    game.phase = 'final-bonus';
    game.turnSeat = game.startingSeat;
    game.players[game.startingSeat].rubies = 5;
    expect(finishFinalBonusSeat(game)).toBe(true);
    expect(game.phase).toBe('final-bonus');
    expect(finishFinalBonusSeat(game)).toBe(true);
    expect(finishFinalBonusSeat(game)).toBe(true);
    expect(game.phase).toBe('game-over');
    expect(game.end.rankings).toHaveLength(3);
    expect(game.end.winnerUids).toContain(game.players[game.startingSeat].uid);
  });
});


it('automatically plays all money cards and only goods cards that fit before scoring', () => {
  const game = createSetup(room(3), 'automatic-finals');
  game.phase = 'final-bonus';
  const [a, b, c] = game.players;
  for (const p of game.players) { p.bonusHand = []; p.lira = 0; p.rubies = 5; }
  a.capacity = 2;
  a.goods = { fabric: 2, spice: 1, fruit: 2, jewelry: 2 };
  a.bonusHand = ['bonus-gain-lira-1', 'bonus-gain-lira-2', 'bonus-gain-good-1', 'bonus-gain-good-2', 'bonus-long-move-1'];
  b.bonusHand = ['bonus-gain-lira-3'];
  c.goods = { fabric: c.capacity, spice: c.capacity, fruit: c.capacity, jewelry: c.capacity };
  c.bonusHand = ['bonus-gain-good-3'];
  expect(settleFinalBonuses(game)).toBe(true);
  expect(game.phase).toBe('game-over');
  expect(a.lira).toBe(10);
  expect(a.goods.spice).toBe(2);
  expect(a.bonusHand).toEqual(['bonus-gain-good-2', 'bonus-long-move-1']);
  expect(b.lira).toBe(5);
  expect(c.bonusHand).toEqual(['bonus-gain-good-3']);
  expect(game.end.winnerUids).toEqual([a.uid]);
  expect(game.end.rankings[0]).toMatchObject({ lira: 10, goods: 8, bonusCards: 2 });
  expect(game.end.finalBonuses).toEqual([
    { uid: a.uid, lira: 10, goods: 1, cards: ['bonus-gain-lira-1', 'bonus-gain-lira-2', 'bonus-gain-good-1'] },
    { uid: b.uid, lira: 5, goods: 0, cards: ['bonus-gain-lira-3'] }
  ]);
  const finished = structuredClone(game);
  expect(settleFinalBonuses(game)).toBe(false);
  expect(game).toEqual(finished);
});

it('preserves completed legacy final-card seats when finishing an in-progress old game', () => {
  const game = createSetup(room(2), 'legacy-final-window');
  game.phase = 'final-bonus';
  game.end.finalBonusSeatsCompleted = [0];
  game.players[0].bonusHand = ['bonus-gain-lira-1'];
  game.players[1].bonusHand = ['bonus-gain-lira-2'];
  const old = structuredClone(game.players[0]);
  expect(settleFinalBonuses(game)).toBe(true);
  expect(game.players[0]).toEqual(old);
  expect(game.players[1].bonusHand).toEqual([]);
});


it('settles only after the final ordinary turn and conserves cards', () => {
  const { state } = fixture('victory', 2, 'personal-screens', 6);
  state.game!.end.finalTurnSeat = 1;
  const before = structuredClone(state.game!.players);
  const command = { type: 'turn/ended', payload: { automaticFinalBonus: true } };
  expect(applyEvent(state, eventFor(state, command, 1))).toBe(true);
  expect(state.game!.phase).toBe('movement');
  expect(state.game!.players).toEqual(before);
  state.game!.phase = 'turn-end';
  expect(applyEvent(state, eventFor(state, command, 2))).toBe(true);
  expect(state.game!.phase).toBe('game-over');
  expect(state.game!.end.rankings).toHaveLength(2);
  const cards = [...state.game!.bonusDrawPile, ...state.game!.bonusDiscard, ...state.game!.players.flatMap(p => p.bonusHand)];
  expect(cards).toHaveLength(26);
  expect(new Set(cards).size).toBe(26);
});

it('replays automatic scoring and restores the exact pre-scoring state on undo', () => {
  const { state, trigger } = fixture('victory', 2, 'personal-screens', 6);
  const end = eventFor(state, trigger, 1);
  end.id = `${end.actorUid}-${end.clientSeq}`;
  const finished = replayEvents([end], state);
  expect(finished.game!.phase).toBe('game-over');
  expect(finished.diagnostics).toEqual([]);
  const undo = eventFor(state, { type: 'action/undone', payload: { targetEventId: end.id } }, 2);
  undo.id = `${undo.actorUid}-${undo.clientSeq}`;
  const restored = replayEvents([end, undo], state);
  expect(restored.diagnostics).toEqual([]);
  expect(restored.game).toEqual(state.game);
  const repeat = { ...end, id: `${end.actorUid}-000003`, clientSeq: '000003', createdAt: 3 };
  expect(replayEvents([end, undo, repeat], state).game).toEqual(finished.game);
});
