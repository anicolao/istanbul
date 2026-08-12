<script lang="ts">
  import { bonusCards, demandTiles, mosqueTiles, type Good } from '$lib/game/manifests';
  import { postOfficeRows, warehouseGood } from '$lib/game/actions';
  import { currentSultanCost } from '$lib/game/ruby-routes';
  import { locationStateSummary } from '$lib/game/location-state';
  import type { GameSetup } from '$lib/game/setup';
  import GameArt from './GameArt.svelte';

  let { game, placeId }: { game: GameSetup; placeId: number } = $props();
  const active = $derived(game.players[game.turnSeat]);
  const summary = $derived(locationStateSummary(game, placeId));
  const demand = $derived(demandTiles.find(({ id }) => id === (placeId === 10 ? game.largeDemand[0] : game.smallDemand[0])));
  const discard = $derived(bonusCards.find(({ id }) => id === game.bonusDiscard.at(-1)));
  const separatedAssistants = $derived(Object.values(active.assistantsByPlace).reduce((total, count) => total + count, 0));
  const sultanCounts = $derived(currentSultanCost(game).reduce<Record<Good | 'any', number>>((counts, good) => ({ ...counts, [good]: counts[good] + 1 }), { fabric: 0, spice: 0, fruit: 0, jewelry: 0, any: 0 }));
  const goods = ['fabric', 'spice', 'fruit', 'jewelry'] as Good[];
</script>

<span class={`location-state state-${placeId}`} data-testid={`place-state-${placeId}`} data-state-summary={summary} aria-hidden="true">
  {#if placeId === 1}
    <span class="component-well price"><GameArt kind="component" component="lira" /><b>7</b></span>
    <span class="component-well stock"><GameArt kind="component" component="wheelbarrow" /><b>{game.supplies.wheelbarrowExtensions}</b></span>
    <span class="component-well stock"><GameArt kind="component" component="ruby" /><b>{game.supplies.wainwrightRubies}</b></span>
  {:else if warehouseGood(placeId)}
    <span class="warehouse-rack">
      {#each Array(active.capacity) as _}<span><GameArt kind="component" component={warehouseGood(placeId)!} /></span>{/each}
    </span>
  {:else if placeId === 5}
    <span class="mail-board">
      {#each postOfficeRows as rows, index}
        {@const upper = rows[1]}
        {@const lower = rows[0]}
        <span class="mail-column">
          <span class:covered={game.postOfficeLower[index]}><GameArt kind="component" component={upper.good ?? 'lira'} />{#if upper.lira}<b>{upper.lira}</b>{/if}</span>
          <span class:covered={!game.postOfficeLower[index]}><GameArt kind="component" component={lower.good ?? 'lira'} />{#if lower.lira}<b>{lower.lira}</b>{/if}</span>
          <i class:lower={game.postOfficeLower[index]}></i>
        </span>
      {/each}
    </span>
  {:else if placeId === 6}
    <span class="caravan-table">
      <span class="card-pile deck"><GameArt kind="card-back" /><b>{game.bonusDrawPile.length}</b></span>
      <span class:empty={!discard} class="card-pile discard">{#if discard}<GameArt kind="card" effect={discard.effect} />{:else}<i></i>{/if}<b>{game.bonusDiscard.length}</b></span>
    </span>
  {:else if placeId === 7}
    <span class="assistant-corral">{#each Array(Math.max(1, separatedAssistants)) as _, index}<GameArt kind="piece" piece="assistant" color={active.color} class={index >= separatedAssistants ? 'ghost' : ''} />{/each}</span>
  {:else if placeId === 8}
    <span class="black-market-board"><span>{#each goods.slice(0, 3) as good}<GameArt kind="component" component={good} />{/each}</span><GameArt kind="piece" piece="dice-pair" class="state-dice" /><b>{game.lastRoll?.place === 8 ? game.lastRoll.dice.reduce((sum, die) => sum + die, 0) : '7 · 9 · 11'}</b></span>
  {:else if placeId === 9}
    <span class="tea-board"><GameArt kind="component" component="lira" /><b>{game.lastRoll?.place === 9 ? game.lastRoll.declared : '3–12'}</b><GameArt kind="piece" piece="dice-pair" class="state-dice" />{#if game.lastRoll?.place === 9}<strong>{game.lastRoll.dice.reduce((sum, die) => sum + die, 0)}</strong>{/if}</span>
  {:else if placeId === 10 || placeId === 11}
    <span class="demand-board"><GameArt kind="component" component={placeId === 10 ? 'demand-large' : 'demand-small'} class="demand-tile" /><span>{#each demand?.goods ?? [] as good}<GameArt kind="component" component={good} />{/each}</span></span>
  {:else if placeId === 12}
    <span class="police-yard"><GameArt kind="piece" piece="family" color={active.color} /><b>{active.familyPlace === 12 ? 'GO' : active.familyPlace}</b></span>
  {:else if placeId === 13}
    <span class="ruby-track sultan"><GameArt kind="component" component="sultan-track" class="track-board" /><span class="cost-wells">{#each [...goods, 'any' as const] as good}{#if sultanCounts[good]}<span><GameArt kind="component" component={good === 'any' ? 'goods-supply' : good} /><b>{sultanCounts[good]}</b></span>{/if}{/each}</span><span class="track-ruby"><GameArt kind="component" component="ruby" /><b>{game.rubyTracks.sultanRubies}</b></span></span>
  {:else if placeId === 14 || placeId === 15}
    {@const colors = placeId === 14 ? ['fabric', 'spice'] as Good[] : ['fruit', 'jewelry'] as Good[]}
    <span class="mosque-table">
      {#each colors as color}
        {@const tile = mosqueTiles.find(({ id }) => id === game.mosqueStacks[color][0])}
        <span class:empty={!tile} class="mosque-stack">{#if tile}<GameArt kind="component" component={`mosque-${color}`} class="mosque-power" /><b><GameArt kind="component" component={color} />{tile.required}<small>pay 1</small></b>{:else}<i></i>{/if}</span>
      {/each}
      <span class="mosque-ruby"><GameArt kind="component" component="ruby" /><b>{placeId === 14 ? game.supplies.smallMosqueRubies : game.supplies.greatMosqueRubies}</b></span>
    </span>
  {:else if placeId === 16}
    <span class="ruby-track gemstone"><GameArt kind="component" component="gemstone-track" class="track-board" /><span class="dealer-price"><GameArt kind="component" component="lira" /><b>{game.rubyTracks.gemstonePrice}</b></span><span class="track-ruby"><GameArt kind="component" component="ruby" /><b>{game.rubyTracks.gemstoneRubies}</b></span></span>
  {/if}
</span>

<style>
  .location-state { position: absolute; z-index: 2; top: .22rem; right: 1.72rem; left: .22rem; height: 2.05rem; display: flex; gap: .18rem; align-items: center; pointer-events: none; }
  .location-state :global(.game-art) { width: 1.3rem; height: 1.3rem; flex: 0 0 auto; filter: drop-shadow(0 2px 2px #000b); }
  b, strong { position: relative; z-index: 2; color: #fffaf0; font-size: .58rem; line-height: 1; white-space: nowrap; text-shadow: 0 1px 2px #000; }
  .component-well { position: relative; height: 1.7rem; min-width: 2.4rem; display: flex; gap: .12rem; align-items: center; justify-content: center; padding: .12rem .25rem; border: 2px solid #d2ab61; border-radius: .45rem; background: #3a2418e8; box-shadow: inset 0 0 .35rem #000a, 0 2px 3px #0008; }
  .warehouse-rack { display: flex; gap: .08rem; padding: .16rem .28rem; border: 2px solid #b68a48; border-radius: .35rem; background: #402818e8; box-shadow: inset 0 0 .4rem #000; }.warehouse-rack span { width: 1.45rem; height: 1.45rem; display: grid; place-items: center; border: 1px solid #8c633a; border-radius: .22rem; background: #24150d; }.warehouse-rack :global(.game-art) { width: 1.2rem; height: 1.2rem; }
  .mail-board { height: 2rem; display: flex; gap: .09rem; padding: .12rem .2rem; border: 2px solid #cda65f; border-radius: .35rem; background: #e4cf9d; box-shadow: 0 2px 3px #0008; }.mail-column { position: relative; width: 1.15rem; display: grid; grid-template-rows: 1fr 1fr; gap: .04rem; }.mail-column > span { position: relative; display: grid; place-items: center; border: 1px solid #8f7449; border-radius: .12rem; background: #f2e4bd; }.mail-column > span.covered { opacity: .3; filter: grayscale(1); }.mail-column :global(.game-art) { width: .74rem; height: .74rem; filter: none; }.mail-column b { position: absolute; right: 0; bottom: 0; color: #173f43; font-size: .35rem; text-shadow: none; }.mail-column i { position: absolute; z-index: 3; top: 7%; right: 3%; width: .42rem; height: .42rem; border: 1px solid #fff2d0; border-radius: .1rem; background: #a93f38; box-shadow: 0 1px 2px #0008; transition: top .18s ease; }.mail-column i.lower { top: 59%; }
  .caravan-table { height: 2rem; display: flex; gap: .4rem; align-items: center; padding: .1rem .35rem; border: 2px solid #9f6f39; border-radius: .35rem; background: #4b2e1de8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.card-pile { position: relative; width: 1.2rem; height: 1.75rem; display: flex; align-items: end; }.card-pile :global(.game-art), .card-pile i { width: 1rem; height: 1.55rem; border-radius: .12rem; box-shadow: .12rem .08rem 0 #d8b464, .2rem .15rem 0 #6e4526; }.card-pile i { display: block; border: 1px dashed #d8c294; background: #173f43aa; }.card-pile b { position: absolute; right: -.2rem; bottom: -.05rem; min-width: .75rem; padding: .12rem; border-radius: 50%; text-align: center; background: #9d3935; }
  .assistant-corral { display: flex; gap: .08rem; padding: .18rem .3rem; border: 2px solid #c49a55; border-radius: 1rem; background: #3e2719e8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.assistant-corral :global(.game-art) { width: 1.55rem; height: 1.55rem; }.assistant-corral :global(.ghost) { opacity: .25; filter: grayscale(1); }
  .black-market-board, .tea-board { height: 1.9rem; display: flex; gap: .15rem; align-items: center; padding: .12rem .3rem; border: 2px solid #c29c58; border-radius: .35rem; background: #312218e8; box-shadow: inset 0 0 .35rem #000, 0 2px 3px #0008; }.black-market-board > span { display: flex; }.black-market-board > span :global(.game-art) { width: .9rem; height: .9rem; }.black-market-board :global(.state-dice), .tea-board :global(.state-dice) { width: 1.55rem; height: 1.25rem; }.tea-board > :global(.component) { width: 1rem; height: 1rem; }.tea-board strong { padding: .18rem; border-radius: 50%; background: #a43c38; }
  .demand-board { position: relative; width: 7.4rem; height: 1.85rem; display: grid; place-items: center; overflow: hidden; border: 2px solid #d0ab63; border-radius: .42rem; box-shadow: 0 2px 3px #0008; }.demand-board :global(.demand-tile) { position: absolute; inset: 0; width: 100%; height: 100%; filter: brightness(.72); }.demand-board > span { position: relative; z-index: 2; display: flex; gap: .12rem; }.demand-board > span :global(.game-art) { width: 1.08rem; height: 1.08rem; }
  .police-yard { height: 1.85rem; display: flex; align-items: center; padding: .12rem .35rem; border: 2px solid #9b8052; border-radius: .35rem; background: #4a3423e8; box-shadow: inset 0 0 .35rem #000, 0 2px 3px #0008; }.police-yard :global(.game-art) { width: 1.55rem; height: 1.55rem; }.police-yard b { min-width: 1.1rem; padding: .2rem; border-radius: 50%; text-align: center; background: #1d5355; }
  .ruby-track { position: relative; width: 7.4rem; height: 1.9rem; overflow: hidden; border: 2px solid #d0aa62; border-radius: .42rem; box-shadow: 0 2px 3px #0008; }.ruby-track :global(.track-board) { position: absolute; inset: 0; width: 100%; height: 100%; filter: brightness(.7); }.cost-wells { position: absolute; z-index: 2; inset: .25rem 1.55rem .25rem .25rem; display: flex; gap: .12rem; align-items: center; }.cost-wells > span { position: relative; display: grid; place-items: center; }.cost-wells :global(.game-art) { width: 1.05rem; height: 1.05rem; }.cost-wells b { position: absolute; right: -.12rem; bottom: -.12rem; min-width: .6rem; padding: .08rem; border-radius: 50%; text-align: center; background: #a33e39; }.track-ruby { position: absolute; z-index: 2; top: .12rem; right: .18rem; display: grid; place-items: center; }.track-ruby :global(.game-art) { width: 1.4rem; height: 1.4rem; }.track-ruby b, .dealer-price b { position: absolute; right: -.1rem; bottom: -.05rem; min-width: .65rem; padding: .1rem; border-radius: 50%; text-align: center; background: #173f43; }.dealer-price { position: absolute; z-index: 2; top: .3rem; left: .4rem; display: flex; align-items: center; }.dealer-price :global(.game-art) { width: 1.15rem; height: 1.15rem; }.dealer-price b { right: -.5rem; }
  .mosque-table { position: relative; height: 2.25rem; display: flex; gap: .3rem; align-items: center; padding: .12rem 1.5rem .12rem .22rem; border: 2px solid #d1aa61; border-radius: .42rem; background: #3a261ae8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.mosque-stack { position: relative; width: 1.9rem; height: 1.9rem; display: grid; place-items: center; }.mosque-stack :global(.mosque-power) { width: 1.8rem; height: 1.8rem; border-radius: .2rem; box-shadow: .08rem .08rem 0 #e0bd71, .16rem .14rem 0 #75502b; }.mosque-stack > b { position: absolute; right: -1rem; bottom: -.05rem; min-width: 1.25rem; display: grid; grid-template-columns: .55rem auto; gap: .02rem; align-items: center; padding: .08rem; border: 1px solid #e2c378; border-radius: .28rem; background: #173f43; }.mosque-stack > b :global(.game-art) { width: .5rem; height: .5rem; filter: none; }.mosque-stack small { grid-column: 1 / -1; color: #efca7d; font-size: .28rem; text-align: center; }.mosque-stack i { width: 1.75rem; height: 1.75rem; display: block; border: 1px dashed #d5bd8c; border-radius: .2rem; }.mosque-ruby { position: absolute; top: .3rem; right: .18rem; display: grid; place-items: center; }.mosque-ruby :global(.game-art) { width: 1.3rem; height: 1.3rem; }.mosque-ruby b { position: absolute; right: -.05rem; bottom: -.1rem; min-width: .6rem; padding: .08rem; border-radius: 50%; text-align: center; background: #173f43; }
  @media (max-width: 720px) {
    .location-state { top: .12rem; right: 1.3rem; left: .12rem; height: 1.25rem; gap: .05rem; scale: .66; transform-origin: top left; width: 145%; }
    .state-5, .state-6, .state-10, .state-11, .state-13, .state-14, .state-15, .state-16 { scale: .55; width: 175%; }
    .warehouse-rack span { width: 1.15rem; height: 1.15rem; }.warehouse-rack :global(.game-art) { width: 1rem; height: 1rem; }
  }
  @media (prefers-reduced-motion: reduce) { .mail-column i { transition: none; } }
</style>
