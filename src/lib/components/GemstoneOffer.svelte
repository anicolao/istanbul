<script lang="ts">
  import GameArt from './GameArt.svelte';

  let { price, panel = false }: { price: number; panel?: boolean } = $props();
  const prices = $derived(Array.from({ length: 3 }, (_, offset) => Math.min(25, price + offset)));
</script>

<span class:panel class="gemstone-payoffs" aria-label={`Gemstone Dealer ruby prices: now ${prices[0]}, next ${prices[1]}, then ${prices[2]} Lira`} data-component="GemstoneOffer">
  {#each prices as amount, index}
    <span class:current={index === 0} data-price-step={index} data-price={amount}><small>{index === 0 ? 'now' : index === 1 ? 'next' : 'then'}</small><i><GameArt kind="component" component="lira" /><b>{amount}</b></i><i><span aria-hidden="true">→</span><GameArt kind="component" component="ruby" /></i></span>
  {/each}
</span>

<style>
  .gemstone-payoffs { width: min(100%, 9rem); height: 3.2rem; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .18rem; padding: .28rem; border: 2px solid #cda65f; border-radius: .45rem; background: #23170fe8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }
  .gemstone-payoffs > span { min-width: 0; display: grid; grid-template-rows: auto 1fr 1fr; place-items: center; padding: .08rem; border: 1px solid #efca7d77; border-radius: .3rem; background: #173f43; }
  .gemstone-payoffs > span.current { border-color: #efca7d; background: #245e5c; box-shadow: inset 0 0 0 1px #efca7d66; }
  small { color: #efca7d; font-size: .38rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  i { display: flex; align-items: center; justify-content: center; color: #efca7d; font-size: .55rem; font-style: normal; }
  :global(.game-art) { width: .78rem; height: .78rem; filter: none; }
  b { min-width: .72rem; margin-left: -.1rem; padding: .08rem; border-radius: 50%; color: #fffaf0; font-size: .48rem; line-height: 1; text-align: center; background: #a33e39; text-shadow: 0 1px 2px #000; }
  .gemstone-payoffs.panel { width: 100%; height: 4.4rem; gap: .35rem; margin: .75rem 0; padding: .45rem; }.gemstone-payoffs.panel > span { padding: .18rem; }.gemstone-payoffs.panel small { font-size: .55rem; }.gemstone-payoffs.panel i { font-size: .85rem; }.gemstone-payoffs.panel :global(.game-art) { width: 1.25rem; height: 1.25rem; }.gemstone-payoffs.panel b { min-width: 1.05rem; font-size: .72rem; }
  @media (max-width: 960px) {
    .gemstone-payoffs:not(.panel) { width: 100%; height: 1.15rem; gap: .04rem; padding: .06rem; border-width: 1px; border-radius: .18rem; }.gemstone-payoffs:not(.panel) > span { padding: .015rem; border-radius: .1rem; }.gemstone-payoffs:not(.panel) small { font-size: .15rem; }.gemstone-payoffs:not(.panel) i { font-size: .17rem; }.gemstone-payoffs:not(.panel) :global(.game-art) { width: .28rem; height: .28rem; }.gemstone-payoffs:not(.panel) b { min-width: .28rem; padding: .02rem; font-size: .17rem; }
  }
  @media (max-width: 720px) {
    .gemstone-payoffs.panel { height: 2.4rem; gap: .12rem; margin: .1rem 0; padding: .16rem; }.gemstone-payoffs.panel > span { padding: .06rem; }.gemstone-payoffs.panel small { font-size: .4rem; }.gemstone-payoffs.panel i { font-size: .55rem; }.gemstone-payoffs.panel :global(.game-art) { width: .8rem; height: .8rem; }.gemstone-payoffs.panel b { min-width: .7rem; font-size: .48rem; }
  }
</style>
