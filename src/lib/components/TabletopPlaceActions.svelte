<script lang="ts">
  import {
    postOfficeRows,
    warehouseGood,
    type PlaceActionChoice
  } from '$lib/game/actions';
  import { type Good } from '$lib/game/manifests';
  import MarketFlow from './MarketFlow.svelte';
  import MosqueOffers from './MosqueOffers.svelte';
  import SultanOffer from './SultanOffer.svelte';
  import type { GameSetup, SetupPlayer } from '$lib/game/setup';
  import { base } from '$app/paths';
  import { locationArt, type PlayerColorName } from '$lib/game/art';
  import { places } from '$lib/game/manifests';
  import CaravansaryFlow from './CaravansaryFlow.svelte';
  import GameArt from './GameArt.svelte';
  let {
    game,
    player,
    placeId,
    onAction,
    onSkip
  }: {
    game: GameSetup;
    player: SetupPlayer;
    placeId: number;
    onAction: (choice: PlaceActionChoice) => void;
    onSkip: () => void;
  } = $props();
  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
  let recalls = $state<number[]>([]);
  const warehouse = $derived(warehouseGood(placeId));
  let wager = $state(7);
</script>

<div
  class="choices"
  class:police-map={placeId === 12 && player.familyPlace === 12}
  aria-label="Place action"
>
  {#if warehouse}
    <button
      class="offer primary"
      onclick={() => onAction({ kind: 'warehouse-fill', good: warehouse })}
      aria-label={`Fill ${warehouse} to ${player.capacity}`}
      ><GameArt kind="component" component={warehouse} /><span
        >Fill {warehouse}<b>{player.goods[warehouse]} → {player.capacity}</b
        ></span
      ></button
    >
  {:else if placeId === 1}
    <button
      class="offer primary"
      disabled={player.lira < 7 ||
        player.extensions >= 3 ||
        game.supplies.wheelbarrowExtensions < 1}
      onclick={() => onAction({ kind: 'wainwright-buy' })}
      ><GameArt kind="component" component="wheelbarrow" /><span
        >Extend all tracks<b>7 Lira · capacity {player.capacity + 1}</b></span
      ></button
    >
  {:else if placeId === 5}
    <button
      class="offer primary"
      onclick={() => onAction({ kind: 'post-office-collect' })}
      ><span>Collect</span>{#each postOfficeRows as rows, i}{@const reward =
          rows[game.postOfficeLower[i] ? 1 : 0]}<span class="reward"
          ><GameArt
            kind="component"
            component={reward.good ?? 'lira'}
          />{#if !reward.good}<b>{reward.lira}</b>{/if}</span
        >{/each}</button
    >
  {:else if placeId === 6}
    <CaravansaryFlow {game} {onAction} />
  {:else if placeId === 7}
    <div class="assistants">
      {#each Object.entries(player.assistantsByPlace) as [place, count]}{#each Array(count) as _, i}{@const n =
            Number(place)}<button
            class:selected={recalls.filter((p) => p === n).length > i}
            aria-label={`Recall assistant ${i + 1} from ${places.find((p) => p.id === n)?.name}`}
            onclick={() => {
              const selected = recalls.filter((p) => p === n).length;
              recalls =
                selected === count
                  ? recalls.filter((p) => p !== n)
                  : [...recalls, n];
            }}
            ><GameArt
              kind="piece"
              piece="assistant"
              color={player.color as PlayerColorName}
            /><small>{places.find((p) => p.id === n)?.shortName}</small></button
          >{/each}{/each}
    </div>
    <button
      disabled={!recalls.length}
      onclick={() =>
        onAction({ kind: 'fountain-recall', assistantPlaces: recalls })}
      >Recall selected</button
    ><button
      onclick={() =>
        onAction({
          kind: 'fountain-recall',
          assistantPlaces: Object.entries(player.assistantsByPlace).flatMap(
            ([p, n]) => Array(n).fill(Number(p))
          )
        })}>Recall all</button
    >
  {:else if placeId === 8}
    <p>Take a good and roll for jewelry.</p>
    {#each goods.slice(0, 3) as good}<button
        class="offer primary"
        aria-label={`Take ${good} and roll`}
        onclick={() =>
          onAction({
            kind: 'black-market-roll',
            good: good as Exclude<Good, 'jewelry'>
          })}
        ><GameArt kind="component" component={good} /><span>+1 & roll</span
        ></button
      >{/each}
  {:else if placeId === 9}
    <div class="wagers" aria-label="Tea House wager">
      {#each Array.from({ length: 10 }, (_, i) => i + 3) as n}<button
          class:selected={wager === n}
          aria-pressed={wager === n}
          onclick={() => (wager = n)}>{n}</button
        >{/each}
    </div>
    <button
      class="primary"
      onclick={() => onAction({ kind: 'tea-house-wager', wager })}
      >Roll for {wager} Lira</button
    >
  {:else if placeId === 10 || placeId === 11}
    <MarketFlow {game} {player} {placeId} {onAction} active />
  {:else if placeId === 12}
    {#if player.familyPlace === 12}<div class="destinations">
        {#each game.board as id}{@const target = places.find(
            (p) => p.id === id
          )!}<button
            aria-label={`Send family to ${target.name}`}
            disabled={id === 12}
            style={`background-image:url('${base}/${locationArt[id]}')`}
            onclick={() => onAction({ kind: 'police-send', destination: id })}
            >{target.shortName}</button
          >{/each}
      </div>{:else}<GameArt
        kind="piece"
        piece="family"
        color={player.color as PlayerColorName}
      />
      <p>Your family is already in the bazaar.</p>{/if}
  {:else if placeId === 13}
    <SultanOffer {game} {player} {onAction} active />
  {:else if placeId === 14 || placeId === 15}
    <MosqueOffers {game} {player} {placeId} {onAction} active />
  {:else if placeId === 16}
    <button
      class="offer primary"
      disabled={player.lira < game.rubyTracks.gemstonePrice}
      onclick={() => onAction({ kind: 'gemstone-buy' })}
      ><GameArt kind="component" component="ruby" /><span
        >Buy ruby<b>{game.rubyTracks.gemstonePrice} Lira</b></span
      ></button
    >
  {/if}
</div>

<style>
  .choices {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5cqw;
    width: 100%;
    min-width: 0;
  }
  p {
    margin: 0;
    font-size: 0.9cqw;
    text-align: center;
  }
  small {
    font-size: 0.75cqw;
  }
  button {
    font: inherit;
    font-size: 0.9cqw;
    color: #fff5da;
    background: #194943e8;
    border: 1px solid #b19759;
    border-radius: 0.3cqw;
    padding: 0.5cqw;
    cursor: pointer;
    touch-action: manipulation;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .primary,
  button.selected {
    background: #efd28e;
    color: #163b37;
    border-color: #efd28e;
  }
  .offer {
    display: flex;
    align-items: center;
    gap: 0.5cqw;
    text-align: left;
    max-width: 100%;
  }
  .offer > span {
    display: grid;
    gap: 0.2cqw;
  }
  .offer b {
    font-size: 0.8cqw;
  }
  .offer :global(.game-art) {
    width: 3cqw;
    height: 3cqw;
    flex-shrink: 0;
  }
  .reward {
    position: relative;
  }
  .reward b {
    position: absolute;
    bottom: 0;
    right: 0;
  }
  .wagers {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.3cqw;
    width: 100%;
  }
  .wagers button {
    padding: 0.5cqw;
    font-size: 1.3cqw;
  }

  button:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
  .choices.police-map {
    height: 100%;
    container-type: size;
  }
  .destinations {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    gap: 0.6cqw;
    width: min(100cqw, calc(100cqh * 16 / 9));
    aspect-ratio: 16 / 9;
    container-type: inline-size;
  }
  .destinations button {
    min-width: 0;
    min-height: 0;
    padding: 1cqw;
    overflow: hidden;
    line-height: 1.1;
    background-size: cover;
    background-position: center;
    text-shadow:
      0 1px 3px #000,
      0 0 5px #000;
    font-size: 2.8cqw;
    display: flex;
    align-items: end;
    justify-content: center;
  }
  .assistants {
    display: flex;
    gap: 0.4cqw;
    flex-wrap: wrap;
    justify-content: center;
  }
  .assistants button {
    display: grid;
    justify-items: center;
  }
  .assistants :global(.game-art) {
    width: 3cqw;
    height: 3cqw;
  }
</style>
