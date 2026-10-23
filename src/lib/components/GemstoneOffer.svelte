<script lang="ts">
  import GameArt from './GameArt.svelte';

  let { price, taken = false }: { price: number; taken?: boolean } = $props();
  const prices = $derived(
    Array.from({ length: 3 }, (_, offset) => Math.min(25, price + offset))
  );
</script>

<span
  class="gemstone-payoffs"
  aria-label={`Gemstone Dealer ruby prices: now ${prices[0]}, next ${prices[1]}, then ${prices[2]} Lira`}
  data-component="GemstoneOffer"
>
  {#each prices as amount, index}
    <span
      class="outcome"
      class:current={index === 0}
      data-price-step={index}
      data-price={amount}
    >
      <small>{index === 0 ? 'now' : index === 1 ? 'next' : 'then'}</small>
      <span class="cost"
        ><GameArt kind="component" component="lira" /><b>{amount}</b></span
      >
      <span class="payout"
        ><span aria-hidden="true">→</span><span
          data-gemstone-ruby
          class:taken={index === 0 && taken}
          ><GameArt kind="component" component="ruby" /></span
        ></span
      >
    </span>
  {/each}
</span>

<style>
  [data-gemstone-ruby] {
    display: inline-flex;
  }
  .taken {
    visibility: hidden;
  }
  .gemstone-payoffs {
    display: grid;
    grid-template-columns: max-content max-content max-content;
    width: max-content;
    max-width: 100%;
    margin: 0 auto;
    gap: 0.08em 0.45em;
    padding: 0.2em 0.45em;
    box-sizing: border-box;
    border: 1px solid #cda65f99;
    border-radius: 0.35em;
    background: #23170fd9;
    color: #fff1cd;
    font-size: inherit;
    line-height: 1;
  }
  .outcome {
    display: contents;
  }
  small {
    align-self: center;
    color: #d3bd8e;
    font-size: 0.7em;
    font-weight: 700;
    text-transform: uppercase;
  }
  .current small {
    color: #ffe4a0;
  }
  .cost,
  .payout {
    display: flex;
    align-items: center;
    gap: 0.25em;
    white-space: nowrap;
  }
  b {
    font-size: 1.05em;
  }
  .cost :global(.game-art) {
    width: 2em;
    height: 1.65em;
    filter: none;
  }
  .payout :global(.game-art) {
    width: 1.45em;
    height: 1.45em;
    filter: none;
  }
</style>
