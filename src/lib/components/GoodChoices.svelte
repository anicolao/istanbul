<script lang="ts">
  import GameArt from './GameArt.svelte';
  import type { Good } from '$lib/game/manifests';
  let { selected, unavailable = [], label = 'Choose a good', onChoose }: {
    selected?: Good; unavailable?: Good[]; label?: string; onChoose: (good: Good) => void;
  } = $props();
  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
</script>
<div class="goods" role="group" aria-label={label}>
  {#each goods as good}<button class:selected={selected === good} disabled={unavailable.includes(good)} aria-label={`${label}: ${good}${unavailable.includes(good) ? ' (full)' : ''}`} aria-pressed={selected === good} onclick={() => onChoose(good)}><GameArt kind="component" component={good} /></button>{/each}
</div>
<style>
  .goods { display: flex; justify-content: center; gap: .4em; margin: .4em 0; }
  button { width: 48px; height: 48px; padding: 4px; background: #213c32; border: 2px solid #9a8864; border-radius: 8px; cursor: pointer; }
  button.selected { border-color: #ffe6a0; background: #5b6344; }
  button:disabled { filter: grayscale(1); opacity: .4; cursor: default; }
  button :global(.game-art) { width: 100%; height: 100%; object-fit: contain; }
</style>
