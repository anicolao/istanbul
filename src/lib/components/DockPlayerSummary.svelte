<script lang="ts">
  import { base } from '$app/paths';
  import { compactComponentArt, componentArt, playerHighlightColors } from '$lib/game/art';
  import type { SetupPlayer } from '$lib/game/setup';
  import type { Good } from '$lib/game/manifests';
  let { player, active = false, onOpen }: { player: SetupPlayer; active?: boolean; onOpen: () => void } = $props();
  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
</script>
<button class="summary" class:active style={`--player-color:${playerHighlightColors[player.color]}`}
  aria-label={`Show ${player.name}'s player mat${active ? ". Current turn." : ""}`} aria-current={active ? "true" : undefined} onclick={onOpen}>
  <span class="name">{#if active}<span class="turn-marker" aria-hidden="true">▶</span>{:else}<i aria-hidden="true"></i>{/if}<span>{player.name}</span></span>
  <span class="totals">
    {#each goods as good}<span data-help={`${player.name}: ${player.goods[good]} ${good}, capacity ${player.capacity}`} aria-label={`${player.goods[good]} ${good}`}>
      <img src={`${base}/${compactComponentArt[good]}`} alt="" /><b>{player.goods[good]}</b>
    </span>{/each}
    <span class="money" data-help={`${player.name}: ${player.lira} Lira`} aria-label={`${player.lira} Lira`}><img src={`${base}/${componentArt.lira}`} alt="" /><b>{player.lira}</b></span>
    <span class="score" data-help={`${player.name}: ${player.rubies} rubies`} aria-label={`${player.rubies} rubies`}><img src={`${base}/${compactComponentArt.ruby}`} alt="" /><b>{player.rubies}</b></span>
  </span>
</button>
<style>
  .summary { flex: 1 0 240px; min-width: 0; max-width: 320px; display: grid; grid-template-columns: minmax(35px, 0.8fr) minmax(0, 3fr); align-items: center; gap: 7px; padding: 4px 7px; border: 1px solid #ab895b66; border-top: 2px solid var(--player-color); border-radius: 7px 7px 0 0; background: linear-gradient(#183b34, #0b2925); color: #fff0d1; cursor: pointer; font: 13px/1.15 'Atkinson Hyperlegible', sans-serif; text-align: left; scroll-snap-align: start; }
  .summary.active { background: linear-gradient(#345044, #173b31); border-color: var(--player-color); }
  .summary.active .name { position: relative; isolation: isolate; overflow: visible; color: #fff1c9; text-shadow: 0 1px 1px #13271f; }
  .summary.active .name::before { content: ''; position: absolute; z-index: -1; inset: -2px -4px; border-radius: 50%; background: var(--player-color); opacity: 0.65; filter: blur(5px); pointer-events: none; }
  .turn-marker { flex: none; color: color-mix(in srgb, var(--player-color) 75%, white); font-size: 11px; text-shadow: none; }
  .name { display: flex; align-items: center; gap: 5px; font-weight: 700; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .name i { width: 6px; height: 6px; flex: none; border-radius: 50%; background: var(--player-color); }
  .name > span { overflow: hidden; text-overflow: ellipsis; }
  .totals { display: flex; justify-content: space-between; gap: 3px; }
  .totals > span { display: flex; align-items: center; gap: 2px; }
  img { width: 20px; height: 20px; object-fit: contain; }
  b { font-size: 13px; font-variant-numeric: tabular-nums; }
  .score { color: #ffdb9a; }
  .summary:focus-visible { outline: 2px solid #fff0d1; outline-offset: -3px; }
  @media(max-width: 600px) {
    .summary { flex: 1 0 164px; max-width: none; box-sizing: border-box; padding: 5px 3px; font-size: 11px; grid-template-columns: 34px minmax(0, 1fr); gap: 3px; }
    .summary.active .name { position: relative; isolation: isolate; overflow: visible; color: #fff1c9; text-shadow: 0 1px 1px #13271f; }
  .summary.active .name::before { content: ''; position: absolute; z-index: -1; inset: -2px -4px; border-radius: 50%; background: var(--player-color); opacity: 0.65; filter: blur(5px); pointer-events: none; }
  .turn-marker { flex: none; color: color-mix(in srgb, var(--player-color) 75%, white); font-size: 11px; text-shadow: none; }
  .name { gap: 2px; } .name i { width: 4px; height: 4px; }
    img { width: 12px; height: 18px; } b { font-size: 10px; }
    .totals, .totals > span { gap: 0; }
  }
</style>
