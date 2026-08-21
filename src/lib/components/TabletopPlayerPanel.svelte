<script lang="ts">
  import type { RoomProjection } from '$lib/game/protocol';
  import type { GameSetup, SetupPlayer } from '$lib/game/setup';
  import PlayerTray from './PlayerTray.svelte';

  let { game, room }: { game: GameSetup; room: RoomProjection } = $props();

  const currentPlayer = $derived(game.players[game.turnSeat]);
  const clockwisePlayers = $derived(Array.from(
    { length: game.players.length },
    (_, index) => game.players[(game.startingSeat + index) % game.players.length]
  ));

  function playerIndex(player: SetupPlayer) {
    return game.players.findIndex(({ uid }) => uid === player.uid);
  }

  function playerNumber(player: SetupPlayer) {
    return clockwisePlayers.findIndex(({ uid }) => uid === player.uid) + 1;
  }

  function tablePosition(player: SetupPlayer) {
    return room.seats.find(({ uid }) => uid === player.uid)?.tablePosition;
  }

  function stackTop(index: number) {
    return `${index * (40 / Math.max(1, clockwisePlayers.length - 1))}%`;
  }

  function stackLeft(index: number) {
    return `${index * (32 / Math.max(1, clockwisePlayers.length - 1))}%`;
  }
</script>

<section class="tabletop-player-panel" aria-label="Player resources" data-e2e-fit data-e2e-no-scroll>
  <article class="current-player-mat" aria-label={`Current player resources: ${currentPlayer.name}`}>
    <span class="mat-caption"><b>Current player · #{playerNumber(currentPlayer)}</b><small>Position {tablePosition(currentPlayer)}</small></span>
    <div class="upright-mat">
      <PlayerTray player={currentPlayer} seat={playerNumber(currentPlayer)} starting={playerIndex(currentPlayer) === game.startingSeat} local={false} compact selectedBonus={null} onInspectBonus={() => {}} />
    </div>
  </article>

  <div class="player-card-stack" aria-label="Clockwise player cards">
    <span class="stack-caption">Player order · clockwise</span>
    {#each clockwisePlayers as player, index}
      <article
        class:active={player.uid === currentPlayer.uid}
        aria-label={`${player.name} resources`}
        aria-current={player.uid === currentPlayer.uid ? 'true' : undefined}
        style={`--stack-top: ${stackTop(index)}; --stack-left: ${stackLeft(index)}; --stack-z: ${index + 1}`}
      >
        <span class="order-badge"><b>#{index + 1}</b><small>P{tablePosition(player)}</small></span>
        <strong class="stack-player-name">{player.name}</strong>
        <PlayerTray {player} seat={index + 1} starting={index === 0} local={false} compact selectedBonus={null} onInspectBonus={() => {}} />
      </article>
    {/each}
  </div>
</section>

<style>
  .tabletop-player-panel { grid-column: 1; grid-row: 2; min-width: 0; min-height: 0; display: grid; grid-template-rows: minmax(0, 1fr) minmax(0, 1fr); gap: .4rem; overflow: hidden; }
  .current-player-mat, .player-card-stack { position: relative; min-width: 0; min-height: 0; overflow: hidden; border: 1px solid rgb(239 202 125 / 35%); border-radius: .65rem; background: rgb(5 29 31 / 72%); }
  .current-player-mat { display: grid; place-items: center; padding: 1.35rem .3rem .3rem; }
  .mat-caption, .stack-caption { position: absolute; z-index: 20; top: .3rem; right: .4rem; left: .4rem; display: flex; align-items: center; justify-content: space-between; gap: .35rem; color: #efca7d; font-size: .52rem; letter-spacing: .06em; text-transform: uppercase; }
  .mat-caption small { color: #9fb8b2; }
  .upright-mat { width: 100%; max-height: 100%; aspect-ratio: 1; display: grid; place-items: center; }
  .upright-mat :global(.compact-tray) { width: 100%; height: auto; max-height: 100%; }
  .player-card-stack { padding-top: 1.25rem; }
  .player-card-stack > article { position: absolute; z-index: var(--stack-z); top: calc(1.15rem + var(--stack-top)); left: var(--stack-left); width: 62%; aspect-ratio: 1; overflow: visible; filter: brightness(.72) saturate(.82); transition: filter .15s ease, translate .15s ease; }
  .player-card-stack > article.active { z-index: 10; filter: none; translate: 0 -.12rem; }
  .player-card-stack > article :global(.compact-tray) { box-shadow: 0 .35rem .8rem #000b; }
  .order-badge { position: absolute; z-index: 12; top: -.25rem; right: -.25rem; width: 2rem; aspect-ratio: 1; display: grid; place-content: center; border: 2px solid #efca7d; border-radius: 50%; color: #fffaf0; text-align: center; background: #a43b32; box-shadow: 0 .15rem .35rem #0009; line-height: .75; }
  .order-badge b { font-size: .68rem; }.order-badge small { color: #f5d996; font-size: .42rem; }
  .stack-player-name { display: none; }
  @media (max-width: 960px), (max-height: 599px) {
    .tabletop-player-panel { grid-column: 1 / 3; grid-row: 4; height: 6.2rem; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr; }
    .current-player-mat { padding: .2rem; }.mat-caption { display: none; }.upright-mat { width: auto; height: 100%; justify-self: center; }.upright-mat :global(.compact-tray) { width: auto; height: 100%; }
    .player-card-stack { padding-top: .9rem; }.player-card-stack > article { top: calc(.8rem + var(--stack-top)); width: 28%; }.player-card-stack > article :global(.compact-tray) { display: none; }.stack-caption { font-size: .4rem; }.stack-player-name { min-height: 1.8rem; display: grid; place-items: center; overflow: hidden; padding: .2rem; border: 1px solid #efca7d88; border-radius: .35rem; color: #fffaf0; background: #173f43; font-size: .48rem; text-overflow: ellipsis; white-space: nowrap; }.order-badge { width: 1.35rem; }.order-badge b { font-size: .48rem; }.order-badge small { font-size: .32rem; }
  }
  @media (prefers-reduced-motion: reduce) { .player-card-stack > article { transition: none; } }
</style>
