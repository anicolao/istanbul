<script lang="ts">
  import type { BonusCardManifest } from '$lib/game/manifests';
  import GameArt from './GameArt.svelte';

  let {
    card,
    compact = false,
    testId,
    class: className = ''
  }: {
    card: BonusCardManifest;
    compact?: boolean;
    testId?: string;
    class?: string;
  } = $props();
</script>

<article
  class:compact
  class={`bonus-card ${className}`}
  aria-label={`Bonus card: ${card.title}. ${card.text}`}
  data-card-effect={card.effect}
  data-component="BonusCard"
  data-testid={testId}
>
  <GameArt kind="card" effect={card.effect} class="card-face" />
  <span>Bonus</span>
  <strong>{card.title}</strong>
  <p>{card.text}</p>
</article>

<style>
  .bonus-card { position: relative; width: 100%; min-height: 13rem; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; padding: 1rem; border: 2px solid #d49d42; border-radius: .8rem; color: #fffaf0; text-align: left; background: #173f43; box-shadow: 0 .8rem 1.4rem #4b2c2240; }
  .bonus-card::after { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 20%, rgb(5 25 27 / 22%) 42%, rgb(5 25 27 / 96%) 100%); content: ''; }
  .bonus-card :global(.card-face) { position: absolute; inset: 0; width: 100%; height: 100%; }
  .bonus-card > span, .bonus-card strong, .bonus-card p { position: relative; z-index: 1; text-shadow: 0 1px 3px #000; }
  .bonus-card > span { font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; }
  .bonus-card strong { margin-top: auto; font: 700 1.5rem/1 'Cormorant Garamond', serif; }
  .bonus-card p { margin: .35rem 0 0; font-size: .78rem; }
  .bonus-card.compact { min-height: 0; aspect-ratio: 1 / 1.5; padding: clamp(.35rem, 1.2vw, .75rem); border-radius: .55rem; }
  .bonus-card.compact strong { font-size: clamp(.72rem, 1.8vw, 1.15rem); }
  .bonus-card.compact p { max-height: 2.8em; overflow: hidden; font-size: clamp(.45rem, 1vw, .67rem); line-height: 1.2; }
  .bonus-card.compact > span { font-size: clamp(.4rem, .8vw, .55rem); }
</style>
