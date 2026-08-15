import type { BonusCardManifest, Good } from './manifests';

export const playerColorNames = ['ruby', 'saffron', 'teal', 'indigo', 'plum'] as const;
export type PlayerColorName = (typeof playerColorNames)[number];

export const locationArt = Object.fromEntries(
  Array.from({ length: 16 }, (_, index) => {
    const id = index + 1;
    const names = [
      'wainwright', 'fabric-warehouse', 'spice-warehouse', 'fruit-warehouse',
      'post-office', 'caravansary', 'fountain', 'black-market',
      'tea-house', 'large-market', 'small-market', 'police-station',
      'sultans-palace', 'small-mosque', 'great-mosque', 'gemstone-dealer'
    ];
    return [id, `art/game/locations/${String(id).padStart(2, '0')}-${names[index]}.webp`];
  })
) as Record<number, string>;

export const pieceArt = {
  merchant: Object.fromEntries(playerColorNames.map((color) => [color, `art/game/pieces/merchant-${color}-transparent.png`])) as Record<PlayerColorName, string>,
  assistant: Object.fromEntries(playerColorNames.map((color) => [color, `art/game/pieces/assistant-${color}-transparent.png`])) as Record<PlayerColorName, string>,
  family: Object.fromEntries(playerColorNames.map((color) => [color, `art/game/pieces/family-${color}-transparent.png`])) as Record<PlayerColorName, string>,
  neutralMerchant: 'art/game/pieces/neutral-merchant-transparent.png',
  governor: 'art/game/pieces/governor-transparent.png',
  smuggler: 'art/game/pieces/smuggler-transparent.png',
  firstPlayer: 'art/game/pieces/first-player-transparent.png',
  dicePair: 'art/game/pieces/dice-pair-transparent.png'
} as const;

export type PieceKind = 'merchant' | 'assistant' | 'family';

export const bonusCardArt: Record<BonusCardManifest['effect'] | 'back' | 'deck', string> = {
  'gain-good': 'art/game/cards/gain-good.webp',
  'gain-lira': 'art/game/cards/gain-lira.webp',
  'repeat-sultan': 'art/game/cards/repeat-sultan.webp',
  'repeat-post': 'art/game/cards/repeat-post.webp',
  'repeat-gemstone': 'art/game/cards/repeat-gemstone.webp',
  'return-family': 'art/game/cards/return-family.webp',
  stay: 'art/game/cards/stay.webp',
  'long-move': 'art/game/cards/long-move.webp',
  'wild-small-market': 'art/game/cards/wild-small-market.webp',
  'return-assistant': 'art/game/cards/return-assistant.webp',
  back: 'art/game/cards/card-back.webp',
  deck: 'art/game/cards/deck.webp'
};

export const playerMatArt = Object.fromEntries(
  playerColorNames.map((color) => [color, `art/game/mats/${color}.webp`])
) as Record<PlayerColorName, string>;

export const componentArt = {
  fabric: 'art/game/components/transparent/fabric.png',
  spice: 'art/game/components/transparent/spice.png',
  fruit: 'art/game/components/transparent/fruit.png',
  jewelry: 'art/game/components/transparent/jewelry.png',
  lira: 'art/game/components/transparent/lira.png',
  ruby: 'art/game/components/transparent/ruby.png',
  wheelbarrow: 'art/game/components/transparent/wheelbarrow.png',
  die: 'art/game/components/transparent/die.png',
  mail: 'art/game/components/transparent/mail.png',
  mosque: {
    fabric: 'art/game/components/transparent/mosque-fabric.png',
    spice: 'art/game/components/transparent/mosque-spice.png',
    fruit: 'art/game/components/transparent/mosque-fruit.png',
    jewelry: 'art/game/components/transparent/mosque-jewelry.png'
  } satisfies Record<Good, string>,
  demandLarge: 'art/game/components/transparent/demand-large.png',
  demandSmall: 'art/game/components/transparent/demand-small.png',
  rubySupply: 'art/game/components/transparent/ruby-supply.png',
  goodsSupply: 'art/game/components/transparent/goods-supply.png'
} as const;

/** Pre-filtered source sizes for dense tray UI, avoiding unstable browser downsampling of 1254px art into ~20–50px wells. */
export const compactComponentArt: Record<Good | 'ruby', string> = {
  fabric: 'art/game/components/tray/fabric.png',
  spice: 'art/game/components/tray/spice.png',
  fruit: 'art/game/components/tray/fruit.png',
  jewelry: 'art/game/components/tray/jewelry.png',
  ruby: 'art/game/components/tray/ruby.png'
};

export function artPath(basePath: string, asset: string) {
  return `${basePath}/${asset}`;
}
