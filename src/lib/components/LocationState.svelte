<script lang="ts">
  import { bonusCards, demandTiles } from '$lib/game/manifests';
  import MailTrack from './MailTrack.svelte';
  import { locationStateSummary } from '$lib/game/location-state';
  import type { GameSetup } from '$lib/game/setup';
  import BonusCard from './BonusCard.svelte';
  import GemstoneOffer from './GemstoneOffer.svelte';
  import GameArt from './GameArt.svelte';
  import MarketDemand from './MarketDemand.svelte';
  import PlayingPiece from './PlayingPiece.svelte';
  import MosqueOffers from './MosqueOffers.svelte';
  import SultanOffer from './SultanOffer.svelte';
  import DicePayoffs from './DicePayoffs.svelte';

  let {
    game,
    placeId
  }: {
    game: GameSetup;
    placeId: number;
  } = $props();
  const summary = $derived(locationStateSummary(game, placeId));
  const demand = $derived(
    demandTiles.find(
      ({ id }) =>
        id === (placeId === 10 ? game.largeDemand[0] : game.smallDemand[0])
    )
  );
  const discard = $derived(
    bonusCards.find(({ id }) => id === game.bonusDiscard.at(-1))
  );
  const policeFamilies = $derived(
    game.players.filter(({ familyPlace }) => familyPlace === 12)
  );
</script>

<span
  class={`location-state state-${placeId}`}
  data-testid={`place-state-${placeId}`}
  data-state-summary={summary}
  data-e2e-status-area
>
  {#if placeId === 5}
    <span class="mail-board"><MailTrack lower={game.postOfficeLower} /></span>
  {:else if placeId === 6}
    <span class="caravan-table">
      <span
        class:empty={!game.bonusDrawPile.length}
        class="card-pile deck"
        data-pile-source="deck"
        aria-label={`Bonus draw pile: ${game.bonusDrawPile.length} face-down cards`}
        ><BonusCard reverse="card-back" compact mini /><b
          >{game.bonusDrawPile.length}</b
        ></span
      >
      <span
        class:empty={!discard}
        class="card-pile discard"
        data-inspect-pile-card={discard?.id}
        data-pile-source="discard"
        aria-label={discard
          ? `Inspect discard pile top card: ${discard.title}`
          : 'Bonus discard pile is empty'}
        >{#if discard}<BonusCard card={discard} compact mini />{:else}<i
          ></i>{/if}<b>{game.bonusDiscard.length}</b></span
      >
    </span>
  {:else if placeId === 8 || placeId === 9}
    <DicePayoffs {placeId} />
  {:else if placeId === 10 || placeId === 11}
    <MarketDemand
      market={placeId === 10 ? 'large' : 'small'}
      goods={demand?.goods ?? []}
    />
  {:else if placeId === 12}
    <span
      class:empty={policeFamilies.length === 0}
      class="family-corral"
      aria-label={`${policeFamilies.length} family members available at Police Station`}
    >
      {#each policeFamilies as player}<PlayingPiece
          piece="family"
          color={player.color}
          class="station-family"
          label={`${player.name}'s family available at Police Station`}
        />{/each}
    </span>
  {:else if placeId === 13}
    <SultanOffer {game} />
  {:else if placeId === 14 || placeId === 15}
    <MosqueOffers {game} {placeId} />
  {:else if placeId === 16}
    <GemstoneOffer price={game.rubyTracks.gemstonePrice} />
  {/if}
</span>

<style>
  .location-state {
    position: absolute;
    z-index: 2;
    right: 0.32rem;
    bottom: 0.3rem;
    left: 0.32rem;
    min-height: 4.5rem;
    display: flex;
    gap: 0.3rem;
    align-items: end;
    justify-content: center;
    pointer-events: none;
  }
  .location-state > * {
    transform-origin: bottom center;
  }
  .location-state :global(.demand-board) {
    transform-origin: bottom center;
  }
  .location-state :global(.game-art:not([data-art-kind='piece'])) {
    flex: 0 0 auto;
    filter: drop-shadow(0 2px 2px #000b);
  }
  b {
    position: relative;
    z-index: 2;
    color: #fffaf0;
    font-size: 0.72rem;
    line-height: 1;
    white-space: nowrap;
    text-shadow: 0 1px 2px #000;
  }
  .mail-board {
    width: min(100%, 8.5rem);
  }
  .caravan-table {
    height: 4.45rem;
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.16rem 0.65rem;
    border: 2px solid #9f6f39;
    border-radius: 0.45rem;
    background: #4b2e1de8;
    box-shadow:
      inset 0 0 0.4rem #000,
      0 2px 3px #0008;
  }
  .card-pile {
    position: relative;
    width: 2.25rem;
    height: 4.1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
    cursor: pointer;
  }
  .card-pile :global(.bonus-card) {
    width: auto !important;
    max-width: 100%;
    height: 100% !important;
    max-height: 100%;
    min-width: 0;
    flex: 0 1 auto;
    border-radius: 0.16rem;
    box-shadow:
      0.14rem 0.1rem 0 #d8b464,
      0.24rem 0.2rem 0 #6e4526;
  }
  .card-pile i {
    width: 2rem;
    max-width: 2rem;
    min-width: 0;
    height: 4rem;
    display: block;
    flex: 0 0 2rem;
    border: 1px dashed #d8c294;
    background: #173f43aa;
    box-shadow:
      0.14rem 0.1rem 0 #d8b464,
      0.24rem 0.2rem 0 #6e4526;
  }
  .card-pile b {
    position: absolute;
    right: -0.2rem;
    bottom: -0.05rem;
    min-width: 1rem;
    padding: 0.18rem;
    border-radius: 50%;
    text-align: center;
    background: #9d3935;
  }
  .family-corral {
    width: min(100%, 9rem);
    height: 3.1rem;
    display: flex;
    gap: 0.16rem;
    align-items: center;
    justify-content: center;
    padding: 0.28rem 0.42rem;
    border: 2px solid #cda65f;
    border-radius: 1.2rem;
    background: #34251be8;
    box-shadow:
      inset 0 0 0.45rem #000,
      0 2px 3px #0008;
  }
  .family-corral.empty::after {
    color: #d8c294;
    font-size: 0.55rem;
    letter-spacing: 0.08em;
    content: 'ON PATROL';
  }
  .family-corral :global(.station-family) {
    width: min(1.7rem, 18%);
    height: auto;
    aspect-ratio: 1;
  }
  @container location-tile (min-width: 15rem) and (min-height: 10rem) {
    .location-state {
      min-height: 6.8rem;
    }
    .location-state > *,
    .location-state :global(.demand-board) {
      scale: 1.5;
    }
  }
  @media (max-width: 960px) {
    .location-state {
      right: 0;
      bottom: 0.02rem;
      left: 0;
      width: auto;
      height: 1.15rem;
      min-width: 0;
      min-height: 0;
      scale: none;
      translate: none;
    }
    .location-state > * {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      scale: 1;
    }
    .location-state > :global([data-component]) {
      min-width: 0;
      max-width: 100%;
      box-sizing: border-box;
      transform-origin: bottom center;
    }
    .location-state :global(.demand-board) {
      scale: 1;
    }
    .location-state :global(.game-art:not([data-art-kind='piece'])) {
      filter: drop-shadow(0 1px 1px #000b);
    }
    .mail-board {
      width: 100%;
    }
    .caravan-table {
      width: 100%;
      height: 1rem;
      gap: 0.2rem;
      justify-content: center;
      padding: 0.03rem 0.14rem;
      border-width: 1px;
      border-radius: 0.18rem;
    }
    .card-pile {
      width: 0.46rem;
      height: 0.9rem;
    }
    .card-pile :global(.bonus-card) {
      width: auto !important;
      max-width: 100%;
      height: 100% !important;
      max-height: 100%;
      flex-basis: auto;
      box-shadow:
        0.035rem 0.025rem 0 #d8b464,
        0.055rem 0.045rem 0 #6e4526;
    }
    .card-pile i {
      width: 0.42rem;
      max-width: 0.42rem;
      height: 0.84rem;
      flex-basis: 0.42rem;
      box-shadow:
        0.035rem 0.025rem 0 #d8b464,
        0.055rem 0.045rem 0 #6e4526;
    }
    .card-pile b {
      right: 0;
      bottom: 0;
      min-width: 0.3rem;
      padding: 0.03rem;
      font-size: 0.21rem;
    }
    .family-corral {
      width: 100%;
      height: 1rem;
      gap: 0.03rem;
      padding: 0.06rem 0.12rem;
      border-width: 1px;
      border-radius: 0.48rem;
    }
    .family-corral.empty::after {
      font-size: 0.21rem;
    }
    .family-corral :global(.station-family) {
      width: min(0.58rem, 18%);
      height: min(0.58rem, 84%);
    }
  }
  @container location-tile (max-width: 3.5rem) {
    .location-state {
      height: 1rem;
    }
    .location-state > * {
      max-width: 180%;
      scale: 0.5;
    }
    .location-state > :global([data-component]) {
      max-width: 100%;
      scale: 0.8;
    }
    .location-state :global(.demand-board) {
      max-width: 150%;
      scale: 0.6;
    }
  }
</style>
