<script lang="ts">
  import { base } from '$app/paths';
  import { bonusCards, mosqueTiles, type Good } from '$lib/game/manifests';
  import type { SetupPlayer } from '$lib/game/setup';
  import type { PlayerColorName } from '$lib/game/art';
  import BonusCard from './BonusCard.svelte';
  import GameArt from './GameArt.svelte';
  import PlayingPiece from './PlayingPiece.svelte';
  import Wheelbarrow from './Wheelbarrow.svelte';

  let {
    player,
    seat,
    starting,
    local,
    compact = false,
    selectedBonus,
    onInspectBonus
  }: {
    player: SetupPlayer;
    seat: number;
    starting: boolean;
    local: boolean;
    compact?: boolean;
    selectedBonus: string | null;
    onInspectBonus: (cardId: string) => void;
  } = $props();

  const goods = ['fabric', 'spice', 'fruit', 'jewelry'] as Good[];
  const goodNames: Record<Good, string> = { fabric: 'Fabric', spice: 'Spice', fruit: 'Fruit', jewelry: 'Jewelry' };
  const powerNames: Record<Good, string> = { fabric: 'Red', spice: 'Green', fruit: 'Yellow', jewelry: 'Blue' };
  const bonusById = new Map(bonusCards.map((card) => [card.id, card]));

  function ownedPower(color: Good) {
    const tileId = player.mosqueTileIds.find((id) => mosqueTiles.find((tile) => tile.id === id)?.color === color);
    return tileId ? mosqueTiles.find((tile) => tile.id === tileId) : undefined;
  }
</script>

{#if compact}
  <div class="compact-tray" style={`--tray-art: url('${base}/art/game/mats/tabletop-tray-v1.png')`} data-testid={`player-tray-${player.uid}`} data-player-color={player.color} data-component="PlayerTray" data-e2e-fit data-e2e-no-scroll>
    <header>
      {#if starting}<GameArt kind="piece" piece="first-player" class="compact-first-player" />{:else}<span class={`player-dot ${player.color}`}></span>{/if}
      <span><strong>{player.name}{local ? ' · you' : ''}</strong></span>
      <span class="compact-merchant" aria-label={`${player.name}'s merchant carrying ${player.assistantsCarried} assistant${player.assistantsCarried === 1 ? '' : 's'}`}><PlayingPiece piece="merchant" color={player.color as PlayerColorName} /><b>{player.assistantsCarried}</b></span>
    </header>
    <Wheelbarrow amounts={player.goods} capacity={player.capacity} extensions={player.extensions} label={`${player.name} goods`} />
    <aside class="compact-sidebar">
      <div class="compact-powers" aria-label={`${player.name} Mosque tiles`}>
        {#each goods as color}
          {@const power = ownedPower(color)}
          <span class:enabled={Boolean(power)} data-enabled={Boolean(power)} data-power-color={color} title={power?.ability ?? `${powerNames[color]} Mosque power not acquired`}>
            {#if power}<GameArt kind="component" component={`mosque-${color}` as `mosque-${Good}`} label={`${powerNames[color]} Mosque power: ${power.ability}`} />{:else}<i></i>{/if}
          </span>
        {/each}
      </div>
      <div class="compact-rubies" aria-label={`${player.rubies} rubies`}>
        {#each Array(6) as _, index}<span class:filled={index < player.rubies} data-ruby-slot={index + 1} data-filled={index < player.rubies}>{#if index < player.rubies}<GameArt kind="component" component="ruby" renderSize="compact" />{/if}</span>{/each}
      </div>
      <footer>
        <span aria-label={`${player.lira} Lira`}><GameArt kind="component" component="lira" /><b>{player.lira}</b></span>
        <span aria-label={`${player.bonusHand.length} Bonus cards`}><BonusCard reverse="card-back" compact mini class="tray-card-indicator" /><b>{player.bonusHand.length}</b>{#if !local}<em class="visually-hidden">Bonus hand · {player.bonusHand.length} hidden card{player.bonusHand.length === 1 ? '' : 's'}</em>{/if}</span>
      </footer>
    </aside>
    {#if local}
      <nav class="hand compact-hand" style={`--hand-count: ${Math.max(1, player.bonusHand.length)}`} aria-label="Private Bonus hand" data-e2e-fit data-e2e-no-scroll>
        <span class="visually-hidden">Private hand</span>
        {#each player.bonusHand as cardId}
          <button aria-label={`Inspect Bonus card: ${bonusById.get(cardId)?.title}`} aria-pressed={selectedBonus === cardId} onclick={() => onInspectBonus(cardId)}>
            <BonusCard card={bonusById.get(cardId)!} compact class="tray-hand-card" artClass="hand-card-art" />
          </button>
        {/each}
      </nav>
    {/if}
  </div>
{:else}
<div class="tray-stage" data-testid={`player-tray-${player.uid}`} data-player-color={player.color} data-component="PlayerTray" data-e2e-fit>
  <GameArt kind="mat" color={player.color as PlayerColorName} class="player-mat-art" />

  <div class="tray-name">
    {#if starting}<GameArt kind="piece" piece="first-player" class="first-player-art" />{:else}<span class={`player-dot ${player.color}`}></span>{/if}
    <strong>{player.name}{local ? ' · you' : ''}</strong>
    <small>{starting ? 'Start player' : `Seat ${seat}`}</small>
    <span class="assistant-count"><PlayingPiece piece="assistant" color={player.color as PlayerColorName} /><b>{player.assistantsCarried}</b></span>
  </div>

  <div class="goods-tracks" aria-label={`${player.name} goods`}>
    {#each goods as good, index}
      <span
        class={`good-marker ${good}`}
        class:empty={player.goods[good] === 0}
        style={`--column: ${index}; --level: ${Math.max(1, player.goods[good])}`}
        title={goodNames[good]}
        data-count={player.goods[good]}
      ><GameArt kind="component" component={good} renderSize="compact" class="good-art" /><b>{player.goods[good]}</b></span>
    {/each}
    {#each goods as _, index}<i class="capacity-gate" style={`--column: ${index}; --capacity: ${player.capacity}`} aria-hidden="true"></i>{/each}
  </div>

  <div class="extension-track" aria-label={`${player.extensions} of 3 wheelbarrow extensions`}>
    {#each Array(3) as _, index}<span class:filled={index < player.extensions}>{#if index < player.extensions}<GameArt kind="component" component="wheelbarrow" />{/if}</span>{/each}
  </div>

  <div class="ruby-wells" aria-label={`${player.rubies} rubies`}>
    {#each Array(6) as _, index}<span class:filled={index < player.rubies}>{#if index < player.rubies}<GameArt kind="component" component="ruby" renderSize="compact" />{/if}</span>{/each}
  </div>

  <div class="coin-purse" aria-label={`${player.lira} Lira`}><GameArt kind="component" component="lira" /><b>{player.lira}</b></div>

  <div class="power-bank" aria-label={`${player.name} Mosque tiles`}>
    {#each goods as color}
      {@const power = ownedPower(color)}
      <span class:enabled={Boolean(power)} class={`power-slot ${color}`} data-enabled={Boolean(power)} data-power-color={color} title={power?.ability ?? `${powerNames[color]} Mosque power not acquired`}>
        {#if power}<GameArt kind="component" component={`mosque-${color}` as `mosque-${Good}`} class="power-tile" label={`${powerNames[color]} Mosque power: ${power.ability}`} /><b class="visually-hidden">{powerNames[color]}</b>{/if}
      </span>
    {/each}
  </div>

  <div class="card-well" aria-label={`${player.bonusHand.length} Bonus cards`}>
    {#if player.bonusHand.length}<BonusCard reverse="card-back" compact class="well-card" /><b>{player.bonusHand.length}</b>{/if}
  </div>
</div>

{#if local}
  <div class="hand" data-e2e-fit data-e2e-no-scroll><span>Private hand</span>{#each player.bonusHand as cardId}<button aria-label={`Inspect Bonus card: ${bonusById.get(cardId)?.title}`} aria-pressed={selectedBonus === cardId} onclick={() => onInspectBonus(cardId)}><BonusCard card={bonusById.get(cardId)!} compact class="tray-hand-card" artClass="hand-card-art" /></button>{/each}</div>
{:else}
  <p class="masked-hand" data-e2e-fit data-e2e-no-scroll><BonusCard reverse="card-back" compact class="masked-card-art" />Bonus hand · {player.bonusHand.length} hidden card{player.bonusHand.length === 1 ? '' : 's'}</p>
{/if}
{/if}

<style>
  .visually-hidden { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .compact-tray { --player-accent: #28796f; --player-deep: #143b3b; container-type: inline-size; position: relative; width: 100%; aspect-ratio: 1; min-height: 0; overflow: hidden; border: 2px solid color-mix(in srgb, var(--player-accent) 76%, #efca7d); border-radius: 2.2%; color: #fffaf0; background: linear-gradient(color-mix(in srgb, var(--player-accent) 11%, transparent), color-mix(in srgb, var(--player-deep) 15%, transparent)), var(--tray-art) center / 100% 100% no-repeat; box-shadow: inset 0 0 1.4rem rgb(0 0 0 / 18%), 0 .2rem .45rem rgb(0 0 0 / 32%); text-shadow: 0 1px 2px #000; }
  .compact-tray[data-player-color='ruby'] { --player-accent: #a63e3a; --player-deep: #4b2220; }
  .compact-tray[data-player-color='saffron'] { --player-accent: #c98c28; --player-deep: #4f371d; }
  .compact-tray[data-player-color='teal'] { --player-accent: #28796f; --player-deep: #143b3b; }
  .compact-tray[data-player-color='indigo'] { --player-accent: #43588f; --player-deep: #222c50; }
  .compact-tray[data-player-color='plum'] { --player-accent: #73466e; --player-deep: #3d273d; }
  .compact-tray > header { position: absolute; z-index: 4; top: 2.5%; right: 2.5%; left: 2.5%; height: 8.5%; min-width: 0; }
  .compact-tray header > span:nth-child(2) { min-width: 0; display: grid; }
  .compact-tray header strong { overflow: hidden; font: 700 clamp(.5rem, 6.5cqi, 1rem)/1 'Cormorant Garamond', serif; text-overflow: ellipsis; white-space: nowrap; }
  .compact-tray header > :global(.compact-first-player), .compact-tray header > .player-dot { position: absolute; top: 8%; left: 13%; width: 8%; aspect-ratio: 1; height: auto; }
  .compact-tray header > span:nth-child(2) { position: absolute; top: 20%; left: 30%; width: 40%; text-align: center; }
  .compact-merchant { position: absolute; top: 0; right: 12%; width: 10.7%; aspect-ratio: 1; display: grid; place-items: center; }
  .compact-merchant :global(.playing-piece) { width: 100%; height: 100%; aspect-ratio: 1; }
  .compact-merchant b { position: absolute; right: -8%; bottom: -8%; width: 52%; aspect-ratio: 1; display: grid; place-items: center; border-radius: 50%; background: #a13c38; font-size: clamp(.3rem, 3cqi, .52rem); }
  .compact-sidebar { position: absolute; z-index: 2; inset: 0; min-width: 0; min-height: 0; overflow: hidden; pointer-events: none; }
  .compact-powers { position: absolute; top: 13.2%; left: 64.6%; width: 29.4%; height: 29.8%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(0, 1fr)); gap: 3.5%; }
  .compact-powers > span { min-width: 0; min-height: 0; display: grid; place-items: center; overflow: hidden; border: 0; border-radius: 6%; background: transparent; }
  .compact-powers > span.enabled { background: rgb(255 250 239 / 5%); }
  .compact-powers :global(.game-art) { width: 88%; height: 88%; border-radius: 5%; box-shadow: 0 .08rem .2rem #000a; }
  .compact-powers i { width: 34%; aspect-ratio: 1; border: 1px dashed rgb(239 202 125 / 28%); border-radius: .2rem; }
  .compact-rubies { position: absolute; inset: 0; }
  .compact-rubies span { position: absolute; width: 9%; aspect-ratio: 1; display: grid; place-items: center; overflow: hidden; border: 0; border-radius: 50%; background: transparent; }
  .compact-rubies span:nth-child(1) { top: 47.95%; left: 63.95%; }
  .compact-rubies span:nth-child(2) { top: 47.95%; left: 74.85%; }
  .compact-rubies span:nth-child(3) { top: 47.95%; left: 85.05%; }
  .compact-rubies span:nth-child(4) { top: 58.55%; left: 63.95%; }
  .compact-rubies span:nth-child(5) { top: 58.55%; left: 74.85%; }
  .compact-rubies span:nth-child(6) { top: 58.55%; left: 85.05%; }
  .compact-rubies span.filled { background: rgb(75 23 25 / 24%); }
  .compact-rubies :global(.game-art) { width: 90%; height: 90%; border-radius: 50%; background-size: contain; filter: none; }
  .compact-tray footer { position: absolute; inset: 0; }
  .compact-tray footer > span { position: absolute; top: 72.5%; height: 19.4%; min-width: 0; min-height: 0; display: grid; place-items: center; overflow: hidden; border-radius: 4%; background: transparent; }
  .compact-tray footer > span:first-child { left: 63.1%; width: 15.6%; }
  .compact-tray footer > span:last-child { left: 79.8%; width: 15.3%; }
  .compact-tray footer > span:first-child :global(.game-art) { width: 62%; height: auto; aspect-ratio: 1; }
  .compact-tray footer > span:last-child :global(.tray-card-indicator) { width: 52%; }
  .compact-tray footer b { position: absolute; right: 7%; bottom: 6%; width: 29%; min-width: 0; aspect-ratio: 1; display: grid; place-items: center; border: 1px solid #f2d68d; border-radius: 50%; background: #a13c38; font-size: clamp(.25rem, 2.8cqi, .45rem); line-height: 1; }
  .compact-tray .compact-hand { position: absolute; z-index: 2; right: 4%; bottom: 3%; left: 4%; height: 45%; min-width: 0; min-height: 0; display: grid; grid-template-columns: repeat(var(--hand-count), minmax(0, 1fr)); gap: 1%; overflow: hidden; margin: 0; padding: 1%; border: 1px solid rgb(239 202 125 / 72%); border-radius: 3%; background: rgb(5 29 31 / 94%); box-shadow: 0 -.2rem .7rem rgb(0 0 0 / 35%); }
  .compact-tray .compact-hand button { width: 100%; min-width: 0; min-height: 0; display: grid; place-items: end center; overflow: hidden; padding: 0; border: 0; background: transparent; }
  .compact-tray .compact-hand :global(.tray-hand-card) { width: min(100%, 22cqi); }
  .tray-stage { position: relative; width: 100%; aspect-ratio: 853 / 250; min-height: 0; overflow: hidden; color: #fffaf0; text-shadow: 0 1px 2px #000; }
  :global(.player-mat-art) { position: absolute; z-index: 0; inset: 0; opacity: 1; filter: none; }
  .tray-stage > :not(:global(.player-mat-art)) { position: absolute; z-index: 1; }
  .tray-name { top: 3%; left: 44%; width: 33%; height: 21%; display: grid; grid-template-columns: 13% 1fr 19%; grid-template-rows: 1fr 1fr; gap: 0 3%; align-items: center; overflow: hidden; padding: 1% 3%; text-align: left; }
  .tray-name > :global(.first-player-art), .tray-name > .player-dot { grid-row: 1 / 3; width: 100%; aspect-ratio: 1; }
  .player-dot { display: block; border: 2px solid #f0cd80; border-radius: 50%; box-shadow: inset 0 0 0 1px #fffaf0; }
  .ruby { background: #a63e3a; }.saffron { background: #c98c28; }.teal { background: #28796f; }.indigo { background: #43588f; }.plum { background: #73466e; }
  .tray-name strong { min-width: 0; overflow: hidden; font-size: clamp(.5rem, 1.2vw, .78rem); line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
  .tray-name small { color: #eadfc9; font-size: clamp(.34rem, .7vw, .53rem); }
  .assistant-count { grid-column: 3; grid-row: 1 / 3; display: flex; align-items: center; justify-content: center; }
  .assistant-count :global(.playing-piece) { width: 80%; aspect-ratio: 1; }
  .assistant-count b, .coin-purse b, .card-well b, .good-marker b { position: absolute; min-width: 1.05rem; padding: .12rem; border: 1px solid #f2d68d; border-radius: 50%; color: #fffaf0; text-align: center; background: #123c3e; font-size: clamp(.38rem, .8vw, .625rem); line-height: 1; }
  .assistant-count b { right: -8%; bottom: -4%; }
  .goods-tracks { top: 15%; left: 7%; width: 36%; height: 59%; }
  .good-marker { position: absolute; z-index: 2; left: calc(var(--column) * 25% + 5%); top: calc(87% - (var(--level) - 1) * 17.5%); width: 16%; aspect-ratio: 1; translate: 0 -50%; filter: drop-shadow(0 2px 2px #000a); transition: top .2s ease; }
  .good-marker.empty { top: 87%; opacity: .28; filter: grayscale(1); }
  .good-marker :global(.game-art) { width: 100%; height: 100%; }
  .good-marker b { right: -35%; bottom: -20%; }
  .capacity-gate { position: absolute; z-index: 1; left: calc(var(--column) * 25% + 1%); top: calc(94% - (var(--capacity) - 1) * 17.5%); width: 23%; height: 2px; border-radius: 2px; background: #f4d981; box-shadow: 0 0 0 1px #4b2716, 0 0 .25rem #f4d981; }
  .extension-track { top: 77%; left: 15%; width: 26%; height: 18%; display: grid; grid-template-columns: repeat(3, 1fr); gap: 2%; }
  .extension-track span { display: grid; place-items: center; opacity: .25; }
  .extension-track span.filled { opacity: 1; }
  .extension-track :global(.game-art) { width: 82%; height: 82%; filter: drop-shadow(0 2px 2px #000); }
  .ruby-wells { top: 79%; left: 45%; width: 33%; height: 16%; display: grid; grid-template-columns: repeat(6, 1fr); gap: 1%; }
  .ruby-wells span { display: grid; place-items: center; }
  .ruby-wells :global(.game-art) { width: 92%; height: 92%; background-size: contain; filter: none; }
  .coin-purse { top: 30%; left: 75%; width: 11%; height: 40%; display: grid; place-items: center; }
  .coin-purse :global(.game-art) { width: 72%; height: 72%; }
  .coin-purse b { right: 2%; bottom: 4%; }
  .power-bank { top: 28%; left: 49%; width: 20%; height: 43%; display: grid; grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(2, 1fr); gap: 4%; }
  .power-slot { min-width: 0; min-height: 0; display: grid; place-items: center; border-radius: 9%; }
  .power-slot.enabled { animation: settle-power .35s ease-out; }
  .power-slot :global(.power-tile) { width: 94%; height: 94%; border-radius: 8%; box-shadow: 0 3px 4px #0009; }
  .card-well { top: 22%; left: 89%; width: 7%; height: 50%; display: grid; place-items: center; }
  .card-well :global(.well-card) { width: 52%; border-radius: .18rem; box-shadow: 0 2px 3px #0009; }
  .card-well b { right: -12%; bottom: 2%; }
  .hand, .masked-hand { min-height: 2.4rem; display: flex; gap: .4rem; align-items: end; margin: 0; padding: .3rem .55rem .4rem; color: #eadfc9; background: #24170f; }
  .hand > span { font-size: .55rem; text-transform: uppercase; }
  .hand button { position: relative; width: 3.25rem; min-width: 0; min-height: 0; display: grid; overflow: hidden; padding: 0; border: 0; border-radius: .35rem; color: #fffaf0; text-align: left; background: transparent; }
  .hand :global(.tray-hand-card) { width: 100%; }
  .hand button[aria-pressed='true'] { outline: 2px solid #e7b64c; }
  .masked-hand { font-size: .62rem; }:global(.masked-card-art) { width: 1.45rem; border-radius: .15rem; box-shadow: 0 .1rem .2rem #0008; }
  @keyframes settle-power { from { scale: 1.2; translate: 0 -.35rem; filter: brightness(1.5); } to { scale: 1; translate: 0; filter: none; } }
  @media (max-width: 720px) {
    .tray-name { padding: 0 2%; }.tray-name strong { font-size: .45rem; }.tray-name small { display: none; }.tray-name :global(.first-player-art), .tray-name .player-dot { width: 90%; }
    .assistant-count b, .coin-purse b, .card-well b, .good-marker b { min-width: .68rem; padding: .08rem; font-size: .34rem; }
    .hand { min-width: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .15rem; padding: .2rem .35rem; }.hand > span { grid-column: 1 / -1; }.hand button { width: 100%; }
    .masked-hand { min-height: 1.8rem; padding: .15rem .35rem; font-size: .48rem; }:global(.masked-card-art) { width: 1rem; }
  }
  @media (prefers-reduced-motion: reduce) { .good-marker { transition: none; }.power-slot.enabled { animation: none; } }
</style>
