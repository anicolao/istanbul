<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { base } from '$app/paths';
  import { componentArt } from '$lib/game/art';
  import { flyComponent } from './component-flight';
  export interface WainwrightPurchase {
    uid: string;
    capacityBefore: number;
    capacityAfter: number;
    rubiesBefore: number;
    rubiesAfter: number;
  }
  let {
    purchase,
    ready,
    surface,
    onWheelbarrow,
    onRuby,
    onComplete
  }: {
    purchase: WainwrightPurchase | null;
    ready: boolean;
    surface: HTMLElement | undefined;
    onWheelbarrow: () => void;
    onRuby: () => void;
    onComplete: () => void;
  } = $props();
  let wheelbarrow = $state<HTMLImageElement>(undefined!),
    ruby = $state<HTMLImageElement>(undefined!);
  $effect(() => {
    const request = purchase,
      root = surface,
      canStart = ready;
    if (!request || !root || !canStart) return;
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
        const origin = root!.querySelector<HTMLElement>(
          '.zoom-tile [data-wheelbarrow-source]'
        );
        const cargo = mat?.querySelector<HTMLElement>('[data-wheelbarrow]');
        if (!origin || !cargo) {
          onComplete();
          return;
        }
        const wheel = flyComponent(wheelbarrow, origin, cargo, root!, {
          duration: 1000,
          emerge: true,
          fade: true
        });
        animations.push(wheel);
        const arrivals = [
          wheel.finished.then(() => {
            if (!cancelled) onWheelbarrow();
          })
        ];
        if (request!.rubiesAfter > request!.rubiesBefore) {
          const source = root!.querySelector<HTMLElement>(
            '.zoom-tile [data-location-reward="ruby"]'
          );
          const target = mat?.querySelector<HTMLElement>(
            `[data-ruby-slot="${request!.rubiesBefore}"]`
          );
          if (source && target) {
            const gem = flyComponent(ruby, source, target, root!, {
              duration: 1000,
              delay: 500
            });
            animations.push(gem);
            arrivals.push(
              gem.finished.then(() => {
                if (!cancelled) onRuby();
              })
            );
          }
        }
        await Promise.all(arrivals);
        if (!cancelled) onComplete();
      } catch {
        if (!cancelled) onComplete();
      }
    }
    return () => {
      cancelled = true;
      for (const animation of animations) animation.cancel();
    };
  });
</script>

{#if purchase}
  <img
    bind:this={wheelbarrow}
    class="component-flight wheelbarrow-flight"
    src={`${base}/${componentArt.wheelbarrow}`}
    alt=""
    aria-hidden="true"
  />
  {#if purchase.rubiesAfter > purchase.rubiesBefore}<img
      bind:this={ruby}
      class="component-flight ruby-flight"
      src={`${base}/${componentArt.ruby}`}
      alt=""
      aria-hidden="true"
    />{/if}
{/if}

<style>
  .component-flight {
    position: absolute;
    width: 0;
    height: 0;
    left: 0;
    top: 0;
    z-index: 100;
    pointer-events: none;
    object-fit: contain;
    opacity: 0;
    filter: drop-shadow(0 3px 4px #0009);
    will-change: transform;
  }
</style>
