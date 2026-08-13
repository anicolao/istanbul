import type { Good } from './manifests';
import type { GameSetup, SetupPlayer } from './setup';

export const sultanCostSequence: Array<Good | 'any'> = [
  'jewelry', 'fabric', 'spice', 'fruit', 'any',
  'jewelry', 'fabric', 'spice', 'fruit', 'any'
];

export function createRubyTracks(playerCount: number): GameSetup['rubyTracks'] {
  const sultanIndex = playerCount === 2 ? 7 : playerCount === 3 ? 6 : 4;
  const gemstonePrice = playerCount <= 3 ? 15 : 12;
  return {
    sultanIndex,
    sultanRubies: sultanCostSequence.length - sultanIndex,
    gemstonePrice,
    gemstoneRubies: 25 - gemstonePrice
  };
}

export function currentSultanCost(game: GameSetup): Array<Good | 'any'> {
  return sultanCostSequence.slice(0, game.rubyTracks.sultanIndex);
}

export function buySultanRuby(game: GameSetup, player: SetupPlayer, wildGoods: Good[]): string | null {
  if (game.rubyTracks.sultanRubies < 1) return null;
  const cost = currentSultanCost(game);
  const wildCount = cost.filter((good) => good === 'any').length;
  if (wildGoods.length !== wildCount) return null;

  const payment: Record<Good, number> = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
  for (const good of cost) if (good !== 'any') payment[good] += 1;
  for (const good of wildGoods) {
    if (!['fabric', 'spice', 'fruit', 'jewelry'].includes(good)) return null;
    payment[good] += 1;
  }
  if ((Object.keys(payment) as Good[]).some((good) => player.goods[good] < payment[good])) return null;

  for (const good of Object.keys(payment) as Good[]) player.goods[good] -= payment[good];
  player.rubies += 1;
  game.rubyTracks.sultanIndex += 1;
  game.rubyTracks.sultanRubies -= 1;
  return `Delivered ${cost.length} goods to the Sultan and claimed 1 ruby.`;
}

export function buyGemstoneRuby(game: GameSetup, player: SetupPlayer): string | null {
  const price = game.rubyTracks.gemstonePrice;
  if (game.rubyTracks.gemstoneRubies < 1 || player.lira < price) return null;
  player.lira -= price;
  player.rubies += 1;
  game.rubyTracks.gemstonePrice += 1;
  game.rubyTracks.gemstoneRubies -= 1;
  return `Paid ${price} Lira to the Gemstone Dealer and claimed 1 ruby.`;
}
