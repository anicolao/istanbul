<script lang="ts">
  import type { SetupPlayer } from '$lib/game/setup';
  import PlayerTray from '../PlayerTray.svelte';

  let { player, position }: { player: SetupPlayer; position: 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9 } = $props();

  const rotation = $derived(position <= 3 ? 180 : position === 4 ? 90 : position === 6 ? -90 : 0);
</script>

<section class={`mock-seat position-${position}`} aria-label={`Table position ${position}, ${rotation} degree player-facing orientation`}>
  <span class="position-badge">{position}</span>
  <div class="mat-shell" style={`--seat-rotation: ${rotation}deg`}>
    <PlayerTray {player} seat={position} starting={position === 1} local={false} selectedBonus={null} onInspectBonus={() => {}} />
  </div>
</section>

<style>
  .mock-seat { position: absolute; z-index: 6; display: grid; place-items: center; pointer-events: none; }
  .position-1, .position-2, .position-3, .position-7, .position-8, .position-9 { width: 28%; height: 15%; }
  .position-1 { top: 1%; left: 1.5%; }.position-2 { top: 1%; left: 36%; }.position-3 { top: 1%; right: 1.5%; }
  .position-7 { bottom: 1%; left: 1.5%; }.position-8 { bottom: 1%; left: 36%; }.position-9 { right: 1.5%; bottom: 1%; }
  .position-4, .position-6 { top: 22%; width: 13%; height: 56%; }
  .position-4 { left: .5%; }.position-6 { right: .5%; }
  .mat-shell { width: 100%; transform: rotate(var(--seat-rotation)); transform-origin: center; filter: drop-shadow(0 .45rem .55rem rgb(0 0 0 / 50%)); }
  .position-4 .mat-shell, .position-6 .mat-shell { position: absolute; top: 50%; left: 50%; width: min(56vh, 30vw); transform: translate(-50%, -50%) rotate(var(--seat-rotation)); }
  .mat-shell :global(.tray-stage) { width: 100%; }
  .mat-shell :global(.masked-hand) { display: none; }
  .position-badge { position: absolute; z-index: 5; top: 50%; left: 50%; width: 1.65rem; aspect-ratio: 1; display: grid; place-items: center; border: 2px solid #f3d488; border-radius: 50%; color: #fff8e7; background: #a43b32; box-shadow: 0 .18rem .35rem #0009; font-weight: 700; translate: -50% -50%; }
  .position-1 .position-badge, .position-2 .position-badge, .position-3 .position-badge { top: auto; bottom: -.35rem; }
  .position-7 .position-badge, .position-8 .position-badge, .position-9 .position-badge { top: -.35rem; }
  .position-4 .position-badge { right: -.2rem; left: auto; }.position-6 .position-badge { right: auto; left: -.2rem; }
</style>
