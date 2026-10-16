<script lang="ts">
  import { base } from '$app/paths';
  import { locationArt, type PlayerColorName } from '$lib/game/art';
  import { places } from '$lib/game/manifests';
  import type { GameSetup, SetupPlayer } from '$lib/game/setup';
  import GameArt from './GameArt.svelte';

  let { game, player, disabled = false, onRecall }: {
    game: GameSetup;
    player: SetupPlayer;
    disabled?: boolean;
    onRecall: (place: number) => void;
  } = $props();
</script>

<div class="recall-map" role="group" aria-label="Choose an assistant to return">
  {#each game.board as id}
    {@const place = places.find((p) => p.id === id)!}
    {@const count = player.assistantsByPlace[id] ?? 0}
    <button
      type="button"
      data-recall-place={id}
      class:available={count > 0}
      disabled={disabled || count === 0}
      aria-label={count ? `Return assistant from ${place.name} (${count} available)` : `${place.name}: no assistants to return`}
      style={`background-image:url('${base}/${locationArt[id]}')`}
      onclick={() => onRecall(id)}
    >
      <span class="title">{place.shortName}</span>
      {#if count}<span class="assistants">
        <GameArt kind="piece" piece="assistant" color={player.color as PlayerColorName} />
        {#if count > 1}<b>{count}</b>{/if}
      </span>{/if}
    </button>
  {/each}
</div>

<style>
  .recall-map {
    width: min(100%, 720px);
    aspect-ratio: 16 / 9;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    gap: 4px;
    margin: auto;
    container-type: inline-size;
  }
  button {
    position: relative;
    min-width: 0;
    min-height: 0;
    padding: 0;
    border: 2px solid transparent;
    border-radius: 4px;
    background-size: cover;
    background-position: center;
    color: #fff1cd;
  }
  button.available {
    border-color: #efca7d;
    box-shadow: 0 0 6px #efca7d88;
    cursor: pointer;
  }
  button:focus-visible { outline: 3px solid white; outline-offset: 1px; }
  button:disabled:not(.available) { filter: brightness(.6); }
  .title {
    position: absolute;
    inset: auto 0 0;
    padding: 2px;
    background: #171209cc;
    font-size: clamp(8px, 2.2cqw, 14px);
    line-height: 1;
  }
  .assistants {
    position: absolute;
    inset: 2px 0 22%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .assistants :global(.game-art) { height: 100%; width: 45%; }
  b { background: #173f43; border-radius: 50%; padding: 2px 5px; font-size: clamp(10px, 3cqw, 18px); }
</style>
