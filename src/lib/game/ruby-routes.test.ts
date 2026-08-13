import { describe, expect, it } from 'vitest';
import { createSetup } from './setup';
import { buyGemstoneRuby, buySultanRuby, createRubyTracks, currentSultanCost, sultanCostSequence } from './ruby-routes';
import type { RoomProjection } from './protocol';

function setup(count: number) {
  const room: RoomProjection = {
    roomCode: 'RUBYS', hostUid: 'p0', status: 'playing', maxPlayers: count,
    layout: 'short-path', mode: 'personal-screens',
    seats: Array.from({ length: count }, (_, index) => ({ uid: `p${index}`, name: `P${index}`, ready: true }))
  };
  return createSetup(room, `ruby-${count}`);
}

describe('escalating ruby routes', () => {
  it('transcribes every printed player-count start position', () => {
    expect(createRubyTracks(2)).toEqual({ sultanIndex: 5, sultanRubies: 5, gemstonePrice: 15, gemstoneRubies: 10 });
    expect(createRubyTracks(3)).toEqual({ sultanIndex: 5, sultanRubies: 5, gemstonePrice: 15, gemstoneRubies: 10 });
    expect(createRubyTracks(4)).toEqual({ sultanIndex: 4, sultanRubies: 6, gemstonePrice: 12, gemstoneRubies: 13 });
    expect(createRubyTracks(5)).toEqual(createRubyTracks(4));
    expect(sultanCostSequence).toEqual(['jewelry', 'fabric', 'spice', 'fruit', 'any', 'jewelry', 'fabric', 'spice', 'fruit', 'any']);
  });

  it('charges the exact Sultan goods, including explicit wild choices', () => {
    const game = setup(2);
    const player = game.players[0];
    player.goods = { fabric: 2, spice: 2, fruit: 1, jewelry: 2 };
    expect(currentSultanCost(game)).toEqual(['jewelry', 'fabric', 'spice', 'fruit', 'any']);
    expect(buySultanRuby(game, player, [])).toBeNull();
    expect(buySultanRuby(game, player, ['spice'])).toBe('Delivered 5 goods to the Sultan and claimed 1 ruby.');
    expect(player.goods).toEqual({ fabric: 1, spice: 0, fruit: 0, jewelry: 1 });
    expect(player.rubies).toBe(1);
    expect(game.rubyTracks).toMatchObject({ sultanIndex: 6, sultanRubies: 5 });
  });

  it('rejects short payment and advances the Gemstone price once per ruby', () => {
    const game = setup(4);
    const player = game.players[0];
    player.lira = 11;
    expect(buyGemstoneRuby(game, player)).toBeNull();
    player.lira = 25;
    expect(buyGemstoneRuby(game, player)).toBe('Paid 12 Lira to the Gemstone Dealer and claimed 1 ruby.');
    expect(buyGemstoneRuby(game, player)).toBe('Paid 13 Lira to the Gemstone Dealer and claimed 1 ruby.');
    expect(player).toMatchObject({ lira: 0, rubies: 2 });
    expect(game.rubyTracks).toMatchObject({ gemstonePrice: 14, gemstoneRubies: 13 });
  });

  it('keeps awarding rubies after the printed tracks reach their capped price and cost', () => {
    const game = setup(2);
    const player = game.players[0];
    player.lira = 100;
    game.rubyTracks.gemstonePrice = 25;
    expect(buyGemstoneRuby(game, player)).toContain('Paid 25 Lira');
    expect(buyGemstoneRuby(game, player)).toContain('Paid 25 Lira');
    expect(game.rubyTracks).toMatchObject({ gemstonePrice: 25, gemstoneRubies: 10 });

    game.rubyTracks.sultanIndex = sultanCostSequence.length;
    player.goods = { fabric: 10, spice: 10, fruit: 10, jewelry: 10 };
    expect(buySultanRuby(game, player, ['fabric', 'spice'])).toContain('Delivered 10 goods');
    expect(buySultanRuby(game, player, ['fruit', 'jewelry'])).toContain('Delivered 10 goods');
    expect(game.rubyTracks).toMatchObject({ sultanIndex: 10, sultanRubies: 5 });
    expect(player.rubies).toBe(4);
  });
});
