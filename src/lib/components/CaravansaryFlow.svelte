<script lang="ts">
  import { bonusCards } from '$lib/game/manifests';
  import type { CardSource, PlaceActionChoice } from '$lib/game/actions';
  import type { GameSetup } from '$lib/game/setup';
  import BonusCard from './BonusCard.svelte';
  import BonusCardChoices from './BonusCardChoices.svelte';
  let {
    game,
    disabled = false,
    displayOnly = false,
    onAction = () => {}
  }: {
    game: GameSetup;
    disabled?: boolean;
    displayOnly?: boolean;
    onAction?: (choice: PlaceActionChoice) => void;
  } = $props();
  let sources = $state<CardSource[]>([]);
  const player = $derived(game.players[game.turnSeat]);
  const discardCount = $derived(
    game.bonusDiscard.length - sources.filter((s) => s === 'discard').length
  );
  const deckCount = $derived(
    game.bonusDrawPile.length - sources.filter((s) => s === 'deck').length
  );
  const discard = $derived(
    bonusCards.find((card) => card.id === game.bonusDiscard[discardCount - 1])
  );
  const firstCard = $derived(
    sources[0] === 'discard'
      ? bonusCards.find((card) => card.id === game.bonusDiscard.at(-1))
      : undefined
  );
  function take(source: CardSource) {
    if (disabled || sources.length >= 2) return;
    if (!sources.length) sources = [source];
    else {
      const first = sources[0];
      sources = [];
      onAction({ kind: 'caravansary-draw', drawSources: [first, source] });
    }
  }
</script>

<div class="caravansary-flow" class:display-only={displayOnly}>
  {#if !displayOnly && game.pending?.kind === 'caravansary-discard'}
    <p>Tap a card to discard</p>
    <BonusCardChoices
      cards={player.bonusHand}
      {disabled}
      onChoose={(discardCardId) =>
        onAction({ kind: 'caravansary-discard', discardCardId })}
    />
  {:else}
    <div class="piles">
      <svelte:element
        this={displayOnly ? 'span' : 'button'}
        role={displayOnly ? 'img' : 'button'}
        class="pile card-pile"
        data-card-pile="deck"
        aria-label="Draw from face-down pile"
        disabled={disabled || deckCount === 0}
        onclick={displayOnly ? undefined : () => take('deck')}
      >
        <BonusCard reverse="card-back" /><span class="count">{deckCount}</span>
      </svelte:element>
      <svelte:element
        this={displayOnly ? 'span' : 'button'}
        role={displayOnly ? 'img' : 'button'}
        class="pile card-pile"
        data-card-pile="discard"
        aria-label="Draw from face-up pile"
        disabled={disabled || !discard}
        onclick={displayOnly ? undefined : () => take('discard')}
      >
        {#if discard}<BonusCard card={discard} />{:else}<span
            class="empty"
            aria-label="Empty discard pile"
          ></span>{/if}
        <span class="count">{discardCount}</span>
      </svelte:element>
      {#if sources.length}<button
          class="picked"
          aria-label="Return selected card"
          {disabled}
          onclick={() => (sources = [])}
        >
          <BonusCard
            card={firstCard}
            reverse={firstCard ? undefined : 'card-back'}
          />
        </button>{/if}
    </div>
    {#if !displayOnly}<p>
        {sources.length
          ? 'Tap a pile for your second card'
          : 'Tap a pile for your first card'}
      </p>{/if}
  {/if}
</div>

<style>
  .caravansary-flow {
    width: 100%;
    --choice-card-width: clamp(4.5rem, 8cqw, 8rem);
  }
  .piles {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.4cqw;
  }
  button,
  .pile {
    position: relative;
    padding: 0;
    border: 0;
    background: none;
    color: #fff5da;
    cursor: pointer;
    touch-action: manipulation;
  }
  .pile {
    display: block;
    width: var(--pile-width, clamp(4.5rem, 8cqw, 8rem));
  }
  .picked {
    position: absolute;
    right: -30%;
    width: var(--picked-width, clamp(3.5rem, 6cqw, 6rem));
    transform: rotate(6deg);
  }
  .count {
    position: absolute;
    bottom: -2%;
    right: -3%;
    padding: 2% 5%;
    font-size: var(--pile-count-size, 0.85rem);
    border-radius: 50%;
    background: #173f43;
    border: 1px solid #d49d42;
  }
  .empty {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 2;
    box-sizing: border-box;
    border: 1px dashed #d49d42;
    border-radius: 0.4rem;
  }
  .display-only .pile {
    cursor: inherit;
  }
  p {
    text-align: center;
    margin: 0.6rem 0;
    font-size: clamp(0.7rem, 1cqw, 1rem);
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  button:focus-visible {
    outline: 2px solid white;
    outline-offset: 3px;
  }
</style>
