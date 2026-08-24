<script lang="ts">
  import { tablePositionNames, tablePositions, type LayoutKind, type RoomProjection, type TablePosition } from '$lib/game/protocol';
  import SeatQr from './SeatQr.svelte';

  let {
    room, invitationFor, layoutNames, canConfigure = false, canStart = false, actionPending = false,
    onConfigure = () => {}, onStart = () => {}
  }: {
    room: RoomProjection;
    invitationFor: (position: TablePosition) => string;
    layoutNames: Record<LayoutKind, string>;
    canConfigure?: boolean;
    canStart?: boolean;
    actionPending?: boolean;
    onConfigure?: (layout: LayoutKind) => void;
    onStart?: () => void;
  } = $props();
</script>

<section class="table-lobby" aria-labelledby="shared-table-title">
  <header>
    <div><p>Dedicated tabletop · room {room.roomCode}</p><h1 id="shared-table-title">Choose your place.</h1><span class="table-instruction">Scan the invitation nearest your physical seat, then join and ready on your private controller.</span></div>
    <div class="room-code"><span>Join code</span><strong>{room.roomCode}</strong></div>
  </header>

  <div class="table-map" aria-label="Eight physical positions around the tabletop">
    {#each tablePositions as position}
      {@const seat = room.seats.find((candidate) => candidate.tablePosition === position)}
      <article class:claimed={seat} class={`position-${position}`} aria-label={`Position ${position}, ${tablePositionNames[position]}${seat ? `, claimed by ${seat.name}` : ', open'}`}>
        <span class="seat-number">Position {position} · {tablePositionNames[position]}</span>
        {#if seat}
          <div class="claimed-token">{seat.name.slice(0, 1).toUpperCase()}</div>
          <h2>{seat.name}</h2><p>{seat.ready ? 'Ready at this position' : 'Planning at this position'}</p>
        {:else if room.seats.length < room.maxPlayers}
          <SeatQr url={invitationFor(position)} label={`Join position ${position}`} />
        {:else}
          <div class="closed-position" aria-hidden="true">◆</div><h2>Table full</h2><p>This position remains open around the table.</p>
        {/if}
      </article>
    {/each}

    <section class="table-centre" aria-label="Tabletop game controls">
      <div><p class="order-rule">Clockwise order</p><strong>A random occupied position becomes Player 1.</strong><span>Every later player follows clockwise around the table, skipping empty positions.</span></div>
      <label>Table layout
        <select value={room.layout} onchange={(event) => onConfigure(event.currentTarget.value as LayoutKind)} disabled={!canConfigure || actionPending}>
          <option value="short-path">Short Path</option><option value="long-path">Long Path</option><option value="number-order">Number Order</option><option value="random">Seeded Random</option>
        </select>
      </label>
      <p class="ready-copy"><strong>{layoutNames[room.layout]}</strong><span>{room.seats.length < 2 ? 'At least two merchants must join.' : canStart ? 'Everyone here is ready.' : 'Waiting for every joined merchant to ready.'}</span></p>
      <button onclick={onStart} disabled={!canStart || actionPending}>Open the bazaar</button>
    </section>
  </div>

  <footer><strong>{room.seats.filter(({ ready }) => ready).length}/{room.seats.length} ready · {room.maxPlayers - room.seats.length} merchant spots remaining</strong><span>Eight physical positions · two to five merchants · phones keep Bonus cards private</span></footer>
</section>

<style>
  .table-lobby { height: 100%; display: flex; flex-direction: column; gap: clamp(.65rem, 1.2vw, 1.25rem); padding: clamp(.8rem, 1.8vw, 2rem); color: #fffaf0; background: radial-gradient(circle at 50% 0, #3a6e69 0, transparent 34rem), linear-gradient(145deg, #173f43, #0c292c); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
  header p, .order-rule { margin: 0; color: #efca7d; font-size: clamp(.6rem, .8vw, .85rem); font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  h1 { margin: .15rem 0 0; font: 700 clamp(2.3rem, 3.8vw, 5rem)/.9 'Cormorant Garamond', serif; }
  .table-instruction { display: block; margin-top: .35rem; color: #bdd0ca; font-size: clamp(.65rem, .8vw, .9rem); }
  .room-code { min-width: 9rem; padding: .5rem 1rem; border: 1px solid #efca7d; border-radius: .8rem; text-align: center; background: #0e3033cc; }
  .room-code span { display: block; color: #bdd0ca; font-size: .58rem; text-transform: uppercase; }
  .room-code strong { color: #efca7d; font: 700 clamp(1.7rem, 2.4vw, 3rem) 'Cormorant Garamond', serif; letter-spacing: .13em; }
  .table-map { min-height: 0; flex: 1; display: grid; grid-template-columns: minmax(0, 1fr) minmax(15rem, 1.2fr) minmax(0, 1fr); grid-template-rows: repeat(3, minmax(0, 1fr)); grid-template-areas: 'p1 p2 p3' 'p8 centre p4' 'p7 p6 p5'; gap: clamp(.4rem, .8vw, .8rem); }
  article { position: relative; min-width: 0; min-height: 0; display: grid; place-content: center; justify-items: center; overflow: hidden; padding: clamp(.45rem, .8vw, .8rem); border: 1px solid #efca7d66; border-radius: 1rem; color: #173f43; text-align: center; background: linear-gradient(145deg, #fffaf0, #ead5aa); box-shadow: 0 .6rem 1.5rem #0004; }
  .position-1 { grid-area: p1; }.position-2 { grid-area: p2; }.position-3 { grid-area: p3; }.position-4 { grid-area: p4; }.position-5 { grid-area: p5; }.position-6 { grid-area: p6; }.position-7 { grid-area: p7; }.position-8 { grid-area: p8; }
  article.claimed { color: #fffaf0; background: radial-gradient(circle, #bd514d 0 3rem, transparent 3.1rem), linear-gradient(145deg, #214f50, #153638); }
  .seat-number { position: absolute; top: .45rem; left: .55rem; color: #a43b32; font-size: clamp(.45rem, .55vw, .62rem); font-weight: 700; letter-spacing: .07em; text-transform: uppercase; }
  .claimed .seat-number { color: #efca7d; }
  .claimed-token, .closed-position { width: clamp(2.8rem, 4vw, 4.5rem); aspect-ratio: 1; display: grid; place-items: center; border: .25rem solid #efca7d; border-radius: 50%; color: #fffaf0; background: #a43b32; box-shadow: inset 0 0 0 .18rem #fffaf0, 0 .5rem 1rem #0005; font: 700 clamp(1.4rem, 2.2vw, 2.8rem) 'Cormorant Garamond', serif; }
  .closed-position { border-width: 1px; color: #a43b32; background: transparent; box-shadow: none; }
  article h2 { margin: .35rem 0 0; font: 700 clamp(1rem, 1.35vw, 1.6rem) 'Cormorant Garamond', serif; }
  article p { margin: .05rem 0; color: #bdd0ca; font-size: clamp(.48rem, .6vw, .68rem); } article:not(.claimed) p { color: #6c7d79; }
  article :global(figure) { grid-template-columns: clamp(3rem, 5vw, 8rem) 1fr; gap: .6rem; align-items: center; text-align: left; }
  article :global(.qr) { width: clamp(3rem, 5vw, 8rem); } article :global(figcaption strong) { font-size: clamp(.72rem, .9vw, 1rem); }
  .table-centre { grid-area: centre; min-width: 0; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; align-content: center; gap: .55rem .75rem; padding: clamp(.7rem, 1.2vw, 1.35rem); border: 1px solid #efca7d88; border-radius: 1.25rem; background: radial-gradient(circle at 50% 45%, #255b59, transparent 70%), #0e3033; box-shadow: inset 0 0 2rem #0004; }
  .table-centre > div { grid-column: 1 / -1; display: grid; gap: .2rem; text-align: center; }.table-centre > div strong { font: 700 clamp(1.15rem, 1.6vw, 1.8rem) 'Cormorant Garamond', serif; }.table-centre > div span { color: #bdd0ca; font-size: clamp(.55rem, .65vw, .72rem); }
  .table-centre label { display: grid; gap: .2rem; color: #efca7d; font-size: .6rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .table-centre select, .table-centre button { min-height: 2.5rem; padding: .4rem .65rem; border-radius: .5rem; font: 700 .78rem 'Atkinson Hyperlegible', sans-serif; }
  .table-centre select { border: 1px solid #efca7d; color: #173f43; background: #fffaf0; }.table-centre button { align-self: end; border: 0; color: #173f43; background: #efca7d; }.table-centre button:disabled { opacity: .45; }
  .ready-copy { display: grid; gap: .1rem; margin: 0; }.ready-copy strong { color: #fffaf0; }.ready-copy span { color: #bdd0ca; font-size: .6rem; }
  footer { display: flex; justify-content: space-between; gap: 1rem; color: #bdd0ca; font-size: clamp(.52rem, .65vw, .7rem); } footer strong { color: #efca7d; }
  @media (max-width: 720px) {
    .table-lobby { gap: .35rem; padding: .45rem; } header { gap: .4rem; } h1 { font-size: 1.75rem; }.table-instruction { max-width: 14rem; font-size: .5rem; }.room-code { min-width: 5.7rem; padding: .25rem; }.room-code strong { font-size: 1.25rem; }
    .table-map { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .22rem; }.table-map article { padding: .2rem; border-radius: .55rem; }.seat-number { top: .18rem; left: .22rem; max-width: calc(100% - .4rem); overflow: hidden; font-size: .35rem; text-overflow: ellipsis; white-space: nowrap; }.claimed-token, .closed-position { width: 2rem; border-width: .12rem; font-size: 1rem; }
    article :global(figure) { grid-template-columns: 2rem 1fr; gap: .15rem; } article :global(.qr) { width: 2rem; padding: .1rem; } article :global(figcaption strong) { font-size: .48rem; } article :global(figcaption small) { display: none; }
    .table-centre { grid-template-columns: 1fr; gap: .25rem; padding: .35rem; border-radius: .65rem; }.table-centre > div, .table-centre label { grid-column: 1; }.table-centre > div strong { font-size: .8rem; }.table-centre > div span { display: none; }.table-centre select, .table-centre button { min-height: 1.8rem; padding: .2rem; font-size: .52rem; }.ready-copy { display: none; } footer { font-size: .42rem; }
  }
</style>
