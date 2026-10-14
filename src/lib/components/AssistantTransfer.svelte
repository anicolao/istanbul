<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { base } from '$app/paths';
  import { pieceArt, type PlayerColorName } from '$lib/game/art';
  import { flyComponent } from './component-flight';
  export interface AssistantRecall {
    uid: string;
    color: PlayerColorName;
    places: number[];
    carried: number;
    stationed: Record<number, number>;
  }
  let {
    recall,
    surface,
    onArrival,
    onComplete
  }: {
    recall: AssistantRecall | null;
    surface: HTMLElement | undefined;
    onArrival: (count: number) => void;
    onComplete: () => void;
  } = $props();
  const tokens = new Map<number, HTMLImageElement>();
  function register(node: HTMLImageElement, index: number) {
    tokens.set(index, node);
    return {
      destroy: () => {
        tokens.delete(index);
      }
    };
  }
  $effect(() => {
    const request = recall,
      root = surface;
    if (!request || !root) return;
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
        const target = Array.from(
          root!.querySelectorAll<HTMLElement>(
            '.board [data-piece-kind="merchant"]'
          )
        ).find((el) => el.dataset.ownerUid === request!.uid);
        if (!target) {
          onComplete();
          return;
        }
        const sources = request!.places.map(
          (place, index) =>
            Array.from(
              root!.querySelectorAll<HTMLElement>(
                `.board [data-place-id="${place}"] [data-piece-kind="assistant"]`
              )
            ).filter((el) => el.dataset.ownerUid === request!.uid)[
              request!.places.slice(0, index).filter((p) => p === place).length
            ]
        );
        await Promise.all(
          sources.map(async (source, index) => {
            if (!source) return;
            const animation = flyComponent(
              tokens.get(index)!,
              source,
              target,
              root!,
              { duration: 1000, delay: index * 200 }
            );
            const hide = source.animate([{ opacity: 0 }, { opacity: 0 }], {
              duration: 1000,
              delay: index * 200,
              fill: 'forwards'
            });
            animations.push(animation, hide);
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

{#if recall}{#each recall.places as place, index}<img
      class="flying-assistant"
      use:register={index}
      src={`${base}/${pieceArt.assistant[recall.color]}`}
      alt=""
      aria-hidden="true"
    />{/each}{/if}

<style>
  .flying-assistant {
    position: absolute;
    width: 0;
    height: 0;
    z-index: 100;
    top: 0;
    left: 0;
    opacity: 0;
    object-fit: contain;
    pointer-events: none;
    filter: drop-shadow(0 2px 3px #0009);
  }
</style>
