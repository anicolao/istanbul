<script lang="ts">
  import { base } from '$app/paths';
  let { surface }: { surface: HTMLElement | undefined } = $props();
  let inspecting = $state(false);
  let text = $state('');
  let toggle: HTMLButtonElement;
  let anchor = $state.raw<HTMLElement>();
  let x = $state(8), y = $state(68);

  function explain(target: EventTarget | null) {
    if (!inspecting || !(target instanceof Element)) return;
    // The enclosing live context takes precedence over an icon's generic name.
    const item = target.closest<HTMLElement>('[data-help-context]') ?? target.closest<HTMLElement>('[data-help], button[aria-label], .good[aria-label], .coins[aria-label], .rubies[aria-label], .power[aria-label], [data-component=BonusCard]');
    if (!item || item.closest('.component-help')) return;
    const message = item.dataset.helpContext || item.dataset.help || item.getAttribute('aria-label') || item.title;
    if (!message) return;
    anchor = item;
    text = message;
  }

  function positionTip(node: HTMLElement, _content: { text: string; anchor: HTMLElement | undefined }) {
    const place = () => {
      const rect = (anchor?.isConnected ? anchor : toggle)?.getBoundingClientRect();
      if (!rect) return;
      const bounds = node.getBoundingClientRect();
      x = Math.max(8, Math.min(rect.left, window.innerWidth - bounds.width - 8));
      const below = rect.bottom + 8;
      const above = rect.top - bounds.height - 8;
      y = Math.max(8, Math.min(below + bounds.height <= window.innerHeight - 8 ? below : above, window.innerHeight - bounds.height - 8));
    };
    const observer = new ResizeObserver(place);
    observer.observe(node);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    place();
    return { update: place, destroy() {
      observer.disconnect();
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    } };
  }

  $effect(() => {
    const root = surface;
    if (!root) return;
    const active = inspecting;
    root.classList.toggle('help-active', active);
    // Make otherwise static live resource regions reachable only in help mode.
    const addedFocus = active ? [...root.querySelectorAll<HTMLElement>('[data-help-context]')].filter(el => !el.closest('button') && !el.hasAttribute('tabindex') && !el.querySelector('[tabindex]')) : [];
    for (const el of addedFocus) el.tabIndex = 0;
    const focus = (e: FocusEvent) => explain(e.target);
    const click = (e: MouseEvent) => {
      const target = e.target;
      if (!active || !(target instanceof Element) || target.closest('.component-help')) return;
      // Keep opening a mat available; tapping its individual totals explains them.
      if (target.closest('.summary') && !target.closest('[data-help-context], [data-help]')) return;
      e.preventDefault(); e.stopImmediatePropagation(); explain(target);
    };
    const key = (e: KeyboardEvent) => {
      if (!active || e.key !== 'Escape') return;
      e.preventDefault(); e.stopImmediatePropagation();
      inspecting = false; text = ''; toggle.focus();
    };
    root.addEventListener('focusin', focus);
    root.addEventListener('click', click, true);
    window.addEventListener('keydown', key, true);
    return () => {
      root.classList.remove('help-active');
      for (const el of addedFocus) el.removeAttribute('tabindex');
      root.removeEventListener('focusin', focus);
      root.removeEventListener('click', click, true);
      window.removeEventListener('keydown', key, true);
    };
  });
</script>
<div class="component-help">
  <button bind:this={toggle} aria-label={inspecting ? 'Turn help off' : 'Turn help on'} aria-pressed={inspecting}
    onclick={() => { inspecting = !inspecting; anchor = toggle; text = inspecting ? 'Tap a component to learn about it. Turn help off or press Escape to resume playing.' : ''; }}>
    <img src={`${base}/art/game/controls/help-${inspecting ? 'on' : 'off'}-v1.png`} alt="" draggable="false" />
  </button>
  {#if text}
    <!-- The explanation is focusable so keyboard users can scroll long help. -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div class="tip" role="region" aria-label="Component help" aria-live="polite" tabindex="0" use:positionTip={{ text, anchor }} style={`left:${x}px;top:${y}px`}>{text}</div>{/if}
</div>
<style>
  :global(.help-active [data-help]), :global(.help-active [data-help-context]) { pointer-events: auto !important; cursor: help; }
  :global(.help-active [data-help-context]:focus-visible) { outline: 3px solid #fff0ce; outline-offset: 2px; }
  .component-help > button { position: absolute; z-index: 110; top: 8px; right: 8px; width: 52px; height: 52px; padding: 0; border: 0; background: transparent; cursor: pointer; }
  .component-help > button img { display: block; width: 100%; height: 100%; object-fit: contain; }
  .component-help > button[aria-pressed='true'] { filter: drop-shadow(0 0 6px #ffdd82); outline: 2px solid #ffdd82; outline-offset: 2px; border-radius: 50%; }
  .component-help > button:focus-visible, .tip:focus-visible { outline: 3px solid #fff0ce; outline-offset: 3px; border-radius: 8px; }
  .tip { position: fixed; z-index: 120; width: max-content; max-width: min(340px, calc(100vw - 16px)); max-height: calc(100dvh - 16px); overflow: auto; padding: 12px; box-sizing: border-box; background: #fff0ce; color: #222d28; border: 1px solid #96743d; border-radius: 8px; box-shadow: 0 3px 15px #0008; font: 16px/1.45 'Atkinson Hyperlegible', sans-serif; text-shadow: none; }
</style>
