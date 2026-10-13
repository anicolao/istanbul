<script lang="ts">
  import TabletopArrow from './TabletopArrow.svelte';
  import { base } from '$app/paths';
  import type { RoomProjection } from '$lib/game/protocol';
  import type { GameSetup, SetupPlayer } from '$lib/game/setup';
  import { mosqueTiles, type Good } from '$lib/game/manifests';
  import { componentArt, bonusCardArt } from '$lib/game/art';
  let {
    game,
    room,
    player,
    index = 0,
    seat,
    active = false,
    userUid = '',
    canEnd = false,
    busy = false,
    onEnd = () => {},
    onPower = () => {},
    onOpen = () => {},
    onHand = () => {}
  }: {
    game: GameSetup;
    room: RoomProjection;
    player: SetupPlayer;
    index?: number;
    seat: { x: number; y: number; angle: number; width: number };
    active?: boolean;
    userUid?: string;
    canEnd?: boolean;
    busy?: boolean;
    onEnd?: () => void;
    onPower?: (good: Good) => void;
    onOpen?: () => void;
    onHand?: () => void;
  } = $props();
  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
  const colors: Record<string, string> = {
    ruby: '#d26757',
    saffron: '#e0b451',
    teal: '#6ec4b4',
    indigo: '#91aaf2',
    plum: '#cd8acd'
  };
  const asset = (path: string) => `${base}/${path}`;
</script>

<article
  class="mat"
  data-component="PlayerMat"
  class:active
  aria-label={`${player.name} resources`}
  aria-current={active ? 'true' : undefined}
  data-position={room.seats.find((s) => s.uid === player.uid)?.tablePosition ??
    index + 1}
  style={`--x:${seat.x}%;--y:${seat.y}%;--rotation:${seat.angle}deg;--width:${seat.width}%;--seat-color:${colors[player.color]};background-image:url('${asset('art/game/mats/shared-five-slots-v2.png')}')`}
>
  <strong class="name">{player.name}<span class="turn-light"></span></strong>
  <div class="cargo">
    {#each goods as good}<div
        class="good"
        aria-label={`${player.goods[good]} ${good}, capacity ${player.capacity}`}
      >
        <span class="good-count"
          >{player.goods[good]}<small>/{player.capacity}</small></span
        >{#each Array(5) as _, row}{@const slot = 4 - row}
          <div
            class="goods-slot"
            class:locked={slot >= player.capacity}
            class:filled={slot < player.goods[good]}
          >
            {#if slot < player.goods[good]}<img
                src={asset(componentArt[good])}
                alt=""
              />{/if}
          </div>{/each}
      </div>{/each}
  </div>
  <div class="coins" aria-label={`${player.lira} Lira`}>
    <img src={asset(componentArt.lira)} alt="" /><b>{player.lira}</b>
  </div>
  {#if room.mode === 'personal-screens' && player.uid === userUid}<button
      class="cards"
      aria-label="Your Bonus cards"
      onclick={onHand}
      ><img src={asset(bonusCardArt.back)} alt="" /><span
        >{player.bonusHand.length}</span
      ></button
    >{:else}<div
      class="cards"
      aria-label={`${player.bonusHand.length} Bonus cards`}
    >
      <img src={asset(bonusCardArt.back)} alt="" /><span
        >{player.bonusHand.length}</span
      >
    </div>
  {/if}
  <div class="rubies" aria-label={`${player.rubies} rubies`}>
    {#each Array(Math.max(6, player.rubies)) as _, i}<span
        >{#if i < player.rubies}<img
            src={asset(componentArt.ruby)}
            alt=""
          />{/if}</span
      >{/each}
  </div>
  <div class="turn-controls">
    {#if active}<button
        class="turn"
        disabled={busy}
        onclick={canEnd ? onEnd : onOpen}
        >{canEnd
          ? 'End turn'
          : game.phase === 'movement'
            ? 'Move your merchant'
            : 'Continue turn'}{#if canEnd}
          <TabletopArrow />{/if}</button
      >{/if}
  </div>
  <div class="powers" aria-label={`${player.name} Mosque tiles`}>
    {#each player.mosqueTileIds as id}{@const tile = mosqueTiles.find(
        (t) => t.id === id
      )}{#if tile}<button
          aria-label={tile.ability}
          title={tile.ability}
          disabled={!active || busy}
          onclick={() => onPower(tile.color)}
          ><img
            src={asset(componentArt.mosque[tile.color])}
            alt={tile.ability}
          /></button
        >{/if}{/each}
  </div>
</article>

<style>
  .mat {
    container-type: inline-size;
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: var(--width);
    height: 15%;
    transform: translate(-50%, -50%) rotate(var(--rotation));
    background-size: 100% 105%;
    background-position: top;
    border: 1px solid var(--seat-color);
    border-radius: 0.6cqw;
    filter: drop-shadow(0 0.35cqw 0.4cqw #000a);
    pointer-events: auto;
    color: #f6e8c4;
  }
  .mat.active {
    filter: drop-shadow(0 0 0.35cqw var(--seat-color))
      drop-shadow(0 0.35cqw 0.4cqw #000a);
  }
  .name {
    position: absolute;
    top: 8%;
    left: 62%;
    width: 31%;
    text-align: center;
    font:
      700 4.2cqw 'Cormorant Garamond',
      serif;
    color: var(--seat-color);
  }
  .turn-light {
    display: inline-block;
    width: 1.4cqw;
    height: 1.4cqw;
    margin-left: 1.2cqw;
    border-radius: 50%;
    background: #665e43;
  }
  .active .turn-light {
    background: var(--seat-color);
    box-shadow: 0 0 1.6cqw var(--seat-color);
  }
  .cargo {
    position: absolute;
    left: 6.6%;
    top: 20%;
    width: 51.8%;
    height: 66.5%;
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2.2%;
  }
  .good {
    position: relative;
    display: grid;
    grid-template-rows: repeat(5, minmax(0, 1fr));
    gap: 1px;
    min-width: 0;
    min-height: 0;
  }
  .good-count {
    position: absolute;
    left: 0;
    right: 0;
    top: 100%;
    text-align: center;
    padding-top: 0.48cqw;
    font-size: 3.2cqw;
    font-weight: 700;
    text-shadow:
      0 1px 3px #000,
      0 0 4px #000;
  }
  .good-count small {
    font-size: 2.2cqw;
  }
  .goods-slot {
    position: relative;
    display: grid;
    place-items: center;
    min-height: 0;
    overflow: hidden;
  }
  .goods-slot img {
    position: absolute;
    inset: 3% 8%;
    height: 94%;
    width: 84%;
    object-fit: contain;
    filter: drop-shadow(0 1px 2px #000);
  }
  .goods-slot.filled {
    background: #c4a45819;
  }
  .goods-slot.locked {
    background: #7b817c99;
    box-shadow: inset 0 0 0 1px #a3a59b55;
  }
  .coins {
    position: absolute;
    top: 30%;
    left: 63%;
    width: 11%;
    height: 32%;
    display: grid;
    place-items: center;
  }
  .coins img {
    width: 90%;
    height: 100%;
    object-fit: contain;
    filter: brightness(0.65);
  }
  .coins b {
    position: absolute;
    font-size: 5.8cqw;
    text-shadow: 0 1px 4px #000;
  }
  .cards {
    position: absolute;
    left: 88.5%;
    top: 27%;
    width: 6%;
    height: 44%;
  }
  .cards img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
  .cards span {
    position: absolute;
    bottom: 0;
    right: -0.8cqw;
    background: #13271f;
    border: 1px solid #b59858;
    border-radius: 50%;
    width: 4cqw;
    height: 4cqw;
    display: grid;
    place-items: center;
    font-size: 2.6cqw;
  }
  .rubies {
    position: absolute;
    left: 60.5%;
    top: 76.8%;
    width: 32.9%;
    height: 16%;
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    align-items: center;
  }
  .rubies span {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    min-width: 0;
    min-height: 0;
  }
  .rubies img {
    display: block;
    width: 88%;
    height: 88%;
    object-fit: contain;
  }
  button {
    font: inherit;
    color: inherit;
    cursor: pointer;
    border: 1px solid #b59858;
    border-radius: 0.8cqw;
    background: #13271fdd;
    padding: 0.6cqw;
    touch-action: manipulation;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  button:focus-visible {
    outline: 2px solid #fff0b9;
    outline-offset: 2px;
  }
  .turn-controls {
    position: absolute;
    left: 73%;
    top: 32%;
    width: 16%;
    height: 34%;
    display: flex;
    align-items: center;
    gap: 0.8cqw;
    font-size: 2.48cqw;
  }
  .turn {
    height: 100%;
    min-width: 0;
    flex: 1;
    line-height: 1.1;
  }
  .powers {
    position: absolute;
    left: 61%;
    right: 14%;
    top: 63%;
    height: 13%;
    display: flex;
    justify-content: center;
    gap: 1.4cqw;
  }
  .powers button {
    background: none;
    border: 0;
    padding: 0;
    height: 100%;
    width: 5.6cqw;
    filter: drop-shadow(0 2px 2px #000);
  }
  .powers img {
    height: 100%;
    width: 100%;
    object-fit: contain;
  }
  .powers button:disabled {
    opacity: 1;
  }
</style>
