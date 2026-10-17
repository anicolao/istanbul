<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import '@fontsource/cormorant-garamond/700.css';
  import { onMount, tick } from 'svelte';
  import LabControls from './LabControls.svelte';
  import TabletopSurface from '$lib/components/TabletopSurface.svelte';
  import { applyEvent, revealedInformationReason } from '$lib/game/reducer';
  import {
    tablePositions,
    type ReplayProjection,
    type RoomMode,
    type TablePosition
  } from '$lib/game/protocol';
  import { fixture, scenarios, eventFor } from './scenarios';

  let embedded = $state(false);
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
    embedded = params.get('embedded') === 'true' && window.parent !== window;
    const receive = (event: MessageEvent) => {
      if (!embedded || event.origin !== location.origin || event.source !== window.parent || event.data?.type !== 'lab-command') return;
      const data = event.data;
      if (data.command === 'configure') {
        subject = data.subject; count = data.count; mode = data.mode; seat = data.seat;
        void reset();
      } else if (data.command === 'trigger') trigger();
      else if (data.command === 'reset') void reset(data.replay);
      else if (data.command === 'next') next();
      else if (data.command === 'playback') { speed = data.speed; paused = data.paused; }
    };
    window.addEventListener('message', receive);
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
      window.removeEventListener('message', receive);
      cancelAnimationFrame(frame);
      media.removeEventListener('change', update);
    };
  });
  $effect(() => {
    const state = { subject, count, mode, seat, speed, paused, triggered, moving, latest,
      phase: projection.game?.phase, reduced, error };
    if (embedded) window.parent.postMessage({ type: 'lab-state', ...state }, location.origin);
  });
</script>

<svelte:head><title>Animation lab · Istanbul</title></svelte:head>
<div class="stage" class:embedded bind:this={stage}>
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
{#if !embedded}<LabControls bind:subject bind:count bind:mode bind:seat bind:speed bind:paused bind:toolsOpen
  {triggered} {moving} {latest} phase={projection.game?.phase} {reduced} {error} {reset} {trigger} {next} />{/if}


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

  @media (max-width: 600px), (max-height: 500px) {
    .stage:not(.embedded) { margin-top: 56px; height: calc(100svh - 56px); }
  }
</style>
