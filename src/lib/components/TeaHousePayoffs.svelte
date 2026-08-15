<script lang="ts">
  import GameArt from './GameArt.svelte';
  let { panel = false }: { panel?: boolean } = $props();
</script>

<span class:panel class="tea-house-payoffs" aria-label="Tea House outcomes: roll at least the wager to gain the wager; otherwise gain 2 Lira" data-component="TeaHousePayoffs">
  <span data-outcome="success"><b>≥ wager</b><GameArt kind="piece" piece="dice-pair" class="outcome-dice" /><i class="payout"><GameArt kind="component" component="lira" /><strong>= wager</strong></i></span>
  <span data-outcome="failure"><b>&lt; wager</b><GameArt kind="piece" piece="dice-pair" class="outcome-dice" /><i class="payout"><GameArt kind="component" component="lira" /><strong>×2</strong></i></span>
</span>

<style>
  .tea-house-payoffs { width: min(100%, 9rem); height: 3.1rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .1rem; padding: .2rem; border: 2px solid #cda65f; border-radius: .45rem; background: #23170fe8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }
  .tea-house-payoffs > span { min-width: 0; display: grid; grid-template-columns: 1fr 1.4fr; grid-template-rows: auto 1fr; gap: .02rem .06rem; place-items: center; padding: .08rem; border: 1px solid #efca7d77; border-radius: .3rem; background: #173f43; }
  b { grid-column: 1 / -1; overflow: hidden; color: #efca7d; font-size: .52rem; text-align: center; white-space: nowrap; }
  i { display: flex; align-items: center; justify-content: center; font-style: normal; }
  :global(.outcome-dice) { width: 1.15rem; height: .8rem; filter: none; }
  .payout { min-width: 0; gap: .01rem; overflow: hidden; color: #fffaf0; font-size: .42rem; font-weight: 700; white-space: nowrap; }.payout :global(.game-art) { width: .65rem; height: .65rem; filter: none; }
  .tea-house-payoffs.panel { width: 100%; height: 4.4rem; gap: .35rem; margin: .75rem 0; padding: .45rem; }.tea-house-payoffs.panel > span { grid-template-columns: 1fr 1.5fr; padding: .25rem .4rem; }.tea-house-payoffs.panel b { font-size: .82rem; }.tea-house-payoffs.panel :global(.outcome-dice) { width: 2.1rem; height: 1.45rem; }.tea-house-payoffs.panel .payout { font-size: .78rem; }.tea-house-payoffs.panel .payout :global(.game-art) { width: 1.2rem; height: 1.2rem; }
  @media (max-width: 960px) {
    .tea-house-payoffs:not(.panel) { width: 100%; height: 1.15rem; gap: .04rem; padding: .06rem; border-width: 1px; border-radius: .18rem; }.tea-house-payoffs:not(.panel) > span { gap: .008rem .02rem; padding: .015rem; border-radius: .1rem; }.tea-house-payoffs:not(.panel) b { font-size: .18rem; }.tea-house-payoffs:not(.panel) :global(.outcome-dice) { width: .39rem; height: .28rem; }.tea-house-payoffs:not(.panel) .payout { font-size: .16rem; }.tea-house-payoffs:not(.panel) .payout :global(.game-art) { width: .25rem; height: .25rem; }
  }
  @media (max-width: 720px) {
    .tea-house-payoffs.panel { height: 2.4rem; gap: .12rem; margin: .1rem 0; padding: .16rem; }.tea-house-payoffs.panel > span { padding: .08rem .16rem; }.tea-house-payoffs.panel b { font-size: .55rem; }.tea-house-payoffs.panel :global(.outcome-dice) { width: 1.25rem; height: .86rem; }.tea-house-payoffs.panel .payout { font-size: .48rem; }.tea-house-payoffs.panel .payout :global(.game-art) { width: .72rem; height: .72rem; }
  }
</style>
