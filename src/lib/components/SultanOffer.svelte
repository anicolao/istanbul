<script lang="ts">
  import type { Good } from '$lib/game/manifests';
  import GameArt from './GameArt.svelte';

  let { cost, nextGood, panel = false, label }: { cost: Array<Good | 'any'>; nextGood?: Good | 'any'; panel?: boolean; label?: string } = $props();
  const goods = ['fabric', 'spice', 'fruit', 'jewelry'] as const;
  const counts = $derived(cost.reduce<Record<Good | 'any', number>>((result, good) => ({ ...result, [good]: result[good] + 1 }), { fabric: 0, spice: 0, fruit: 0, jewelry: 0, any: 0 }));
  const visibleGoods = $derived([...goods, 'any' as const].filter((good) => counts[good] > 0));
</script>

<span class:panel class="sultan-offer" aria-label={label} data-component="SultanOffer">
  <span class="sultan-cost">
    {#each visibleGoods as good}
      <span data-sultan-good={good} data-required={counts[good]}>
        {#if good === 'any'}<i class="any-good" aria-hidden="true"><i></i><i></i><i></i><i></i></i>{:else}<GameArt kind="component" component={good} />{/if}
        {#if counts[good] >= 2}<b>{counts[good]}</b>{/if}
      </span>
    {/each}
    {#if nextGood}
      <span class="next-cost" data-sultan-next={nextGood} aria-label={`Next cost adds ${nextGood === 'any' ? 'any good' : nextGood}`}>
        {#if nextGood === 'any'}<i class="any-good" aria-hidden="true"><i></i><i></i><i></i><i></i></i>{:else}<GameArt kind="component" component={nextGood} />{/if}
      </span>
    {/if}
  </span>
  <i class="offer-arrow" aria-hidden="true">→</i><span class="ruby-reward"><GameArt kind="component" component="ruby" /></span>
</span>

<style>
  .sultan-offer { width: min(100%, 14rem); height: 3.2rem; display: grid; grid-template-columns: minmax(0, 1fr) auto 1.35rem; gap: .16rem; align-items: center; padding: .28rem; border: 2px solid #d0aa62; border-radius: .45rem; background: #e4cf9d; box-shadow: 0 2px 3px #0008; }
  .sultan-cost { align-self: stretch; display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); align-items: center; gap: .1rem; }
  .sultan-cost > span { position: relative; width: min(100%, 2.35rem); aspect-ratio: 1; min-width: 0; justify-self: center; display: grid; place-items: center; border: 1px solid #8f7449; border-radius: .22rem; background: #f2e4bd; }
  .sultan-cost > span.next-cost { opacity: .38; filter: grayscale(1); border-style: dashed; background: #d1c8af; }
  .sultan-cost :global(.game-art), .any-good { width: 1.05rem; height: 1.05rem; filter: none; }
  b { position: absolute; right: -.06rem; bottom: -.06rem; z-index: 2; min-width: .68rem; padding: .08rem; border-radius: 50%; color: #fffaf0; font-size: .72rem; line-height: 1; text-align: center; white-space: nowrap; background: #a33e39; text-shadow: 0 1px 2px #000; }
  .any-good { display: grid; grid-template-columns: repeat(2, 1fr); gap: .06rem; padding: .1rem; border-radius: 50%; background: #173f43; }
  .any-good > i { border-radius: 50%; }.any-good > i:nth-child(1) { background: #9d3935; }.any-good > i:nth-child(2) { background: #4f7938; }.any-good > i:nth-child(3) { background: #d08a26; }.any-good > i:nth-child(4) { background: #345b83; }
  .offer-arrow { color: #7c5127; font-size: 1rem; font-style: normal; font-weight: 700; }
  .ruby-reward { display: grid; place-items: center; }.ruby-reward :global(.game-art) { width: 1.35rem; height: 1.35rem; filter: none; }
  .sultan-offer.panel { width: 100%; height: 4.4rem; grid-template-columns: minmax(0, 1fr) auto 2.25rem; gap: .35rem; margin: .75rem 0; padding: .45rem; }
  .sultan-offer.panel .sultan-cost { gap: .22rem; }.sultan-offer.panel .sultan-cost > span { width: min(100%, 3rem); }.sultan-offer.panel .sultan-cost :global(.game-art), .sultan-offer.panel .any-good { width: 1.65rem; height: 1.65rem; }.sultan-offer.panel .ruby-reward :global(.game-art) { width: 2.2rem; height: 2.2rem; }.sultan-offer.panel .offer-arrow { font-size: 1.5rem; }
  @media (max-width: 960px) {
    .sultan-offer:not(.panel) { width: 100%; height: 1.15rem; grid-template-columns: minmax(0, 1fr) auto .45rem; gap: .03rem; padding: .06rem; border-width: 1px; border-radius: .18rem; }.sultan-offer:not(.panel) .sultan-cost { gap: .02rem; }.sultan-offer:not(.panel) .sultan-cost > span { width: min(100%, .86rem); border-radius: .07rem; }.sultan-offer:not(.panel) .sultan-cost :global(.game-art), .sultan-offer:not(.panel) .any-good { width: .38rem; height: .38rem; }.sultan-offer:not(.panel) b { min-width: .25rem; padding: .02rem; font-size: .19rem; }.sultan-offer:not(.panel) .any-good { gap: .015rem; padding: .03rem; }.sultan-offer:not(.panel) .offer-arrow { font-size: .35rem; }.sultan-offer:not(.panel) .ruby-reward :global(.game-art) { width: .45rem; height: .45rem; }
  }
  @media (max-width: 720px) {
    .sultan-offer.panel { height: 2.4rem; grid-template-columns: minmax(0, 1fr) auto 1.3rem; gap: .12rem; margin: .1rem 0; padding: .16rem; }.sultan-offer.panel .sultan-cost { gap: .08rem; }.sultan-offer.panel .sultan-cost > span { width: min(100%, 1.8rem); }.sultan-offer.panel .sultan-cost :global(.game-art), .sultan-offer.panel .any-good { width: 1rem; height: 1rem; }.sultan-offer.panel .ruby-reward :global(.game-art) { width: 1.25rem; height: 1.25rem; }.sultan-offer.panel .offer-arrow { font-size: .85rem; }
  }
</style>
