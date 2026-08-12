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
  merchant: Object.fromEntries(playerColorNames.map((color) => [color, `art/game/pieces/merchant-${color}.webp`])) as Record<PlayerColorName, string>,
  assistant: Object.fromEntries(playerColorNames.map((color) => [color, `art/game/pieces/assistant-${color}.webp`])) as Record<PlayerColorName, string>,
  family: Object.fromEntries(playerColorNames.map((color) => [color, `art/game/pieces/family-${color}.webp`])) as Record<PlayerColorName, string>,
  neutralMerchant: 'art/game/pieces/neutral-merchant.webp',
  governor: 'art/game/pieces/governor.webp',
  smuggler: 'art/game/pieces/smuggler.webp',
  firstPlayer: 'art/game/pieces/first-player.webp',
  dicePair: 'art/game/pieces/dice-pair.webp'
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
  fabric: 'art/game/components/fabric.webp',
  spice: 'art/game/components/spice.webp',
  fruit: 'art/game/components/fruit.webp',
  jewelry: 'art/game/components/jewelry.webp',
  lira: 'art/game/components/lira.webp',
  ruby: 'art/game/components/ruby.webp',
  wheelbarrow: 'art/game/components/wheelbarrow-extension.webp',
  die: 'art/game/components/die.webp',
  mail: 'art/game/components/mail-marker.webp',
  bonusDeck: 'art/game/components/bonus-deck.webp',
  mosque: {
    fabric: 'art/game/components/mosque-fabric.webp',
    spice: 'art/game/components/mosque-spice.webp',
    fruit: 'art/game/components/mosque-fruit.webp',
    jewelry: 'art/game/components/mosque-jewelry.webp'
  } satisfies Record<Good, string>,
  sultanTrack: 'art/game/components/sultan-track.webp',
  demandLarge: 'art/game/components/demand-large.webp',
  demandSmall: 'art/game/components/demand-small.webp',
  gemstoneTrack: 'art/game/components/gemstone-track.webp',
  rubySupply: 'art/game/components/ruby-supply.webp',
  goodsSupply: 'art/game/components/goods-supply.webp'
} as const;

export function artPath(basePath: string, asset: string) {
  return `${basePath}/${asset}`;
}
