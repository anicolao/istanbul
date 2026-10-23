<script lang="ts">
  import { base } from '$app/paths';
  let { surface }: { surface: HTMLElement | undefined } = $props();
  let inspecting = $state(false);
  let text = $state('');
  let x = $state(16), y = $state(60);
  function explain(target: EventTarget | null) {
    if (!inspecting || !(target instanceof Element)) return;
    const item = target.closest<HTMLElement>('[data-help], button[aria-label], .good[aria-label], .coins[aria-label], .rubies[aria-label], .power[aria-label], [data-component=BonusCard]');
    if (!item || item.closest('.component-help')) { if (!inspecting) text = ''; return; }
    const message = item.dataset.help || item.getAttribute('aria-label') || item.title;
    if (!message) return;
    text = message;
    const rect = item.getBoundingClientRect();
    x = Math.max(8, Math.min(rect.left, window.innerWidth - 300));
    y = Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 130));
  }
  $effect(() => {
    const root = surface;
    if (!root) return;
    root.classList.toggle('help-active', inspecting);
    const focus = (e: FocusEvent) => explain(e.target);
    const click = (e: MouseEvent) => {
      if (!inspecting || (e.target as Element)?.closest('.component-help, .summary')) return;
      e.preventDefault(); e.stopImmediatePropagation(); explain(e.target);
    };
    root.addEventListener('focusin', focus);
    root.addEventListener('click', click, true);
    return () => {
      root.classList.remove('help-active');
      root.removeEventListener('focusin', focus);
      root.removeEventListener('click', click, true);
    };
  });
</script>
<svelte:window onkeydown={(e) => { if (e.key === 'Escape') { inspecting = false; text = ''; } }} />
<div class="component-help">
  <button aria-label={inspecting ? "Turn help off" : "Turn help on"} aria-pressed={inspecting}
    onclick={() => { inspecting = !inspecting; text = inspecting ? 'Tap a component to learn about it. Turn help off to resume playing.' : ''; }}>
    <img src={`${base}/art/game/controls/help-${inspecting ? 'on' : 'off'}-v1.png`} alt="" draggable="false" />
  </button>
  {#if text}<div class="tip" role="tooltip" aria-live="polite" style={`left:${x}px;top:${y}px`}>{text}</div>{/if}
</div>
<style>
  :global(.help-active [data-help]) { pointer-events: auto !important; cursor: help; }
  .component-help > button { position: absolute; z-index: 110; top: 8px; right: 8px; width: 52px; height: 52px; padding: 0; border: 0; background: transparent; cursor: pointer; }
  .component-help > button img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .component-help > button:focus-visible { outline: 2px solid #fff0ce; outline-offset: 3px; border-radius: 50%; }
  .tip { position: fixed; z-index: 120; width: min(280px, calc(100vw - 32px)); padding: 12px; box-sizing: border-box; background: #fff0ce; color: #222d28; border: 1px solid #96743d; border-radius: 8px; box-shadow: 0 3px 15px #0008; font: 15px/1.4 'Atkinson Hyperlegible', sans-serif; pointer-events: none; text-shadow: none; }
</style>
