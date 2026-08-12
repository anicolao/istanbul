import { describe, expect, it } from 'vitest';
import { finishFinalBonusSeat, markEndTrigger, rankPlayers } from './endgame';
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
