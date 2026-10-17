<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import LabControls from '../LabControls.svelte';
  import type { RoomMode, TablePosition } from '$lib/game/protocol';
  let frame = $state<HTMLIFrameElement>();
  let previewState = $state({ subject: 'arrival-3', count: 4, mode: 'personal-screens' as RoomMode,
    seat: 6 as TablePosition, speed: 1, paused: false, triggered: false, moving: 0,
    latest: 'Loading', phase: undefined as string | undefined, reduced: false, error: '' });
  function command(command: string, extra = {}) {
    frame?.contentWindow?.postMessage({ type: 'lab-command', command, ...extra }, location.origin);
  }
  function reset(replay?: boolean) {
    if (replay) command('reset', { replay });
    else command('configure', { subject: previewState.subject, count: previewState.count, mode: previewState.mode, seat: previewState.seat });
  }
  $effect(() => {
    const { speed, paused } = previewState;
    if (source) command('playback', { speed, paused });
  });

  const devices = [
    { name: 'Phone portrait · 393 × 852', width: 393, height: 852 },
    { name: 'Narrow phone · 320 × 700', width: 320, height: 700 },
    { name: 'Phone landscape · 852 × 393', width: 852, height: 393 },
    { name: 'Tablet portrait · 820 × 1180', width: 820, height: 1180 },
    { name: 'Tablet landscape · 1180 × 820', width: 1180, height: 820 }
  ];
  let selected = $state(0);
  let availableWidth = $state(0);
  let availableHeight = $state(0);
  let source = $state('');
  const device = $derived(devices[selected]);
  const scale = $derived(Math.min(1, availableWidth / device.width, availableHeight / device.height));

  onMount(() => {
    const url = new URL(`${base}/dev/animations`, location.origin);
    url.search = location.search;
    if (!url.searchParams.has('surface')) url.searchParams.set('surface', 'personal-screens');
    url.searchParams.set('embedded', 'true');
    source = url.href;
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame?.contentWindow || event.data?.type !== 'lab-state') return;
      const { type, ...value } = event.data;
      previewState = value;
      const url = new URL(location.href);
      for (const [key, entry] of Object.entries({ scenario: value.subject, players: value.count, surface: value.mode, seat: value.seat })) {
        url.searchParams.set(key, String(entry));
      }
      history.replaceState(null, '', url);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  });
</script>

<svelte:head><title>Mobile animation preview · Istanbul</title></svelte:head>
<main>
  <header>
    <label>Preview size <select bind:value={selected}>
      {#each devices as item, index}<option value={index}>{item.name}</option>{/each}
    </select></label>
    <span>{Math.round(scale * 100)}% · scaled to fit this window</span>
    <a href={`${base}/dev/animations`}>Full-window lab</a>
  </header>
  <div class="review">
  <aside aria-label="Preview controls">
    <LabControls external bind:subject={previewState.subject} bind:count={previewState.count} bind:mode={previewState.mode}
      bind:seat={previewState.seat} bind:speed={previewState.speed} bind:paused={previewState.paused}
      triggered={previewState.triggered} moving={previewState.moving} latest={previewState.latest} phase={previewState.phase}
      reduced={previewState.reduced} error={previewState.error} {reset}
      trigger={() => command('trigger')} next={() => command('next')} />
  </aside>
  <div class="workspace" bind:clientWidth={availableWidth} bind:clientHeight={availableHeight}>
    <div class="device" style:width={`${device.width * scale}px`} style:height={`${device.height * scale}px`}>
      {#if source}<iframe bind:this={frame} title="Animation lab at selected mobile size" src={source}
        style:width={`${device.width}px`} style:height={`${device.height}px`}
        style:transform={`scale(${scale})`}></iframe>{/if}
    </div>
  </div>
  </div>
</main>

<style>
  :global(body) { margin: 0; background: #071b17; color: #f5e3bd; font-family: sans-serif; }
  main { height: 100svh; box-sizing: border-box; padding: 12px; display: flex; flex-direction: column; gap: 12px; }
  header { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  label { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
  select { min-height: 44px; max-width: 100%; font: inherit; background: #173c32; color: inherit; border: 1px solid #a98e56; border-radius: 5px; padding: 6px; }
  span, a { font-size: 13px; color: #dbc99e; }
  .review { flex: 1; min-height: 0; display: flex; gap: 16px; }
  aside { width: 320px; flex-shrink: 0; overflow: auto; }
  @media (max-width: 700px) {
    .review { flex-direction: column; }
    aside { width: 100%; max-height: 35svh; }
  }
  .workspace { flex: 1; min-height: 0; display: grid; place-items: center; }
  .device { position: relative; outline: 1px solid #a98e56; box-shadow: 0 4px 24px #0008; }
  iframe { display: block; border: 0; transform-origin: top left; }
</style>
