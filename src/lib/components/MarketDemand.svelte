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
>
  <GameArt kind="component" component={market === 'large' ? 'demand-large' : 'demand-small'} class="demand-tile" />
  <span>{#each goods as good}<GameArt kind="component" component={good} label={good} />{/each}</span>
</span>

<style>
  .demand-board { position: relative; width: min(100%, 9rem); height: 3.15rem; display: grid; place-items: center; overflow: hidden; border: 2px solid #d0ab63; border-radius: .42rem; box-shadow: 0 2px 3px #0008; }
  .demand-board :global(.demand-tile) { position: absolute; inset: 0; width: 100%; height: 100%; filter: brightness(.72); }
  .demand-board > span { position: relative; z-index: 2; display: flex; gap: .2rem; }
  .demand-board > span :global(.game-art) { width: 1.55rem; height: 1.55rem; filter: drop-shadow(0 2px 2px #000b); }
  .demand-board.review { width: min(92%, 24rem); height: auto; aspect-ratio: 9 / 3.15; }
  .demand-board.review > span { gap: clamp(.2rem, 1vw, .7rem); }
  .demand-board.review > span :global(.game-art) { width: clamp(1.55rem, 5vw, 4rem); height: clamp(1.55rem, 5vw, 4rem); }
  @media (max-width: 960px) {
    .demand-board:not(.review) { width: 100%; height: 1.35rem; border-width: 1px; border-radius: .2rem; }
    .demand-board:not(.review) > span { gap: .04rem; }
    .demand-board:not(.review) > span :global(.game-art) { width: min(.65rem, 18%); height: min(.65rem, 85%); filter: drop-shadow(0 1px 1px #000b); }
  }
</style>
