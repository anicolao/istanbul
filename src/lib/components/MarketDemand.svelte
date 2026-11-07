<script lang="ts">
  import type { Good } from '$lib/game/manifests';
  import { base } from '$app/paths';
  import { componentArt, artPath } from '$lib/game/art';

  let {
    market,
    goods,
    label,
    review = false,
    fluid = false,
    interactive = false,
    disabled = false,
    selected = [],
    payment = [],
    flexible = false,
    onToggle = () => {},
    onCycle = () => {}
  }: {
    market: 'large' | 'small';
    goods: Good[];
    label?: string;
    review?: boolean;
    fluid?: boolean;
    interactive?: boolean;
    disabled?: boolean;
    selected?: number[];
    payment?: Good[];
    flexible?: boolean;
    onToggle?: (index: number) => void;
    onCycle?: (index: number) => void;
  } = $props();
</script>

<span
  class:review
  class:fluid
  class="demand-board"
  aria-label={label ??
    `${market === 'large' ? 'Large' : 'Small'} Market demand: ${goods.join(', ')}`}
  role={interactive ? 'group' : 'img'}
  data-component="MarketDemand"
  data-market={market}
  data-goods={goods.join(',')}
  data-good-layout="circular-overlay"
>
  <img
    class="demand-tile"
    src={artPath(base, market === 'large' ? componentArt.demandLarge : componentArt.demandSmall)}
    alt=""
    draggable="false"
  />
  <span class="good-overlays" aria-hidden={interactive ? undefined : true}>
    {#each goods as good, index}
      {#if interactive}
        <span class={`demand-slot slot-${index + 1}`}>
          <button
            class="demand-good"
            class:selected={selected.includes(index)}
            aria-pressed={selected.includes(index)}
            aria-label={`Sell demand slot ${index + 1}: ${payment[index] ?? good}`}
            {disabled}
            onclick={() => onToggle(index)}
            data-demand-slot={index + 1}
            data-good={payment[index] ?? good}
          >
            <img class="resource" src={artPath(base, componentArt[payment[index] ?? good])} alt="" draggable="false" />
            <b>{selected.includes(index) ? '✓' : '−'}</b>
          </button>
          {#if flexible}<button
              class="cycle"
              aria-label={`Change payment for demand slot ${index + 1}`}
              {disabled}
              onclick={() => onCycle(index)}>↻</button
            >{/if}
        </span>
      {:else}
        <span
          class={`demand-good slot-${index + 1}`}
          data-demand-slot={index + 1}
          data-good={good}
          data-help={good}
        >
          <img class="resource" src={artPath(base, componentArt[good])} alt="" draggable="false" />
        </span>
      {/if}
    {/each}
  </span>
</span>

<style>
  .demand-board {
    position: relative;
    width: min(100%, 3.4rem);
    aspect-ratio: 1;
    display: block;
    flex: 0 1 auto;
    overflow: hidden;
    border: 0;
    border-radius: 0.42rem;
    background: transparent;
    box-shadow: none;
  }
  .demand-tile {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    max-width: none;
    object-fit: contain;
    display: block;
  }
  .good-overlays {
    position: absolute;
    z-index: 2;
    inset: 0;
  }
  .demand-good {
    position: absolute;
    width: 30%;
    aspect-ratio: 1;
    overflow: visible;
    border: 0;
    border-radius: 50%;
    background: transparent;
    box-shadow: none;
    margin-left: -15%;
    margin-top: -15%;
  }
  .demand-good .resource {
    position: absolute;
    inset: 12%;
    width: 76%;
    height: 76%;
    border-radius: 0;
    object-fit: contain;
    display: block;
    filter: none;
  }
  .demand-board[data-market='large'] .slot-1 {
    left: 50%;
    top: 22.5%;
  }
  .demand-board[data-market='large'] .slot-2 {
    left: 24%;
    top: 40%;
  }
  .demand-board[data-market='large'] .slot-3 {
    left: 75%;
    top: 40%;
  }
  .demand-board[data-market='large'] .slot-4 {
    left: 32.5%;
    top: 70%;
  }
  .demand-board[data-market='large'] .slot-5 {
    left: 65%;
    top: 70%;
  }
  .demand-board[data-market='small'] .slot-1 {
    left: 49.5%;
    top: 23%;
  }
  .demand-board[data-market='small'] .slot-2 {
    left: 23%;
    top: 43%;
  }
  .demand-board[data-market='small'] .slot-3 {
    left: 75.5%;
    top: 43%;
  }
  .demand-board[data-market='small'] .slot-4 {
    left: 33%;
    top: 73.5%;
  }
  .demand-board[data-market='small'] .slot-5 {
    left: 65.5%;
    top: 73.5%;
  }
  .demand-board.review {
    width: min(72%, 17rem);
    border-width: 0;
    border-radius: 0.7rem;
    box-shadow: none;
  }
  .demand-board.review .demand-good {
    box-shadow: none;
  }
  @media (max-width: 960px) {
    .demand-board:not(.review) {
      width: 1.15rem;
      border-width: 0;
      border-radius: 0.18rem;
    }
  }
  .demand-board.fluid {
    width: 100%;
    max-width: none;
    box-sizing: border-box;
    border-width: 0;
    border-radius: 3cqw;
  }
  .demand-slot {
    position: absolute;
    width: 30%;
    aspect-ratio: 1;
    margin-left: -15%;
    margin-top: -15%;
  }
  .demand-board .demand-slot .demand-good {
    inset: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    cursor: pointer;
    overflow: visible;
  }
  .demand-good b {
    position: absolute;
    /* Anchor the badge to the circular rim, not outside the square bounds. */
    left: 85.36%;
    top: 85.36%;
    transform: translate(-50%, -50%);
    width: 24%;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #173f43;
    color: #fff1bb;
    font: 700 5cqw/1 sans-serif;
    padding: 0;
  }
  .cycle {
    position: absolute;
    top: -24%;
    right: -20%;
    border-radius: 50%;
    border: 1px solid #dbb667;
    background: #eed799;
    color: #24392b;
    font: 700 5cqw/1 sans-serif;
    padding: 0.15em;
    cursor: pointer;
  }
  button:focus-visible {
    outline: 0.8cqw solid white;
  }
</style>
