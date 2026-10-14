<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { base } from '$app/paths';
  import { componentArt } from '$lib/game/art';
  import { postOfficeRows } from '$lib/game/actions';
  import type { SetupPlayer } from '$lib/game/setup';
  import { flyComponent } from './component-flight';
  export interface MailCollection {
    uid: string;
    before: boolean[];
    after: boolean[];
    player: SetupPlayer;
  }
  let {
    collection,
    ready,
    surface,
    onArrival,
    onComplete
  }: {
    collection: MailCollection | null;
    ready: boolean;
    surface: HTMLElement | undefined;
    onArrival: (column: number) => void;
    onComplete: () => void;
  } = $props();
  const tokens = new Map<number, HTMLImageElement>();
  function register(node: HTMLImageElement, column: number) {
    tokens.set(column, node);
    return {
      destroy: () => {
        tokens.delete(column);
      }
    };
  }
  $effect(() => {
    const request = collection,
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
        const flights = postOfficeRows.map(async (rows, column) => {
          const reward = rows[request!.before[column] ? 1 : 0];
          const source = root!.querySelector<HTMLElement>(
            `.zoom-tile [data-mail-column="${column}"] [data-mail-reward="${request!.before[column] ? 1 : 0}"]`
          );
          const target = mat?.querySelector<HTMLElement>(
            reward.good
              ? `[data-good="${reward.good}"] [data-goods-slot="${request!.player.goods[reward.good]}"]`
              : '[data-lira]'
          );
          // A full goods track receives nothing, as in the rules.
          if (!source || !target) return;
          const animation = flyComponent(
            tokens.get(column)!,
            source,
            target,
            root!,
            { duration: 1000, delay: column * 200 }
          );
          animations.push(animation);
          await animation.finished;
          if (!cancelled) onArrival(column);
        });
        await Promise.all(flights);
        if (cancelled) return;
        const slides: Promise<Animation>[] = [];
        let order = 0;
        for (let column = 0; column < 4; column++) {
          if (request!.before[column] === request!.after[column]) continue;
          const block = root!.querySelector<HTMLElement>(
            `.zoom-tile [data-mail-column="${column}"] [data-mail-block]`
          );
          if (!block) continue;
          const animation = block.animate(
            [
              { top: request!.before[column] ? '52%' : '0%' },
              { top: request!.after[column] ? '52%' : '0%' }
            ],
            {
              duration: 500,
              delay: order++ * 200,
              easing: 'ease-in-out',
              fill: 'forwards'
            }
          );
          animations.push(animation);
          slides.push(animation.finished);
        }
        await Promise.all(slides);
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

{#if collection}
  {#each postOfficeRows as rows, column}
    <img
      use:register={column}
      class="flying-mail"
      src={`${base}/${componentArt[rows[collection.before[column] ? 1 : 0].good ?? 'lira']}`}
      alt=""
      aria-hidden="true"
    />
  {/each}
{/if}

<style>
  .flying-mail {
    position: absolute;
    width: 0;
    height: 0;
    z-index: 100;
    left: 0;
    top: 0;
    pointer-events: none;
    object-fit: contain;
    opacity: 0;
    filter: drop-shadow(0 3px 4px #0009);
    will-change: transform;
  }
</style>
