import { demandTiles, type Good } from './manifests';
import type { GameSetup, SetupPlayer } from './setup';

export type CardSource = 'deck' | 'discard';

export type PlaceActionChoice =
  | { kind: 'wainwright-buy' }
  | { kind: 'warehouse-fill'; good: Exclude<Good, 'jewelry'> }
  | { kind: 'fountain-recall'; assistantPlaces: number[] }
  | { kind: 'post-office-collect' }
  | { kind: 'caravansary-trade'; drawSources: [CardSource, CardSource]; discardCardId: string }
  | { kind: 'market-sell'; slotIndexes: number[] }
  | { kind: 'black-market-roll'; good: Exclude<Good, 'jewelry'> }
  | { kind: 'tea-house-wager'; wager: number };

export const postOfficeRows: Array<[
  { lira?: number; good?: Good },
  { lira?: number; good?: Good }
]> = [
  [{ good: 'fabric' }, { good: 'spice' }],
  [{ lira: 2 }, { good: 'fabric' }],
  [{ good: 'jewelry' }, { good: 'fruit' }],
  [{ good: 'spice' }, { lira: 1 }]
];

export const marketRevenue = [0, 2, 5, 9, 14, 20] as const;

export function warehouseGood(place: number): Exclude<Good, 'jewelry'> | null {
  if (place === 2) return 'fabric';
  if (place === 3) return 'spice';
  if (place === 4) return 'fruit';
  return null;
}

export function isPlaceActionChoice(value: unknown): value is PlaceActionChoice {
  if (!value || typeof value !== 'object' || !('kind' in value)) return false;
  const choice = value as Record<string, unknown>;
  if (choice.kind === 'wainwright-buy') return true;
  if (choice.kind === 'warehouse-fill') return ['fabric', 'spice', 'fruit'].includes(String(choice.good));
  if (choice.kind === 'fountain-recall') return Array.isArray(choice.assistantPlaces)
    && choice.assistantPlaces.every((place) => typeof place === 'number' && Number.isInteger(place));
  if (choice.kind === 'post-office-collect') return true;
  if (choice.kind === 'caravansary-trade') return Array.isArray(choice.drawSources)
    && choice.drawSources.length === 2
    && choice.drawSources.every((source) => source === 'deck' || source === 'discard')
    && typeof choice.discardCardId === 'string';
  if (choice.kind === 'market-sell') return Array.isArray(choice.slotIndexes)
    && choice.slotIndexes.every((index) => Number.isInteger(index));
  if (choice.kind === 'black-market-roll') return ['fabric', 'spice', 'fruit'].includes(String(choice.good));
  return choice.kind === 'tea-house-wager'
    && typeof choice.wager === 'number'
    && Number.isInteger(choice.wager)
    && choice.wager >= 3
    && choice.wager <= 12;
}

export function collectPostOffice(game: GameSetup, player: SetupPlayer): string {
  const received: string[] = [];
  for (const [index, rows] of postOfficeRows.entries()) {
    const resource = rows[game.postOfficeLower[index] ? 0 : 1];
    if (resource.lira) player.lira += resource.lira;
    if (resource.good) player.goods[resource.good] = Math.min(player.capacity, player.goods[resource.good] + 1);
    received.push(resource.lira ? `${resource.lira} Lira` : `1 ${resource.good}`);
  }
  const firstUpper = game.postOfficeLower.indexOf(false);
  if (firstUpper === -1) game.postOfficeLower = [false, false, false, false];
  else game.postOfficeLower[firstUpper] = true;
  return `Collected ${received.join(', ')}.`;
}

export function previewCaravansary(game: GameSetup, sources: [CardSource, CardSource]): string[] | null {
  const deck = [...game.bonusDrawPile];
  const discard = [...game.bonusDiscard];
  const cards: string[] = [];
  for (const source of sources) {
    const card = source === 'deck' ? deck.shift() : discard.pop();
    if (!card) return null;
    cards.push(card);
  }
  return cards;
}

export function tradeAtCaravansary(
  game: GameSetup,
  player: SetupPlayer,
  sources: [CardSource, CardSource],
  discardCardId: string
): string | null {
  const cards = previewCaravansary(game, sources);
  if (!cards || ![...player.bonusHand, ...cards].includes(discardCardId)) return null;
  for (const source of sources) {
    const card = source === 'deck' ? game.bonusDrawPile.shift() : game.bonusDiscard.pop();
    if (!card) return null;
    player.bonusHand.push(card);
  }
  const discardIndex = player.bonusHand.indexOf(discardCardId);
  if (discardIndex < 0) return null;
  game.bonusDiscard.push(player.bonusHand.splice(discardIndex, 1)[0]);
  return `Took 2 Bonus cards and discarded 1; ${player.bonusHand.length} remain in hand.`;
}

export function sellAtMarket(game: GameSetup, player: SetupPlayer, place: number, slotIndexes: number[]): string | null {
  const stack = place === 10 ? game.largeDemand : place === 11 ? game.smallDemand : null;
  if (!stack || slotIndexes.length < 1 || slotIndexes.length > 5) return null;
  const unique = [...new Set(slotIndexes)].sort((a, b) => a - b);
  if (unique.length !== slotIndexes.length || unique.some((index) => index < 0 || index > 4)) return null;
  const demand = demandTiles.find(({ id }) => id === stack[0]);
  if (!demand) return null;
  const sold = unique.map((index) => demand.goods[index]);
  const counts = sold.reduce<Record<Good, number>>((totals, good) => ({ ...totals, [good]: totals[good] + 1 }), {
    fabric: 0, spice: 0, fruit: 0, jewelry: 0
  });
  if ((Object.keys(counts) as Good[]).some((good) => counts[good] > player.goods[good])) return null;
  for (const good of Object.keys(counts) as Good[]) player.goods[good] -= counts[good];
  player.lira += marketRevenue[sold.length];
  stack.push(stack.shift()!);
  return `Sold ${sold.length} good${sold.length === 1 ? '' : 's'} for ${marketRevenue[sold.length]} Lira.`;
}

export function resolveBlackMarket(player: SetupPlayer, good: Exclude<Good, 'jewelry'>, dice: [number, number]): string {
  player.goods[good] = Math.min(player.capacity, player.goods[good] + 1);
  const total = dice[0] + dice[1];
  const jewelry = total >= 11 ? 3 : total >= 9 ? 2 : total >= 7 ? 1 : 0;
  player.goods.jewelry = Math.min(player.capacity, player.goods.jewelry + jewelry);
  return `Took 1 ${good}; rolled ${dice[0]} + ${dice[1]} = ${total} and gained ${jewelry} jewelry.`;
}

export function resolveTeaHouse(player: SetupPlayer, wager: number, dice: [number, number]): string {
  const total = dice[0] + dice[1];
  const reward = total >= wager ? wager : 2;
  player.lira += reward;
  return `Wagered ${wager}; rolled ${dice[0]} + ${dice[1]} = ${total} and gained ${reward} Lira.`;
}

export function buyWheelbarrowExtension(game: GameSetup, player: SetupPlayer): string | null {
  if (player.lira < 7 || player.extensions >= 3 || game.supplies.wheelbarrowExtensions < 1) return null;
  player.lira -= 7;
  player.extensions += 1;
  player.capacity += 1;
  game.supplies.wheelbarrowExtensions -= 1;
  if (player.extensions === 3 && game.supplies.wainwrightRubies > 0) {
    player.rubies += 1;
    game.supplies.wainwrightRubies -= 1;
    return 'Completed the wheelbarrow and claimed its ruby.';
  }
  return `Bought wheelbarrow extension ${player.extensions} of 3.`;
}

export function recallAssistants(player: SetupPlayer, places: number[]): string | null {
  const remaining = { ...player.assistantsByPlace };
  for (const place of places) {
    if (!remaining[place]) return null;
    remaining[place] -= 1;
  }
  player.assistantsByPlace = Object.fromEntries(Object.entries(remaining).filter(([, count]) => count > 0));
  player.assistantsCarried += places.length;
  return `Recalled ${places.length} assistant${places.length === 1 ? '' : 's'}.`;
}
