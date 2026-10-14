<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { base } from '$app/paths';
  import { bonusCards } from '$lib/game/manifests';
  import BonusCard from './BonusCard.svelte';
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
  const pipPositions = [
    [[50, 50]],
    [
      [25, 25],
      [75, 75]
    ],
    [
      [25, 25],
      [50, 50],
      [75, 75]
    ],
    [
      [25, 25],
      [75, 25],
      [25, 75],
      [75, 75]
    ],
    [
      [25, 25],
      [75, 25],
      [50, 50],
      [25, 75],
      [75, 75]
    ],
    [
      [25, 25],
      [75, 25],
      [25, 50],
      [75, 50],
      [25, 75],
      [75, 75]
    ]
  ];
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
    if (a.uid)
      scope =
        Array.from(
          root.querySelectorAll<HTMLElement>('[data-player-uid]')
        ).find((el) => el.dataset.playerUid === a.uid) ?? null;
    else if (a.place) {
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
        token.style.width = '136px';
        token.style.height = '60px';
        token.style.left = `${box.left + box.width / 2 - bounds.left - 68}px`;
        token.style.top = `${box.top + box.height / 2 - bounds.top - 30}px`;
        const dice = Array.from(
          token.querySelectorAll<HTMLElement>('.die-strip')
        );
        const spins = dice.map(
          (die, i) =>
            play(
              die,
              s.adjustDie
                ? [
                    {
                      transform: `translateY(-${((s.oldDice?.[i] ?? 1) - 1) * 60}px)`,
                      easing: 'steps(1,end)'
                    },
                    { transform: `translateY(-${(s.dice![i] - 1) * 60}px)` }
                  ]
                : Array.from({ length: 15 }, (_, frame) => ({
                    transform: `translateY(-${(frame === 14 ? s.dice![i] - 1 : Math.floor(Math.random() * 6)) * 60}px)`,
                    offset: frame / 14,
                    easing: 'steps(1,end)'
                  })),
              {
                ...options,
                easing: 'linear',
                fill: 'forwards'
              }
            ).finished
        );
        await Promise.all([
          play(
            token,
            [
              { opacity: 1, transform: 'rotate(-12deg) scale(.8)' },
              {
                opacity: 1,
                transform: 'rotate(10deg) scale(1.15)',
                offset: 0.45
              },
              { opacity: 1, transform: 'rotate(0deg) scale(1)' }
            ],
            { ...options, fill: 'forwards' }
          ).finished,
          ...spins
        ]);
      } else if (token) {
        if (s.hideSource)
          play(from, [{ opacity: 0 }, { opacity: 0 }], {
            duration: s.duration,
            delay: 0,
            fill: 'none'
          });
        const flight = flyComponent(token, from, to, root!, {
          duration: s.duration,
          delay: 0,
          aspectRatio: s.card?.length ? 0.5 : s.badge !== undefined ? 0.75 : 1,
          minSize: s.badge !== undefined ? 36 : 24,
          fade: s.fade
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
      {#if step.effect === 'dice'}{#each [0, 1] as i}<span class="die-window"
            ><span class="die-strip"
              >{#each pipPositions as pips}<b
                  >{#each pips as [x, y]}<i style={`left:${x}%;top:${y}%`}
                    ></i>{/each}</b
                >{/each}</span
            ></span
          >{/each}
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
  .dice-motion {
    display: flex;
    gap: 8px;
    color: #263d32;
  }
  .die-window {
    display: block;
    flex: none;
    width: 60px;
    height: 60px;
    overflow: hidden;
    background: #f3e3bc;
    border: 2px solid #b59154;
    border-radius: 9px;
    box-shadow: 0 4px 5px #0006;
  }
  .die-strip {
    display: block;
  }
  .die-strip i {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #263d32;
    transform: translate(-50%, -50%);
  }
  .die-strip b {
    position: relative;
    display: block;
    font: 54px/60px serif;
    width: 60px;
    height: 60px;
    text-align: center;
  }
</style>
