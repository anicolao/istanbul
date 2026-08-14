<script lang="ts">
  import { base } from '$app/paths';
  import {
    artPath,
    bonusCardArt,
    componentArt,
    locationArt,
    pieceArt,
    playerMatArt,
    type PieceKind,
    type PlayerColorName
  } from '$lib/game/art';
  import type { BonusCardManifest, Good } from '$lib/game/manifests';

  let {
    kind,
    place,
    piece,
    color,
    effect,
    component,
    label,
    class: className = ''
  }: {
    kind: 'location' | 'piece' | 'card' | 'card-back' | 'card-deck' | 'mat' | 'component';
    place?: number;
    piece?: PieceKind | 'neutral-merchant' | 'governor' | 'smuggler' | 'first-player' | 'dice-pair';
    color?: PlayerColorName;
    effect?: BonusCardManifest['effect'];
    component?: Good | 'lira' | 'ruby' | 'wheelbarrow' | 'die' | 'mail' | 'bonus-deck' | 'mosque-fabric' | 'mosque-spice' | 'mosque-fruit' | 'mosque-jewelry' | 'sultan-track' | 'demand-large' | 'demand-small' | 'gemstone-track' | 'ruby-supply' | 'goods-supply';
    label?: string;
    class?: string;
  } = $props();

  const componentPaths = {
    fabric: componentArt.fabric,
    spice: componentArt.spice,
    fruit: componentArt.fruit,
    jewelry: componentArt.jewelry,
    lira: componentArt.lira,
    ruby: componentArt.ruby,
    wheelbarrow: componentArt.wheelbarrow,
    die: componentArt.die,
    mail: componentArt.mail,
    'bonus-deck': componentArt.bonusDeck,
    'mosque-fabric': componentArt.mosque.fabric,
    'mosque-spice': componentArt.mosque.spice,
    'mosque-fruit': componentArt.mosque.fruit,
    'mosque-jewelry': componentArt.mosque.jewelry,
    'sultan-track': componentArt.sultanTrack,
    'demand-large': componentArt.demandLarge,
    'demand-small': componentArt.demandSmall,
    'gemstone-track': componentArt.gemstoneTrack,
    'ruby-supply': componentArt.rubySupply,
    'goods-supply': componentArt.goodsSupply
  } as const;

  const asset = $derived.by(() => {
    if (kind === 'location' && place) return locationArt[place];
    if (kind === 'mat' && color) return playerMatArt[color];
    if (kind === 'card' && effect) return bonusCardArt[effect];
    if (kind === 'card-back') return bonusCardArt.back;
    if (kind === 'card-deck') return bonusCardArt.deck;
    if (kind === 'component' && component) return componentPaths[component];
    if (kind === 'piece' && piece) {
      if ((piece === 'merchant' || piece === 'assistant' || piece === 'family') && color) return pieceArt[piece][color];
      if (piece === 'neutral-merchant') return pieceArt.neutralMerchant;
      if (piece === 'governor') return pieceArt.governor;
      if (piece === 'smuggler') return pieceArt.smuggler;
      if (piece === 'first-player') return pieceArt.firstPlayer;
      if (piece === 'dice-pair') return pieceArt.dicePair;
    }
    return componentArt.goodsSupply;
  });
</script>

<span
  class={`game-art ${className}`}
  class:location={kind === 'location'}
  class:piece={kind === 'piece'}
  class:card={kind === 'card' || kind === 'card-back' || kind === 'card-deck'}
  class:mat={kind === 'mat'}
  class:component={kind === 'component'}
  style={`--game-art: url('${artPath(base, asset)}')`}
  role={label ? 'img' : undefined}
  aria-label={label}
  title={label}
  aria-hidden={label ? undefined : 'true'}
  data-art-kind={kind}
></span>

<style>
  .game-art { display: inline-block; background-image: var(--game-art); background-position: center; background-repeat: no-repeat; background-size: cover; }
  .piece, .component { background-size: contain; }
  .card { aspect-ratio: 1 / 1.5; }
  .location, .mat { width: 100%; height: 100%; }
</style>
