import { describe, expect, it } from 'vitest';
import { createGalleryGame } from './gallery-fixture';
import { bonusCards } from './manifests';
import { unfinishedDestination, availableRepeatCard } from './unfinished-destination';

function position(place: number) {
  const game = createGalleryGame();
  game.phase = 'action';
  game.pending = null;
  const player = game.players[game.turnSeat];
  player.merchantPlace = place;
  player.goods = { fabric: 5, spice: 5, fruit: 5, jewelry: 5 };
  player.mosqueTileIds = [];
  player.lira = 40;
  return game;
}

describe('unfinished destination reminder', () => {
  it.each([14, 15])('warns about a power at mosque %s only while one can be gained', place => {
    const game = position(place);
    expect(unfinishedDestination(game)).toBe('gain a mosque power');
    game.players[0].goods = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
    expect(unfinishedDestination(game)).toBeNull();
  });
  it.each([13, 16])('warns about an affordable ruby at %s', place => {
    const game = position(place);
    expect(unfinishedDestination(game)).toBe('gain a ruby');
    game.players[0].lira = 0;
    game.players[0].goods = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
    expect(unfinishedDestination(game)).toBeNull();
  });
  it('requires enough leftover goods for the Sultan wild costs', () => {
    const game = position(13);
    game.rubyTracks.sultanIndex = 5;
    game.players[0].goods = { fabric: 1, spice: 1, fruit: 1, jewelry: 1 };
    expect(unfinishedDestination(game)).toBeNull();
    game.players[0].goods.fabric++;
    expect(unfinishedDestination(game)).toBe('gain a ruby');
  });
  it('uses the dispatched family destination', () => {
    const game = position(12);
    game.phase = 'family-action';
    game.pending = { kind: 'family-action', destination: 14 };
    expect(unfinishedDestination(game)).toBe('gain a mosque power');
  });
  it('does not warn again after an action or for optional encounters', () => {
    const game = position(14);
    game.phase = 'turn-end';
    expect(unfinishedDestination(game)).toBeNull();
    game.phase = 'encounters';
    game.pending = { kind: 'encounters', familyUids: [], governor: null, smuggler: true };
    expect(unfinishedDestination(game)).toBeNull();
  });
  it('does not offer already-owned mosque powers', () => {
    const game = position(14);
    game.players[0].mosqueTileIds = [game.mosqueStacks.fabric[0], game.mosqueStacks.spice[0]];
    expect(unfinishedDestination(game)).toBeNull();
  });
  it('warns before abandoning a roll, sale, draw, recall, or dispatch', () => {
    for (const place of [6, 7, 8, 9, 10, 11, 12]) expect(unfinishedDestination(position(place))).not.toBeNull();
  });
});

describe('repeat card reminder', () => {
  it.each([[5, 'repeat-post'], [13, 'repeat-sultan'], [16, 'repeat-gemstone']] as const)('offers a usable repeat at %s', (place, effect) => {
    const game = position(place);
    const card = bonusCards.find(card => card.effect === effect)!;
    game.players[0].bonusHand = [card.id];
    game.phase = 'turn-end';
    game.lastAction = { place, playerUid: game.players[0].uid, kind: 'sultan-buy', summary: '' };
    expect(availableRepeatCard(game)).toBe(card.id);
    game.players[0].bonusHand = [];
    expect(availableRepeatCard(game)).toBeNull();
  });
  it.each([13, 16])('does not suggest an unaffordable repeat at %s', place => {
    const game = position(place);
    game.phase = 'turn-end';
    game.lastAction = { place, playerUid: game.players[0].uid, kind: 'sultan-buy', summary: '' };
    game.players[0].bonusHand = bonusCards.map(card => card.id);
    game.players[0].lira = 0;
    game.players[0].goods = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
    expect(availableRepeatCard(game)).toBeNull();
  });
  it('does not suggest repeating a previous player’s action', () => {
    const game = position(5);
    game.phase = 'turn-end';
    game.lastAction = { place: 5, playerUid: game.players[1].uid, kind: 'post-office-collect', summary: '' };
    game.players[0].bonusHand = bonusCards.map(card => card.id);
    expect(availableRepeatCard(game)).toBeNull();
  });
});
