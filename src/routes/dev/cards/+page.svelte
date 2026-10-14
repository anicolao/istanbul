<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/cormorant-garamond/700.css';
  import { base } from '$app/paths';
  import { bonusCards } from '$lib/game/manifests';
  import { bonusCardArt } from '$lib/game/art';
  import BonusCard from '$lib/components/BonusCard.svelte';
  const cards = bonusCards.filter(
    (card, index, all) =>
      all.findIndex((other) => other.effect === card.effect) === index
  );
  let query = $state('');
  let artOnly = $state(false);
  const visible = $derived(
    cards.filter((card) =>
      `${card.title} ${card.text}`.toLowerCase().includes(query.toLowerCase())
    )
  );
</script>

<svelte:head><title>Istanbul · Card gallery</title></svelte:head>
<main>
  <header>
    <div>
      <h1>Card gallery</h1>
      <p>
        {cards.length} designs · {bonusCards.length} cards · Fronts and backs shown
        at 1:2
      </p>
    </div>
    <a href={`${base}/dev/animations/?scenario=arrival-6`}
      >Animation preview →</a
    >
  </header>
  <div class="controls">
    <input
      type="search"
      aria-label="Find a card"
      placeholder="Find a card…"
      bind:value={query}
    /><label
      ><input type="checkbox" bind:checked={artOnly} /> Artwork only</label
    >
  </div>
  <div class="gallery">
    <article>
      <div class="card"><BonusCard reverse="card-back" /></div>
      <h2>Card back</h2>
      <p>Same dimensions as every card front.</p>
    </article>
    {#each visible as card}<article>
        <div class="card">
          {#if artOnly}<img
              src={`${base}/${bonusCardArt[card.effect]}`}
              alt={`${card.title} artwork`}
            />{:else}<BonusCard {card} />{/if}
        </div>
        <h2>{card.title}</h2>
        <p>{card.text}</p>
        <small
          >{bonusCards.filter((other) => other.effect === card.effect).length} copies</small
        >
      </article>{/each}
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #102c28;
    color: #f5e7c6;
    font-family: 'Atkinson Hyperlegible', sans-serif;
  }
  main {
    max-width: 1500px;
    margin: auto;
    padding: 2rem;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
  }
  h1 {
    margin: 0;
    font:
      700 2.6rem 'Cormorant Garamond',
      serif;
  }
  a {
    color: #ecd295;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    align-items: center;
    margin: 1.5rem 0 2rem;
  }
  input[type='search'] {
    padding: 0.7rem;
    border: 1px solid #b79855;
    border-radius: 0.4rem;
    background: #f5e7c6;
    color: #102c28;
    font: inherit;
  }
  .gallery {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2.5rem 2rem;
  }
  article {
    min-width: 0;
  }
  .card {
    width: 100%;
    max-width: 256px;
    margin: auto;
  }
  .card img {
    display: block;
    width: 100%;
    aspect-ratio: 1 / 2;
    object-fit: cover;
    border-radius: 0.6rem;
  }
  h2 {
    font:
      700 1.6rem 'Cormorant Garamond',
      serif;
    margin: 0.9rem 0 0.4rem;
  }
  p {
    line-height: 1.45;
    margin: 0.4rem 0;
  }
  small {
    color: #cfba8e;
  }
</style>
