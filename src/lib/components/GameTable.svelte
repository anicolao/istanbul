<script lang="ts">
  import { base } from '$app/paths';
  import { bonusCards, places, type Good } from '$lib/game/manifests';
  import type { RoomProjection } from '$lib/game/protocol';
  import type { GameSetup } from '$lib/game/setup';
  import PlaceGlyph from './PlaceGlyph.svelte';

  let {
    game,
    room,
    userUid,
    selectedPlace,
    selectedBonus,
    boardScale,
    onInspectPlace,
    onInspectBonus,
    onZoomIn,
    onFit
  }: {
    game: GameSetup;
    room: RoomProjection;
    userUid: string;
    selectedPlace: number | null;
    selectedBonus: string | null;
    boardScale: number;
    onInspectPlace: (place: number) => void;
    onInspectBonus: (cardId: string) => void;
    onZoomIn: () => void;
    onFit: () => void;
  } = $props();

  const placeById = new Map(places.map((place) => [place.id, place]));
  const bonusById = new Map(bonusCards.map((card) => [card.id, card]));
  const localPlayer = $derived(game.players.find((player) => player.uid === userUid)!);
  const currentPlayer = $derived(game.players[game.turnSeat]);
  const selectedPlaceManifest = $derived(selectedPlace ? placeById.get(selectedPlace) : null);
  const selectedBonusManifest = $derived(selectedBonus ? bonusById.get(selectedBonus) : null);
  const goodNames: Record<Good, string> = { fabric: 'Fabric', spice: 'Spice', fruit: 'Fruit', jewelry: 'Jewelry' };
  const artUrl = `${base}/art/bazaar-courtyard.png`;

  function occupants(placeId: number) {
    return game.players.filter(({ merchantPlace }) => merchantPlace === placeId);
  }
</script>

<section class="game-table" aria-labelledby="game-title" style={`--courtyard: url('${artUrl}')`}>
  <header class="turn-banner">
    <div><p>Turn {game.turnNumber} · Movement</p><h1 id="game-title">{currentPlayer.name} surveys the bazaar.</h1></div>
    <div class="turn-token"><span class={`player-dot ${currentPlayer.color}`}></span><strong>{currentPlayer.name}</strong><small>{currentPlayer.uid === userUid ? 'Your turn' : 'Planning route'}</small></div>
  </header>

  <div class="play-area">
    <section class="board-shell" aria-label="Istanbul bazaar board">
      <div class="board-tools" aria-label="Board view controls">
        <button class="zoom-button" onclick={onZoomIn} aria-label="Zoom board in"><span aria-hidden="true"></span></button>
        <button onclick={onFit}>Fit board</button>
      </div>
      <div class="board-viewport">
        <div class="board" style={`--board-scale: ${boardScale}`} data-testid="bazaar-board">
          {#each game.board as placeId, index}
            {@const place = placeById.get(placeId)!}
            {@const here = occupants(placeId)}
            <button
              class:selected={selectedPlace === placeId}
              class={`place family-${place.family}`}
              style={`--row: ${Math.floor(index / 4)}; --column: ${index % 4}`}
              aria-label={`${place.id} ${place.name}. ${place.action}${here.length ? ` Merchants: ${here.map(({ name }) => name).join(', ')}.` : ''}`}
              aria-pressed={selectedPlace === placeId}
              onclick={() => onInspectPlace(placeId)}
            >
              <span class="place-number">{place.id}</span>
              <span class="place-glyph"><PlaceGlyph glyph={place.glyph} /></span>
              <strong>{place.shortName}</strong>
              <span class="occupants" aria-hidden="true">
                {#each here as merchant}<span class={`merchant ${merchant.color}`}>{merchant.name.slice(0, 1)}</span>{/each}
                {#each game.neutralMerchants.filter(({ place: neutralPlace }) => neutralPlace === placeId) as neutral}<span class="merchant neutral">N</span>{/each}
              </span>
              {#if placeId === game.governorPlace}<span class="encounter governor" title="Governor">G</span>{/if}
              {#if placeId === game.smugglerPlace}<span class="encounter smuggler" title="Smuggler">S</span>{/if}
            </button>
          {/each}
        </div>
      </div>
      <p class="board-caption">{room.layout.replace('-', ' ')} · setup seed {game.seed}</p>
    </section>

    <aside class="inspector" aria-live="polite">
      {#if selectedBonusManifest}
        <p class="section-kicker">Private Bonus card</p>
        <h2>{selectedBonusManifest.title}</h2>
        <p class="mobile-card-text">{selectedBonusManifest.text}</p>
        <div class="large-card"><span>Bonus</span><strong>{selectedBonusManifest.title}</strong><p>{selectedBonusManifest.text}</p></div>
      {:else if selectedPlaceManifest}
        <p class="section-kicker">Place {selectedPlaceManifest.id}</p>
        <h2>{selectedPlaceManifest.name}</h2>
        <div class="inspector-glyph"><PlaceGlyph glyph={selectedPlaceManifest.glyph} /></div>
        <p>{selectedPlaceManifest.action}</p>
        <dl><div><dt>Grid position</dt><dd>Row {Math.floor(game.board.indexOf(selectedPlaceManifest.id) / 4) + 1}, column {(game.board.indexOf(selectedPlaceManifest.id) % 4) + 1}</dd></div><div><dt>Merchants here</dt><dd>{occupants(selectedPlaceManifest.id).map(({ name }) => name).join(', ') || 'None'}</dd></div></dl>
      {:else}
        <p class="section-kicker">Route planner</p>
        <h2>Inspect any Place</h2>
        <p>Select a tile to read its action, exact grid position, and current occupants. Movement opens on the next turn slice.</p>
        <div class="encounter-ledger"><span><i class="governor">G</i> Governor at {game.governorPlace}</span><span><i class="smuggler">S</i> Smuggler at {game.smugglerPlace}</span></div>
        <dl class="supply-ledger" aria-label="Public component supply">
          <div><dt>Bonus draw pile</dt><dd>{game.bonusDrawPile.length}</dd></div>
          <div><dt>Mosque tiles</dt><dd>{Object.values(game.mosqueStacks).flat().length}</dd></div>
          <div><dt>Market demands</dt><dd>{game.largeDemand.length + game.smallDemand.length}</dd></div>
          <div><dt>Wheelbarrow extensions</dt><dd>{game.supplies.wheelbarrowExtensions}</dd></div>
          <div><dt>Ruby supply</dt><dd>{game.supplies.wainwrightRubies + game.supplies.smallMosqueRubies + game.supplies.greatMosqueRubies}</dd></div>
        </dl>
      {/if}
    </aside>
  </div>

  <section class="player-rail" aria-label="Player resources" style={`--players: ${game.players.length}`}>
    {#each game.players as player, index}
      <article class:local={player.uid === userUid} aria-label={`${player.name} resources`}>
        <div class="player-name"><span class={`player-dot ${player.color}`}></span><strong>{player.name}{player.uid === userUid ? ' · you' : ''}</strong><small>{index === game.startingSeat ? 'Start player' : `Seat ${index + 1}`}</small></div>
        <dl class="resources"><div><dt>Lira</dt><dd>{player.lira}</dd></div><div><dt>Rubies</dt><dd>{player.rubies}</dd></div><div><dt>Capacity</dt><dd>{player.capacity}</dd></div><div><dt>Assistants</dt><dd>{player.assistantsCarried}</dd></div></dl>
        <div class="goods" aria-label={`${player.name} goods`}>{#each Object.entries(player.goods) as [good, count]}<span class={`good ${good}`} title={goodNames[good as Good]}><i></i>{count}</span>{/each}</div>
        {#if player.uid === userUid}
          <div class="hand"><span>Private hand</span>{#each player.bonusHand as cardId}<button aria-label={`Inspect Bonus card: ${bonusById.get(cardId)?.title}`} aria-pressed={selectedBonus === cardId} onclick={() => onInspectBonus(cardId)}><small>Bonus</small><strong>{bonusById.get(cardId)?.title}</strong></button>{/each}</div>
        {:else}<p class="masked-hand">Bonus hand · {player.bonusHand.length} hidden card</p>{/if}
      </article>
    {/each}
  </section>
</section>

<style>
  .game-table { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: .65rem; color: #fffaf0; }
  .turn-banner { min-height: 4.4rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .55rem 1.1rem; border: 1px solid rgb(239 202 125 / 35%); border-radius: 1rem; background: linear-gradient(100deg, rgb(13 48 51 / 96%), rgb(28 76 75 / 92%)); box-shadow: 0 .8rem 2rem rgb(35 21 9 / 22%); }
  .turn-banner p, .section-kicker { margin: 0; color: #efca7d; font-size: .68rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .turn-banner h1 { margin: .1rem 0 0; font: 700 clamp(1.65rem, 3vw, 2.5rem)/.95 'Cormorant Garamond', serif; }
  .turn-token { display: grid; grid-template-columns: 1.8rem auto; gap: 0 .55rem; align-items: center; }
  .turn-token .player-dot { grid-row: 1 / 3; }
  .turn-token small { color: #bdd0ca; }
  .player-dot { width: 1.7rem; height: 1.7rem; display: inline-block; border: 3px solid #f0cd80; border-radius: 50%; box-shadow: inset 0 0 0 2px #fffaf0; }
  .ruby { background: #a63e3a; }.saffron { background: #c98c28; }.teal { background: #28796f; }.indigo { background: #43588f; }.plum { background: #73466e; }
  .play-area { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(15rem, .3fr); gap: .65rem; }
  .board-shell { position: relative; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgb(239 202 125 / 35%); border-radius: 1rem; background: linear-gradient(rgb(7 31 34 / 47%), rgb(7 31 34 / 68%)), var(--courtyard) center / cover; box-shadow: inset 0 0 5rem rgb(0 0 0 / 38%); }
  .board-tools { position: absolute; z-index: 5; top: .5rem; right: .5rem; display: flex; gap: .3rem; }
  .board-tools button { min-height: 2rem; padding: .3rem .65rem; border: 1px solid rgb(255 255 255 / 32%); border-radius: 2rem; color: #fffaf0; background: rgb(10 44 47 / 80%); font: inherit; font-size: .72rem; font-weight: 700; }
  .board-tools .zoom-button { width: 2rem; padding: 0; display: grid; place-items: center; }
  .zoom-button span { position: relative; width: .7rem; height: .7rem; display: block; }
  .zoom-button span::before, .zoom-button span::after { position: absolute; inset: calc(50% - 1px) 0 auto; height: 2px; border-radius: 1px; background: currentColor; content: ''; }
  .zoom-button span::after { rotate: 90deg; }
  .board-viewport { flex: 1; min-height: 0; display: grid; place-items: center; overflow: hidden; padding: 2.4rem 1.2rem 1rem; }
  .board { width: min(100%, 42rem); aspect-ratio: 1.42; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: .42rem; scale: var(--board-scale); transform-origin: center; transition: scale .2s ease; }
  .place { position: relative; min-width: 0; min-height: 0; display: grid; grid-template-columns: 2rem 1fr; grid-template-rows: 1fr auto; gap: .15rem .3rem; align-items: center; overflow: hidden; padding: .42rem; border: 1px solid rgb(255 250 240 / 60%); border-radius: .55rem; color: #173f43; text-align: left; background: linear-gradient(150deg, rgb(255 252 239 / 96%), rgb(223 199 151 / 96%)); box-shadow: 0 .35rem .7rem rgb(0 0 0 / 30%); cursor: pointer; }
  .place::after { position: absolute; inset: 0; border: 3px solid transparent; border-radius: inherit; content: ''; pointer-events: none; }
  .place.selected::after { border-color: #e2574f; box-shadow: inset 0 0 0 2px #fff7d6; }
  .place-number { position: absolute; top: .25rem; right: .3rem; color: #a43b32; font-size: .7rem; font-weight: 700; }
  .place-glyph { width: 1.9rem; height: 1.9rem; color: #426c68; }
  .place strong { align-self: end; overflow: hidden; font-size: clamp(.58rem, 1vw, .78rem); line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
  .family-ruby { background: linear-gradient(150deg, #fff4df, #dfb36d); }.family-warehouse { background: linear-gradient(150deg, #fffced, #d9e4c2); }.family-chance { background: linear-gradient(150deg, #f5eee5, #d7bed1); }
  .occupants { grid-column: 1 / -1; min-height: 1.2rem; display: flex; gap: .12rem; align-items: end; }
  .merchant { width: 1.1rem; height: 1.1rem; display: grid; place-items: center; border: 1px solid #fffaf0; border-radius: 50%; color: #fff; font-size: .52rem; font-weight: 700; box-shadow: 0 .1rem .2rem #0005; }
  .merchant.neutral { color: #173f43; background: #ece7d8; }
  .encounter { position: absolute; right: .25rem; bottom: .25rem; width: 1rem; height: 1rem; display: grid; place-items: center; border-radius: .2rem; color: #fff; font-size: .5rem; font-weight: 700; }
  .governor { background: #744c8b; }.smuggler { background: #263235; }
  .board-caption { margin: 0; padding: .28rem .7rem; color: #d3dfd8; font-size: .62rem; text-align: center; text-transform: capitalize; background: rgb(5 29 31 / 58%); }
  .inspector { min-height: 0; overflow: hidden; padding: 1rem; border: 1px solid rgb(23 63 67 / 18%); border-radius: 1rem; color: #173f43; background: rgb(255 250 239 / 94%); }
  .inspector h2 { margin: .15rem 0 .6rem; font: 700 1.8rem/1 'Cormorant Garamond', serif; }
  .inspector > p:not(.section-kicker) { color: #526b68; font-size: .84rem; line-height: 1.4; }
  .inspector-glyph { width: 4.3rem; height: 4.3rem; padding: .6rem; border-radius: 50%; color: #a43b32; background: #eed8aa; }
  .inspector dl { margin: 1rem 0 0; font-size: .72rem; }
  .inspector dl div { display: grid; gap: .1rem; padding: .5rem 0; border-top: 1px solid #d9cdb7; }.inspector dt { color: #73817e; }.inspector dd { margin: 0; font-weight: 700; }
  .encounter-ledger { display: grid; gap: .5rem; margin-top: 1rem; }.encounter-ledger span { display: flex; align-items: center; gap: .5rem; font-size: .75rem; font-weight: 700; }.encounter-ledger i { width: 1.5rem; height: 1.5rem; display: grid; place-items: center; border-radius: .3rem; color: #fff; font-style: normal; }
  .supply-ledger { display: grid; grid-template-columns: 1fr 1fr; gap: 0 .7rem; margin-top: .8rem !important; }.supply-ledger div { grid-template-columns: 1fr auto; align-items: baseline; }.supply-ledger dd { color: #a43b32; font-size: .9rem; }
  .large-card { min-height: 13rem; display: flex; flex-direction: column; justify-content: space-between; padding: 1rem; border: 2px solid #d49d42; border-radius: .8rem; color: #fffaf0; background: radial-gradient(circle at 80% 15%, #d27a40, transparent 5rem), #a23b36; box-shadow: 0 .8rem 1.4rem #4b2c2240; }.large-card > span { font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; }.large-card strong { font: 700 1.5rem/1 'Cormorant Garamond', serif; }.large-card p { margin: 0; font-size: .78rem; }
  .mobile-card-text { display: none; }
  .player-rail { display: grid; grid-template-columns: repeat(var(--players, 2), minmax(0, 1fr)); grid-auto-flow: column; gap: .5rem; }
  .player-rail article { min-width: 0; display: grid; grid-template-columns: auto 1fr auto; gap: .35rem .7rem; padding: .55rem .7rem; border: 1px solid rgb(239 202 125 / 30%); border-radius: .85rem; color: #173f43; background: rgb(255 250 239 / 92%); }.player-rail article.local { outline: 2px solid #e7b64c; }
  .player-name { display: grid; grid-template-columns: 1.55rem auto; align-items: center; }.player-name .player-dot { grid-row: 1 / 3; width: 1.4rem; height: 1.4rem; margin-right: .35rem; }.player-name small { color: #6d7c79; font-size: .6rem; }
  .resources { display: flex; margin: 0; }.resources div { padding: 0 .45rem; border-left: 1px solid #d9cdb7; text-align: center; }.resources dt { color: #6d7c79; font-size: .52rem; text-transform: uppercase; }.resources dd { margin: 0; font-weight: 700; }
  .goods { display: flex; gap: .25rem; align-items: center; }.good { display: flex; gap: .15rem; align-items: center; font-size: .65rem; font-weight: 700; }.good i { width: .65rem; height: .65rem; border-radius: .16rem; }.good.fabric i { background: #b7423c; }.good.spice i { background: #3b8662; }.good.fruit i { background: #d6a82c; }.good.jewelry i { background: #4382a9; }
  .hand { grid-column: 1 / -1; display: flex; gap: .4rem; align-items: center; border-top: 1px solid #d9cdb7; padding-top: .35rem; font-size: .62rem; }.hand > span { color: #6d7c79; text-transform: uppercase; }.hand button { max-width: 12rem; display: grid; padding: .28rem .5rem; border: 1px solid #c98948; border-radius: .35rem; color: #fffaf0; text-align: left; background: #a23b36; }.hand button[aria-pressed='true'] { outline: 2px solid #e7b64c; }.hand button small { font-size: .48rem; text-transform: uppercase; }.hand button strong { overflow: hidden; font-size: .62rem; text-overflow: ellipsis; white-space: nowrap; }
  .masked-hand { grid-column: 1 / -1; margin: 0; padding-top: .35rem; border-top: 1px solid #d9cdb7; color: #6d7c79; font-size: .62rem; }
  @media (max-width: 720px) {
    .game-table { gap: .4rem; }
    .turn-banner { min-height: 3.4rem; padding: .35rem .6rem; }.turn-banner h1 { font-size: 1.45rem; }.turn-token { font-size: .7rem; }.turn-token small { font-size: .55rem; }
    .play-area { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; gap: .4rem; }
    .board-viewport { padding: 2.1rem .4rem .35rem; }.board { width: 100%; aspect-ratio: 1.18; gap: .25rem; }.place { grid-template-columns: 1.35rem 1fr; padding: .24rem; border-radius: .38rem; }.place-glyph { width: 1.25rem; height: 1.25rem; }.place strong { display: -webkit-box; overflow: hidden; font-size: .52rem; line-height: .88; white-space: normal; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }.place-number { font-size: .5rem; }.occupants { min-height: .85rem; }.merchant { width: .8rem; height: .8rem; font-size: .4rem; }.encounter { width: .7rem; height: .7rem; font-size: .38rem; }
    .inspector { min-height: 5.5rem; max-height: 8rem; display: grid; grid-template-columns: auto 1fr; gap: .2rem .7rem; align-content: center; padding: .55rem .7rem; }.inspector .section-kicker, .inspector h2, .inspector > p { grid-column: 2; }.inspector h2 { margin: 0; font-size: 1.35rem; }.inspector > p:not(.section-kicker) { margin: 0; font-size: .65rem; }.inspector-glyph { grid-column: 1; grid-row: 1 / 4; width: 3rem; height: 3rem; }.inspector dl { grid-column: 1 / -1; display: flex; gap: .8rem; margin: 0; }.inspector dl div { padding: .15rem 0; border: 0; font-size: .55rem; }.encounter-ledger, .supply-ledger, .large-card { display: none; }.mobile-card-text { display: block; }
    .player-rail { grid-auto-flow: row; grid-template-columns: 1fr 1fr; gap: .3rem; }.player-rail article { padding: .35rem .45rem; grid-template-columns: 1fr auto; gap: .2rem; }.resources { display: none; }.goods { justify-content: end; }.hand, .masked-hand { padding-top: .2rem; }.hand button { max-width: 8rem; }.player-name { font-size: .72rem; }
  }
  @media (prefers-reduced-motion: reduce) { .board { transition: none; } }
</style>
