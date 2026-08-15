<script lang="ts">
  import { bonusCards, demandTiles, mosqueTiles, type Good } from '$lib/game/manifests';
  import { postOfficeRows } from '$lib/game/actions';
  import { currentSultanCost, sultanCostSequence } from '$lib/game/ruby-routes';
  import { locationStateSummary } from '$lib/game/location-state';
  import type { GameSetup } from '$lib/game/setup';
  import BonusCard from './BonusCard.svelte';
  import GemstoneOffer from './GemstoneOffer.svelte';
  import GameArt from './GameArt.svelte';
  import MarketDemand from './MarketDemand.svelte';
  import PlayingPiece from './PlayingPiece.svelte';
  import SultanOffer from './SultanOffer.svelte';
  import TeaHousePayoffs from './TeaHousePayoffs.svelte';

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
  const policeFamilies = $derived(game.players.filter(({ familyPlace }) => familyPlace === 12));
  const sultanCost = $derived(currentSultanCost(game));
  const nextSultanGood = $derived(sultanCostSequence[sultanCost.length]);
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
      ><BonusCard reverse="card-back" compact mini /><b>{game.bonusDrawPile.length}</b></span>
      <span
        class:empty={!discard}
        class="card-pile discard"
        data-inspect-pile-card={discard?.id}
        data-pile-source="discard"
        aria-label={discard ? `Inspect discard pile top card: ${discard.title}` : 'Bonus discard pile is empty'}
      >{#if discard}<BonusCard card={discard} compact mini />{:else}<i></i>{/if}<b>{game.bonusDiscard.length}</b></span>
    </span>
  {:else if placeId === 7}
    <span class="assistant-corral">{#each Array(Math.max(1, separatedAssistants)) as _, index}<PlayingPiece piece="assistant" color={active.color} class={index >= separatedAssistants ? 'ghost' : ''} />{/each}</span>
  {:else if placeId === 8}
    <span class="black-market-payoffs" aria-label="Black Market jewelry thresholds: 7 for 1, 9 for 2, 11 for 3">
      {#each [[7, 1], [9, 2], [11, 3]] as payoff}<span><b>{payoff[0]}+</b><GameArt kind="component" component="jewelry" /><strong>×{payoff[1]}</strong></span>{/each}
    </span>
  {:else if placeId === 9}
    <TeaHousePayoffs />
  {:else if placeId === 10 || placeId === 11}
    <MarketDemand market={placeId === 10 ? 'large' : 'small'} goods={demand?.goods ?? []} />
  {:else if placeId === 12}
    <span class:empty={policeFamilies.length === 0} class="family-corral" aria-label={`${policeFamilies.length} family members available at Police Station`}>
      {#each policeFamilies as player}<PlayingPiece piece="family" color={player.color} class="station-family" label={`${player.name}'s family available at Police Station`} />{/each}
    </span>
  {:else if placeId === 13}
    <SultanOffer cost={sultanCost} nextGood={nextSultanGood} label={`Sultan ruby offer: ${summary}`} />
  {:else if placeId === 14 || placeId === 15}
    {@const colors = placeId === 14 ? ['fabric', 'spice'] as Good[] : ['fruit', 'jewelry'] as Good[]}
    <span class="mosque-table">
      {#each colors as color}
        {@const tile = mosqueTiles.find(({ id }) => id === game.mosqueStacks[color][0])}
        <span class:empty={!tile} class="mosque-stack">{#if tile}<GameArt kind="component" component={`mosque-${color}`} class="mosque-power" /><b><GameArt kind="component" component={color} />{tile.required}<small>pay 1</small></b>{:else}<i></i>{/if}</span>
      {/each}
    </span>
  {:else if placeId === 16}
    <GemstoneOffer price={game.rubyTracks.gemstonePrice} />
  {/if}
</span>

<style>
  .location-state { position: absolute; z-index: 2; right: .32rem; bottom: .3rem; left: .32rem; min-height: 4.5rem; display: flex; gap: .3rem; align-items: end; justify-content: center; pointer-events: none; }
  .location-state > * { transform-origin: bottom center; }
  .location-state :global(.demand-board) { transform-origin: bottom center; }
  .location-state :global(.game-art:not([data-art-kind='piece'])) { flex: 0 0 auto; filter: drop-shadow(0 2px 2px #000b); }
  b { position: relative; z-index: 2; color: #fffaf0; font-size: .72rem; line-height: 1; white-space: nowrap; text-shadow: 0 1px 2px #000; }
  .mail-board { width: min(100%, 8.5rem); height: 3.25rem; display: flex; gap: .14rem; padding: .16rem .28rem; border: 2px solid #cda65f; border-radius: .45rem; background: #e4cf9d; box-shadow: 0 2px 3px #0008; }.mail-column { position: relative; flex: 1; display: grid; grid-template-rows: 1fr 1fr; gap: .06rem; }.mail-column > span { position: relative; display: grid; place-items: center; border: 1px solid #8f7449; border-radius: .15rem; background: #f2e4bd; }.mail-column > span.covered { opacity: .3; filter: grayscale(1); }.mail-column :global(.game-art) { width: 1.05rem; height: 1.05rem; filter: none; }.mail-column b { position: absolute; right: 0; bottom: 0; color: #173f43; font-size: .45rem; text-shadow: none; }.mail-column i { position: absolute; z-index: 3; top: 7%; right: 3%; width: .6rem; height: .6rem; border: 1px solid #fff2d0; border-radius: .1rem; background: #a93f38; box-shadow: 0 1px 2px #0008; transition: top .18s ease; }.mail-column i.lower { top: 59%; }
  .caravan-table { height: 4.45rem; display: flex; gap: .75rem; align-items: center; padding: .16rem .65rem; border: 2px solid #9f6f39; border-radius: .45rem; background: #4b2e1de8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.card-pile { position: relative; width: 2.25rem; height: 4.1rem; display: flex; align-items: center; justify-content: center; pointer-events: auto; cursor: pointer; }.card-pile :global(.bonus-card) { width: auto !important; max-width: 100%; height: 100% !important; max-height: 100%; min-width: 0; flex: 0 1 auto; border-radius: .16rem; box-shadow: .14rem .1rem 0 #d8b464, .24rem .2rem 0 #6e4526; }.card-pile i { width: 2rem; max-width: 2rem; min-width: 0; height: 4rem; display: block; flex: 0 0 2rem; border: 1px dashed #d8c294; background: #173f43aa; box-shadow: .14rem .1rem 0 #d8b464, .24rem .2rem 0 #6e4526; }.card-pile b { position: absolute; right: -.2rem; bottom: -.05rem; min-width: 1rem; padding: .18rem; border-radius: 50%; text-align: center; background: #9d3935; }
  .assistant-corral { width: min(100%, 9rem); display: flex; gap: .12rem; justify-content: center; padding: .25rem .45rem; border: 2px solid #c49a55; border-radius: 1rem; background: #3e2719e8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.assistant-corral :global(.playing-piece) { width: min(2.15rem, 21%); height: auto; aspect-ratio: 1; flex: 0 1 auto; }.assistant-corral :global(.ghost) { opacity: .25; filter: grayscale(1); }
  .black-market-payoffs { width: min(100%, 9rem); height: 3.1rem; display: grid; grid-template-columns: repeat(3, 1fr); gap: .18rem; padding: .28rem; border: 2px solid #cda65f; border-radius: .45rem; background: #23170fe8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.black-market-payoffs > span { min-width: 0; display: grid; grid-template-columns: 1fr 1fr; place-items: center; padding: .1rem; border: 1px solid #efca7d77; border-radius: .3rem; background: #173f43; }.black-market-payoffs b { grid-column: 1 / -1; color: #efca7d; font-size: .72rem; }.black-market-payoffs strong { color: #fffaf0; font-size: .65rem; }.black-market-payoffs :global(.game-art) { width: 1.15rem; height: 1.15rem; filter: none; }
  .family-corral { width: min(100%, 9rem); height: 3.1rem; display: flex; gap: .16rem; align-items: center; justify-content: center; padding: .28rem .42rem; border: 2px solid #cda65f; border-radius: 1.2rem; background: #34251be8; box-shadow: inset 0 0 .45rem #000, 0 2px 3px #0008; }.family-corral.empty::after { color: #d8c294; font-size: .55rem; letter-spacing: .08em; content: 'ON PATROL'; }.family-corral :global(.station-family) { width: min(1.7rem, 18%); height: auto; aspect-ratio: 1; }
  .mosque-table { position: relative; width: min(100%, 9rem); height: 3.5rem; display: flex; gap: .55rem; align-items: center; justify-content: center; padding: .16rem .3rem; border: 2px solid #d1aa61; border-radius: .42rem; background: #3a261ae8; box-shadow: inset 0 0 .4rem #000, 0 2px 3px #0008; }.mosque-stack { position: relative; width: 3.25rem; height: 3.05rem; display: grid; place-items: center; }.mosque-stack :global(.mosque-power) { width: 3rem; height: 3rem; border-radius: .2rem; box-shadow: .08rem .08rem 0 #e0bd71, .16rem .14rem 0 #75502b; }.mosque-stack > b { position: absolute; right: -.45rem; bottom: -.08rem; min-width: 1.5rem; display: grid; grid-template-columns: .75rem auto; gap: .04rem; align-items: center; padding: .1rem; border: 1px solid #e2c378; border-radius: .28rem; background: #173f43; }.mosque-stack > b :global(.game-art) { width: .72rem; height: .72rem; filter: none; }.mosque-stack small { grid-column: 1 / -1; color: #efca7d; font-size: .36rem; text-align: center; }.mosque-stack i { width: 3rem; height: 3rem; display: block; border: 1px dashed #d5bd8c; border-radius: .2rem; }
  @container location-tile (min-width: 15rem) and (min-height: 10rem) {
    .location-state { min-height: 6.8rem; }
    .location-state > *, .location-state :global(.demand-board) { scale: 1.5; }
  }
  @media (max-width: 960px) {
    .location-state { right: 0; bottom: .02rem; left: 0; width: auto; height: 1.15rem; min-width: 0; min-height: 0; scale: none; translate: none; }
    .location-state > * { min-width: 0; max-width: 100%; box-sizing: border-box; scale: 1; }
    .location-state > :global([data-component]) { min-width: 0; max-width: 100%; box-sizing: border-box; transform-origin: bottom center; }
    .location-state :global(.demand-board) { scale: 1; }
    .location-state :global(.game-art:not([data-art-kind='piece'])) { filter: drop-shadow(0 1px 1px #000b); }
    .mail-board { width: 100%; height: 1rem; gap: .02rem; padding: .04rem; border-width: 1px; border-radius: .18rem; }.mail-column { min-width: 0; gap: .015rem; }.mail-column :global(.game-art) { width: .22rem; height: .22rem; }.mail-column b { font-size: .16rem; }.mail-column i { right: 0; width: .17rem; height: .17rem; border-width: 1px; }.mail-column i.lower { top: 58%; }
    .caravan-table { width: 100%; height: 1rem; gap: .2rem; justify-content: center; padding: .03rem .14rem; border-width: 1px; border-radius: .18rem; }.card-pile { width: .46rem; height: .9rem; }.card-pile :global(.bonus-card) { width: auto !important; max-width: 100%; height: 100% !important; max-height: 100%; flex-basis: auto; box-shadow: .035rem .025rem 0 #d8b464, .055rem .045rem 0 #6e4526; }.card-pile i { width: .42rem; max-width: .42rem; height: .84rem; flex-basis: .42rem; box-shadow: .035rem .025rem 0 #d8b464, .055rem .045rem 0 #6e4526; }.card-pile b { right: 0; bottom: 0; min-width: .3rem; padding: .03rem; font-size: .21rem; }
    .assistant-corral { height: 1rem; padding: .06rem .16rem; border-width: 1px; }.assistant-corral :global(.playing-piece) { width: min(.72rem, 19%); height: min(.72rem, 86%); }
    .black-market-payoffs { width: 100%; height: 1rem; gap: .025rem; padding: .04rem; border-width: 1px; border-radius: .18rem; }.black-market-payoffs > span { min-width: 0; gap: 0; padding: .01rem; border-radius: .08rem; }.black-market-payoffs b { font-size: .2rem; }.black-market-payoffs strong { min-width: 0; font-size: .14rem; }.black-market-payoffs :global(.game-art) { width: .2rem; height: .2rem; }
    .family-corral { width: 100%; height: 1rem; gap: .03rem; padding: .06rem .12rem; border-width: 1px; border-radius: .48rem; }.family-corral.empty::after { font-size: .21rem; }.family-corral :global(.station-family) { width: min(.58rem, 18%); height: min(.58rem, 84%); }
    .mosque-table { width: 100%; height: 1rem; gap: .08rem; padding: .035rem .07rem; border-width: 1px; border-radius: .18rem; }.mosque-stack { width: min(1.5rem, 43%); height: .84rem; }.mosque-stack :global(.mosque-power), .mosque-stack i { width: min(.52rem, 78%); height: auto; aspect-ratio: 1; }.mosque-stack > b { right: 0; bottom: 0; min-width: .45rem; grid-template-columns: .2rem auto; padding: .015rem; font-size: .18rem; }.mosque-stack > b :global(.game-art) { width: .18rem; height: .18rem; }.mosque-stack small { font-size: .12rem; }
  }
  @container location-tile (max-width: 3.5rem) {
    .location-state { height: 1rem; }
    .location-state > * { max-width: 180%; scale: .5; }
    .location-state > :global([data-component]) { max-width: 100%; scale: .8; }
    .location-state :global(.demand-board) { max-width: 150%; scale: .6; }
  }
  @media (prefers-reduced-motion: reduce) { .mail-column i { transition: none; } }
</style>
