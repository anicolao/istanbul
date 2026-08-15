<script lang="ts">
  import { bonusCards } from '$lib/game/manifests';
  import BonusCard from './BonusCard.svelte';

  let {
    cards,
    selected,
    onInspect,
    class: className = ''
  }: {
    cards: string[];
    selected: string | null;
    onInspect: (cardId: string) => void;
    class?: string;
  } = $props();

  const bonusById = new Map(bonusCards.map((card) => [card.id, card]));
</script>

<nav
  class={`private-bonus-hand ${className}`}
  aria-label="Private Bonus hand"
  data-component="PrivateBonusHand"
  data-e2e-fit
  data-e2e-no-scroll
>
  <header><strong>Your private Bonus cards</strong><span>{cards.length} card{cards.length === 1 ? '' : 's'}</span></header>
  {#if cards.length}
    <div class="private-cards" style={`--card-count: ${cards.length}`}>
      {#each cards as cardId}
        {@const card = bonusById.get(cardId)}
        {#if card}
          <button aria-label={`Inspect Bonus card: ${card.title}`} aria-pressed={selected === cardId} onclick={() => onInspect(cardId)}>
            <BonusCard {card} compact class="private-bonus-card" artClass="hand-card-art" />
          </button>
        {/if}
      {/each}
    </div>
  {:else}
    <p>No Bonus cards in hand</p>
  {/if}
</nav>

<style>
  .private-bonus-hand { box-sizing: border-box; min-width: 0; min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr); gap: .25rem; overflow: hidden; padding: .35rem .45rem .45rem; border: 1px solid rgb(239 202 125 / 60%); border-radius: .65rem; color: #fffaf0; background: linear-gradient(120deg, rgb(36 23 15 / 98%), rgb(10 44 47 / 98%)); box-shadow: inset 0 0 1rem rgb(0 0 0 / 28%); }
  header { min-width: 0; display: flex; align-items: baseline; justify-content: space-between; gap: .5rem; }
  header strong { overflow: hidden; color: #efca7d; font-size: .58rem; letter-spacing: .08em; text-overflow: ellipsis; text-transform: uppercase; white-space: nowrap; }
  header span { flex: 0 0 auto; color: #b8cbc5; font-size: .5rem; }
  .private-cards { min-width: 0; min-height: 0; display: grid; grid-template-columns: repeat(var(--card-count), minmax(0, 1fr)); gap: .3rem; place-items: center; overflow: hidden; }
  button { box-sizing: border-box; width: 100%; height: 100%; min-width: 0; min-height: 0; display: grid; place-items: center; overflow: hidden; padding: .12rem; border: 0; border-radius: .35rem; color: inherit; background: transparent; }
  button[aria-pressed='true'] { outline: 2px solid #efca7d; outline-offset: -2px; background: rgb(239 202 125 / 12%); }
  button :global(.private-bonus-card) { width: auto; max-width: 100%; height: 100% !important; max-height: 100%; }
  p { margin: auto; color: #b8cbc5; font-size: .62rem; }
</style>
