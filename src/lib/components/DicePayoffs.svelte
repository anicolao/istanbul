<script lang="ts">
  import GameArt from './GameArt.svelte';
  let { placeId }: { placeId: 8 | 9 } = $props();
  const outcomes = $derived(placeId === 8
    ? [{ operator: '≥', value: '7', count: '1' }, { operator: '≥', value: '9', count: '2' }, { operator: '≥', value: '11', count: '3' }]
    : [{ operator: '≥', value: 'wager', count: 'wager' }, { operator: '<', value: 'wager', count: '2' }]);
</script>

<span class="dice-payoffs" data-component="DicePayoffs" aria-label={placeId === 8
  ? 'Black Market: roll at least 7 for 1 jewelry, 9 for 2 jewelry, or 11 for 3 jewelry'
  : 'Tea House: roll at least the wager to gain that many Lira; otherwise gain 2 Lira'}>
  {#each outcomes as outcome}
    <span class="outcome">
      <span class="condition"><GameArt kind="piece" piece="dice-pair" /><b>{outcome.operator} {outcome.value}</b></span>
      <span class="payout"><span>→</span><strong>{outcome.count}×</strong><GameArt kind="component" component={placeId === 8 ? 'jewelry' : 'lira'} class={placeId === 9 ? 'coins' : ''} /></span>
    </span>
  {/each}
</span>

<style>
  .dice-payoffs { display: grid; grid-template-columns: max-content max-content; width: max-content; max-width: 100%; margin: 0 auto; gap: .08em .45em; padding: .2em .45em; box-sizing: border-box; border: 1px solid #cda65f99; border-radius: .35em; background: #23170fd9; color: #fff1cd; font-size: inherit; line-height: 1; }
  .outcome { display: contents; }
  .condition, .payout { display: flex; align-items: center; justify-content: flex-start; gap: .25em; white-space: nowrap; }
  b, strong { font-size: .85em; }
  .condition :global(.game-art) { width: 2.4em; height: 1.8em; filter: none; }
  .payout :global(.game-art) { width: 1.45em; height: 1.45em; filter: none; }
  .payout :global(.coins) { width: 2em; height: 1.65em; }
</style>
