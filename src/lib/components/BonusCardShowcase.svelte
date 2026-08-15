<script lang="ts">
  import { onMount } from 'svelte';
  import type { BonusCardManifest } from '$lib/game/manifests';
  import BonusCard from './BonusCard.svelte';

  let {
    card,
    reverse,
    label,
    large = false
  }: {
    card?: BonusCardManifest;
    reverse?: 'card-back' | 'card-deck';
    label?: string;
    large?: boolean;
  } = $props();
  let showcase: HTMLElement;
  const displayLabel = $derived(card?.title ?? label ?? 'Bonus card');

  onMount(() => {
    const samples = [...showcase.querySelectorAll<HTMLElement>('[data-bonus-size]')];
    const update = () => {
      for (const sample of samples) {
        const face = sample.querySelector<HTMLElement>('[data-card-face]');
        if (!face) continue;
        const faceBounds = face.getBoundingClientRect();
        sample.dataset.renderedSize = `${Math.round(faceBounds.width)}×${Math.round(faceBounds.height)}`;
        const textFits = [...face.querySelectorAll<HTMLElement>('[data-bonus-text]')].every((element) => {
          const bounds = element.getBoundingClientRect();
          return element.scrollWidth <= element.clientWidth + 2
            && element.scrollHeight <= element.clientHeight + 2
            && bounds.left >= faceBounds.left - 1
            && bounds.right <= faceBounds.right + 1
            && bounds.top >= faceBounds.top - 1
            && bounds.bottom <= faceBounds.bottom + 1;
        });
        sample.dataset.textFit = textFits ? 'true' : 'false';
        sample.dataset.aspectFit = Math.abs(faceBounds.height / faceBounds.width - 2) < .02 ? 'true' : 'false';
      }
    };
    const observer = new ResizeObserver(update);
    for (const sample of samples) observer.observe(sample);
    void document.fonts.ready.then(update);
    requestAnimationFrame(update);
    return () => observer.disconnect();
  });
</script>

{#snippet face(size: 'hand' | 'phone' | 'desktop')}
  <span class="card-face-shell" data-card-face>
    {#if card}
      <BonusCard {card} compact={size !== 'desktop'} class={`${size}-card`} />
    {:else if reverse}
      <BonusCard {reverse} label={displayLabel} class="reverse-card" />
    {/if}
  </span>
{/snippet}

<section bind:this={showcase} class:large class="bonus-showcase" data-component="BonusCardShowcase" aria-label={`${displayLabel} at every production size`}>
  <figure class="hand-sample" data-bonus-size="hand">
    <figcaption><strong>Hand</strong><span>complete face</span></figcaption>
    {@render face('hand')}
  </figure>
  <figure class="phone-sample" data-bonus-size="phone">
    <figcaption><strong>Phone</strong><span>complete face</span></figcaption>
    {@render face('phone')}
  </figure>
  <figure class="desktop-sample" data-bonus-size="desktop">
    <figcaption><strong>Desktop</strong><span>complete face</span></figcaption>
    {@render face('desktop')}
  </figure>
</section>

<style>
  .bonus-showcase { width: 96%; min-width: 0; display: grid; grid-template-columns: 4rem 5.5rem 8.25rem; gap: .75rem; align-items: end; justify-content: center; }
  figure { position: relative; min-width: 0; display: grid; gap: .25rem; margin: 0; }
  figcaption { display: grid; gap: .08rem; color: #173f43; font-size: .43rem; line-height: 1; text-align: center; }
  figcaption strong { text-transform: uppercase; }
  figcaption span { color: #657673; }
  [data-bonus-size]::after { position: absolute; z-index: 3; right: .18rem; bottom: .18rem; padding: .12rem .22rem; border-radius: 1rem; color: #e9f7ec; background: #267356e8; content: attr(data-rendered-size) ' · complete'; font-size: .36rem; font-style: normal; font-weight: 700; line-height: 1; }
  [data-bonus-size]:global([data-text-fit='false'])::after,
  [data-bonus-size]:global([data-aspect-fit='false'])::after { color: #fff; background: #a23b36; content: attr(data-rendered-size) ' · clips'; }
  .card-face-shell { position: relative; width: 100%; max-width: 100%; min-width: 0; aspect-ratio: 1 / 2; display: block; overflow: hidden; line-height: 0; }
  .card-face-shell > :global(.bonus-card), .card-face-shell > :global(.reverse-card) { width: 100%; height: 100%; aspect-ratio: 1 / 2; }
  .card-face-shell > :global(.reverse-card) { position: absolute; inset: 0; display: block; background-size: cover; }
  .bonus-showcase.large { grid-template-columns: 4.5rem 7rem 13rem; gap: 1.25rem; }
  @media (max-width: 600px) {
    .bonus-showcase { width: 175%; transform: scale(.54); }
    figcaption { font-size: .38rem; }
  }
</style>
