<script lang="ts">
  import PlayerMat from './PlayerMat.svelte';
  import type { RoomProjection } from '$lib/game/protocol';
  import type { GameSetup } from '$lib/game/setup';
  import { type Good } from '$lib/game/manifests';
  import { tableSeat } from './table-layout';
  let {
    game,
    room,
    userUid = '',
    onHand = () => {},
    canEnd = false,
    busy = false,
    onEnd,
    onPower,
    onOpen
  }: {
    game: GameSetup;
    room: RoomProjection;
    userUid?: string;
    onHand?: () => void;
    canEnd?: boolean;
    busy?: boolean;
    onEnd: () => void;
    onPower: (good: Good) => void;
    onOpen: () => void;
  } = $props();
</script>

<section class="seats" aria-label="Player resources">
  {#each game.players as player, index (player.uid)}
    <PlayerMat
      {game}
      {room}
      {player}
      {index}
      seat={tableSeat(game, room, index, userUid)}
      active={index === game.turnSeat}
      {userUid}
      {canEnd}
      {busy}
      {onEnd}
      {onPower}
      {onOpen}
      {onHand}
    />
  {/each}
</section>

<style>
  .seats {
    z-index: 2;
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
</style>
