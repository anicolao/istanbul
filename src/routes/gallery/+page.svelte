<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import '@fontsource/cormorant-garamond/700.css';
  import { base } from '$app/paths';
  import BonusCard from '$lib/components/BonusCard.svelte';
  import GameArt from '$lib/components/GameArt.svelte';
  import LocationTile from '$lib/components/LocationTile.svelte';
  import MarketDemand from '$lib/components/MarketDemand.svelte';
  import PlayerTray from '$lib/components/PlayerTray.svelte';
  import { bonusCards } from '$lib/game/manifests';
  import { createGalleryGame } from '$lib/game/gallery-fixture';
  import { galleryCategories, rawGalleryItems, type GalleryCategoryId, type GalleryItem } from '$lib/game/gallery';

  const pageSize = 6;
  let categoryId = $state<GalleryCategoryId>('places');
  let page = $state(0);
  let selected = $state<GalleryItem | null>(null);
  const galleryGame = createGalleryGame();
  const bonusByEffect = new Map(bonusCards.map((card) => [card.effect, card]));
  const category = $derived(galleryCategories.find(({ id }) => id === categoryId)!);
  const pageCount = $derived(Math.ceil(category.items.length / pageSize));
  const visibleItems = $derived(category.items.slice(page * pageSize, (page + 1) * pageSize));
  const firstVisible = $derived(page * pageSize + 1);
  const lastVisible = $derived(Math.min((page + 1) * pageSize, category.items.length));

  function selectCategory(id: GalleryCategoryId) {
    categoryId = id;
    page = 0;
  }

  function previousPage() {
    if (page > 0) page -= 1;
  }

  function nextPage() {
    if (page + 1 < pageCount) page += 1;
  }

  function rendererName(item: GalleryItem) {
    if (item.kind === 'location') return 'LocationTile';
    if (item.kind === 'mat') return 'PlayerTray';
    if (item.kind === 'card') return 'BonusCard';
    if (item.kind === 'demand') return 'MarketDemand';
    return 'GameArt';
  }

  function rendererProps(item: GalleryItem) {
    if (item.kind === 'location') return `placeId=${item.place} · projection=production-component-gallery`;
    if (item.kind === 'mat') return `color=${item.color} · state=representative-play`;
    if (item.kind === 'card') return `effect=${item.effect} · rules-text=visible`;
    if (item.kind === 'demand') return `market=${item.market} · goods=${item.goods.join(',')}`;
    if (item.kind === 'piece') return `piece=${item.piece}${item.color ? ` · color=${item.color}` : ''}`;
    if (item.kind === 'component') return `component=${item.component}`;
    return `kind=${item.kind}`;
  }
</script>

<svelte:head><title>Production component gallery · Istanbul</title><meta name="description" content="Review the logical components rendered by the Istanbul game." /></svelte:head>
<svelte:window onkeydown={(event) => { if (selected && event.key === 'Escape') selected = null; }} />

{#snippet artwork(item: GalleryItem, large = false)}
  {#if item.kind === 'location'}
    <div class:large class="location-component"><LocationTile game={galleryGame} placeId={item.place} index={item.place - 1} tabIndex={-1} onclick={() => selected = item} /></div>
  {:else if item.kind === 'mat'}
    {@const player = galleryGame.players.find(({ color }) => color === item.color)!}
    <div class:large class="tray-component"><PlayerTray {player} seat={galleryGame.players.indexOf(player) + 1} starting={player.uid === galleryGame.players[galleryGame.startingSeat].uid} local={false} selectedBonus={null} onInspectBonus={() => {}} /></div>
  {:else if item.kind === 'piece'}<GameArt kind="piece" piece={item.piece} color={item.color} class={large ? 'gallery-art gallery-art-large' : 'gallery-art'} label={item.title} />
  {:else if item.kind === 'card'}<div class:large class="bonus-component"><BonusCard card={bonusByEffect.get(item.effect)!} compact /></div>
  {:else if item.kind === 'card-back'}<GameArt kind="card-back" class={large ? 'gallery-art gallery-art-large' : 'gallery-art'} label={item.title} />
  {:else if item.kind === 'card-deck'}<GameArt kind="card-deck" class={large ? 'gallery-art gallery-art-large' : 'gallery-art'} label={item.title} />
  {:else if item.kind === 'component'}<GameArt kind="component" component={item.component} class={large ? 'gallery-art gallery-art-large' : 'gallery-art'} label={item.title} />
  {:else}
    <MarketDemand market={item.market} goods={item.goods} label={`${item.title}: ${item.detail}`} review />
  {/if}
{/snippet}

<main data-e2e-layout data-gallery-raw-count={rawGalleryItems.length} data-gallery-composite-count={galleryCategories.find(({ id }) => id === 'demands')?.items.length} data-gallery-rendered-count={galleryCategories.flatMap(({ items }) => items).length}>
  <header class="gallery-header" data-e2e-fit data-e2e-no-scroll>
    <a class="brand" href={`${base}/`} aria-label="Back to Istanbul"><span aria-hidden="true"></span>Istanbul</a>
    <div><p>Production review room</p><h1>Component gallery</h1><small>83 rendered states · shared with live play</small></div>
    <p class="manifest-status" role="status" data-status="synced"><i></i>Components live</p>
  </header>

  <nav class="category-nav" aria-label="Asset categories" data-e2e-fit data-e2e-no-scroll>
    {#each galleryCategories as option}
      <button class:active={option.id === categoryId} aria-pressed={option.id === categoryId} onclick={() => selectCategory(option.id)}><strong>{option.label}</strong><span>{option.items.length}</span></button>
    {/each}
  </nav>

  <section class="gallery-panel" aria-labelledby="category-title" data-e2e-fit data-e2e-no-scroll>
    <header><div><p>{category.description}</p><h2 id="category-title">{category.label}</h2></div><strong>{firstVisible}–{lastVisible} <span>of {category.items.length}</span></strong></header>
    <div class="asset-grid" data-e2e-fit data-e2e-no-scroll>
      {#each visibleItems as item}
        <article class="asset-card" data-asset-id={item.id} data-renderer={rendererName(item)}>
          <span class="asset-preview">{@render artwork(item)}</span>
          <span class="asset-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
          <button class="inspect-component" aria-label={`Inspect ${item.title}`} onclick={() => selected = item}>Review</button>
          <code>{rendererName(item)}</code>
        </article>
      {/each}
    </div>
  </section>

  <footer class="gallery-pagination" data-e2e-fit data-e2e-no-scroll>
    <button aria-label="Previous asset page" disabled={page === 0} onclick={previousPage}>← Previous</button>
    <span aria-live="polite"><strong>{category.label}</strong> · page {page + 1} of {pageCount}</span>
    <button aria-label="Next asset page" disabled={page + 1 >= pageCount} onclick={nextPage}>Next →</button>
  </footer>

  {#if selected}
    <div class="review-backdrop" role="presentation" onclick={() => selected = null}>
      <div class="review-dialog" role="dialog" aria-modal="true" aria-labelledby="review-title" tabindex="-1" data-e2e-fit data-e2e-no-scroll onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
        <header><div><p>Review reference · {selected.id}</p><h2 id="review-title">{selected.title}</h2></div><button aria-label="Close asset review" onclick={() => selected = null}>×</button></header>
        <div class="review-art">{@render artwork(selected, true)}</div>
        <footer><p>{selected.detail}</p><code>{rendererName(selected)} · {rendererProps(selected)}</code></footer>
      </div>
    </div>
  {/if}
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html, body) { min-width: 320px; height: 100%; margin: 0; overflow: hidden; color: #173f43; background: #0c2f32; font-family: 'Atkinson Hyperlegible', sans-serif; }
  :global(button) { font: inherit; cursor: pointer; }
  main { height: 100svh; display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; gap: clamp(.45rem, 1.2vh, .8rem); overflow: hidden; padding: clamp(.55rem, 1.4vw, 1.15rem); background: radial-gradient(circle at 15% 0%, #245e5c, transparent 32rem), linear-gradient(135deg, #12383b, #082427); }
  .gallery-header { min-width: 0; display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; overflow: hidden; padding: .55rem .8rem; border: 1px solid #efca7d66; border-radius: .9rem; color: #fffaf0; background: #092a2dd9; }
  .brand { display: flex; align-items: center; gap: .55rem; color: #fffaf0; font: 700 1.25rem 'Cormorant Garamond', serif; text-decoration: none; }.brand > span { width: .85rem; height: .85rem; rotate: 45deg; border: 2px solid #f3aa8c; border-radius: .15rem; background: #aa303f; box-shadow: inset 0 0 0 2px #c84a51; }
  .gallery-header > div { min-width: 0; }.gallery-header p, .gallery-header h1, .gallery-header small { margin: 0; }.gallery-header > div p { color: #efca7d; font-size: .56rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }.gallery-header h1 { font: 700 clamp(1.65rem, 3vw, 2.45rem)/.9 'Cormorant Garamond', serif; }.gallery-header small { color: #b9cfca; font-size: .62rem; }
  .manifest-status { display: flex; gap: .4rem; align-items: center; color: #cde5d6; font-size: .62rem; font-weight: 700; white-space: nowrap; }.manifest-status i { width: .55rem; height: .55rem; border: 2px solid #bde0ca; border-radius: 50%; background: #4ca46d; }
  .category-nav { min-width: 0; display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: .4rem; overflow: hidden; }.category-nav button { min-width: 0; min-height: 2.4rem; display: flex; align-items: center; justify-content: space-between; gap: .3rem; padding: .35rem .55rem; border: 1px solid #efca7d55; border-radius: .55rem; color: #c5d8d3; background: #ffffff0a; }.category-nav button.active { color: #173f43; background: #efca7d; }.category-nav strong { overflow: hidden; font-size: .61rem; text-overflow: ellipsis; white-space: nowrap; }.category-nav span { min-width: 1.25rem; padding: .08rem .25rem; border-radius: 1rem; color: inherit; background: #ffffff1a; font-size: .5rem; text-align: center; }
  .gallery-panel { min-height: 0; display: grid; grid-template-rows: auto minmax(0, 1fr); gap: .45rem; overflow: hidden; padding: .6rem; border: 1px solid #efca7d55; border-radius: 1rem; background: #fffaf0; box-shadow: 0 1rem 3rem #0004; }.gallery-panel > header { min-width: 0; display: flex; align-items: end; justify-content: space-between; gap: 1rem; }.gallery-panel > header p, .gallery-panel h2 { margin: 0; }.gallery-panel > header p { color: #637976; font-size: .58rem; }.gallery-panel h2 { font: 700 clamp(1.35rem, 2.3vw, 2rem)/1 'Cormorant Garamond', serif; }.gallery-panel > header > strong { color: #a43b32; font-size: .72rem; white-space: nowrap; }.gallery-panel > header > strong span { color: #738481; }
  .asset-grid { min-height: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: .55rem; overflow: hidden; }.asset-card { position: relative; min-width: 0; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-rows: minmax(0, 1fr) auto; gap: .25rem .5rem; overflow: hidden; padding: .38rem; border: 1px solid #d1b574; border-radius: .65rem; color: #173f43; text-align: left; background: #efe0bd; }.asset-card:has(.inspect-component:hover), .asset-card:has(.inspect-component:focus-visible) { border-color: #a43b32; outline: 2px solid #a43b32; outline-offset: -2px; }.asset-preview { grid-column: 1 / -1; min-height: 0; display: grid; place-items: center; overflow: hidden; border-radius: .42rem; background: radial-gradient(circle, #fff9e8, #cdb485); }.asset-copy { min-width: 0; display: grid; }.asset-copy strong, .asset-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.asset-copy strong { font-size: .67rem; }.asset-copy small { color: #5f706d; font-size: .5rem; }.asset-card code { align-self: end; color: #995145; font-size: .47rem; white-space: nowrap; }.inspect-component { position: absolute; z-index: 8; top: .65rem; right: .65rem; min-height: 1.6rem; padding: .2rem .5rem; border: 1px solid #efca7d; border-radius: 1rem; color: #fffaf0; background: #173f43e8; font-size: .5rem; font-weight: 700; }
  :global(.gallery-art) { width: 94%; height: 94%; background-size: contain !important; }.asset-preview > :global(.card) { width: min(45%, 6.8rem); height: 96%; }.asset-preview > :global(.mat) { width: 96%; height: 96%; }.asset-preview > :global(.piece) { width: 72%; height: 92%; }.asset-preview > :global(.component) { width: 70%; height: 86%; }
  .location-component { width: 94%; max-height: 96%; aspect-ratio: 1.42; }.location-component.large { width: min(94%, 42rem); }
  .tray-component { width: 96%; display: grid; align-content: center; overflow: hidden; }.tray-component.large { width: min(98%, 50rem); }
  .bonus-component { width: min(46%, 7rem); max-height: 96%; }.bonus-component.large { width: min(44%, 17rem); }
  .gallery-pagination { min-width: 0; display: grid; grid-template-columns: 7rem 1fr 7rem; gap: .55rem; align-items: center; overflow: hidden; }.gallery-pagination button { min-height: 2.35rem; padding: .3rem .6rem; border: 1px solid #efca7d; border-radius: .5rem; color: #173f43; background: #efca7d; font-size: .63rem; font-weight: 700; }.gallery-pagination button:disabled { border-color: #ffffff2c; color: #829793; background: #ffffff0b; cursor: not-allowed; }.gallery-pagination span { overflow: hidden; color: #c7d8d4; font-size: .61rem; text-align: center; text-overflow: ellipsis; white-space: nowrap; }
  .review-backdrop { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: clamp(.5rem, 2vw, 1.5rem); background: #031719e8; backdrop-filter: blur(6px); }.review-dialog { width: min(54rem, 100%); height: min(46rem, 100%); display: grid; grid-template-rows: auto minmax(0, 1fr) auto; gap: .55rem; overflow: hidden; padding: clamp(.7rem, 2vw, 1.2rem); border: 1px solid #efca7d; border-radius: 1rem; color: #173f43; background: #fffaf0; box-shadow: 0 2rem 6rem #000a; }.review-dialog > header { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }.review-dialog header p, .review-dialog h2, .review-dialog footer p { margin: 0; }.review-dialog header p { color: #a43b32; font-size: .58rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }.review-dialog h2 { font: 700 clamp(1.65rem, 4vw, 2.6rem)/1 'Cormorant Garamond', serif; }.review-dialog header button { width: 2.3rem; height: 2.3rem; border: 1px solid #b99a6b; border-radius: 50%; color: #173f43; background: #fff; font-size: 1.4rem; }.review-art { min-height: 0; display: grid; place-items: center; overflow: hidden; border: 1px solid #d9c28e; border-radius: .75rem; background: radial-gradient(circle, #fff, #dfc797); }.review-art :global(.gallery-art-large) { width: 94%; height: 94%; background-size: contain !important; }.review-art > :global(.card) { width: min(48%, 17rem); }.review-art > :global(.piece), .review-art > :global(.component) { width: min(65%, 25rem); }.review-dialog footer { min-width: 0; display: grid; grid-template-columns: 1fr auto; gap: .7rem; align-items: center; }.review-dialog footer p { color: #4f6663; font-size: .68rem; }.review-dialog footer code { max-width: 26rem; overflow: hidden; padding: .3rem .45rem; border-radius: .3rem; color: #8d4138; background: #eadbbd; font-size: .54rem; text-overflow: ellipsis; white-space: nowrap; }
  @media (max-width: 600px) {
    main { gap: .4rem; padding: .45rem; }.gallery-header { grid-template-columns: auto 1fr; gap: .55rem; padding: .4rem .55rem; }.brand { font-size: 1rem; }.gallery-header h1 { font-size: 1.55rem; }.gallery-header small { font-size: .5rem; }.manifest-status { grid-column: 1 / -1; position: absolute; top: .65rem; right: .8rem; font-size: .5rem; }.category-nav { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .25rem; }.category-nav button { min-height: 1.85rem; padding: .2rem .35rem; }.category-nav strong { font-size: .52rem; }.gallery-panel { gap: .25rem; padding: .4rem; }.gallery-panel > header p { display: none; }.gallery-panel h2 { font-size: 1.2rem; }.asset-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(3, minmax(0, 1fr)); gap: .3rem; }.asset-card { gap: .12rem .2rem; padding: .25rem; border-radius: .45rem; }.asset-copy strong { font-size: .56rem; }.asset-copy small { font-size: .43rem; }.asset-card code { max-width: 4.6rem; overflow: hidden; font-size: .4rem; text-overflow: ellipsis; }.inspect-component { top: .4rem; right: .4rem; min-height: 1.2rem; padding: .12rem .3rem; font-size: .4rem; }.asset-preview > :global(.card) { width: min(54%, 4rem); }.asset-preview > :global(.piece) { width: 78%; }.location-component { width: 98%; }.bonus-component { width: min(48%, 4rem); }.gallery-pagination { grid-template-columns: 5.6rem 1fr 5.6rem; gap: .25rem; }.gallery-pagination button { min-height: 2rem; font-size: .52rem; }.gallery-pagination span { font-size: .5rem; }.review-dialog { height: min(42rem, 100%); padding: .6rem; }.review-dialog footer { grid-template-columns: 1fr; gap: .25rem; }.review-dialog footer p { font-size: .58rem; }.review-dialog footer code { max-width: 100%; }.review-art > :global(.card) { width: min(70%, 13rem); }.review-art > :global(.piece), .review-art > :global(.component) { width: 78%; }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition: none !important; animation: none !important; } }
</style>
