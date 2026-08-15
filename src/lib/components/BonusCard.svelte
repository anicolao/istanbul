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

  const asset = $derived(card ? bonusCardArt[card.effect] : bonusCardArt[reverse === 'card-deck' ? 'deck' : 'back']);
</script>

<article
  class:compact
  class:mini
  class:reverse={Boolean(reverse)}
  class={`bonus-card ${className}`}
  aria-label={card ? `Bonus card: ${card.title}. ${card.text}` : label ?? (reverse === 'card-deck' ? 'Bonus card deck' : 'Bonus card back')}
  data-card-effect={card?.effect}
  data-card-side={reverse ?? 'face'}
  data-component="BonusCard"
  data-testid={testId}
>
  {#if card}
    <span class={`card-face ${artClass}`} style={`--card-art: url('${artPath(base, asset)}')`} data-art-kind="card" aria-hidden="true"></span>
    <strong data-bonus-text="title">{card.title}</strong>
    <p data-bonus-text="rules">{card.text}</p>
  {:else if reverse}
    <span class={`card-face ${artClass}`} style={`--card-art: url('${artPath(base, asset)}')`} data-art-kind="card" aria-hidden="true"></span>
  {/if}
</article>

<style>
  .bonus-card { container-type: inline-size; position: relative; box-sizing: border-box; width: 100%; max-width: 100%; height: auto !important; min-width: 0; min-height: 0; aspect-ratio: 1 / 2 !important; display: flex; flex-direction: column; justify-content: end; overflow: hidden; padding: clamp(.18rem, 4.5cqi, .7rem); border: clamp(1px, 1.2cqi, 2px) solid #d49d42; border-radius: clamp(.35rem, 6cqi, .8rem); color: #fffaf0; text-align: left; background: #173f43; box-shadow: 0 .8rem 1.4rem #4b2c2240; }
  .bonus-card::after { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 34%, rgb(5 25 27 / 20%) 50%, rgb(5 25 27 / 96%) 100%); content: ''; }
  .card-face { position: absolute; inset: 0; width: 100%; height: 100%; aspect-ratio: 1 / 2; background: var(--card-art) center / cover no-repeat; }
  .bonus-card strong, .bonus-card p { position: relative; z-index: 1; flex: none; text-shadow: 0 1px 3px #000; }
  .bonus-card strong { margin-top: auto; font: 700 clamp(.5rem, 13cqi, 1.65rem)/.94 'Cormorant Garamond', serif; }
  .bonus-card p { margin: clamp(.1rem, 2.6cqi, .35rem) 0 0; font-size: clamp(.31rem, 6.8cqi, .9rem); line-height: 1.1; }
  .bonus-card.compact { min-height: 0; aspect-ratio: 1 / 2; }
  .bonus-card.mini { padding: 4cqi 3cqi; border-radius: 5cqi; }
  .bonus-card.mini strong { font-size: 10cqi; line-height: .92; }
  .bonus-card.mini p { margin-top: 2cqi; font-size: 5.4cqi; line-height: 1.02; }
  .bonus-card.reverse { padding: 0; }
  .bonus-card.reverse::after { display: none; }
</style>
