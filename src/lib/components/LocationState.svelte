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
    <span class="state-group"><GameArt kind="component" component="lira" /> <b>7</b></span>
    <span class="state-group"><GameArt kind="component" component="wheelbarrow" /> <b>{game.supplies.wheelbarrowExtensions}</b></span>
    <span class="state-group"><GameArt kind="component" component="ruby" /> <b>{game.supplies.wainwrightRubies}</b></span>
  {:else if warehouseGood(placeId)}
    <span class="state-group"><GameArt kind="component" component={warehouseGood(placeId)!} /> <b>MAX</b></span>
  {:else if placeId === 5}
    {#each postOfficeRows as rows, index}
      {@const resource = rows[game.postOfficeLower[index] ? 0 : 1]}
      <span class:lower={game.postOfficeLower[index]} class="mail-state">
        <GameArt kind="component" component={resource.good ?? 'lira'} />{#if resource.lira}<b>{resource.lira}</b>{/if}
      </span>
    {/each}
  {:else if placeId === 6}
    <span class="card-stack"><GameArt kind="card-back" /><b>{game.bonusDrawPile.length}</b></span>
    <span class:empty={!discard} class="card-stack discard">{#if discard}<GameArt kind="card" effect={discard.effect} />{:else}<i></i>{/if}<b>{game.bonusDiscard.length}</b></span>
  {:else if placeId === 7}
    <span class="state-group"><GameArt kind="piece" piece="assistant" color={active.color} /><b>↶ {separatedAssistants}</b></span>
  {:else if placeId === 8}
    <span class="basic-goods">{#each goods.slice(0, 3) as good}<GameArt kind="component" component={good} />{/each}</span>
    <span class="state-group dice"><GameArt kind="piece" piece="dice-pair" /><b>{game.lastRoll?.place === 8 ? game.lastRoll.dice.reduce((sum, die) => sum + die, 0) : '7·9·11'}</b></span>
  {:else if placeId === 9}
    <span class="state-group"><GameArt kind="component" component="lira" /><b>{game.lastRoll?.place === 9 ? game.lastRoll.declared : '3–12'}</b></span>
    <span class="state-group dice"><GameArt kind="piece" piece="dice-pair" />{#if game.lastRoll?.place === 9}<b>{game.lastRoll.dice.reduce((sum, die) => sum + die, 0)}</b>{/if}</span>
  {:else if placeId === 10 || placeId === 11}
    <span class="demand-state">{#each demand?.goods ?? [] as good}<GameArt kind="component" component={good} />{/each}</span>
  {:else if placeId === 12}
    <span class="state-group"><GameArt kind="piece" piece="family" color={active.color} /><b>{active.familyPlace === 12 ? 'GO' : `→${active.familyPlace}`}</b></span>
  {:else if placeId === 13}
    <span class="cost-state">{#each [...goods, 'any' as const] as good}{#if sultanCounts[good]}<span><GameArt kind="component" component={good === 'any' ? 'goods-supply' : good} /><b>{sultanCounts[good]}</b></span>{/if}{/each}</span>
    <span class="state-group ruby-stock"><GameArt kind="component" component="ruby" /><b>{game.rubyTracks.sultanRubies}</b></span>
  {:else if placeId === 14 || placeId === 15}
    {@const colors = placeId === 14 ? ['fabric', 'spice'] as Good[] : ['fruit', 'jewelry'] as Good[]}
    {#each colors as color}
      {@const tile = mosqueTiles.find(({ id }) => id === game.mosqueStacks[color][0])}
      <span class:empty={!tile} class="mosque-state"><GameArt kind="component" component={`mosque-${color}`} />{#if tile}<b>{tile.required}<small>−1</small></b>{:else}<b>×</b>{/if}</span>
    {/each}
    <span class="state-group ruby-stock"><GameArt kind="component" component="ruby" /><b>{placeId === 14 ? game.supplies.smallMosqueRubies : game.supplies.greatMosqueRubies}</b></span>
  {:else if placeId === 16}
    <span class="state-group"><GameArt kind="component" component="lira" /><b>{game.rubyTracks.gemstonePrice}</b></span>
    <span class="state-group ruby-stock"><GameArt kind="component" component="ruby" /><b>{game.rubyTracks.gemstoneRubies}</b></span>
  {/if}
</span>

<style>
  .location-state { position: absolute; z-index: 2; top: .22rem; right: 1.72rem; left: .22rem; height: 1.55rem; display: flex; gap: .12rem; align-items: center; overflow: hidden; padding: .12rem .2rem; border: 1px solid rgb(239 202 125 / 70%); border-radius: .38rem; color: #fffaf0; background: rgb(6 31 33 / 88%); box-shadow: 0 .12rem .25rem rgb(0 0 0 / 40%); pointer-events: none; }
  .location-state :global(.game-art) { width: 1.05rem; height: 1.05rem; flex: 0 0 auto; filter: drop-shadow(0 1px 1px #000); }
  .state-group, .mail-state, .mosque-state, .card-stack, .cost-state span { min-width: 0; display: flex; gap: .06rem; align-items: center; }
  b { font-size: .52rem; line-height: 1; white-space: nowrap; text-shadow: 0 1px 2px #000; }
  .mail-state { position: relative; flex: 1; justify-content: center; padding-bottom: .16rem; border-bottom: 2px solid #e5b64e; }
  .mail-state.lower { padding-top: .16rem; padding-bottom: 0; border-top: 2px solid #a9483f; border-bottom: 0; }
  .mail-state :global(.game-art) { width: .9rem; height: .9rem; }
  .card-stack { position: relative; height: 1.18rem; flex: 1; }
  .card-stack :global(.game-art), .card-stack i { width: .78rem; height: 1.12rem; border-radius: .1rem; }
  .card-stack i { display: block; border: 1px dashed #d8c294; background: #173f4366; }
  .card-stack b { padding: .14rem; border-radius: 50%; background: #9d3935; }
  .basic-goods, .demand-state, .cost-state { min-width: 0; display: flex; gap: .02rem; align-items: center; }
  .basic-goods :global(.game-art), .demand-state :global(.game-art) { width: .88rem; height: .88rem; }
  .demand-state { width: 100%; justify-content: space-between; }
  .dice { margin-left: auto; }
  .dice :global(.game-art) { width: 1.25rem; }
  .cost-state { flex: 1; }
  .cost-state span { position: relative; }
  .cost-state :global(.game-art) { width: .82rem; height: .82rem; }
  .cost-state b { position: absolute; right: -.05rem; bottom: -.08rem; min-width: .55rem; padding: .08rem; border-radius: 50%; text-align: center; background: #9d3935; }
  .ruby-stock { margin-left: auto; }
  .mosque-state { flex: 1; }
  .mosque-state b { display: grid; }
  .mosque-state small { color: #efca7d; font-size: .34rem; }
  @media (max-width: 720px) {
    .location-state { top: .16rem; right: 1.38rem; left: .16rem; height: 1.08rem; gap: .04rem; padding: .05rem .08rem; border-radius: .25rem; }
    .location-state :global(.game-art) { width: .68rem; height: .68rem; }
    b { font-size: .36rem; }
    .mail-state :global(.game-art), .basic-goods :global(.game-art), .demand-state :global(.game-art), .cost-state :global(.game-art) { width: .55rem; height: .55rem; }
    .card-stack { height: .88rem; }.card-stack :global(.game-art), .card-stack i { width: .55rem; height: .82rem; }
    .dice :global(.game-art) { width: .78rem; }
    .mosque-state small { font-size: .28rem; }
  }
</style>
