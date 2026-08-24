<script lang="ts">
  import { createGalleryGame } from '$lib/game/gallery-fixture';
  import { places } from '$lib/game/manifests';
  import type { TablePosition } from '$lib/game/protocol';
  import LocationTile from '../LocationTile.svelte';
  import TabletopPlaceActionDialog from '../TabletopPlaceActionDialog.svelte';
  import MockPlayerSeat from './MockPlayerSeat.svelte';
  import RoomControlMockup from './RoomControlMockup.svelte';

  let { activePlace, previewPosition = 1, onSelect }: { activePlace: number; previewPosition?: TablePosition; onSelect: (place: number) => void } = $props();

  const game = createGalleryGame();
  game.board = Array.from({ length: 16 }, (_, index) => index + 1);
  game.turnSeat = 0;
  game.startingSeat = 0;

  const positions = [1, 2, 3, 4, 6, 7, 8, 9] as const;
</script>

<main class="tabletop-concept" aria-label="Player-facing tabletop and in-room controls concept">
  <div class="concept-note"><strong>Tabletop control study</strong><span>Controls expand from the active room · all eight possible mat orientations shown</span></div>

  {#each positions as position, index}
    <MockPlayerSeat player={game.players[index % game.players.length]} {position} />
  {/each}

  <section class="board-zone" aria-label="Bazaar board">
    <div class="board-grid">
      {#each game.board as placeId, index}
        <div class:active={placeId === activePlace} class="board-room"><LocationTile {game} {placeId} {index} tabIndex={-1} onclick={() => onSelect(placeId)} /></div>
      {/each}
    </div>
    <div class="board-dimmer"></div>
    <div class="active-room-overlay"><RoomControlMockup placeId={activePlace} /></div>
  </section>

  <nav class="room-switcher" aria-label="Mock-up room selector">
    {#each places as place}<button class:active={place.id === activePlace} onclick={() => onSelect(place.id)} title={place.name}>{place.id}</button>{/each}
  </nav>
  <TabletopPlaceActionDialog
    {game}
    player={game.players[0]}
    placeId={activePlace}
    tablePosition={previewPosition}
    boardIndex={game.board.indexOf(activePlace)}
    onAction={() => {}}
    onSkip={() => {}}
    onClose={() => onSelect(activePlace === 1 ? 2 : 1)}
  />
</main>

<style>
  .tabletop-concept { position: relative; width: 100vw; height: 100svh; min-width: 0; min-height: 0; overflow: hidden; color: #fffaf0; background: radial-gradient(circle at 50% 48%, #376d67 0, #12383b 45%, #071d20 100%); }
  .tabletop-concept::before { position: absolute; inset: 0; opacity: .18; background-image: url('/art/bazaar-courtyard.png'); background-position: center; background-size: cover; content: ''; }
  .concept-note { position: absolute; z-index: 8; top: 16.2%; left: 1.5%; display: grid; gap: .1rem; color: #d4e0dc; font-size: .55rem; letter-spacing: .05em; text-transform: uppercase; }.concept-note strong { color: #efca7d; font-size: .7rem; }
  .board-zone { position: absolute; z-index: 2; inset: 17% 17%; min-width: 0; min-height: 0; overflow: hidden; border: .3rem solid #241710; border-radius: 1.3rem; background: #241710; box-shadow: 0 1.2rem 3rem #000b, 0 0 0 1px #efca7d66; }
  .board-grid { width: 100%; height: 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: .25rem; }.board-room { min-width: 0; min-height: 0; opacity: .72; }.board-room.active { opacity: 1; outline: .2rem solid #efca7d; outline-offset: -.2rem; }
  .board-room :global(.place) { border-radius: .25rem; }
  .board-dimmer { position: absolute; z-index: 3; inset: 0; background: rgb(3 20 22 / 68%); backdrop-filter: blur(1px); }
  .active-room-overlay { position: absolute; z-index: 4; inset: 4% 5% 10%; }
  .room-switcher { position: absolute; z-index: 10; bottom: 17.1%; left: 50%; width: max-content; display: grid; grid-template-columns: repeat(16, 1.85rem); gap: .16rem; padding: .2rem; border: 1px solid #efca7d55; border-radius: 1rem; background: #071f21e8; box-shadow: 0 .35rem .8rem #0008; transform: translateX(-50%); }.room-switcher button { aspect-ratio: 1; padding: 0; border: 1px solid #efca7d44; border-radius: 50%; color: #b9ceca; background: transparent; font-size: .48rem; }.room-switcher button.active { border-color: #efca7d; color: #173f43; background: #efca7d; font-weight: 700; }
</style>
