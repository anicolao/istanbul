<script lang="ts">
  import { base } from '$app/paths';
  import { tablePositions, tablePositionNames, type RoomMode, type TablePosition } from '$lib/game/protocol';
  import { scenarios } from './scenarios';
  let { subject = $bindable(), count = $bindable(), mode = $bindable(), seat = $bindable(),
    speed = $bindable(), paused = $bindable(), toolsOpen = $bindable(true),
    triggered, moving, latest, phase, reduced, error, reset, trigger, next, external = false
  }: {
    subject: string; count: number; mode: RoomMode; seat: TablePosition; speed: number;
    paused: boolean; toolsOpen?: boolean; triggered: boolean; moving: number; latest: string;
    phase: string | undefined; reduced: boolean; error: string; external?: boolean;
    reset: (replay?: boolean) => void; trigger: () => void; next: () => void;
  } = $props();
  const groups = [...new Set(scenarios.map(s => s.group))];
  const description = $derived(scenarios.find(s => s.id === subject)!);
</script>
<aside class="lab-tools" class:expanded={toolsOpen} class:external aria-label="Animation lab">
  <div class="quick-controls">
    <button onclick={() => (toolsOpen = !toolsOpen)} aria-expanded={toolsOpen}
      >Animation lab {toolsOpen ? '▴' : '▾'}</button
    >
    <button
      class="primary"
      onclick={() => (triggered ? reset(true) : trigger())}
      >{triggered ? 'Replay' : 'Trigger'}</button
    >
    <button class="secondary" onclick={() => (paused = !paused)}
      >{paused ? 'Resume' : 'Pause'}</button
    >
    <button class="secondary" onclick={() => reset()}>Reset</button><button onclick={next}
      >Next →</button
    >
    <span class="secondary" role="status"
      >{paused ? 'Paused' : moving ? `${moving} moving` : 'Ready'}</span
    >
  </div>
  {#if toolsOpen}
    <div class="settings">
      <label
        >Scenario<select aria-label="Scenario" bind:value={subject} onchange={() => reset()}
          >{#each groups as group}<optgroup label={group}
              >{#each scenarios.filter((s) => s.group === group) as s}<option
                  value={s.id}>{s.name}</option
                >{/each}</optgroup
            >{/each}</select
        ></label
      >
      <div class="row">
        <label
          >Surface<select aria-label="Surface" bind:value={mode} onchange={() => reset()}
            ><option value="shared-table">Tabletop</option><option
              value="personal-screens">Personal screen</option
            ></select
          ></label
        >
        <label
          >Players<select aria-label="Players" bind:value={count} onchange={() => reset()}
            >{#each [2, 3, 4, 5] as n}<option value={n}>{n}</option
              >{/each}</select
          ></label
        >
      </div>
      <div class="row">
        <label
          >Seat<select aria-label="Seat"
            bind:value={seat}
            onchange={() => reset()}
            disabled={mode === 'personal-screens'}
            >{#each tablePositions as p}<option value={p}
                >{tablePositionNames[p]}</option
              >{/each}</select
          ></label
        >
        <label
          >Playback speed<select aria-label="Playback speed" bind:value={speed}
            ><option value={0.1}>¹⁄₁₀×</option><option value={0.25}>¼×</option
            ><option value={0.5}>½×</option><option value={1}>Normal</option
            ><option value={2}>2×</option></select
          ></label
        >
      </div>
      <p>{description.hint}</p>
      {#if !external}<p><a href={`${base}/dev/animations/mobile?scenario=${subject}&players=${count}&surface=${mode}&seat=${seat}`}>Preview phone and tablet sizes</a></p>{/if}
      <p class="note">
        Live game components and rules, with prepared local positions. Play
        directly, or Trigger and Replay. The URL preserves the selected
        scenario. Changes here are never saved to a room.
      </p>
      <p class="note">
        {scenarios.length} scenarios · {latest} · {phase}
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
  a { color: #f5e3bd; }
  .warning {
    color: #ffb77a;
    margin: 8px 10px;
  }
  @media (max-width: 600px), (max-height: 500px) {
    /* Keep the review tools outside the game viewport on phones. */
    .lab-tools {
      top: 0;
      left: 0;
      transform: none;
      width: 100%;
      max-width: none;
      box-sizing: border-box;
      border-radius: 0;
    }
    .lab-tools:not(.expanded) .secondary {
      display: none;
    }
    .lab-tools button,
    .lab-tools select {
      min-height: 44px;
    }
    .lab-tools .quick-controls {
      padding: 5px;
    }
    .lab-tools .settings {
      max-height: calc(100svh - 120px);
    }
  }

  .lab-tools.external { position: static; transform: none; width: 100%; max-width: none; box-sizing: border-box; }
  .external .settings { width: 100%; max-width: none; max-height: none; }
  .external .quick-controls { flex-wrap: wrap; }
</style>
