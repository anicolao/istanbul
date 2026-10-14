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
          title={good}
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
    left: -13%;
    top: -13%;
    width: 126%;
    height: 126%;
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
    width: 20.2%;
    aspect-ratio: 1;
    overflow: hidden;
    border: 0;
    border-radius: 50%;
    background: transparent;
    box-shadow:
      0 0 0 1px #2d2114,
      0 0.035em 0.08em #000a;
    margin-left: -10.1%;
    margin-top: -10.1%;
  }
  .demand-good .resource {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    object-fit: contain;
    display: block;
    filter: none;
  }
  .demand-board[data-market='large'] .demand-good {
    width: 20.2%;
  }
  .demand-board[data-market='large'] .slot-1 {
    top: 25.08%;
    left: 50.1%;
  }
  .demand-board[data-market='large'] .slot-2 {
    top: 38.19%;
    left: 27.19%;
  }
  .demand-board[data-market='large'] .slot-3 {
    top: 38.45%;
    left: 72.6%;
  }
  .demand-board[data-market='large'] .slot-4 {
    top: 64.11%;
    left: 33.72%;
  }
  .demand-board[data-market='large'] .slot-5 {
    top: 64.62%;
    left: 64.42%;
  }
  .demand-board[data-market='small'] .demand-good {
    width: 20.2%;
  }
  .demand-board[data-market='small'] .slot-1 {
    top: 23.93%;
    left: 49.8%;
  }
  .demand-board[data-market='small'] .slot-2 {
    top: 39.5%;
    left: 29%;
  }
  .demand-board[data-market='small'] .slot-3 {
    top: 39.4%;
    left: 70.5%;
  }
  .demand-board[data-market='small'] .slot-4 {
    top: 63.87%;
    left: 36.28%;
  }
  .demand-board[data-market='small'] .slot-5 {
    top: 63.82%;
    left: 63.41%;
  }
  .demand-board.review {
    width: min(72%, 17rem);
    border-width: 0;
    border-radius: 0.7rem;
    box-shadow: none;
  }
  .demand-board.review .demand-good {
    box-shadow:
      0 0.11em 0.22em #000c,
      inset 0 0 0 0.045em #6f4c21;
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
    width: 20.2%;
    aspect-ratio: 1;
    margin-left: -10.1%;
    margin-top: -10.1%;
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
  .demand-good.selected {
    outline: 0.7cqw solid #f7db88;
  }
  .demand-good b {
    position: absolute;
    right: -10%;
    bottom: -6%;
    border-radius: 50%;
    background: #173f43;
    color: #fff1bb;
    font: 700 5cqw/1 sans-serif;
    padding: 0.12em;
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
