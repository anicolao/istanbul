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
    component?: Good | 'any' | 'lira' | 'ruby' | 'wheelbarrow' | 'die' | 'mail' | 'mosque-fabric' | 'mosque-spice' | 'mosque-fruit' | 'mosque-jewelry' | 'demand-large' | 'demand-small' | 'ruby-supply' | 'goods-supply';
    renderSize?: 'full' | 'compact';
    label?: string;
    class?: string;
  } = $props();

  const componentPaths = {
    any: componentArt.any,
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

  const explanations: Record<string, string> = {
    any: 'Any resource: choose fabric, spice, fruit, or jewelry.',
    fabric: 'Fabric', spice: 'Spice', fruit: 'Fruit', jewelry: 'Jewelry',
    lira: 'Lira: money for payments and purchases.', ruby: 'Ruby: collect rubies to win.',
    'neutral-merchant': 'Neutral merchant: pay 2 Lira to act here. No toll at the Fountain.',
    governor: 'Governor: draw a Bonus card, then pay 2 Lira or discard a card. Roll to relocate him.',
    smuggler: 'Smuggler: gain a good, then pay 2 Lira or give a good. Roll to relocate him.',
    assistant: 'Assistant: leave one to act, or collect yours if one is already here.',
    family: 'Family member: sent from the Police Station to perform a location action.',
    merchant: 'Merchant: moves with your assistants to take location actions.',
    wheelbarrow: 'Wheelbarrow extension: increases capacity for every good.',
    'dice-pair': 'Roll two dice and add their values.',
    'mosque-fabric': 'Red power: reroll both dice or turn one die to 4.',
    'mosque-spice': 'Green power: at a warehouse, pay 2 Lira for one additional good.',
    'mosque-fruit': 'Yellow power: pay 2 Lira to return an assistant to your merchant.',
    'mosque-jewelry': 'Blue power: gain your fifth assistant.',
  };
  const help = $derived(label ?? explanations[component ?? piece ?? '']);
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

<!-- Pawns are focusable so keyboard users can read their component explanation without taking an action. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<span
  class={`game-art ${className}`}
  class:location={kind === 'location'}
  class:piece={kind === 'piece'}
  class:mat={kind === 'mat'}
  class:component={kind === 'component'}
  style={`--game-art: url('${artPath(base, asset)}')`}
  role={help ? 'img' : undefined}
  aria-label={help}
  tabindex={help && kind === 'piece' ? 0 : undefined}
  data-help={help}
  aria-hidden={help ? undefined : 'true'}
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
