<script lang="ts">
  import type { PieceKind, PlayerColorName } from '$lib/game/art';
  import GameArt from './GameArt.svelte';

  let {
    piece,
    color,
    label,
    glow = true,
    class: className = ''
  }: {
    piece: PieceKind | 'neutral-merchant' | 'governor' | 'smuggler';
    color?: PlayerColorName;
    label?: string;
    glow?: boolean;
    class?: string;
  } = $props();
</script>

<span class={`playing-piece ${className}`} class:glow data-component="PlayingPiece" data-piece-kind={piece} data-piece-glow={glow}>
  <GameArt kind="piece" {piece} {color} {label} />
</span>

<style>
  .playing-piece { display: inline-grid; place-items: center; min-width: 0; min-height: 0; }
  .playing-piece.glow { filter: drop-shadow(0 0 .13rem #fff7cf) drop-shadow(0 0 .38rem #efbd55e6) drop-shadow(0 .12rem .1rem #000b); }
  .playing-piece :global(.game-art) { width: 100%; height: 100%; filter: none; }
</style>
