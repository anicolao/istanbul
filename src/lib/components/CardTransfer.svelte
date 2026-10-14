<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { bonusCards } from '$lib/game/manifests';
  import type { CardSource } from '$lib/game/actions';
  import { flyComponent } from './component-flight';
  import BonusCard from './BonusCard.svelte';
  export interface CardDraw {
    uid: string;
    cards: { id: string; source: CardSource }[];
  }
  let {
    draw,
    ready,
    surface,
    onArrival,
    onComplete
  }: {
    draw: CardDraw | null;
    ready: boolean;
    surface: HTMLElement | undefined;
    onArrival: (count: number) => void;
    onComplete: () => void;
  } = $props();
  const tokens = new Map<number, HTMLElement>();
  function register(node: HTMLElement, index: number) {
    tokens.set(index, node);
    return {
      destroy: () => {
        tokens.delete(index);
      }
    };
  }
  $effect(() => {
    const request = draw,
      root = surface,
      start = ready;
    if (!request || !root || !start) return;
    let cancelled = false;
    const animations: Animation[] = [];
    untrack(() => {
      void run();
    });
    async function run() {
      try {
        await tick();
        if (cancelled) return;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          onComplete();
          return;
        }
        const mat = Array.from(
          root!.querySelectorAll<HTMLElement>('[data-player-uid]')
        ).find((el) => el.dataset.playerUid === request!.uid);
        const target = mat?.querySelector<HTMLElement>('[data-card-tray]');
        if (!target) {
          onComplete();
          return;
        }
        await Promise.all(
          request!.cards.map(async (card, index) => {
            const source = root!.querySelector<HTMLElement>(
              `.zoom-tile [data-card-pile="${card.source}"]`
            );
            if (!source) return;
            const animation = flyComponent(
              tokens.get(index)!,
              source,
              target,
              root!,
              { duration: 1000, delay: index * 200, aspectRatio: 0.5 }
            );
            animations.push(animation);
            await animation.finished;
            if (!cancelled) onArrival(index + 1);
          })
        );
        if (!cancelled) onComplete();
      } catch {
        if (!cancelled) onComplete();
      }
    }
    return () => {
      cancelled = true;
      animations.forEach((animation) => animation.cancel());
    };
  });
</script>

{#if draw}{#each draw.cards as card, index}
    <div class="flying-card" use:register={index} aria-hidden="true">
      <BonusCard
        card={card.source === 'discard'
          ? bonusCards.find((c) => c.id === card.id)
          : undefined}
        reverse={card.source === 'deck' ? 'card-back' : undefined}
        mini
      />
    </div>
  {/each}{/if}

<style>
  .flying-card {
    position: absolute;
    width: 0;
    height: 0;
    z-index: 100;
    left: 0;
    top: 0;
    opacity: 0;
    pointer-events: none;
    will-change: transform;
  }
</style>
