<script lang="ts">
  import { flyComponent } from './component-flight';
  import { tick, untrack } from 'svelte';
  import { base } from '$app/paths';
  import { componentArt } from '$lib/game/art';
  import type { Good } from '$lib/game/manifests';
  export interface Transfer {
    uid: string;
    good: Good;
    from: number;
    to: number;
    landed: number;
    key: string;
  }
  let {
    transfer,
    ready,
    surface,
    onCount,
    onComplete
  }: {
    transfer: Transfer | null;
    ready: boolean;
    surface: HTMLElement | undefined;
    onCount: (count: number) => void;
    onComplete: () => void;
  } = $props();
  const tokens = new Map<number, HTMLImageElement>();
  function registerToken(node: HTMLImageElement, count: number) {
    tokens.set(count, node);
    return {
      destroy: () => {
        tokens.delete(count);
      }
    };
  }
  $effect(() => {
    const request = transfer,
      canStart = ready,
      root = surface;
    if (!request || !canStart || !root) return;
    let cancelled = false;
    const animations: Animation[] = [];
    untrack(() => {
      void run();
    });
    async function run() {
      try {
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          onCount(request!.to);
          onComplete();
          return;
        }
        const first = request!.landed + 1;
        await tick();
        if (cancelled) return;
        const arrivals: Promise<void>[] = [];
        for (let count = first; count <= request!.to; count++) {
          const token = tokens.get(count)!;
          const source = root!.querySelector<HTMLElement>(
            `.zoom-tile [data-location-reward="${request!.good}"]`
          );
          const mat = Array.from(
            root!.querySelectorAll<HTMLElement>('[data-player-uid]')
          ).find((el) => el.dataset.playerUid === request!.uid);
          const target = mat?.querySelector<HTMLElement>(
            `[data-good="${request!.good}"] [data-goods-slot="${count - 1}"]`
          );
          if (!source || !target) {
            onCount(request!.to);
            onComplete();
            return;
          }
          const animation = flyComponent(token, source, target, root!, {
            duration: 1000,
            delay: (count - first) * 200
          });
          animations.push(animation);
          arrivals.push(
            animation.finished.then(() => {
              if (!cancelled) onCount(Math.max(request!.landed, count));
            })
          );
        }
        await Promise.all(arrivals);
        if (!cancelled) onComplete();
      } catch (error) {
        if (!cancelled) {
          onCount(request!.to);
          onComplete();
        }
      }
    }
    return () => {
      cancelled = true;
      for (const animation of animations) animation.cancel();
    };
  });
</script>

{#if transfer}
  {#each Array.from({ length: transfer.to - transfer.from }, (_, i) => transfer!.from + i + 1) as count (count)}
    <img
      use:registerToken={count}
      class="flying-good"
      src={`${base}/${componentArt[transfer.good]}`}
      alt=""
      aria-hidden="true"
    />
  {/each}
{/if}

<style>
  .flying-good {
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
