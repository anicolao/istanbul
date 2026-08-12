import type { LayoutKind } from './protocol';

export type Good = 'fabric' | 'spice' | 'fruit' | 'jewelry';

export interface PlaceManifest {
  id: number;
  name: string;
  shortName: string;
  family: 'upgrade' | 'warehouse' | 'cards' | 'service' | 'chance' | 'market' | 'authority' | 'ruby';
  action: string;
  glyph: 'wheel' | 'fabric' | 'spice' | 'fruit' | 'mail' | 'cards' | 'fountain' | 'dice' | 'tea' | 'market' | 'police' | 'palace' | 'mosque' | 'gem';
}

export const places: PlaceManifest[] = [
  { id: 1, name: 'Wainwright', shortName: 'Wainwright', family: 'upgrade', action: 'Pay 7 Lira for a wheelbarrow extension.', glyph: 'wheel' },
  { id: 2, name: 'Fabric Warehouse', shortName: 'Fabric', family: 'warehouse', action: 'Fill fabric to wheelbarrow capacity.', glyph: 'fabric' },
  { id: 3, name: 'Spice Warehouse', shortName: 'Spice', family: 'warehouse', action: 'Fill spice to wheelbarrow capacity.', glyph: 'spice' },
  { id: 4, name: 'Fruit Warehouse', shortName: 'Fruit', family: 'warehouse', action: 'Fill fruit to wheelbarrow capacity.', glyph: 'fruit' },
  { id: 5, name: 'Post Office', shortName: 'Post Office', family: 'service', action: 'Take the four uncovered mail-track resources.', glyph: 'mail' },
  { id: 6, name: 'Caravansary', shortName: 'Caravansary', family: 'cards', action: 'Draw two Bonus cards, then discard one.', glyph: 'cards' },
  { id: 7, name: 'Fountain', shortName: 'Fountain', family: 'service', action: 'Return any number of assistants to the merchant.', glyph: 'fountain' },
  { id: 8, name: 'Black Market', shortName: 'Black Market', family: 'chance', action: 'Gain a basic good and roll for jewelry.', glyph: 'dice' },
  { id: 9, name: 'Tea House', shortName: 'Tea House', family: 'chance', action: 'Declare a wager from 3 to 12, then roll.', glyph: 'tea' },
  { id: 10, name: 'Large Market', shortName: 'Large Market', family: 'market', action: 'Sell one to five goods shown by demand.', glyph: 'market' },
  { id: 11, name: 'Small Market', shortName: 'Small Market', family: 'market', action: 'Sell one to five goods shown by demand.', glyph: 'market' },
  { id: 12, name: 'Police Station', shortName: 'Police', family: 'authority', action: 'Send the family member to perform a Place action.', glyph: 'police' },
  { id: 13, name: "Sultan's Palace", shortName: "Sultan's Palace", family: 'ruby', action: 'Deliver the exposed goods for a ruby.', glyph: 'palace' },
  { id: 14, name: 'Small Mosque', shortName: 'Small Mosque', family: 'upgrade', action: 'Pay one depicted good for a special ability.', glyph: 'mosque' },
  { id: 15, name: 'Great Mosque', shortName: 'Great Mosque', family: 'upgrade', action: 'Pay one depicted good for a special ability.', glyph: 'mosque' },
  { id: 16, name: 'Gemstone Dealer', shortName: 'Gem Dealer', family: 'ruby', action: 'Pay the exposed Lira price for a ruby.', glyph: 'gem' }
];

export const printedLayouts: Record<Exclude<LayoutKind, 'random'>, number[]> = {
  'short-path': [15, 5, 2, 14, 4, 12, 7, 3, 8, 6, 11, 9, 13, 10, 1, 16],
  'long-path': [16, 2, 8, 11, 15, 7, 6, 4, 3, 5, 12, 1, 10, 9, 14, 13],
  'number-order': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]
};

export interface BonusCardManifest {
  id: string;
  effect: 'gain-good' | 'gain-lira' | 'repeat-sultan' | 'repeat-post' | 'repeat-gemstone' | 'return-family' | 'stay' | 'long-move' | 'wild-small-market' | 'return-assistant';
  title: string;
  text: string;
}

const bonusKinds: Array<[BonusCardManifest['effect'], number, string, string]> = [
  ['gain-good', 4, 'A useful connection', 'Immediately before or after a Place action, gain one good of your choice.'],
  ['gain-lira', 4, 'A profitable bargain', 'Gain 5 Lira.'],
  ['repeat-sultan', 2, 'The Sultan grants another audience', "After the Sultan's Palace action, perform it once more at its new cost."],
  ['repeat-post', 2, 'Another delivery', 'After the Post Office action, perform it once more and advance the indicators again.'],
  ['repeat-gemstone', 2, 'A second ruby offer', 'After the Gemstone Dealer action, perform it once more at its new price.'],
  ['return-family', 2, 'Family pardon', 'Return your family member to Police Station and take the usual catch reward.'],
  ['stay', 2, 'Work where you stand', 'During movement, remain here and use an assistant at this Place.'],
  ['long-move', 4, 'A swift passage', 'During movement, travel three or four Places instead of one or two.'],
  ['wild-small-market', 2, 'Flexible demand', 'At the Small Market, sell the chosen number using any mixture of goods.'],
  ['return-assistant', 2, 'An assistant returns', 'During movement, return one assistant from the board to your merchant stack.']
];

export const bonusCards: BonusCardManifest[] = bonusKinds.flatMap(([effect, count, title, text]) =>
  Array.from({ length: count }, (_, index) => ({ id: `bonus-${effect}-${index + 1}`, effect, title, text }))
);

export interface MosqueTileManifest {
  id: string;
  color: Good;
  required: number;
  ability: string;
}

const mosqueAbility: Record<Good, string> = {
  fabric: 'After a Black Market or Tea House roll, turn one die to 4 or reroll once.',
  spice: 'At a warehouse, pay 2 Lira for one extra good.',
  fruit: 'Once per turn, pay 2 Lira to recall one assistant.',
  jewelry: 'Immediately add the fifth assistant to the merchant stack.'
};

export const mosqueTiles: MosqueTileManifest[] = (Object.keys(mosqueAbility) as Good[]).flatMap((color) =>
  [2, 3, 4, 5].map((required) => ({ id: `mosque-${color}-${required}`, color, required, ability: mosqueAbility[color] }))
);

export interface DemandTileManifest { id: string; market: 'large' | 'small'; goods: Good[]; }

export const demandTiles: DemandTileManifest[] = [
  { id: 'demand-large-1', market: 'large', goods: ['fabric', 'fabric', 'spice', 'fruit', 'jewelry'] },
  { id: 'demand-large-2', market: 'large', goods: ['fabric', 'spice', 'spice', 'fruit', 'jewelry'] },
  { id: 'demand-large-3', market: 'large', goods: ['fabric', 'spice', 'fruit', 'fruit', 'jewelry'] },
  { id: 'demand-large-4', market: 'large', goods: ['fabric', 'spice', 'fruit', 'jewelry', 'jewelry'] },
  { id: 'demand-large-5', market: 'large', goods: ['fabric', 'spice', 'fruit', 'jewelry', 'fabric'] },
  { id: 'demand-small-1', market: 'small', goods: ['fabric', 'fabric', 'spice', 'spice', 'fruit'] },
  { id: 'demand-small-2', market: 'small', goods: ['spice', 'spice', 'fruit', 'fruit', 'jewelry'] },
  { id: 'demand-small-3', market: 'small', goods: ['fruit', 'fruit', 'jewelry', 'jewelry', 'fabric'] },
  { id: 'demand-small-4', market: 'small', goods: ['jewelry', 'jewelry', 'fabric', 'fabric', 'spice'] },
  { id: 'demand-small-5', market: 'small', goods: ['fabric', 'spice', 'fruit', 'jewelry', 'spice'] }
];

export const playerColors = ['ruby', 'saffron', 'teal', 'indigo', 'plum'] as const;
