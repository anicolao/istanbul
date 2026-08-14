import {
  bonusCardArt,
  componentArt,
  locationArt,
  pieceArt,
  playerColorNames,
  playerMatArt,
  type PieceKind,
  type PlayerColorName
} from './art';
import { bonusCards, demandTiles, places, type BonusCardManifest, type Good } from './manifests';

export type GalleryCategoryId = 'places' | 'mats' | 'pieces' | 'bonus' | 'demands' | 'components';
export type GalleryComponent = Good | 'lira' | 'ruby' | 'wheelbarrow' | 'die' | 'mail' | 'bonus-deck'
  | 'mosque-fabric' | 'mosque-spice' | 'mosque-fruit' | 'mosque-jewelry'
  | 'sultan-track' | 'demand-large' | 'demand-small' | 'gemstone-track' | 'ruby-supply' | 'goods-supply';

export type GalleryItem = {
  id: string;
  title: string;
  detail: string;
  assetPath: string;
  category: GalleryCategoryId;
} & (
  | { kind: 'location'; place: number }
  | { kind: 'mat'; color: PlayerColorName }
  | { kind: 'piece'; piece: PieceKind | 'neutral-merchant' | 'governor' | 'smuggler' | 'first-player' | 'dice-pair'; color?: PlayerColorName }
  | { kind: 'card'; effect: BonusCardManifest['effect'] }
  | { kind: 'card-back' }
  | { kind: 'card-deck' }
  | { kind: 'component'; component: GalleryComponent }
  | { kind: 'demand'; market: 'large' | 'small'; goods: Good[] }
);

const titleCase = (value: string) => value.split('-').map((word) => `${word[0].toUpperCase()}${word.slice(1)}`).join(' ');

const placeItems: GalleryItem[] = places.map((place) => ({
  id: `place-${String(place.id).padStart(2, '0')}`,
  title: `${place.id}. ${place.name}`,
  detail: place.action,
  assetPath: locationArt[place.id],
  category: 'places',
  kind: 'location',
  place: place.id
}));

const matItems: GalleryItem[] = playerColorNames.map((color) => ({
  id: `mat-${color}`,
  title: `${titleCase(color)} player mat`,
  detail: 'Goods tracks, wheelbarrow extensions, ruby wells, purse, Bonus cards, and Mosque powers.',
  assetPath: playerMatArt[color],
  category: 'mats',
  kind: 'mat',
  color
}));

const playerPieceItems: GalleryItem[] = (['merchant', 'assistant', 'family'] as PieceKind[]).flatMap((piece) =>
  playerColorNames.map((color) => ({
    id: `${piece}-${color}`,
    title: `${titleCase(color)} ${piece === 'family' ? 'family member' : piece}`,
    detail: piece === 'merchant' ? 'The player pawn moved around the bazaar.' : piece === 'assistant' ? 'Dropped and collected during movement.' : 'Sent from Police Station or caught by another merchant.',
    assetPath: pieceArt[piece][color],
    category: 'pieces' as const,
    kind: 'piece' as const,
    piece,
    color
  }))
);

const specialPieces: Array<{ id: string; title: string; piece: 'neutral-merchant' | 'governor' | 'smuggler' | 'first-player' | 'dice-pair'; detail: string; assetPath: string }> = [
  { id: 'neutral-merchant', title: 'Neutral merchant', piece: 'neutral-merchant', detail: 'Two-player blocking and payment pawn.', assetPath: pieceArt.neutralMerchant },
  { id: 'governor', title: 'Governor', piece: 'governor', detail: 'Optional Bonus-card encounter token.', assetPath: pieceArt.governor },
  { id: 'smuggler', title: 'Smuggler', piece: 'smuggler', detail: 'Optional goods-trade encounter token.', assetPath: pieceArt.smuggler },
  { id: 'first-player', title: 'First-player marker', piece: 'first-player', detail: 'Marks the starting merchant and final-round boundary.', assetPath: pieceArt.firstPlayer },
  { id: 'dice-pair', title: 'Dice pair', piece: 'dice-pair', detail: 'Shared chance marker for public rolls.', assetPath: pieceArt.dicePair }
];

const pieceItems: GalleryItem[] = [...playerPieceItems, ...specialPieces.map((item) => ({ ...item, category: 'pieces' as const, kind: 'piece' as const }))];

const distinctBonus = [...new Map(bonusCards.map((card) => [card.effect, card])).values()];
const bonusItems: GalleryItem[] = distinctBonus.map((card) => ({
  id: `bonus-${card.effect}`,
  title: card.title,
  detail: `${card.text} · ${bonusCards.filter(({ effect }) => effect === card.effect).length} copies`,
  assetPath: bonusCardArt[card.effect],
  category: 'bonus',
  kind: 'card',
  effect: card.effect
}));
bonusItems.push(
  { id: 'bonus-card-back', title: 'Bonus card back', detail: 'Conceals every private hand and face-down draw.', assetPath: bonusCardArt.back, category: 'bonus', kind: 'card-back' },
  { id: 'bonus-deck-face', title: 'Bonus draw deck', detail: 'Public face-down deck presentation.', assetPath: bonusCardArt.deck, category: 'bonus', kind: 'card-deck' }
);

const componentDefinitions: Array<[GalleryComponent, string, string, string]> = [
  ['fabric', 'Fabric good', 'Red goods marker.', componentArt.fabric],
  ['spice', 'Spice good', 'Green goods marker.', componentArt.spice],
  ['fruit', 'Fruit good', 'Yellow goods marker.', componentArt.fruit],
  ['jewelry', 'Jewelry good', 'Blue goods marker.', componentArt.jewelry],
  ['lira', 'Lira', 'Money marker and purse icon.', componentArt.lira],
  ['ruby', 'Ruby', 'Victory marker.', componentArt.ruby],
  ['wheelbarrow', 'Wheelbarrow extension', 'Goods-capacity upgrade tile.', componentArt.wheelbarrow],
  ['die', 'Single die', 'Result marker for individual dice.', componentArt.die],
  ['mail', 'Mail indicator', 'Post Office track cube.', componentArt.mail],
  ['bonus-deck', 'Bonus deck marker', 'Small public pile icon.', componentArt.bonusDeck],
  ['mosque-fabric', 'Red Mosque power', 'Dice adjustment power tile.', componentArt.mosque.fabric],
  ['mosque-spice', 'Green Mosque power', 'Warehouse extra-good power tile.', componentArt.mosque.spice],
  ['mosque-fruit', 'Yellow Mosque power', 'Assistant recall power tile.', componentArt.mosque.fruit],
  ['mosque-jewelry', 'Blue Mosque power', 'Fifth-assistant power tile.', componentArt.mosque.jewelry],
  ['sultan-track', 'Sultan goods track', 'Goods-cost apparatus for ruby deliveries.', componentArt.sultanTrack],
  ['demand-large', 'Large Market demand base', 'Background used beneath the five live demand goods.', componentArt.demandLarge],
  ['demand-small', 'Small Market demand base', 'Background used beneath the five live demand goods.', componentArt.demandSmall],
  ['gemstone-track', 'Gemstone price track', 'Escalating Lira-cost apparatus.', componentArt.gemstoneTrack],
  ['ruby-supply', 'Ruby supply', 'Public ruby presentation.', componentArt.rubySupply],
  ['goods-supply', 'Goods supply', 'Public mixed-goods presentation.', componentArt.goodsSupply]
];

const componentItems: GalleryItem[] = componentDefinitions.map(([component, title, detail, assetPath]) => ({
  id: `component-${component}`,
  title,
  detail,
  assetPath,
  category: 'components',
  kind: 'component',
  component
}));

const demandItems: GalleryItem[] = demandTiles.map((tile) => ({
  id: tile.id,
  title: `${tile.market === 'large' ? 'Large' : 'Small'} Market · ${tile.id.at(-1)}`,
  detail: tile.goods.map(titleCase).join(' · '),
  assetPath: tile.market === 'large' ? componentArt.demandLarge : componentArt.demandSmall,
  category: 'demands',
  kind: 'demand',
  market: tile.market,
  goods: tile.goods
}));

export const galleryCategories: Array<{ id: GalleryCategoryId; label: string; description: string; items: GalleryItem[] }> = [
  { id: 'places', label: 'Locations', description: 'All sixteen live LocationTile states, including titles, pieces, and public apparatus.', items: placeItems },
  { id: 'mats', label: 'Player trays', description: 'Five representative PlayerTray states with live goods, powers, money, and rubies.', items: matItems },
  { id: 'pieces', label: 'Playing pieces', description: 'The GameArt components used for merchants, assistants, family members, and neutral figures.', items: pieceItems },
  { id: 'bonus', label: 'Bonus cards', description: 'Rendered BonusCard rules faces plus the private back and draw deck.', items: bonusItems },
  { id: 'demands', label: 'Market demands', description: 'Every live MarketDemand goods combination.', items: demandItems },
  { id: 'components', label: 'Physical components', description: 'The GameArt goods, money, rubies, powers, tracks, and supplies composed into game UI.', items: componentItems }
];

export const rawGalleryItems = galleryCategories.filter(({ id }) => id !== 'demands').flatMap(({ items }) => items);
