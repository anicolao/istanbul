import type { BonusCardManifest, Good } from './manifests';

export const playerColorNames = ['ruby', 'saffron', 'teal', 'indigo', 'plum'] as const;
export type PlayerColorName = (typeof playerColorNames)[number];

export const playerHighlightColors: Record<PlayerColorName, string> = {
  ruby: '#d23b32',
  saffron: '#e6a012',
  teal: '#159f9b',
  indigo: '#4387bd',
  plum: '#b45b88'
};

export const locationArt = Object.fromEntries(
  Array.from({ length: 16 }, (_, index) => {
    const id = index + 1;
    return [id, `art/reskin/location-${String(id).padStart(2, '0')}.png`];
  })
) as Record<number, string>;

export const pieceArt = {
  merchant: Object.fromEntries(playerColorNames.map((color) => [color, `art/reskin/merchant-${color}.png`])) as Record<PlayerColorName, string>,
  assistant: Object.fromEntries(playerColorNames.map((color) => [color, `art/reskin/assistant-${color}.png`])) as Record<PlayerColorName, string>,
  family: Object.fromEntries(playerColorNames.map((color) => [color, `art/reskin/family-${color}.png`])) as Record<PlayerColorName, string>,
  neutralMerchant: 'art/reskin/neutral-merchant.png',
  governor: 'art/reskin/governor.png',
  smuggler: 'art/reskin/smuggler.png',
  firstPlayer: 'art/reskin/first-player.png',
  dicePair: 'art/reskin/dice-pair.png'
} as const;

export type PieceKind = 'merchant' | 'assistant' | 'family';

export const bonusCardArt: Record<BonusCardManifest['effect'] | 'back' | 'deck', string> = {
  'gain-good': 'art/reskin/card-gain-good.png',
  'gain-lira': 'art/reskin/card-gain-lira.png',
  'repeat-sultan': 'art/reskin/card-repeat-sultan.png',
  'repeat-post': 'art/reskin/card-repeat-post.png',
  'repeat-gemstone': 'art/reskin/card-repeat-gemstone.png',
  'return-family': 'art/reskin/card-return-family.png',
  stay: 'art/reskin/card-stay.png',
  'long-move': 'art/reskin/card-long-move.png',
  'wild-small-market': 'art/reskin/card-wild-small-market.png',
  'return-assistant': 'art/reskin/card-return-assistant.png',
  back: 'art/reskin/card-back.png',
  deck: 'art/reskin/card-back.png'
};

export const playerMatArt = Object.fromEntries(
  playerColorNames.map((color) => [color, 'art/reskin/player-mat.png'])
) as Record<PlayerColorName, string>;

export const componentArt = {
  any: 'art/reskin/any.png',
  fabric: 'art/reskin/fabric.png',
  spice: 'art/reskin/spice.png',
  fruit: 'art/reskin/fruit.png',
  jewelry: 'art/reskin/jewelry.png',
  lira: 'art/reskin/lira.png',
  ruby: 'art/reskin/ruby.png',
  wheelbarrow: 'art/reskin/wheelbarrow.png',
  die: 'art/reskin/die.png',
  mail: 'art/reskin/mail.png',
  mosque: {
    fabric: 'art/reskin/mosque-fabric.png',
    spice: 'art/reskin/mosque-spice.png',
    fruit: 'art/reskin/mosque-fruit.png',
    jewelry: 'art/reskin/mosque-jewelry.png'
  } satisfies Record<Good, string>,
  demandLarge: 'art/reskin/demand-large.png',
  demandSmall: 'art/reskin/demand-small.png',
  rubySupply: 'art/reskin/ruby-supply.png',
  goodsSupply: 'art/reskin/goods-supply.png'
} as const;

/** Trimmed, prefiltered versions of the same reskin art for dense tray UI. */
export const compactComponentArt: Record<Good | 'ruby', string> = {
  fabric: 'art/reskin/compact/fabric.png',
  spice: 'art/reskin/compact/spice.png',
  fruit: 'art/reskin/compact/fruit.png',
  jewelry: 'art/reskin/compact/jewelry.png',
  ruby: 'art/reskin/compact/ruby.png'
};

export function artPath(basePath: string, asset: string) {
  return `${basePath}/${asset}`;
}
