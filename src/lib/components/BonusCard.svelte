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
      <strong data-bonus-text="title">{card.title}</strong>
      <p data-bonus-text="rules">{card.text}</p>
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
    color: #fffaf0;
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
    padding: 9px;
    border: 2px solid #d49d42;
    border-radius: 12px;
    background: #173f43;
  }
  .printed-card::after {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 34%,
      rgb(5 25 27 / 20%) 50%,
      rgb(5 25 27 / 96%) 100%
    );
    content: '';
  }
  .card-face {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: var(--card-art) center / cover no-repeat;
  }
  strong,
  p {
    position: relative;
    z-index: 1;
    flex: none;
    text-shadow: 0 1px 3px #000;
  }
  strong {
    margin-top: auto;
    font:
      700 26px/0.94 'Cormorant Garamond',
      serif;
  }
  p {
    margin: 5.2px 0 0;
    font:
      13.6px/1.1 'Atkinson Hyperlegible',
      sans-serif;
  }
  .back {
    padding: 0;
  }
  .back .card-face {
    background-size: 104% 110%;
    background-position: center top;
  }
  .back::after {
    display: none;
  }
</style>
