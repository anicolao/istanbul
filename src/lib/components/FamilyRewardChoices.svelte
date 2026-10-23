<script lang="ts">
  import GameArt from './GameArt.svelte';
  import BonusCard from './BonusCard.svelte';
  let { disabled = false, verb = 'Return family', onChoose }: {
    disabled?: boolean; verb?: string; onChoose: (reward: 'lira' | 'bonus') => void;
  } = $props();
</script>
<div class="rewards" aria-label="Family reward">
  <button {disabled} onclick={() => onChoose('lira')} aria-label={`${verb} · gain 3 Lira`}>
    <span class="art"><GameArt kind="component" component="lira" /></span>
    <strong>Gain 3 Lira</strong>
  </button>
  <button {disabled} onclick={() => onChoose('bonus')} aria-label={`${verb} · draw a Bonus card (reveals a card)`}>
    <span class="card"><BonusCard reverse="card-back" /></span>
    <strong>Draw a card</strong><small>Reveals a new card</small>
  </button>
</div>
<style>
  .rewards { display: flex; gap: .7em; justify-content: center; flex: 1; }
  button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .25em; flex: 1; max-width: 180px; padding: .5em; border: 1px solid #cfb77c; border-radius: .5em; background: #f4e5c3; color: #20392e; cursor: pointer; font: inherit; }
  button:disabled { opacity: .45; cursor: default; }
  .art { width: 76px; height: 76px; }
  .art :global(.game-art) { width: 100%; height: 100%; object-fit: contain; }
  .card { width: 50px; }
  small { font-size: .75em; }
</style>
