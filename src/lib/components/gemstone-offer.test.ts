import { expect, it } from 'vitest';
import { fixture, eventFor } from '../../routes/dev/animations/scenarios';
import { applyEvent } from '$lib/game/reducer';
import { gemstoneDisplay } from './gemstone-offer';

it('keeps the purchased offer empty through the turn and restores it on undo', () => {
  const { state, trigger } = fixture('action-16', 4, 'shared-table', 6);
  const before = structuredClone(state.game!);
  const price = before.rubyTracks.gemstonePrice;
  expect(gemstoneDisplay(before)).toEqual({ price, taken: false });
  expect(applyEvent(state, eventFor(state, trigger, 900))).toBe(true);
  expect(gemstoneDisplay(state.game!)).toEqual({ price, taken: true });
  // A restored projection has no presentation-only state to undo.
  expect(gemstoneDisplay(before)).toEqual({ price, taken: false });
  state.game!.phase = 'movement';
  expect(gemstoneDisplay(state.game!)).toEqual({
    price: price + 1,
    taken: false
  });
});

it('holds the latest repeat purchase even at the price cap', () => {
  const { state } = fixture('action-16', 4, 'shared-table', 6);
  const game = state.game!;
  game.phase = 'turn-end';
  game.rubyTracks.gemstonePrice = 25;
  game.lastAction = {
    playerUid: game.players[game.turnSeat].uid,
    place: 16,
    kind: 'gemstone-buy',
    summary:
      'Paid 24 Lira to the Gemstone Dealer and claimed 1 ruby. Paid 25 Lira to the Gemstone Dealer and claimed 1 ruby.'
  };
  expect(gemstoneDisplay(game)).toEqual({ price: 25, taken: true });
});
