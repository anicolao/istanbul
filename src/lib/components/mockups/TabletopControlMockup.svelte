<script lang="ts">
  import { createGalleryGame } from "$lib/game/gallery-fixture";
  import type { RoomProjection, TablePosition } from "$lib/game/protocol";
  import TabletopSurface from "../TabletopSurface.svelte";

  let {
    activePlace,
    previewPosition = 6,
    onSelect,
  }: {
    activePlace: number;
    previewPosition?: TablePosition;
    onSelect: (place: number) => void;
  } = $props();
  const game = $derived.by(() => {
    const fixture = createGalleryGame();
    fixture.phase = "action";
    fixture.players[0].merchantPlace = activePlace;
    return fixture;
  });
  const room = $derived<RoomProjection>({
    roomCode: "ARTVW",
    hostUid: "preview",
    tabletopOwned: true,
    status: "playing",
    maxPlayers: 5,
    mode: "shared-table",
    layout: "number-order",
    seats: game.players.map((player, index) => ({
      uid: player.uid,
      name: player.name,
      ready: true,
      tablePosition:
        index === 0
          ? previewPosition
          : ([1, 3, 4, 6, 8] as TablePosition[]).filter(
              (position) => position !== previewPosition,
            )[index - 1],
    })),
  });
</script>

<div class="preview">
  <TabletopSurface
    {game}
    {room}
    userUid="preview"
    onMove={onSelect}
    onPayMerchants={() => {}}
    onTakeAction={() => {}}
    onResolveEncounter={() => {}}
    onUseMosqueAbility={() => {}}
    onEndTurn={() => onSelect((activePlace % 16) + 1)}
    onUndo={() => {}}
    onRollback={() => {}}
    onRematch={() => {}}
    undo={null}
    gameLog={[]}
  />
</div>

<style>
  .preview {
    width: 100vw;
    height: 100svh;
  }
</style>
