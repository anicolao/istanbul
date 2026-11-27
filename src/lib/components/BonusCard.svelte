<script lang="ts">
  import { base } from '$app/paths';
  import { artPath, bonusCardArt } from '$lib/game/art';
  import type { BonusCardManifest } from '$lib/game/manifests';

  let {
    card,
    reverse,
    label,
    compact = false,
    mini = false,
    artClass = '',
    testId,
    class: className = ''
  }: {
    card?: BonusCardManifest;
    reverse?: 'card-back' | 'card-deck';
    label?: string;
    compact?: boolean;
    mini?: boolean;
    artClass?: string;
    testId?: string;
    class?: string;
  } = $props();

  const asset = $derived(
    card
      ? bonusCardArt[card.effect]
      : bonusCardArt[reverse === 'card-deck' ? 'deck' : 'back']
  );
  function fitCopy(node: HTMLElement, _identity: string | undefined) {
    let disposed = false;
    function fit() {
      if (disposed || !node.isConnected || !node.clientHeight) return;
      // Measure the fixed 200 × 400 print layout, never its animated scale.
      let low = 12, high = 48;
      for (let step = 0; step < 10; step++) {
        const size = (low + high) / 2;
        node.style.setProperty('--copy-size', `${size}px`);
        if (node.scrollHeight <= node.clientHeight && node.scrollWidth <= node.clientWidth) low = size;
        else high = size;
      }
      node.style.setProperty('--copy-size', `${Math.floor(low * 4) / 4}px`);
    }
    function schedule() {
      queueMicrotask(fit);
      void document.fonts.ready.then(fit);
    }
    const observer = new ResizeObserver(fit);
    observer.observe(node);
    schedule();
    return { update(_identity: string | undefined) { schedule(); }, destroy() { disposed = true; observer.disconnect(); } };
  }
  function sizeCard(node: HTMLElement) {
    // Scale the fixed print layout in HTML. WebKit can paint positioned HTML
    // inside an SVG foreignObject at its unscaled size despite correct bounds.
    const setWidth = (width: number) => node.style.setProperty('--card-scale', String(width / 200));
    setWidth(parseFloat(getComputedStyle(node).width));
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
</script>

<article
  use:sizeCard
  class:compact
  class:mini
  class:reverse={Boolean(reverse)}
  class={`bonus-card ${className}`}
  aria-label={card
    ? `Bonus card: ${card.title}. ${card.text}`
    : (label ??
      (reverse === 'card-deck' ? 'Bonus card deck' : 'Bonus card back'))}
  data-card-effect={card?.effect}
  data-card-side={reverse ?? 'face'}
  data-component="BonusCard"
  data-testid={testId}
>
  <div
    aria-hidden="true"
    class="printed-card"
    class:back={Boolean(reverse)}
  >
    <span
      class={`card-face ${artClass}`}
      style={`--card-art: url('${artPath(base, asset)}')`}
      data-art-kind="card"
    ></span>
    {#if card}
      <div class="card-copy" use:fitCopy={card.id}>
        <strong data-bonus-text="title">{card.title}</strong>
        <p data-bonus-text="rules">{card.text}</p>
      </div>
    {/if}
  </div>
</article>

<style>
  /* One printed layout at every display size, including moving cards. */
  .bonus-card {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
    height: auto !important;
    min-width: 0;
    min-height: 0;
    aspect-ratio: 1 / 2 !important;
    display: block;
    padding: 0;
    overflow: hidden;
    border-radius: 6%;
    color: #2c2115;
    text-align: left;
    box-shadow: 0 0.8rem 1.4rem #4b2c2240;
  }
  .printed-card {
    position: absolute;
    top: 0;
    left: 0;
    transform: scale(var(--card-scale, 0));
    transform-origin: top left;
    box-sizing: border-box;
    width: 200px;
    height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: end;
    overflow: hidden;
    padding: 12px;
    border: 2px solid #d49d42;
    border-radius: 12px;
    background: #f6e8c9;
  }
  .printed-card::after {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 36%,
      #f6e8c9 41%,
      #f6e8c9 100%
    );
    content: '';
  }
  .card-face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: var(--card-art) center top / 100% auto no-repeat;
  }
  .card-copy {
    position: absolute;
    z-index: 1;
    top: 164px;
    bottom: 12px;
    left: 10px;
    right: 10px;
    color: #2c2115;
    font-size: var(--copy-size, 20px);
  }
  strong {
    display: block;
    font: 700 1.25em/1.02 'Cormorant Garamond', serif;
  }
  p {
    margin: 8px 0 0;
    font: 1em/1.12 'Atkinson Hyperlegible', sans-serif;
  }
  .back {
    /* Backs contain no text: paint directly at their displayed size instead of
       downscaling an already rasterized 200px print surface. */
    transform: none;
    width: 100%;
    height: 100%;
    border-width: calc(2px * var(--card-scale, 0));
    border-radius: 6% / 3%;
    padding: 0;
  }
  .back .card-face {
    background-size: cover;
    background-position: center top;
  }
  .back::after {
    display: none;
  }
</style>
