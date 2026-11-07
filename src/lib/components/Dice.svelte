<script lang="ts">
  import { onMount } from 'svelte';
  import { acquireDiceRenderer } from './dice-renderer';
  let { values, oldValues, rolling = false, adjusting = false }: {
    values: number[]; oldValues?: number[]; rolling?: boolean; adjusting?: boolean;
  } = $props();
  let canvas: HTMLCanvasElement;
  let clock = $state<HTMLSpanElement>();
  let draw: (() => void) | undefined;
  $effect(() => { values; oldValues; adjusting; draw?.(); });
  onMount(() => {
    const renderer = acquireDiceRenderer();
    let lastProgress = -1;
    function render() {
      const progress = rolling ? Number(clock?.getAnimations()[0]?.effect?.getComputedTiming().progress ?? 1) : 1;
      renderer.draw(canvas,values,progress,oldValues,adjusting,rolling);
      lastProgress = progress; canvas.dataset.progress = String(progress);
    }
    const observer = new ResizeObserver(render); observer.observe(canvas);
    draw = render; render();
    let frame = 0, lastFrame = 0;
    function animate(now: number) {
      const progress = Number(clock?.getAnimations()[0]?.effect?.getComputedTiming().progress ?? 1);
      if (progress !== lastProgress && now-lastFrame >= 1000/30) { render(); lastFrame = now; }
      frame = requestAnimationFrame(animate);
    }
    if (rolling) frame = requestAnimationFrame(animate);
    return () => {
      draw = undefined; cancelAnimationFrame(frame); observer.disconnect(); renderer.release();
    };
  });
</script>
<span class="dice-model" class:rolling class:single={values.length === 1} role="img" aria-label={`Dice: ${values.join(' and ')}`}>
  <canvas bind:this={canvas} data-dice-values={values.join(',')}></canvas>
  {#if rolling}<span bind:this={clock} data-dice-clock aria-hidden="true"></span>{/if}
</span>
<style>
  .dice-model { display: inline-block; width: clamp(72px, 12cqw, 160px); aspect-ratio: 2.2; vertical-align: middle; }
  .dice-model.single { width: clamp(24px, 5cqw, 60px); aspect-ratio: 1; }
  .dice-model.rolling { width: 100%; height: 100%; aspect-ratio: auto; }
  canvas { display: block; width: 100%; height: 100%; }
  [data-dice-clock] { position: absolute; width: 0; height: 0; pointer-events: none; }
</style>
