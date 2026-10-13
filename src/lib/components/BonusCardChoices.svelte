<script lang="ts">
  import { bonusCards } from '$lib/game/manifests';
  import BonusCard from './BonusCard.svelte';
  let {
    cards,
    disabled = false,
    onChoose
  }: {
    cards: string[];
    disabled?: boolean;
    onChoose: (id: string) => void;
  } = $props();
  let page = $state(0);
  const lastPage = $derived(Math.max(0, Math.ceil(cards.length / 4) - 1));
  const current = $derived(Math.min(page, lastPage));
</script>

<div class="card-choices">
  <div class="cards">
    {#each cards.slice(current * 4, current * 4 + 4) as id}
      {@const card = bonusCards.find((card) => card.id === id)!}
      <button
        class="card"
        aria-label={`Discard ${card.title}`}
        {disabled}
        onclick={() => onChoose(id)}><BonusCard {card} /></button
      >
    {/each}
  </div>
  {#if lastPage > 0}<nav aria-label="Cards to discard">
      <button
        disabled={current === 0}
        onclick={() => (page = current - 1)}
        aria-label="Previous cards">←</button
      ><span>{current + 1} / {lastPage + 1}</span><button
        disabled={current === lastPage}
        onclick={() => (page = current + 1)}
        aria-label="Next cards">→</button
      >
    </nav>{/if}
</div>

<style>
  .card-choices {
    width: 100%;
    min-width: 0;
  }
  .cards {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .card {
    flex: 0 1 var(--choice-card-width, 5rem);
    min-width: 0;
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .card:focus-visible {
    outline: 3px solid white;
    outline-offset: 2px;
  }
  nav {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
    font-size: 14px;
  }
  nav button {
    min-width: 44px;
    min-height: 44px;
    border: 1px solid #c5a86c;
    border-radius: 0.4rem;
    background: #173f43;
    color: #fffaf0;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
