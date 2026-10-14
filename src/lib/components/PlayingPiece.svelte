<script lang="ts">
  import type { PieceKind, PlayerColorName } from '$lib/game/art';
  import GameArt from './GameArt.svelte';

  let {
    piece,
    color,
    label,
    glow = true,
    ownerUid,
    assistantCount,
    class: className = ''
  }: {
    piece: PieceKind | 'neutral-merchant' | 'governor' | 'smuggler';
    color?: PlayerColorName;
    label?: string;
    glow?: boolean;
    ownerUid?: string;
    assistantCount?: number;
    class?: string;
  } = $props();
</script>

<span
  class={`playing-piece ${className}`}
  class:glow
  data-component="PlayingPiece"
  data-owner-uid={ownerUid}
  data-piece-kind={piece}
  data-piece-glow={glow}
>
  <GameArt kind="piece" {piece} {color} {label} />
  {#if assistantCount !== undefined}<b
      class="assistant-count"
      aria-label={`${assistantCount} assistants carried`}>{assistantCount}</b
    >{/if}
</span>

<style>
  .assistant-count {
    position: absolute;
    right: -8%;
    bottom: 0;
    min-width: 1.5em;
    height: 1.5em;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: #14362d;
    border: 1px solid #efd28e;
    color: #fff5da;
    font: 700 2.2cqw/1 sans-serif;
    text-shadow: none;
  }
  .playing-piece {
    position: relative;
    display: inline-grid;
    place-items: center;
    min-width: 0;
    min-height: 0;
  }
  .playing-piece.glow {
    filter: drop-shadow(0 0 0.13rem #fff7cf) drop-shadow(0 0 0.38rem #efbd55e6)
      drop-shadow(0 0.12rem 0.1rem #000b);
  }
  .playing-piece :global(.game-art) {
    width: 100%;
    height: 100%;
    filter: none;
  }
</style>
