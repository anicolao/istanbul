<script lang="ts">
  import { bonusCards, demandTiles, mosqueTiles, type Good } from '$lib/game/manifests';
  import { postOfficeRows } from '$lib/game/actions';
  import { currentSultanCost } from '$lib/game/ruby-routes';
  import { locationStateSummary } from '$lib/game/location-state';
  import type { GameSetup } from '$lib/game/setup';
  import GameArt from './GameArt.svelte';

  let {
    game,
    placeId
  }: {
    game: GameSetup;
    placeId: number;
  } = $props();
  const active = $derived(game.players[game.turnSeat]);
  const summary = $derived(locationStateSummary(game, placeId));
  const demand = $derived(demandTiles.find(({ id }) => id === (placeId === 10 ? game.largeDemand[0] : game.smallDemand[0])));
  const discard = $derived(bonusCards.find(({ id }) => id === game.bonusDiscard.at(-1)));
  const draw = $derived(bonusCards.find(({ id }) => id === game.bonusDrawPile[0]));
  const separatedAssistants = $derived(Object.values(active.assistantsByPlace).reduce((total, count) => total + count, 0));
  const sultanCounts = $derived(currentSultanCost(game).reduce<Record<Good | 'any', number>>((counts, good) => ({ ...counts, [good]: counts[good] + 1 }), { fabric: 0, spice: 0, fruit: 0, jewelry: 0, any: 0 }));
  const goods = ['fabric', 'spice', 'fruit', 'jewelry'] as Good[];
</script>

<span class={`location-state state-${placeId}`} data-testid={`place-state-${placeId}`} data-state-summary={summary} data-e2e-status-area>
  {#if placeId === 5}
    <span class="mail-board">
      {#each postOfficeRows as rows, index}
        {@const upper = rows[1]}
        {@const lower = rows[0]}
        <span class="mail-column">
          <span class:covered={!game.postOfficeLower[index]} data-mail-row="upper"><GameArt kind="component" component={upper.good ?? 'lira'} />{#if upper.lira}<b>{upper.lira}</b>{/if}</span>
          <span class:covered={game.postOfficeLower[index]} data-mail-row="lower"><GameArt kind="component" component={lower.good ?? 'lira'} />{#if lower.lira}<b>{lower.lira}</b>{/if}</span>
          <i class:lower={game.postOfficeLower[index]}></i>
        </span>
      {/each}
    </span>
  {:else if placeId === 6}
    <span class="caravan-table">
      <span
        class:empty={!draw}
        class="card-pile deck"
        data-inspect-pile-card={draw?.id}
        data-pile-source="deck"
        aria-label={draw ? `Inspect draw pile top card: ${draw.title}` : 'Bonus draw pile is empty'}
      ><GameArt kind="card-back" /><b>{game.bonusDrawPile.length}</b></span>
      <span
        class:empty={!discard}
        class="card-pile discard"
        data-inspect-pile-card={discard?.id}
        data-pile-source="discard"
        aria-label={discard ? `Inspect discard pile top card: ${discard.title}` : 'Bonus discard pile is empty'}
      >{#if discard}<GameArt kind="card" effect={discard.effect} />{:else}<i></i>{/if}<b>{game.bonusDiscard.length}</b></span>
    </span>
  {:else if placeId === 7}
    <span class="assistant-corral">{#each Array(Math.max(1, separatedAssistants)) as _, index}<GameArt kind="piece" piece="assistant" color={active.color} class={index >= separatedAssistants ? 'ghost' : ''} />{/each}</span>
  {:else if placeId === 8}
    <span class="black-market-payoffs" aria-label="Black Market jewelry thresholds: 7 for 1, 9 for 2, 11 for 3">
      {#each [[7, 1], [9, 2], [11, 3]] as payoff}<span><b>{payoff[0]}+</b><GameArt kind="component" component="jewelry" /><strong>×{payoff[1]}</strong></span>{/each}
    </span>
  {:else if placeId === 10 || placeId === 11}
    <span class="demand-board"><GameArt kind="component" component={placeId === 10 ? 'demand-large' : 'demand-small'} class="demand-tile" /><span>{#each demand?.goods ?? [] as good}<GameArt kind="component" component={good} />{/each}</span></span>
  {:else if placeId === 13}
    <span class="ruby-track sultan"><GameArt kind="component" component="sultan-track" class="track-board" /><span class="cost-wells">{#each [...goods, 'any' as const] as good}{#if sultanCounts[good]}<span><GameArt kind="component" component={good === 'any' ? 'goods-supply' : good} /><b>{sultanCounts[good]}</b></span>{/if}{/each}</span></span>
  {:else if placeId === 14 || placeId === 15}
    {@const colors = placeId === 14 ? ['fabric', 'spice'] as Good[] : ['fruit', 'jewelry'] as Good[]}
    <span class="mosque-table">
      {#each colors as color}
        {@const tile = mosqueTiles.find(({ id }) => id === game.mosqueStacks[color][0])}
        <span class:empty={!tile} class="mosque-stack">{#if tile}<GameArt kind="component" component={`mosque-${color}`} class="mosque-power" /><b><GameArt kind="component" component={color} />{tile.required}<small>pay 1</small></b>{:else}<i></i>{/if}</span>
      {/each}
    </span>
  {:else if placeId === 16}
    <span class="ruby-track gemstone"><GameArt kind="component" component="gemstone-track" class="track-board" /><span class="dealer-price"><GameArt kind="component" component="lira" /><b>{game.rubyTracks.gemstonePrice}</b></span></span>
  {/if}
</span>

<style>
  .location-state { position: absolute; z-index: 2; right: .32rem; bottom: .3rem; left: .32rem; min-height: 2.8rem; display: flex; gap: .3rem; align-items: end; justify-content: center; pointer-events: none; }
  .location-state :global(.game-art) { width: 1.75rem; height: 1.75rem; flex: 0 0 auto; filter: drop-shadow(0 2px 2px #000b); }
  b { position: relative; z-index: 2; color: #fffaf0; font-size: .72rem; line-height: 1; white-space: nowrap; text-shadow: 0 1px 2px #000; }
  .mail-board { width: min(100%, 8.5rem); height: 3.25rem; display: flex; gap: .14rem; padding: .16rem .28rem; border: 2px solid #cda65f; border-radius: .45rem; background: #e4cf9d; box-shadow: 0 2px 3px #0008; }.mail-column { position: relative; flex: 1; display: grid; grid-template-rows: 1fr 1fr; gap: .06rem; }.mail-column > span { position: relative; display: grid; place-items: center; border: 1px solid #8f7449; border-radius: .15rem; background: #f2e4bd; }.mail-column > span.covered { opacity: .3; filter: grayscale(1); }.mail-column :global(.game-art) { width: 1.05rem; height: 1.05rem; filter: none; }.mail-column b { position: absolute; right: 0; bottom: 0; color: #173f43; font-size: .45rem; text-shadow: none; }.mail-column i { position: absolute; z-index: 3; top: 7%; right: 3%; width: .6rem; height: .6rem; border: 1px solid #fff2d0; border-radius: .1rem; background: #a93f38; box-shadow: 0 1px 2px #0008; transition: top .18s ease; }.mail-column i.lower { top: 59%; }
  .caravan-table { height: 3.4rem; display: flex; gap: .75rem; align-items: center; padding: .16rem .65rem; border: 2px solid #9f6f39; border-radius: .45rem; background: #4b2e1de8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.card-pile { position: relative; width: 2rem; height: 2.9rem; display: flex; align-items: end; pointer-events: auto; cursor: pointer; }.card-pile :global(.game-art), .card-pile i { width: 1.72rem; height: 2.55rem; border-radius: .16rem; box-shadow: .14rem .1rem 0 #d8b464, .24rem .2rem 0 #6e4526; }.card-pile i { display: block; border: 1px dashed #d8c294; background: #173f43aa; }.card-pile b { position: absolute; right: -.2rem; bottom: -.05rem; min-width: 1rem; padding: .18rem; border-radius: 50%; text-align: center; background: #9d3935; }
  .assistant-corral { width: min(100%, 9rem); display: flex; gap: .12rem; justify-content: center; padding: .25rem .45rem; border: 2px solid #c49a55; border-radius: 1rem; background: #3e2719e8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.assistant-corral :global(.game-art) { width: min(2.15rem, 21%); height: auto; aspect-ratio: 1; flex: 0 1 auto; }.assistant-corral :global(.ghost) { opacity: .25; filter: grayscale(1); }
  .black-market-payoffs { width: min(100%, 9rem); height: 3.1rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: .18rem; padding: .28rem; border: 2px solid #cda65f; border-radius: .45rem; background: #23170fe8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.black-market-payoffs > span { min-width: 0; display: grid; grid-template-columns: 1fr 1fr; place-items: center; padding: .1rem; border: 1px solid #efca7d77; border-radius: .3rem; background: #173f43; }.black-market-payoffs b { grid-column: 1 / -1; color: #efca7d; font-size: .72rem; }.black-market-payoffs strong { color: #fffaf0; font-size: .65rem; }.black-market-payoffs :global(.game-art) { width: 1.15rem; height: 1.15rem; filter: none; }
  .demand-board { position: relative; width: min(100%, 9rem); height: 3.15rem; display: grid; place-items: center; overflow: hidden; border: 2px solid #d0ab63; border-radius: .42rem; box-shadow: 0 2px 3px #0008; }.demand-board :global(.demand-tile) { position: absolute; inset: 0; width: 100%; height: 100%; filter: brightness(.72); }.demand-board > span { position: relative; z-index: 2; display: flex; gap: .2rem; }.demand-board > span :global(.game-art) { width: 1.55rem; height: 1.55rem; }
  .ruby-track { position: relative; width: min(100%, 9rem); height: 3.2rem; overflow: hidden; border: 2px solid #d0aa62; border-radius: .42rem; box-shadow: 0 2px 3px #0008; }.ruby-track :global(.track-board) { position: absolute; inset: 0; width: 100%; height: 100%; filter: brightness(.7); }.cost-wells { position: absolute; z-index: 2; inset: .45rem .55rem; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: .12rem; align-items: center; justify-items: center; }.cost-wells > span { position: relative; width: 100%; height: 100%; display: grid; place-items: center; }.cost-wells :global(.game-art) { width: min(100%, 1.4rem); height: min(100%, 1.4rem); }.cost-wells b { position: absolute; right: .02rem; bottom: .02rem; min-width: .68rem; padding: .08rem; border-radius: 50%; text-align: center; background: #a33e39; }.dealer-price { position: absolute; z-index: 2; inset: .25rem; display: flex; align-items: center; justify-content: center; }.dealer-price :global(.game-art) { width: 2.05rem; height: 2.05rem; }.dealer-price b { min-width: 1.1rem; margin-left: -.3rem; padding: .2rem; border-radius: 50%; text-align: center; background: #173f43; }
  .mosque-table { position: relative; width: min(100%, 9rem); height: 3.5rem; display: flex; gap: .55rem; align-items: center; justify-content: center; padding: .16rem .3rem; border: 2px solid #d1aa61; border-radius: .42rem; background: #3a261ae8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.mosque-stack { position: relative; width: 3.25rem; height: 3.05rem; display: grid; place-items: center; }.mosque-stack :global(.mosque-power) { width: 3rem; height: 3rem; border-radius: .2rem; box-shadow: .08rem .08rem 0 #e0bd71, .16rem .14rem 0 #75502b; }.mosque-stack > b { position: absolute; right: -.45rem; bottom: -.08rem; min-width: 1.5rem; display: grid; grid-template-columns: .75rem auto; gap: .04rem; align-items: center; padding: .1rem; border: 1px solid #e2c378; border-radius: .28rem; background: #173f43; }.mosque-stack > b :global(.game-art) { width: .72rem; height: .72rem; filter: none; }.mosque-stack small { grid-column: 1 / -1; color: #efca7d; font-size: .36rem; text-align: center; }.mosque-stack i { width: 3rem; height: 3rem; display: block; border: 1px dashed #d5bd8c; border-radius: .2rem; }
  @media (max-width: 960px) {
    .location-state { right: .12rem; bottom: .1rem; left: .12rem; width: auto; min-height: 1.35rem; scale: none; translate: none; }
    .location-state :global(.game-art) { filter: drop-shadow(0 1px 1px #000b); }
    .mail-board { width: 100%; height: 1.4rem; gap: .04rem; padding: .08rem; border-width: 1px; border-radius: .2rem; }.mail-column { gap: .02rem; }.mail-column :global(.game-art) { width: .42rem; height: .42rem; }.mail-column b { font-size: .27rem; }.mail-column i { width: .28rem; height: .28rem; border-width: 1px; }.mail-column i.lower { top: 58%; }
    .caravan-table { width: 100%; height: 1.45rem; gap: .28rem; justify-content: center; padding: .06rem .2rem; border-width: 1px; border-radius: .2rem; }.card-pile { width: .72rem; height: 1.18rem; }.card-pile :global(.game-art), .card-pile i { width: .62rem; height: .98rem; box-shadow: .05rem .04rem 0 #d8b464, .08rem .07rem 0 #6e4526; }.card-pile b { right: -.08rem; min-width: .42rem; padding: .06rem; font-size: .3rem; }
    .assistant-corral { height: 1.35rem; padding: .08rem .2rem; border-width: 1px; }.assistant-corral :global(.game-art) { width: min(1rem, 19%); height: min(1rem, 90%); }
    .black-market-payoffs { width: 100%; height: 1.4rem; gap: .05rem; padding: .08rem; border-width: 1px; border-radius: .2rem; }.black-market-payoffs > span { padding: .02rem; border-radius: .12rem; }.black-market-payoffs b { font-size: .32rem; }.black-market-payoffs strong { font-size: .28rem; }.black-market-payoffs :global(.game-art) { width: .42rem; height: .42rem; }
    .demand-board { width: 100%; height: 1.35rem; border-width: 1px; border-radius: .2rem; }.demand-board > span { gap: .04rem; }.demand-board > span :global(.game-art) { width: min(.65rem, 18%); height: min(.65rem, 85%); }
    .ruby-track { width: 100%; height: 1.4rem; border-width: 1px; border-radius: .2rem; }.cost-wells { inset: .16rem .25rem; gap: .04rem; }.cost-wells :global(.game-art) { width: min(100%, .62rem); height: min(100%, .62rem); }.cost-wells b { right: 0; bottom: 0; min-width: .35rem; padding: .03rem; font-size: .28rem; }.dealer-price { inset: .08rem; }.dealer-price :global(.game-art) { width: 1rem; height: 1rem; }.dealer-price b { min-width: .58rem; margin-left: -.15rem; padding: .08rem; font-size: .38rem; }
    .mosque-table { width: 100%; height: 1.5rem; gap: .22rem; padding: .06rem .15rem; border-width: 1px; border-radius: .2rem; }.mosque-stack { width: min(2.3rem, 43%); height: 1.28rem; }.mosque-stack :global(.mosque-power), .mosque-stack i { width: 1.18rem; height: 1.18rem; }.mosque-stack > b { right: .02rem; bottom: 0; min-width: .72rem; grid-template-columns: .34rem auto; padding: .03rem; font-size: .3rem; }.mosque-stack > b :global(.game-art) { width: .32rem; height: .32rem; }.mosque-stack small { font-size: .2rem; }
  }
  @media (prefers-reduced-motion: reduce) { .mail-column i { transition: none; } }
</style>
