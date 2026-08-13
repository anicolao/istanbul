<script lang="ts">
  import type { LayoutKind, RoomProjection } from '$lib/game/protocol';
  import SeatQr from './SeatQr.svelte';

  let {
    room,
    invitationFor,
    layoutNames,
    canConfigure = false,
    canStart = false,
    actionPending = false,
    onConfigure = () => {},
    onStart = () => {}
  }: {
    room: RoomProjection;
    invitationFor: () => string;
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
    <div><p>Dedicated tabletop · room {room.roomCode}</p><h1 id="shared-table-title">Scan. Join. Ready.</h1><span class="table-instruction">Join and ready on private phones. Once play begins, gather here for every public action.</span></div>
    <div class="room-code"><span>Join code</span><strong>{room.roomCode}</strong></div>
  </header>
  <section class="table-controls" aria-label="Tabletop game controls">
    <label>Table layout
      <select value={room.layout} onchange={(event) => onConfigure(event.currentTarget.value as LayoutKind)} disabled={!canConfigure || actionPending}>
        <option value="short-path">Short Path</option><option value="long-path">Long Path</option><option value="number-order">Number Order</option><option value="random">Seeded Random</option>
      </select>
    </label>
    <p><strong>{layoutNames[room.layout]}</strong><span>{room.seats.length < 2 ? 'At least two merchants must join.' : canStart ? 'Everyone here is ready.' : 'Waiting for every joined merchant to ready.'}</span></p>
    <button onclick={onStart} disabled={!canStart || actionPending}>Open the bazaar</button>
  </section>
  <div class="invitation-grid" style={`--seats: ${room.maxPlayers}`}>
    {#each Array(room.maxPlayers) as _, index}
      {@const seat = room.seats[index]}
      <article class:claimed={seat}>
        <span class="seat-number">Seat {index + 1}</span>
        {#if seat}
          <div class="claimed-token">{seat.name.slice(0, 1).toUpperCase()}</div>
          <h2>{seat.name}</h2><p>{seat.ready ? 'Ready at their private controller' : 'Planning on their private controller'}</p>
        {:else}
          <SeatQr url={invitationFor()} label={`Join from position ${index + 1}`} />
        {/if}
      </article>
    {/each}
  </div>
  <footer><strong>{room.seats.filter(({ ready }) => ready).length}/{room.seats.length} ready · {room.maxPlayers - room.seats.length} invitations open</strong><span>Phones show private Bonus cards; the tabletop controls the game.</span></footer>
</section>

<style>
  .table-lobby { height: 100%; display: flex; flex-direction: column; gap: clamp(1rem, 2vw, 2.2rem); padding: clamp(1.2rem, 3vw, 4rem); color: #fffaf0; background: radial-gradient(circle at 50% 0, #3a6e69 0, transparent 34rem), linear-gradient(145deg, #173f43, #0c292c); }
  header { display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
  header p { margin: 0; color: #efca7d; font-size: clamp(.7rem, 1vw, 1rem); font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  h1 { margin: .25rem 0 0; font: 700 clamp(2.8rem, 5vw, 7rem)/.9 'Cormorant Garamond', serif; }
  .table-instruction { display: block; margin-top: .65rem; color: #bdd0ca; font-size: clamp(.75rem, 1vw, 1.1rem); }
  .room-code { min-width: 11rem; padding: .8rem 1.2rem; border: 1px solid #efca7d; border-radius: 1rem; text-align: center; background: #0e3033cc; }
  .room-code span { display: block; color: #bdd0ca; font-size: .65rem; text-transform: uppercase; }
  .room-code strong { color: #efca7d; font: 700 clamp(2rem, 3vw, 4rem) 'Cormorant Garamond', serif; letter-spacing: .13em; }
  .invitation-grid { min-height: 0; flex: 1; display: grid; grid-template-columns: repeat(var(--seats), minmax(0, 1fr)); gap: clamp(.7rem, 1.5vw, 1.5rem); }
  article { position: relative; min-width: 0; display: grid; place-content: center; justify-items: center; padding: clamp(.7rem, 1.5vw, 1.5rem); border: 1px solid #efca7d66; border-radius: 1.4rem; color: #173f43; text-align: center; background: linear-gradient(145deg, #fffaf0, #ead5aa); box-shadow: 0 1.5rem 4rem #0005; }
  article.claimed { color: #fffaf0; background: radial-gradient(circle, #bd514d 0 4rem, transparent 4.1rem), linear-gradient(145deg, #214f50, #153638); }
  .seat-number { position: absolute; top: .8rem; left: .9rem; color: #a43b32; font-size: .7rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
  .claimed .seat-number { color: #efca7d; }
  .claimed-token { width: clamp(5rem, 9vw, 10rem); aspect-ratio: 1; display: grid; place-items: center; border: .45rem solid #efca7d; border-radius: 50%; color: #fffaf0; background: #a43b32; box-shadow: inset 0 0 0 .3rem #fffaf0, 0 1rem 2rem #0005; font: 700 clamp(2.5rem, 5vw, 6rem) 'Cormorant Garamond', serif; }
  article h2 { margin: 1rem 0 0; font: 700 clamp(1.5rem, 2.5vw, 3rem) 'Cormorant Garamond', serif; }
  article p { max-width: 15rem; margin: .2rem 0; color: #bdd0ca; font-size: clamp(.65rem, .9vw, 1rem); }
  .table-controls { display: grid; grid-template-columns: minmax(12rem, 1fr) 2fr auto; align-items: end; gap: 1rem; padding: .75rem 1rem; border: 1px solid #efca7d55; border-radius: 1rem; background: #0e3033cc; }
  .table-controls label { display: grid; gap: .25rem; color: #efca7d; font-size: .7rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .table-controls select { min-height: 2.8rem; padding: .5rem .7rem; border: 1px solid #efca7d; border-radius: .55rem; color: #173f43; background: #fffaf0; font: 700 .9rem 'Atkinson Hyperlegible', sans-serif; }
  .table-controls p { display: grid; gap: .15rem; margin: 0; }.table-controls p strong { color: #fffaf0; }.table-controls p span { color: #bdd0ca; font-size: .75rem; }
  .table-controls button { min-height: 2.8rem; padding: .55rem 1.2rem; border: 0; border-radius: .55rem; color: #173f43; background: #efca7d; font-weight: 700; }.table-controls button:disabled { opacity: .45; }
  footer { display: flex; justify-content: space-between; gap: 1rem; color: #bdd0ca; }
  footer strong { color: #efca7d; }
  @media (max-width: 720px) {
    .table-lobby { gap: .6rem; padding: .8rem; }
    header { gap: .5rem; } h1 { font-size: 2.2rem; }.room-code { min-width: 6.8rem; padding: .35rem; }.room-code strong { font-size: 1.5rem; }
    .table-controls { grid-template-columns: 1fr 1fr; padding: .4rem; }.table-controls p { grid-column: 1 / -1; grid-row: 2; }.table-controls button { padding: .35rem; }
    .invitation-grid { grid-template-columns: repeat(2, 1fr); gap: .45rem; }
    article { padding: .5rem; border-radius: .7rem; }.seat-number { top: .35rem; left: .4rem; font-size: .5rem; }.claimed-token { width: 3.4rem; border-width: .2rem; box-shadow: inset 0 0 0 .15rem #fffaf0; }.claimed h2 { margin-top: .25rem; font-size: 1rem; }.claimed p { font-size: .5rem; }
    article :global(figure) { grid-template-columns: 3.4rem 1fr; gap: .3rem; text-align: left; } article :global(.qr) { width: 3.4rem; } article :global(figcaption small) { display: none; }
    footer { font-size: .6rem; }
  }
</style>
