<script lang="ts">
  import type { Good } from '$lib/game/manifests';
  import GameArt from './GameArt.svelte';

  let {
    market,
    goods,
    label,
    review = false
  }: {
    market: 'large' | 'small';
    goods: Good[];
    label?: string;
    review?: boolean;
  } = $props();
</script>

<span
  class:review
  class="demand-board"
  aria-label={label ?? `${market === 'large' ? 'Large' : 'Small'} Market demand: ${goods.join(', ')}`}
  role="img"
  data-component="MarketDemand"
  data-market={market}
  data-goods={goods.join(',')}
  data-good-layout="circular-overlay"
>
  <GameArt kind="component" component={market === 'large' ? 'demand-large' : 'demand-small'} class="demand-tile" />
  <span class="good-overlays" aria-hidden="true">
    {#each goods as good, index}
      <span class={`demand-good slot-${index + 1}`} data-demand-slot={index + 1} data-good={good} title={good}>
        <GameArt kind="component" component={good} />
      </span>
    {/each}
  </span>
</span>

<style>
  .demand-board { position: relative; width: min(100%, 3.4rem); aspect-ratio: 1; display: block; flex: 0 1 auto; overflow: hidden; border: 2px solid #d0ab63; border-radius: .42rem; background: #092f32; box-shadow: 0 2px 3px #0008; }
  .demand-board :global(.demand-tile) { position: absolute; inset: 0; width: 100%; height: 100%; filter: brightness(.82); }
  .good-overlays { position: absolute; z-index: 2; inset: 0; }
  .demand-good { position: absolute; width: 19%; aspect-ratio: 1; border: max(1px, .035em) solid #d8b96f; border-radius: 50%; background: #082e31; box-shadow: 0 .04em .1em #000b, inset 0 0 0 .025em #6f4c21; transform: translate(-50%, -50%); }
  .demand-good :global(.game-art) { position: absolute; inset: 0; width: 100%; height: 100%; border-radius: inherit; background-size: 125%; filter: saturate(1.08) contrast(1.04); }
  .slot-1 { top: 28.75%; left: 50%; }
  .slot-2 { top: 41.25%; left: 28.5%; }
  .slot-3 { top: 41.25%; left: 72%; }
  .slot-4 { top: 64.25%; left: 39.25%; }
  .slot-5 { top: 64.25%; left: 62.25%; }
  .demand-board.review { width: min(72%, 17rem); border-width: 3px; border-radius: .7rem; box-shadow: 0 .35rem .8rem #0007; }
  .demand-board.review .demand-good { box-shadow: 0 .11em .22em #000c, inset 0 0 0 .045em #6f4c21; }
  @media (max-width: 960px) {
    .demand-board:not(.review) { width: 1.3rem; border-width: 1px; border-radius: .2rem; }
    .demand-good { border-width: 1px; }
  }
</style>
