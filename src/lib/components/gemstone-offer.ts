import type { GameSetup } from '$lib/game/setup';

export interface GemstoneDisplay {
  price: number;
  taken: boolean;
}

/** Keep the paid offer on the table until this player's turn is over, including after reload. */
export function gemstoneDisplay(game: GameSetup): GemstoneDisplay {
  const action = game.lastAction;
  if (
    game.phase !== 'movement' &&
    action?.kind === 'gemstone-buy' &&
    action.playerUid === game.players[game.turnSeat].uid
  ) {
    // Repeated purchases append their receipts; the last one is the visible offer.
    const receipts = [
      ...action.summary.matchAll(/Paid (\d+) Lira to the Gemstone Dealer/g)
    ];
    const receipt = receipts.at(-1);
    if (receipt) return { price: Number(receipt[1]), taken: true };
  }
  return { price: game.rubyTracks.gemstonePrice, taken: false };
}
