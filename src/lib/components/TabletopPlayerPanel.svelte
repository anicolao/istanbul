<script lang="ts">
  import type { RoomProjection } from "$lib/game/protocol";
  import type { GameSetup } from "$lib/game/setup";
  import { mosqueTiles, type Good } from "$lib/game/manifests";
  import type { PlayerColorName } from "$lib/game/art";
  import BonusCard from "./BonusCard.svelte";
  import GameArt from "./GameArt.svelte";
  let { game, room }: { game: GameSetup; room: RoomProjection } = $props();
  const goods: Good[] = ["fabric", "spice", "fruit", "jewelry"];
</script>

<section class="seats" aria-label="Player resources">
  {#each game.players as player, index}
    {@const position =
      room.seats.find((seat) => seat.uid === player.uid)?.tablePosition ??
      index + 1}
    <article
      class="mat"
      class:active={index === game.turnSeat}
      data-position={position}
      data-player-color={player.color as PlayerColorName}
      aria-label={`${player.name} resources`}
      aria-current={index === game.turnSeat ? "true" : undefined}
    >
      <header>
        <strong>{player.name}</strong><span
          >{index === game.turnSeat
            ? "Your turn"
            : `Turn ${((index - game.startingSeat + game.players.length) % game.players.length) + 1}`}</span
        ><span aria-label={`${player.rubies} rubies`}
          ><GameArt kind="component" component="ruby" /><b>{player.rubies}</b
          ></span
        >
      </header>
      <div class="goods">
        {#each goods as good}<div
            aria-label={`${player.goods[good]} ${good}, capacity ${player.capacity}`}
          >
            <GameArt kind="component" component={good} /><b
              >{player.goods[good]}<small>/{player.capacity}</small></b
            ><span class="track"
              >{#each Array(player.capacity) as _, i}<i
                  class:filled={i < player.goods[good]}
                ></i>{/each}</span
            >
          </div>{/each}
      </div>
      <footer>
        <span aria-label={`${player.lira} Lira`}
          ><GameArt kind="component" component="lira" /><b>{player.lira}</b
          ></span
        >
        <span aria-label={`${player.assistantsCarried} assistants carried`}
          ><GameArt
            kind="piece"
            piece="assistant"
            color={player.color as PlayerColorName}
          /><b>{player.assistantsCarried}</b></span
        >
        <span aria-label={`${player.bonusHand.length} Bonus cards`}
          ><BonusCard reverse="card-back" compact mini /><b
            >{player.bonusHand.length}</b
          ></span
        >
        <span class="powers" aria-label={`${player.name} Mosque tiles`}
          >{#each player.mosqueTileIds as id}{@const tile = mosqueTiles.find(
              (tile) => tile.id === id,
            )}{#if tile}<GameArt
                kind="component"
                component={`mosque-${tile.color}`}
                label={tile.ability}
              />{/if}{/each}</span
        >
      </footer>
    </article>
  {/each}
</section>

<style>
  .seats {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .mat {
    --accent: #cfad68;
    position: absolute;
    width: 29%;
    height: 16%;
    padding: 0.4%;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 1fr 2fr 1fr;
    gap: 0.2rem;
    border: 2px solid var(--accent);
    border-radius: 0.8rem;
    background: linear-gradient(135deg, #193b39, #092525);
    color: #fff7df;
    pointer-events: auto;
    box-shadow: 0 0.3rem 1rem #0008;
    font-size: clamp(0.8rem, 1.3vw, 1.9rem);
  }
  .mat[data-player-color="ruby"] {
    --accent: #ec8980;
  }
  .mat[data-player-color="saffron"] {
    --accent: #eabc5b;
  }
  .mat[data-player-color="teal"] {
    --accent: #71ccc1;
  }
  .mat[data-player-color="indigo"] {
    --accent: #99aef2;
  }
  .mat[data-player-color="plum"] {
    --accent: #cd94cc;
  }
  .mat.active {
    border-color: #ffe3a0;
    box-shadow:
      0 0 0 3px #f0ca7366,
      0 0.3rem 1rem #0008;
    background: linear-gradient(135deg, #315850, #123531);
  }
  .mat[data-position="1"] {
    top: 1%;
    left: 3%;
    rotate: 180deg;
  }
  .mat[data-position="2"] {
    top: 1%;
    left: 35.5%;
    rotate: 180deg;
  }
  .mat[data-position="3"] {
    top: 1%;
    right: 3%;
    rotate: 180deg;
  }
  .mat[data-position="5"] {
    bottom: 1%;
    right: 3%;
  }
  .mat[data-position="6"] {
    bottom: 1%;
    left: 35.5%;
  }
  .mat[data-position="7"] {
    bottom: 1%;
    left: 3%;
  }
  .mat[data-position="4"],
  .mat[data-position="8"] {
    width: 29cqh;
    height: 16cqw;
    font-size: clamp(0.7rem, 1.6cqmin, 1.9rem);
    top: 50%;
    translate: 0 -50%;
  }
  .mat[data-position="4"] {
    right: 8%;
    translate: 50% -50%;
    rotate: -90deg;
  }
  .mat[data-position="8"] {
    left: 8%;
    translate: -50% -50%;
    rotate: 90deg;
  }
  header,
  footer {
    display: flex;
    align-items: center;
    gap: 0.6em;
    min-height: 0;
  }
  header strong {
    color: var(--accent);
    font-size: 1.15em;
  }
  header > span:nth-child(2) {
    font-size: 0.7em;
    flex: 1;
  }
  header > span:last-child,
  footer > span {
    display: flex;
    align-items: center;
    gap: 0.2em;
  }
  header :global(.game-art),
  footer :global(.game-art) {
    width: 1.5em;
    height: 1.5em;
  }
  footer :global(.bonus-card) {
    width: 0.75em;
  }
  footer .powers {
    margin-left: auto;
    gap: 0.1em;
  }
  .goods {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0.35em;
    min-height: 0;
  }
  .goods > div {
    min-width: 0;
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    padding: 0.15em 0.25em;
    background: #051f2180;
    border-radius: 0.4em;
  }
  .goods :global(.game-art) {
    width: 100%;
    height: 100%;
    min-height: 0;
    max-height: 3em;
  }
  .goods b {
    font-size: 1.3em;
    text-align: center;
  }
  .goods small {
    font-size: 0.5em;
    color: #c1cbc1;
  }
  .track {
    grid-column: 1/-1;
    display: flex;
    gap: 2px;
    height: 4px;
  }
  .track i {
    flex: 1;
    background: #688080;
  }
  .track i.filled {
    background: #f3d282;
  }
  footer {
    font-size: 0.9em;
  }
  @media (max-width: 600px) {
    .mat {
      font-size: 0.55rem;
      width: 31%;
      padding: 0.3rem;
      height: 17%;
    }
    .mat[data-position="1"],
    .mat[data-position="7"] {
      left: 1%;
    }
    .mat[data-position="2"],
    .mat[data-position="6"] {
      left: 34.5%;
    }
    .mat[data-position="3"],
    .mat[data-position="5"] {
      right: 1%;
    }
    header {
      gap: 0.15em;
    }
    header > span:nth-child(2) {
      display: none;
    }
    .mat[data-position="4"],
    .mat[data-position="8"] {
      width: 29cqh;
      height: 16cqw;
      font-size: 0.5rem;
    }
    footer {
      gap: 0.25em;
    }
    .powers :global(.game-art) {
      width: 1em;
    }
  }
  @media (max-width: 600px) {
    .seats {
      inset: 1% 2% auto;
      height: 27%;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: repeat(2, minmax(0, 1fr));
      gap: 0.3rem;
    }
    .seats .mat[data-position] {
      position: relative;
      inset: auto;
      width: 100%;
      height: 100%;
      rotate: none;
      translate: none;
      font-size: 0.6rem;
      padding: 0.2rem;
    }
    .goods b {
      font-size: 1.2em;
    }
    .goods :global(.game-art) {
      max-height: 2em;
    }
    .mat header strong {
      font-size: 1em;
    }
    .mat footer {
      font-size: 0.85em;
    }
  }
</style>
