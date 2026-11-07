<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { base } from '$app/paths';
  import { bonusCards } from '$lib/game/manifests';
  import BonusCard from './BonusCard.svelte';
  import Dice from './Dice.svelte';
  import { flyComponent } from './component-flight';
  import type { ActionMotion, Anchor, MotionStep } from './action-motion';
  let {
    plan,
    surface,
    ready,
    onArrival,
    onBoardComplete,
    onComplete
  }: {
    plan: ActionMotion | null;
    surface: HTMLElement | undefined;
    ready: boolean;
    onArrival: (id: number) => void;
    onBoardComplete: () => void;
    onComplete: () => void;
  } = $props();
  const tokens = new Map<number, HTMLElement>();
  let release: (() => void) | undefined;
  let roomReady = false;
  $effect(() => {
    roomReady = ready;
    if (ready) release?.();
  });
  function register(node: HTMLElement, id: number) {
    tokens.set(id, node);
    return {
      destroy: () => {
        tokens.delete(id);
      }
    };
  }
  function anchor(root: HTMLElement, a: Anchor) {
    let scope: HTMLElement | null = null;
    if (a.uid) {
      const summary = Array.from(root.querySelectorAll<HTMLElement>('[data-summary-uid]'))
        .find(el => el.dataset.summaryUid === a.uid);
      // The dock stays closed for components represented in its summary.
      // Resolve both ends here so spending and undo follow the same path.
      if (summary && !a.selector?.includes('data-power-slot')) {
        const good = a.selector?.match(/data-good="([^"]+)"/)?.[1];
        const key = good ?? (a.selector?.includes('data-lira') ? 'lira'
          : a.selector?.includes('data-ruby-slot') ? 'ruby'
          : a.selector?.includes('data-wheelbarrow') ? 'wheelbarrow' : 'name');
        const target = summary.querySelector<HTMLElement>(`[data-summary-anchor="${key}"]`);
        if (target) return target.querySelector<HTMLElement>('img') ?? target;
      }
      scope =
        Array.from(
          root.querySelectorAll<HTMLElement>('[data-player-uid]')
        ).find((el) => el.dataset.playerUid === a.uid) ?? null;
    } else if (a.place) {
      if (!a.board)
        scope = root.querySelector<HTMLElement>(
          `.zoom-tile[data-zoom-place="${a.place}"]`
        );
      scope ??= root.querySelector<HTMLElement>(`[data-place-id="${a.place}"]`);
    }
    scope ??= root;
    return (
      (a.selector
        ? scope.querySelectorAll<HTMLElement>(a.selector)[a.index ?? 0]
        : null) ??
      scope.querySelector<HTMLElement>('[data-component-source]') ??
      scope
    );
  }
  $effect(() => {
    const request = plan,
      root = surface;
    if (!request || !root) return;
    let cancelled = false;
    const animations: Animation[] = [];
    untrack(() => {
      void run();
    });
    function play(
      node: HTMLElement,
      frames: Keyframe[],
      options: KeyframeAnimationOptions
    ) {
      const animation = node.animate(frames, options);
      animations.push(animation);
      return animation;
    }
    async function step(s: MotionStep) {
      const token = tokens.get(s.id);
      if (cancelled) return;
      if (s.delay > 0 && token) {
        await play(token, [{ opacity: 0 }, { opacity: 0 }], {
          duration: s.delay
        }).finished;
        await tick();
      }
      if (cancelled) return;
      const from = anchor(root!, s.from),
        to = anchor(root!, s.to);
      const options = {
        duration: s.duration,
        delay: 0,
        easing: 'ease-in-out',
        fill: 'none' as const
      };
      if (s.effect === 'fade') {
        await play(from, [{ opacity: 1 }, { opacity: 0 }], {
          ...options,
          fill: 'forwards'
        }).finished;
      } else if (s.effect === 'block') {
        await play(
          from,
          [
            { top: s.block![0] ? '52%' : '0%' },
            { top: s.block![1] ? '52%' : '0%' }
          ],
          options
        ).finished;
      } else if (s.effect === 'pulse') {
        await play(
          from,
          [
            { filter: 'brightness(1)', transform: 'scale(1)' },
            {
              filter: 'brightness(1.5)',
              transform: 'scale(1.12)',
              offset: 0.5
            },
            { filter: 'brightness(1)', transform: 'scale(1)' }
          ],
          options
        ).finished;
      } else if (s.effect === 'dice' && token) {
        const box = from.getBoundingClientRect(),
          bounds = root!.getBoundingClientRect();
        const width = 240, height = 192;
        token.style.width = `${width}px`;
        token.style.height = `${height}px`;
        token.style.left = `${box.left + box.width / 2 - bounds.left - width / 2}px`;
        token.style.top = `${box.top + box.height / 2 - bounds.top - height / 2}px`;
        const room = from.closest<HTMLElement>('.zoom-tile');
        const facing = room ? parseFloat(getComputedStyle(room).getPropertyValue('--facing')) || 0 : 0;
        token.style.transform = `rotate(${facing}deg)`;
        const clock = token.querySelector<HTMLElement>('[data-dice-clock]')!;
        await Promise.all([
          play(clock, [{ opacity: 0 }, { opacity: 1 }], {
            ...options, easing: 'linear', fill: 'forwards'
          }).finished,
          play(token, [{ opacity: 1 }, { opacity: 1 }], {
            ...options, fill: 'forwards'
          }).finished
        ]);
      } else if (token) {
        if (s.hideSource)
          play(from, [{ opacity: 0 }, { opacity: 0 }], {
            duration: s.duration,
            delay: 0,
            fill: 'none'
          });
        const summaryWheelbarrow = Boolean(to.closest('[data-summary-anchor="wheelbarrow"]'));
        const flight = flyComponent(token, from, to, root!, {
          duration: s.duration,
          delay: 0,
          aspectRatio: s.card?.length ? 0.5 : s.badge !== undefined ? 0.75 : 1,
          minSize: s.badge !== undefined ? 36 : 24,
          fade: summaryWheelbarrow ? false : s.fade,
          direct: summaryWheelbarrow
        });
        animations.push(flight);
        await flight.finished;
      }
      if (!cancelled) onArrival(s.id);
    }
    async function run() {
      try {
        await tick();
        if (cancelled) return;
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
          onComplete();
          return;
        }
        await Promise.all(
          request!.steps.filter((s) => s.stage === 'board').map(step)
        );
        if (cancelled) return;
        onBoardComplete();
        await tick();
        if (!roomReady)
          await new Promise<void>((resolve) => {
            release = resolve;
          });
        if (cancelled) return;
        await tick();
        await Promise.all(
          request!.steps.filter((s) => s.stage === 'room').map(step)
        );
        if (!cancelled) onComplete();
      } catch (error) {
        if (!cancelled) {
          console.warn('Animation completed without motion', error);
          onComplete();
        }
      }
    }
    return () => {
      cancelled = true;
      release?.();
      release = undefined;
      animations.forEach((a) => a.cancel());
    };
  });
</script>

{#if plan}
  {#each plan.steps as step (step.id)}
    <div
      class="motion-token"
      class:pawn-motion={step.badge !== undefined}
      class:dice-motion={step.effect === 'dice'}
      use:register={step.id}
      aria-hidden="true"
    >
      {#if step.effect === 'dice'}<Dice values={step.dice!} oldValues={step.oldDice} rolling adjusting={step.adjustDie} />
      {:else if step.card}<BonusCard
          card={step.faceDown
            ? undefined
            : bonusCards.find((c) => c.id === step.card)}
          reverse={step.faceDown ? 'card-back' : undefined}
        />
      {:else if step.art}<img src={`${base}/${step.art}`} alt="" />{/if}
      {#if step.amount}<strong>{step.amount}</strong>{/if}
      {#if step.badge !== undefined}<strong>{step.badge}</strong>{/if}
    </div>
  {/each}
{/if}

<style>
  .motion-token {
    position: absolute;
    left: 0;
    top: 0;
    width: 0;
    height: 0;
    opacity: 0;
    z-index: 100;
    pointer-events: none;
    will-change: transform;
  }
  .motion-token > img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 2px 3px #0008);
  }
  .motion-token > strong {
    position: absolute;
    right: 0;
    bottom: 0;
    min-width: 1.3em;
    line-height: 1.3;
    text-align: center;
    border-radius: 50%;
    background: #173f43;
    color: #ffe5a1;
    font-size: clamp(12px, 1cqw, 20px);
    border: 1px solid #cda65f;
  }
  .pawn-motion > strong {
    font-size: 9px;
    right: -5%;
    bottom: 0;
  }
  .dice-motion { filter: drop-shadow(0 4px 4px #0005); }
</style>
