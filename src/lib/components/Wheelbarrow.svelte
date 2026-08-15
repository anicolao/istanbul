<script lang="ts">
  import type { Good } from '$lib/game/manifests';
  import GameArt from './GameArt.svelte';

  let {
    amounts,
    capacity,
    extensions,
    label
  }: {
    amounts: Record<Good, number>;
    capacity: number;
    extensions: number;
    label?: string;
  } = $props();

  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
  const names: Record<Good, string> = { fabric: 'Fabric', spice: 'Spice', fruit: 'Fruit', jewelry: 'Jewelry' };
  const levels = [5, 4, 3, 2, 1];
</script>

<section
  class="wheelbarrow"
  aria-label={label ?? `Wheelbarrow capacity ${capacity}; ${extensions} extension${extensions === 1 ? '' : 's'} installed`}
  data-component="Wheelbarrow"
  data-capacity={capacity}
  data-extensions={extensions}
  data-e2e-fit
  data-e2e-no-scroll
>
  <span class="visually-hidden" aria-hidden="true">
    {#each goods as good}<span title={names[good]} data-count={amounts[good]}>{amounts[good]}</span>{/each}
  </span>
  <header aria-hidden="true">
    {#each goods as good}<span><GameArt kind="component" component={good} renderSize="compact" /><b>{names[good]}</b></span>{/each}
  </header>

  <div class="goods-grid">
    {#each levels as level}
      {#each goods as good}
        <span
          class:available={level <= capacity}
          class:filled={level <= amounts[good]}
          class:extension={level > 2}
          class="good-slot"
          data-good={good}
          data-level={level}
          data-available={level <= capacity}
          data-filled={level <= amounts[good]}
          aria-label={`${names[good]} slot ${level}: ${level <= amounts[good] ? 'filled' : level <= capacity ? 'empty' : 'locked'}`}
        >
          {#if level <= amounts[good]}<GameArt kind="component" component={good} renderSize="compact" />{:else if level > capacity}<i aria-hidden="true"></i>{/if}
        </span>
      {/each}
    {/each}
  </div>

  <footer aria-label={`${extensions} of 3 wheelbarrow extensions`}>
    <span class="wheelbarrow-mark"><GameArt kind="component" component="wheelbarrow" /><b>Capacity {capacity}</b></span>
    {#each [1, 2, 3] as extension}
      <span
        class:installed={extension <= extensions}
        class="extension-slot"
        data-extension={extension}
        data-installed={extension <= extensions}
        aria-label={`Extension ${extension}: ${extension <= extensions ? 'installed' : 'available'}`}
      ><b>+{extension}</b></span>
    {/each}
  </footer>
</section>

<style>
  .visually-hidden { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .wheelbarrow { position: absolute; z-index: 2; top: 11.6%; left: 5.25%; width: 56.7%; height: 82.8%; min-width: 0; min-height: 0; overflow: hidden; color: #fffaf0; background: transparent; }
  header { position: absolute; z-index: 3; top: .5%; left: 2.5%; width: 91%; height: 4.2%; min-width: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 3%; }
  header span { min-width: 0; display: grid; place-items: center; overflow: visible; color: #e9d6a4; }
  header :global(.game-art) { width: 30%; aspect-ratio: 1; border-radius: 50%; background-size: 132%; box-shadow: 0 0 0 1px #d4aa62, 0 .06rem .1rem #000b; }
  header b { display: none; }
  .goods-grid { position: absolute; top: 5.1%; left: 2.5%; width: 91%; height: 73.7%; min-width: 0; min-height: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(5, minmax(0, 1fr)); gap: 2.8% 3.2%; }
  .good-slot { position: relative; min-width: 0; min-height: 0; display: grid; place-items: center; overflow: hidden; border: 0; border-radius: 16%; background: transparent; box-shadow: none; }
  .good-slot.extension { background: rgb(25 15 10 / 58%); }
  .good-slot.available { filter: none; background: transparent; box-shadow: none; }
  .good-slot.filled { background: rgb(5 32 33 / 16%); }
  .good-slot :global(.game-art) { width: 84%; height: 84%; border-radius: 18%; background-size: contain; filter: none; }
  .good-slot i { width: 36%; height: 12%; border-radius: 1rem; background: #6f5942; box-shadow: 0 0 0 1px #16100d; }
  footer { position: absolute; inset: 0; min-width: 0; }
  footer > span { position: absolute; min-width: 0; display: grid; place-items: center; overflow: hidden; border: 0; border-radius: 12%; color: #9a8567; background: transparent; box-shadow: none; }
  footer > span.installed { color: #fff3cc; background: rgb(121 81 44 / 20%); box-shadow: inset 0 0 0 1px rgb(255 241 194 / 12%); }
  .wheelbarrow-mark { top: 81.5%; left: 2.8%; width: 89.9%; height: 5.9%; color: #efd99e; }
  .wheelbarrow-mark :global(.game-art) { position: absolute; left: 2%; width: 9%; height: 76%; background-size: contain; }
  .wheelbarrow-mark b { position: absolute; left: 50%; overflow: hidden; transform: translateX(-50%); font-size: clamp(.24rem, 2.4cqi, .48rem); text-overflow: ellipsis; white-space: nowrap; }
  .extension-slot { top: 89.3%; width: 25.4%; height: 7%; }
  .extension-slot:nth-of-type(2) { left: 5.8%; }.extension-slot:nth-of-type(3) { left: 34.5%; }.extension-slot:nth-of-type(4) { left: 63.3%; }
  .extension-slot b { font-size: clamp(.32rem, 3.3cqi, .62rem); }
</style>
