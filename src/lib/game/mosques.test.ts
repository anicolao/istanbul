import { describe, expect, it } from 'vitest';
import type { RoomProjection } from './protocol';
import { createSetup } from './setup';
import { adjustMosqueDice, buyWarehouseExtra, recallWithYellow, takeMosqueTile } from './mosques';

const room = (count = 2): RoomProjection => ({
  roomCode: 'TILES', hostUid: 'p1', status: 'lobby', maxPlayers: count, layout: 'short-path', mode: 'personal-screens',
  seats: Array.from({ length: count }, (_, index) => ({ uid: `p${index + 1}`, name: `Player ${index + 1}`, ready: true }))
});

describe('Mosque tiles and permanent abilities', () => {
  it('requires the exposed amount, pays one good, prevents duplicates, and awards paired rubies once', () => {
    const game = createSetup(room(), 'mosque-acquisition');
    const player = game.players[0];
    player.goods = { fabric: 4, spice: 4, fruit: 4, jewelry: 4 };
    const smallRubies = game.supplies.smallMosqueRubies;
    const greatRubies = game.supplies.greatMosqueRubies;

    expect(takeMosqueTile(game, player, 'mosque-spice-2', 14)).toBe('Paid 1 spice and gained the spice Mosque tile.');
    expect(takeMosqueTile(game, player, 'mosque-spice-4', 14)).toBeNull();
    expect(takeMosqueTile(game, player, 'mosque-fabric-2', 14)).toContain('completed the pair for 1 ruby');
    expect(player).toMatchObject({ goods: { fabric: 3, spice: 3 }, rubies: 1 });
    expect(game.supplies.smallMosqueRubies).toBe(smallRubies - 1);

    expect(takeMosqueTile(game, player, 'mosque-jewelry-2', 15)).toBe('Paid 1 jewelry and gained the jewelry Mosque tile.');
    expect(player).toMatchObject({ assistantsCarried: 5, assistantsInSupply: 0 });
    expect(takeMosqueTile(game, player, 'mosque-fruit-2', 15)).toContain('completed the pair for 1 ruby');
    expect(player.rubies).toBe(2);
    expect(game.supplies.greatMosqueRubies).toBe(greatRubies - 1);
  });

  it('keeps each Mosque color at its official Place and honors player-count stacks', () => {
    const twoPlayer = createSetup(room(2), 'mosque-two');
    expect(Object.fromEntries(Object.entries(twoPlayer.mosqueStacks).map(([color, ids]) => [color, ids.map((id) => Number(id.split('-').at(-1)))]))).toEqual({
      fabric: [2, 4], spice: [2, 4], fruit: [2, 4], jewelry: [2, 4]
    });
    twoPlayer.players[0].goods.fabric = 2;
    expect(takeMosqueTile(twoPlayer, twoPlayer.players[0], 'mosque-fabric-2', 15)).toBeNull();
    expect(takeMosqueTile(twoPlayer, twoPlayer.players[0], 'mosque-fabric-2', 14)).not.toBeNull();
  });

  it('implements all four red post-roll choices without mutating the original dice', () => {
    const original: [number, number] = [2, 5];
    expect(adjustMosqueDice(original, 'none', [6, 6])).toEqual([2, 5]);
    expect(adjustMosqueDice(original, 'first-to-four', [6, 6])).toEqual([4, 5]);
    expect(adjustMosqueDice(original, 'second-to-four', [6, 6])).toEqual([2, 4]);
    expect(adjustMosqueDice(original, 'reroll', [6, 6])).toEqual([6, 6]);
    expect(original).toEqual([2, 5]);
  });

  it('applies green capacity and yellow conservation boundaries exactly', () => {
    const game = createSetup(room(), 'mosque-ability-boundaries');
    const player = game.players[0];
    player.lira = 6;
    player.goods.jewelry = 1;
    expect(buyWarehouseExtra(player, 'jewelry')).toBe(true);
    expect(buyWarehouseExtra(player, 'jewelry')).toBe(false);
    player.assistantsCarried = 2;
    player.assistantsByPlace = { 2: 2 };
    expect(recallWithYellow(player, 2)).toBe(true);
    expect(player).toMatchObject({ lira: 2, assistantsCarried: 3, assistantsByPlace: { 2: 1 }, goods: { jewelry: 2 } });
    expect(player.assistantsCarried + player.assistantsInSupply + Object.values(player.assistantsByPlace).reduce((sum, count) => sum + count, 0)).toBe(5);
  });
});
