<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import '@fontsource/cormorant-garamond/700.css';
  import { onMount, tick } from 'svelte';
  import TabletopSurface from '$lib/components/TabletopSurface.svelte';
  import { applyEvent, revealedInformationReason } from '$lib/game/reducer';
  import {
    tablePositions,
    tablePositionNames,
    type ReplayProjection,
    type RoomMode,
    type TablePosition
  } from '$lib/game/protocol';
  import { fixture, scenarios, eventFor } from './scenarios';

  let subject = $state('arrival-3'),
    count = $state(4),
    mode = $state<RoomMode>('shared-table'),
    seat = $state<TablePosition>(6);
  const initial = fixture('arrival-3', 4, 'shared-table', 6);
  let prepared = $state(initial);
  let projection = $state<ReplayProjection>(structuredClone(initial.state));
  let generation = $state(0),
    selectedBonus = $state<string | null>(null),
    toolsOpen = $state(true);
  let speed = $state(1),
    paused = $state(false),
    moving = $state(0),
    error = $state(''),
    latest = $state('Ready'),
    triggered = $state(false),
    reduced = $state(false);
  let sequence = 0,
    history: ReplayProjection[] = [];
  let stage: HTMLDivElement;
  const description = $derived(scenarios.find((s) => s.id === subject)!);
  const groups = [...new Set(scenarios.map((s) => s.group))];
  function send(type: string, payload: Record<string, unknown> = {}) {
    const before = structuredClone($state.snapshot(projection));
    const next = structuredClone(before);
    const event = eventFor(
      next,
      { type, payload: { ...payload, directAction: true } },
      ++sequence
    );
    if (!applyEvent(next, event)) {
      error = next.diagnostics.at(-1)?.reason ?? 'Action unavailable';
      return;
    }
    history.push(before);
    const barrier = revealedInformationReason(event);
    next.undo = {
      targetEventId: event.id,
      actorUid: event.actorUid,
      actorUids: [event.actorUid],
      label:
        type === 'turn/moved'
          ? 'move'
          : type === 'bonus/played'
            ? 'Bonus card'
            : type === 'turn/ended'
              ? 'end turn'
              : 'action',
      blockedReason: barrier
    };
    // A reveal remains a barrier for earlier snapshots too.
    if (barrier) history = [];
    projection = next;
    selectedBonus = null;
    error = '';
    latest = type;
    triggered = true;
  }
  function undo() {
    if (!projection.undo || projection.undo.blockedReason || !history.length)
      return;
    projection = history.pop()!;
    error = '';
    latest = 'Undone';
  }
  async function reset(replay = false) {
    prepared = fixture(subject, count, mode, seat);
    projection = structuredClone($state.snapshot(prepared.state));
    history = [];
    sequence = 0;
    generation++;
    selectedBonus = null;
    triggered = false;
    error = '';
    latest = 'Ready';
    paused = false;
    const url = new URL(location.href);
    for (const [k, v] of Object.entries({
      scenario: subject,
      players: count,
      surface: mode,
      seat
    }))
      url.searchParams.set(k, String(v));
    window.history.replaceState(null, '', url);
    await tick();
    if (replay) {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );
      trigger();
    }
  }
  function trigger() {
    toolsOpen = false;
    paused = false;
    send(prepared.trigger.type, prepared.trigger.payload);
  }
  function pay() {
    const p = projection.game!.pending;
    if (p?.kind === 'merchant-payment')
      send('turn/merchant-paid', {
        recipientUids: p.recipientUids,
        neutralMerchantIds: p.neutralMerchantIds
      });
  }
  function next() {
    const index = scenarios.findIndex((s) => s.id === subject);
    subject = scenarios[(index + 1) % scenarios.length].id;
    void reset();
  }
  onMount(() => {
    const params = new URLSearchParams(location.search);
    if (scenarios.some((s) => s.id === params.get('scenario')))
      subject = params.get('scenario')!;
    const n = Number(params.get('players'));
    if (n >= 2 && n <= 5) count = n;
    const p = Number(params.get('seat'));
    if (tablePositions.includes(p as TablePosition)) seat = p as TablePosition;
    if (params.get('surface') === 'personal-screens') mode = 'personal-screens';
    void reset();
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => (reduced = media.matches);
    update();
    media.addEventListener('change', update);
    let frame = 0;
    const held = new Set<Animation>();
    function inspect() {
      const animations = stage?.getAnimations({ subtree: true }) ?? [];
      moving = animations.filter(
        (a) => a.playState === 'running' || a.pending
      ).length;
      for (const a of animations) {
        if (a.playbackRate !== speed) a.updatePlaybackRate(speed);
        if (paused && (a.playState === 'running' || a.pending)) {
          a.pause();
          held.add(a);
        } else if (!paused && held.has(a)) {
          a.play();
          held.delete(a);
        }
      }
      frame = requestAnimationFrame(inspect);
    }
    frame = requestAnimationFrame(inspect);
    return () => {
      cancelAnimationFrame(frame);
      media.removeEventListener('change', update);
    };
  });
</script>

<svelte:head><title>Animation lab · Istanbul</title></svelte:head>
<div class="stage" bind:this={stage}>
  {#key generation}
    {#if projection.game && projection.room}
      <TabletopSurface
        game={projection.game}
        room={projection.room}
        userUid={mode === 'shared-table'
          ? projection.room.hostUid
          : projection.game.players[projection.game.turnSeat].uid}
        onMove={(destination, assistantAction) =>
          send('turn/moved', { destination, assistantAction })}
        onPayMerchants={pay}
        onTakeAction={(choice) => send('place/action-taken', { choice })}
        onResolveEncounter={(choice) => send('encounter/resolved', { choice })}
        onUseMosqueAbility={(choice) => send('mosque/ability-used', { choice })}
        onEndTurn={() => send('turn/ended')}
        onUndo={undo}
        onRollback={undo}
        onRematch={() => reset()}
        undo={projection.undo}
        gameLog={[]}
        {selectedBonus}
        onInspectBonus={(id) => (selectedBonus = id)}
        onPlayBonus={(cardId, choice) =>
          send('bonus/played', { cardId, choice })}
      />
    {/if}
  {/key}
</div>
<aside class="lab-tools" aria-label="Animation lab">
  <div class="quick-controls">
    <button onclick={() => (toolsOpen = !toolsOpen)} aria-expanded={toolsOpen}
      >Animation lab {toolsOpen ? '▴' : '▾'}</button
    >
    <button
      class="primary"
      onclick={() => (triggered ? reset(true) : trigger())}
      >{triggered ? 'Replay' : 'Trigger'}</button
    >
    <button onclick={() => (paused = !paused)}
      >{paused ? 'Resume' : 'Pause'}</button
    >
    <button onclick={() => reset()}>Reset</button><button onclick={next}
      >Next →</button
    >
    <span role="status"
      >{paused ? 'Paused' : moving ? `${moving} moving` : 'Ready'}</span
    >
  </div>
  {#if toolsOpen}
    <div class="settings">
      <label
        >Scenario<select bind:value={subject} onchange={() => reset()}
          >{#each groups as group}<optgroup label={group}
              >{#each scenarios.filter((s) => s.group === group) as s}<option
                  value={s.id}>{s.name}</option
                >{/each}</optgroup
            >{/each}</select
        ></label
      >
      <div class="row">
        <label
          >Surface<select bind:value={mode} onchange={() => reset()}
            ><option value="shared-table">Tabletop</option><option
              value="personal-screens">Personal screen</option
            ></select
          ></label
        >
        <label
          >Players<select bind:value={count} onchange={() => reset()}
            >{#each [2, 3, 4, 5] as n}<option value={n}>{n}</option
              >{/each}</select
          ></label
        >
      </div>
      <div class="row">
        <label
          >Seat<select
            bind:value={seat}
            onchange={() => reset()}
            disabled={mode === 'personal-screens'}
            >{#each tablePositions as p}<option value={p}
                >{tablePositionNames[p]}</option
              >{/each}</select
          ></label
        >
        <label
          >Playback speed<select bind:value={speed}
            ><option value={0.1}>¹⁄₁₀×</option><option value={0.25}>¼×</option
            ><option value={0.5}>½×</option><option value={1}>Normal</option
            ><option value={2}>2×</option></select
          ></label
        >
      </div>
      <p>{description.hint}</p>
      <p class="note">
        Live game components and rules, with prepared local positions. Play
        directly, or Trigger and Replay. The URL preserves the selected
        scenario. Changes here are never saved to a room.
      </p>
      <p class="note">
        {scenarios.length} scenarios · {latest} · {projection.game?.phase}
      </p>
      <p class="note">
        This shows current game motion, including actions that still update
        instantly. Slow motion and Pause affect existing animations.
      </p>
      {#if reduced}<p class="warning">
          Reduced motion is enabled in your system. Turn it off to review full
          animations.
        </p>{/if}
    </div>
  {/if}
  {#if error}<p class="warning" role="alert">{error}</p>{/if}
</aside>

<style>
  :global(body) {
    margin: 0;
    background: #071b17;
    font-family: 'Atkinson Hyperlegible', sans-serif;
  }
  .stage {
    height: 100svh;
    width: 100vw;
    overflow: hidden;
  }
  .lab-tools {
    position: fixed;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    width: max-content;
    max-width: calc(100vw - 12px);
    border: 1px solid #a98e56;
    border-radius: 10px;
    background: #081d19f5;
    color: #f5e3bd;
    font:
      12px/1.4 'Atkinson Hyperlegible',
      sans-serif;
    box-shadow: 0 4px 20px #0008;
  }
  .quick-controls {
    display: flex;
    gap: 6px;
    padding: 6px;
    align-items: center;
    flex-wrap: wrap;
  }
  .settings {
    width: 460px;
    max-width: calc(100vw - 30px);
    padding: 0 10px 10px;
    max-height: 65svh;
    overflow: auto;
    box-sizing: border-box;
  }
  label {
    display: grid;
    gap: 4px;
    margin: 7px 0;
  }
  select,
  button {
    min-height: 36px;
    background: #173c32;
    color: inherit;
    border: 1px solid #a98e5677;
    border-radius: 5px;
    padding: 5px 8px;
    font: inherit;
  }
  select {
    width: 100%;
    min-width: 0;
  }
  button {
    cursor: pointer;
  }
  button:disabled,
  select:disabled {
    opacity: 0.45;
  }
  .primary {
    background: #ddbd79;
    color: #122c23;
    font-weight: 700;
  }
  .row {
    display: flex;
    gap: 10px;
  }
  .row label {
    flex: 1;
    min-width: 0;
  }
  .note {
    font-size: 11px;
    color: #bdc4c4;
  }
  .warning {
    color: #ffb77a;
    margin: 8px 10px;
  }
</style>
