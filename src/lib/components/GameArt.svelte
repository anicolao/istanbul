<script lang="ts">
  import { base } from '$app/paths';
  import {
    artPath,
    compactComponentArt,
    componentArt,
    locationArt,
    pieceArt,
    playerMatArt,
    type PieceKind,
    type PlayerColorName
  } from '$lib/game/art';
  import type { Good } from '$lib/game/manifests';

  let {
    kind,
    place,
    piece,
    color,
    component,
    renderSize = 'full',
    label,
    class: className = ''
  }: {
    kind: 'location' | 'piece' | 'mat' | 'component';
    place?: number;
    piece?: PieceKind | 'neutral-merchant' | 'governor' | 'smuggler' | 'first-player' | 'dice-pair';
    color?: PlayerColorName;
    component?: Good | 'lira' | 'ruby' | 'wheelbarrow' | 'die' | 'mail' | 'mosque-fabric' | 'mosque-spice' | 'mosque-fruit' | 'mosque-jewelry' | 'demand-large' | 'demand-small' | 'ruby-supply' | 'goods-supply';
    renderSize?: 'full' | 'compact';
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
    'mosque-fabric': componentArt.mosque.fabric,
    'mosque-spice': componentArt.mosque.spice,
    'mosque-fruit': componentArt.mosque.fruit,
    'mosque-jewelry': componentArt.mosque.jewelry,
    'demand-large': componentArt.demandLarge,
    'demand-small': componentArt.demandSmall,
    'ruby-supply': componentArt.rubySupply,
    'goods-supply': componentArt.goodsSupply
  } as const;

  const asset = $derived.by(() => {
    if (kind === 'location' && place) return locationArt[place];
    if (kind === 'mat' && color) return playerMatArt[color];
    if (kind === 'component' && component) {
      if (renderSize === 'compact' && component in compactComponentArt) return compactComponentArt[component as Good | 'ruby'];
      return componentPaths[component];
    }
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
  class:mat={kind === 'mat'}
  class:component={kind === 'component'}
  style={`--game-art: url('${artPath(base, asset)}')`}
  role={label ? 'img' : undefined}
  aria-label={label}
  title={label}
  aria-hidden={label ? undefined : 'true'}
  data-art-kind={kind}
  data-art-resolution={renderSize}
  data-piece={kind === 'piece' ? piece : undefined}
  data-color={kind === 'piece' ? color : undefined}
  data-component="GameArt"
></span>

<style>
  .game-art { display: inline-block; background-image: var(--game-art); background-position: center; background-repeat: no-repeat; background-size: cover; }
  .piece, .component { background-size: contain; }
  .location, .mat { width: 100%; height: 100%; }
</style>
