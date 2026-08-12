<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import '@fontsource/cormorant-garamond/700.css';
  import { replaceState } from '$app/navigation';
  import { onMount } from 'svelte';
  import { appTitle } from '$lib/app-metadata';
  import GameTable from '$lib/components/GameTable.svelte';
  import { initializeFirebase } from '$lib/firebase';
  import { createEventRepository, type EventRepository } from '$lib/game/repository';
  import { readReplayCache, writeReplayCache } from '$lib/game/replay-cache';
  import { replayEvents } from '$lib/game/reducer';
  import {
    isRoomCode,
    layoutNames,
    normalizeRoomCode,
    type CanonicalEvent,
    type LayoutKind,
    type ReplayProjection
  } from '$lib/game/protocol';

  type Screen = 'landing' | 'loading-room' | 'join-room' | 'lobby' | 'game';

  let connectionStatus = $state<'connecting' | 'synced' | 'error'>('connecting');
  let connectionText = $state('Connecting to Firebase…');
  let screen = $state<Screen>('landing');
  let projection = $state<ReplayProjection>(replayEvents([]));
  let events = $state<CanonicalEvent[]>([]);
  let repository: EventRepository | null = null;
  let unsubscribe: (() => void) | null = null;
  let userUid = $state('');
  let hostName = $state('');
  let guestName = $state('');
  let joinCode = $state('');
  let playerCount = $state(3);
  let selectedLayout = $state<LayoutKind>('short-path');
  let actionPending = $state(false);
  let message = $state('');
  let selectedPlace = $state<number | null>(null);
  let selectedBonus = $state<string | null>(null);
  let boardScale = $state(1);
  const buildHash = (import.meta.env.VITE_GIT_HASH ?? 'local').slice(0, 7);

  const room = $derived(projection.room);
  const game = $derived(projection.game);
  const localSeat = $derived(room?.seats.find((seat) => seat.uid === userUid));
  const isHost = $derived(room?.hostUid === userUid);
  const allReady = $derived(Boolean(room && room.seats.length >= 2 && room.seats.every((seat) => seat.ready)));
  const inviteUrl = $derived(room ? makeInviteUrl(room.roomCode) : '');
  const stateSummary = $derived(JSON.stringify({
    screen,
    roomCode: room?.roomCode ?? null,
    eventCount: projection.acceptedEventIds.length,
    diagnosticCount: projection.diagnostics.length,
    seatCount: room?.seats.length ?? 0,
    maxPlayers: room?.maxPlayers ?? null,
    layout: room?.layout ?? null,
    ready: room?.seats.map((seat) => seat.ready) ?? [],
    localSeat: localSeat?.name ?? null,
    game: game ? {
      seed: game.seed,
      board: game.board,
      currentTurn: game.players[game.turnSeat].name,
      turnNumber: game.turnNumber,
      phase: game.phase,
      localHand: game.players.find(({ uid }) => uid === userUid)?.bonusHand ?? [],
      opponentHandCounts: game.players.filter(({ uid }) => uid !== userUid).map(({ bonusHand }) => bonusHand.length),
      selectedPlace,
      selectedBonus,
      boardScale
    } : null
  }));

  onMount(async () => {
    try {
      const services = await initializeFirebase();
      userUid = services.user.uid;
      connectionStatus = 'synced';
      connectionText = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true'
        ? 'Firebase emulator ready'
        : 'Firebase ready';

      const requestedRoom = normalizeRoomCode(new URL(location.href).searchParams.get('room') ?? '');
      if (isRoomCode(requestedRoom)) await openRoom(requestedRoom, services.db);
    } catch (error) {
      connectionStatus = 'error';
      connectionText = error instanceof Error ? error.message : 'Firebase unavailable';
    }
  });

  function makeInviteUrl(roomCode: string) {
    if (typeof location === 'undefined') return `?room=${roomCode}`;
    const url = new URL(location.href);
    const e2eSeed = url.searchParams.get('e2eSeed');
    url.search = '';
    url.searchParams.set('room', roomCode);
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && e2eSeed) url.searchParams.set('e2eSeed', e2eSeed);
    return url.toString();
  }

  function makeRoomCode() {
    const requested = normalizeRoomCode(new URL(location.href).searchParams.get('e2eRoom') ?? '');
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && isRoomCode(requested)) return requested;
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const random = crypto.getRandomValues(new Uint8Array(5));
    return Array.from(random, (value) => alphabet[value % alphabet.length]).join('');
  }

  async function openRoom(roomCode: string, db?: Awaited<ReturnType<typeof initializeFirebase>>['db']) {
    screen = 'loading-room';
    message = '';
    const firestore = db ?? (await initializeFirebase()).db;
    repository = createEventRepository(firestore, roomCode, userUid);
    unsubscribe?.();
    events = readReplayCache(roomCode);
    if (events.length > 0) updateProjection(roomCode);
    unsubscribe = repository.subscribe(
      (remoteEvents) => {
        events = remoteEvents;
        updateProjection(roomCode);
        writeReplayCache(roomCode, events);
      },
      (error) => {
        message = `Room connection failed: ${error.message}`;
      }
    );
  }

  function updateProjection(roomCode: string) {
    projection = replayEvents(events);
    if (!projection.room) {
      screen = 'loading-room';
      return;
    }
    const seated = projection.room.seats.some((seat) => seat.uid === userUid);
    screen = seated && projection.game ? 'game' : seated ? 'lobby' : 'join-room';
    joinCode = roomCode;
  }

  async function createRoom() {
    if (!hostName.trim() || actionPending) return;
    actionPending = true;
    message = '';
    try {
      const roomCode = makeRoomCode();
      const { db } = await initializeFirebase();
      repository = createEventRepository(db, roomCode, userUid);
      await repository.append('game/created', {
        roomCode,
        hostName: hostName.trim(),
        maxPlayers: playerCount,
        layout: selectedLayout,
        mode: 'personal-screens'
      });
      replaceState(makeInviteUrl(roomCode), {});
      await openRoom(roomCode, db);
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not create the room';
      screen = 'landing';
    } finally {
      actionPending = false;
    }
  }

  async function findRoom() {
    const code = normalizeRoomCode(joinCode);
    if (!isRoomCode(code) || actionPending) return;
    actionPending = true;
    replaceState(makeInviteUrl(code), {});
    await openRoom(code);
    actionPending = false;
  }

  async function joinRoom() {
    if (!guestName.trim() || !repository || actionPending) return;
    actionPending = true;
    message = '';
    try {
      await repository.append('player/joined', { name: guestName.trim() });
    } catch (error) {
      message = error instanceof Error ? error.message : 'Could not join the room';
    } finally {
      actionPending = false;
    }
  }

  async function configureRoom(field: 'layout' | 'maxPlayers', value: string | number) {
    if (!room || !repository || !isHost || actionPending) return;
    actionPending = true;
    try {
      await repository.append('game/configured', {
        maxPlayers: field === 'maxPlayers' ? Number(value) : room.maxPlayers,
        layout: field === 'layout' ? value : room.layout,
        mode: room.mode
      });
    } finally {
      actionPending = false;
    }
  }

  async function toggleReady() {
    if (!repository || !localSeat || actionPending) return;
    actionPending = true;
    try {
      await repository.append('player/ready', { ready: !localSeat.ready });
    } finally {
      actionPending = false;
    }
  }

  async function startGame() {
    if (!repository || !room || !isHost || !allReady || actionPending) return;
    actionPending = true;
    try {
      const requested = new URL(location.href).searchParams.get('e2eSeed');
      const seed = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && requested
        ? requested.slice(0, 96)
        : crypto.randomUUID();
      await repository.append('game/started', { seed });
    } finally {
      actionPending = false;
    }
  }

  function inspectPlace(placeId: number) {
    selectedBonus = null;
    selectedPlace = placeId;
  }

  function inspectBonus(cardId: string) {
    selectedPlace = null;
    selectedBonus = cardId;
  }
</script>

<svelte:head><title>{appTitle}</title></svelte:head>

<main data-e2e-layout class:lobby-screen={screen === 'lobby'} class:game-screen={screen === 'game'}>
  <header class="topbar">
    <a class="brand" href="./" aria-label="Istanbul home">
      <span class="brand-gem" aria-hidden="true"></span>
      <span>Istanbul</span>
    </a>
    <div class="connection">
      <span class="connection-mark" aria-hidden="true"></span>
      <p role="status" data-status={connectionStatus}>{connectionText}</p>
      <span class="build" data-testid="build-marker">Build {buildHash}</span>
    </div>
  </header>

  {#if screen === 'landing'}
    <section class="landing" aria-labelledby="title">
      <div class="welcome">
        <p class="eyebrow">◆ A market for two to five</p>
        <h1 id="title">Meet beneath the bazaar lamps.</h1>
        <p class="lede">Create a private table, share its five-letter code, and plan the first route to a ruby together.</p>
        <ol class="route-notes" aria-label="The Istanbul route">
          <li><span>01</span> Move with your assistants</li>
          <li><span>02</span> Gather goods and favours</li>
          <li><span>03</span> Trade across sixteen places</li>
          <li><span>04</span> Race for five rubies</li>
        </ol>
      </div>

      <div class="entry-card">
        <section aria-labelledby="create-title">
          <p class="section-kicker">New table</p>
          <h2 id="create-title">Open the bazaar</h2>
          <form onsubmit={(event) => { event.preventDefault(); void createRoom(); }}>
            <label>Your merchant name<input bind:value={hostName} maxlength="24" autocomplete="nickname" required /></label>
            <div class="field-row">
              <label>Seats<select bind:value={playerCount}><option value={2}>2 players</option><option value={3}>3 players</option><option value={4}>4 players</option><option value={5}>5 players</option></select></label>
              <label>Layout<select bind:value={selectedLayout}><option value="short-path">Short Path</option><option value="long-path">Long Path</option><option value="number-order">Number Order</option><option value="random">Seeded Random</option></select></label>
            </div>
            <button class="primary" type="submit" disabled={!hostName.trim() || actionPending}>Create private room <span aria-hidden="true">→</span></button>
          </form>
        </section>
        <div class="divider"><span>or</span></div>
        <section aria-labelledby="join-title">
          <p class="section-kicker">Invitation</p>
          <h2 id="join-title">Join with a room code</h2>
          <form class="join-form" onsubmit={(event) => { event.preventDefault(); void findRoom(); }}>
            <label>Five-letter code<input class="code-input" value={joinCode} oninput={(event) => joinCode = normalizeRoomCode(event.currentTarget.value)} maxlength="5" autocomplete="off" /></label>
            <button class="secondary" type="submit" disabled={!isRoomCode(joinCode) || actionPending}>Find room</button>
          </form>
        </section>
        {#if message}<p class="error" role="alert">{message}</p>{/if}
      </div>
    </section>
  {:else if screen === 'loading-room'}
    <section class="loading" aria-live="polite"><span class="lantern" aria-hidden="true"></span><h1>Finding the table…</h1><p>Replaying its immutable history.</p></section>
  {:else if screen === 'join-room' && room}
    <section class="join-room" aria-labelledby="join-room-title">
      <div class="room-ticket"><span>Private room</span><strong>{room.roomCode}</strong><small>{room.seats.length} of {room.maxPlayers} seats claimed</small></div>
      <div class="join-panel">
        <p class="section-kicker">You were invited</p>
        <h1 id="join-room-title">Take a seat at {room.seats[0].name}’s table.</h1>
        <p>The table is using the <strong>{layoutNames[room.layout]}</strong> layout. Your merchant name is public; Bonus cards stay private once play begins.</p>
        <form onsubmit={(event) => { event.preventDefault(); void joinRoom(); }}>
          <label>Your merchant name<input bind:value={guestName} maxlength="24" autocomplete="nickname" required /></label>
          <button class="primary" type="submit" disabled={!guestName.trim() || actionPending || room.seats.length >= room.maxPlayers}>Join the room <span aria-hidden="true">→</span></button>
        </form>
        {#if message}<p class="error" role="alert">{message}</p>{/if}
      </div>
    </section>
  {:else if screen === 'lobby' && room && localSeat}
    <section class="lobby" aria-labelledby="lobby-title">
      <div class="lobby-heading">
        <div><p class="eyebrow">Private room · {room.roomCode}</p><h1 id="lobby-title">Gather your merchants.</h1><p>{allReady ? 'Every merchant is ready. The bazaar can open.' : 'Share the invitation, choose a route, and ready your table.'}</p></div>
        <div class:ready-seal={allReady} class="room-state" aria-live="polite"><span>{allReady ? 'Table ready' : 'Waiting'}</span><strong>{room.seats.filter((seat) => seat.ready).length}/{room.seats.length}</strong><small>merchants ready</small></div>
      </div>

      <div class="lobby-grid">
        <section class="seats-card" aria-labelledby="seats-title">
          <div class="card-heading"><div><p class="section-kicker">Ordered clockwise</p><h2 id="seats-title">Merchant seats</h2></div><span>{room.seats.length}/{room.maxPlayers}</span></div>
          <ol class="seats">
            {#each Array(room.maxPlayers) as _, index}
              {@const seat = room.seats[index]}
              <li class:open={!seat}>
                <span class="seat-number">{index + 1}</span>
                {#if seat}<span class="merchant-token" aria-hidden="true">{seat.name.slice(0, 1).toUpperCase()}</span><span class="seat-copy"><strong>{seat.name}{seat.uid === userUid ? ' · you' : ''}</strong><small>{seat.uid === room.hostUid ? 'Host merchant' : 'Guest merchant'}</small></span><span class:ready={seat.ready} class="readiness">{seat.ready ? 'Ready' : 'Planning'}</span>
                {:else}<span class="empty-token" aria-hidden="true">+</span><span class="seat-copy"><strong>Open seat</strong><small>Waiting for an invitation</small></span><span class="readiness">Open</span>{/if}
              </li>
            {/each}
          </ol>
        </section>

        <aside class="table-card" aria-labelledby="table-title">
          <div class="card-heading"><div><p class="section-kicker">Table settings</p><h2 id="table-title">The opening route</h2></div><span class="route-medallion" aria-hidden="true">16</span></div>
          {#if isHost}
            <label>Reviewed layout<select value={room.layout} onchange={(event) => void configureRoom('layout', event.currentTarget.value)} disabled={actionPending}><option value="short-path">Short Path</option><option value="long-path">Long Path</option><option value="number-order">Number Order</option><option value="random">Seeded Random</option></select></label>
            <label>Maximum seats<select value={room.maxPlayers} onchange={(event) => void configureRoom('maxPlayers', event.currentTarget.value)} disabled={actionPending}><option value={2} disabled={room.seats.length > 2}>2 players</option><option value={3} disabled={room.seats.length > 3}>3 players</option><option value={4}>4 players</option><option value={5}>5 players</option></select></label>
          {:else}
            <dl><div><dt>Layout</dt><dd>{layoutNames[room.layout]}</dd></div><div><dt>Seats</dt><dd>{room.maxPlayers}</dd></div></dl>
          {/if}
          <p class="layout-note">{room.layout === 'short-path' ? 'Direct trade routes make this a welcoming first table.' : room.layout === 'long-path' ? 'Ruby routes sit farther apart for a more tactical journey.' : room.layout === 'number-order' ? 'The numbered reference arrangement from the rulebook.' : 'A valid arrangement derived from the committed setup seed.'}</p>
          <div class="invite"><label>Invitation link<input readonly value={inviteUrl} aria-label="Invitation link" /></label><p>Room code <strong>{room.roomCode}</strong></p></div>
          {#if allReady && isHost}
            <button class="primary ready-button start-button" onclick={() => void startGame()} disabled={actionPending}>Open the bazaar <span aria-hidden="true">→</span></button>
          {:else}
            <button class:unready={localSeat.ready} class="primary ready-button" onclick={() => void toggleReady()} disabled={actionPending}>{localSeat.ready ? 'Keep planning' : 'I am ready'} <span aria-hidden="true">{localSeat.ready ? '↺' : '✓'}</span></button>
          {/if}
        </aside>
      </div>

      <footer class="history"><span>Immutable history <strong data-testid="event-count">{projection.acceptedEventIds.length} events</strong></span><span>Replay <strong>{projection.diagnostics.length === 0 ? 'clean' : `${projection.diagnostics.length} diagnostics`}</strong></span><span>Mode <strong>Personal screens</strong></span></footer>
    </section>
  {:else if screen === 'game' && room && game}
    <GameTable
      {game}
      {room}
      {userUid}
      {selectedPlace}
      {selectedBonus}
      {boardScale}
      onInspectPlace={inspectPlace}
      onInspectBonus={inspectBonus}
      onZoomIn={() => boardScale = Math.min(1.18, boardScale + 0.09)}
      onFit={() => boardScale = 1}
    />
  {/if}

  <span class="state-output" data-testid="projection-state" data-room-code={room?.roomCode ?? ''} data-event-count={projection.acceptedEventIds.length} data-layout={room?.layout ?? ''} data-ready-count={room?.seats.filter((seat) => seat.ready).length ?? 0} data-seat-count={room?.seats.length ?? 0}>{stateSummary}</span>
</main>

<style>
  :global(*) { box-sizing: border-box; }
  :global(html) { min-width: 320px; background: #ead8b7; color: #173f43; font-family: 'Atkinson Hyperlegible', sans-serif; }
  :global(body) { margin: 0; }
  :global(button, input, select) { font: inherit; }
  :global(button, select) { cursor: pointer; }
  :global(button:disabled, select:disabled) { cursor: not-allowed; }
  main { min-height: 100svh; overflow: hidden; padding: clamp(4.8rem, 8vw, 6rem) clamp(1rem, 4vw, 4rem) clamp(1rem, 3vw, 2rem); background: radial-gradient(circle at 8% 8%, #fff9e9 0 0.5rem, transparent 0.55rem), linear-gradient(90deg, rgb(23 63 67 / 5%) 1px, transparent 1px) 0 0 / 4rem 4rem, linear-gradient(rgb(23 63 67 / 5%) 1px, transparent 1px) 0 0 / 4rem 4rem, linear-gradient(145deg, #f4ead6, #dfc28e); }
  main.game-screen { height: 100svh; min-height: 0; padding: 4.75rem .7rem .6rem; background: #102f32; }
  .topbar { position: absolute; inset: 0 0 auto; height: 4.2rem; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(1rem, 4vw, 4rem); border-bottom: 1px solid rgb(23 63 67 / 18%); background: rgb(255 251 240 / 78%); backdrop-filter: blur(12px); }
  .brand { display: flex; align-items: center; gap: .8rem; color: inherit; font: 700 1.7rem/1 'Cormorant Garamond', serif; text-decoration: none; }
  .brand-gem { width: 1.15rem; height: 1.15rem; rotate: 45deg; border: 2px solid #f3aa8c; border-radius: .2rem; background: #aa303f; box-shadow: inset 0 0 0 3px #c84a51; }
  .connection { display: flex; align-items: center; gap: .55rem; font-size: .82rem; }
  .connection p { margin: 0; font-weight: 700; }
  .connection-mark { width: .55rem; height: .55rem; border: 2px solid #173f43; border-radius: 50%; background: #e7c882; }
  .connection:has([data-status='synced']) .connection-mark { border-color: #23664d; background: #58a575; }
  .connection:has([data-status='error']) .connection-mark { border-color: #8b2528; background: #ce4c4f; }
  .build { padding-left: .55rem; border-left: 1px solid rgb(23 63 67 / 22%); color: #617574; }
  .landing, .join-room { width: min(72rem, 100%); min-height: calc(100svh - 9rem); margin: 0 auto; display: grid; grid-template-columns: 1.02fr .98fr; overflow: hidden; border: 1px solid rgb(23 63 67 / 26%); border-radius: 2rem; background: rgb(255 251 240 / 92%); box-shadow: 0 2rem 5rem rgb(76 48 22 / 16%); }
  .welcome { display: flex; flex-direction: column; justify-content: center; padding: clamp(2.3rem, 5vw, 5.2rem); background: radial-gradient(circle at 90% 10%, rgb(236 188 100 / 28%), transparent 17rem); }
  .eyebrow, .section-kicker { margin: 0; color: #a43b32; font-size: .74rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  h1 { margin: .55rem 0 1rem; font: 700 clamp(3.2rem, 6.2vw, 6rem)/.88 'Cormorant Garamond', serif; letter-spacing: -.035em; }
  .lede { max-width: 34rem; margin: 0; color: #496665; font-size: 1.08rem; line-height: 1.5; }
  .route-notes { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem 1.2rem; margin: 2.6rem 0 0; padding: 1.4rem 0 0; border-top: 1px solid rgb(23 63 67 / 18%); list-style: none; color: #3e5c5c; font-size: .84rem; }
  .route-notes span { margin-right: .4rem; color: #c36a31; font-weight: 700; }
  .entry-card, .join-panel { display: flex; flex-direction: column; justify-content: center; padding: clamp(2rem, 4vw, 4rem); color: #fffaf0; background: linear-gradient(135deg, transparent 49.5%, rgb(255 255 255 / 4%) 50%) 0 0 / 2.5rem 2.5rem, #173f43; }
  h2 { margin: .2rem 0 1.15rem; font: 700 clamp(1.65rem, 2.7vw, 2.3rem)/1 'Cormorant Garamond', serif; }
  .entry-card .section-kicker, .join-panel .section-kicker { color: #efca7d; }
  form, label { display: grid; gap: .45rem; }
  label { color: inherit; font-size: .82rem; font-weight: 700; }
  input, select { width: 100%; min-height: 2.8rem; padding: .65rem .8rem; border: 1px solid rgb(255 250 240 / 34%); border-radius: .7rem; color: inherit; background: rgb(255 255 255 / 9%); outline: none; }
  input:focus, select:focus, button:focus-visible { outline: 3px solid #efca7d; outline-offset: 2px; }
  select option { color: #173f43; background: #fffaf0; }
  .field-row { display: grid; grid-template-columns: .7fr 1.3fr; gap: .8rem; }
  button { min-height: 2.9rem; border: 0; border-radius: .75rem; font-weight: 700; }
  button.primary { display: flex; align-items: center; justify-content: space-between; margin-top: .65rem; padding: .72rem 1rem; color: #173f43; background: #efca7d; box-shadow: 0 .35rem 0 #bd8b39; }
  button.primary:active { translate: 0 .2rem; box-shadow: 0 .15rem 0 #bd8b39; }
  button:disabled { opacity: .48; box-shadow: none; }
  .divider { display: flex; align-items: center; gap: .7rem; margin: 1.2rem 0; color: #9cb4af; font-size: .75rem; text-transform: uppercase; }
  .divider::before, .divider::after { height: 1px; flex: 1; content: ''; background: rgb(255 250 240 / 18%); }
  .join-form { grid-template-columns: 1fr auto; align-items: end; }
  .secondary { padding: .6rem 1rem; border: 1px solid rgb(255 250 240 / 40%); color: #fffaf0; background: transparent; }
  .code-input { font-weight: 700; letter-spacing: .22em; text-transform: uppercase; }
  .error { margin: .7rem 0 0; color: #ffc1b6; }
  .loading { min-height: calc(100svh - 9rem); display: grid; place-content: center; text-align: center; }
  .loading h1 { margin: 1rem 0 .3rem; font-size: 3rem; }
  .loading p { margin: 0; }
  .lantern { width: 3rem; height: 4rem; justify-self: center; border: .3rem solid #173f43; border-radius: 45%; background: radial-gradient(circle, #fff7c9, #e6a742); box-shadow: 0 0 2rem #dfab53; }
  .room-ticket { display: grid; place-content: center; gap: .4rem; text-align: center; background: radial-gradient(circle, rgb(255 255 255 / 55%) 1px, transparent 1px) 0 0 / 1rem 1rem, #e9cf9d; }
  .room-ticket span { color: #a43b32; font-size: .8rem; font-weight: 700; letter-spacing: .15em; text-transform: uppercase; }
  .room-ticket strong { font: 700 clamp(4rem, 9vw, 8rem)/1 'Cormorant Garamond', serif; letter-spacing: .13em; }
  .room-ticket small { color: #496665; font-weight: 700; }
  .join-panel > p:not(.section-kicker,.error) { max-width: 35rem; color: #bdd0ca; line-height: 1.5; }
  .join-panel h1 { font-size: clamp(3rem, 5vw, 5rem); }
  .lobby { width: min(76rem, 100%); min-height: calc(100svh - 9rem); margin: 0 auto; display: flex; flex-direction: column; }
  .lobby-heading { display: flex; align-items: center; justify-content: space-between; gap: 2rem; margin-bottom: 1.2rem; }
  .lobby-heading h1 { margin: .25rem 0 .3rem; font-size: clamp(3rem, 5vw, 5rem); }
  .lobby-heading p:last-child { margin: 0; color: #496665; }
  .room-state { min-width: 8.5rem; padding: 1rem; border: 1px solid rgb(23 63 67 / 24%); border-radius: 1rem; text-align: center; background: rgb(255 251 240 / 60%); }
  .room-state span, .room-state small { display: block; color: #607674; font-size: .72rem; font-weight: 700; text-transform: uppercase; }
  .room-state strong { display: block; font: 700 2rem/1 'Cormorant Garamond', serif; }
  .room-state.ready-seal { color: #fffaf0; background: #23664d; }
  .room-state.ready-seal span, .room-state.ready-seal small { color: #d4eadc; }
  .lobby-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1.15fr .85fr; gap: 1.2rem; }
  .seats-card, .table-card { min-height: 0; padding: clamp(1.2rem, 2.4vw, 2rem); border: 1px solid rgb(23 63 67 / 22%); border-radius: 1.4rem; background: rgb(255 251 240 / 86%); box-shadow: 0 1rem 2.4rem rgb(76 48 22 / 10%); }
  .table-card { color: #fffaf0; background: linear-gradient(145deg, #1b4d4f, #12383b); }
  .card-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-bottom: 1rem; border-bottom: 1px solid rgb(23 63 67 / 16%); }
  .table-card .card-heading { border-color: rgb(255 255 255 / 16%); }
  .card-heading h2 { margin-bottom: 0; }
  .card-heading > span { font-weight: 700; }
  .seats { display: grid; gap: .55rem; margin: 1rem 0 0; padding: 0; list-style: none; }
  .seats li { min-height: 3.7rem; display: grid; grid-template-columns: 1.3rem 2.5rem 1fr auto; gap: .7rem; align-items: center; padding: .55rem .7rem; border: 1px solid rgb(23 63 67 / 14%); border-radius: .85rem; background: #fffaf0; }
  .seats li.open { border-style: dashed; color: #738481; background: transparent; }
  .seat-number { color: #a43b32; font-size: .76rem; font-weight: 700; }
  .merchant-token, .empty-token { width: 2.35rem; height: 2.35rem; display: grid; place-items: center; border: 3px solid #e7c882; border-radius: 50%; color: #fffaf0; font-weight: 700; background: #a43b32; box-shadow: inset 0 0 0 2px #fffaf0; }
  .empty-token { border-color: #b8aaa0; color: #738481; background: transparent; box-shadow: none; }
  .seat-copy { display: grid; }
  .seat-copy small { color: #6c7d79; }
  .readiness { padding: .25rem .55rem; border-radius: 2rem; color: #6c7d79; font-size: .72rem; font-weight: 700; background: #eee5d3; }
  .readiness.ready { color: #18563f; background: #cce6d4; }
  .route-medallion { width: 2.6rem; height: 2.6rem; display: grid; place-items: center; border: 1px solid #efca7d; border-radius: 50%; color: #efca7d; }
  .table-card label { margin-top: .85rem; }
  .layout-note { min-height: 2.7rem; margin: .8rem 0; color: #bdd0ca; font-size: .83rem; line-height: 1.35; }
  dl { margin: .8rem 0; }
  dl div { display: flex; justify-content: space-between; padding: .65rem 0; border-bottom: 1px solid rgb(255 255 255 / 16%); }
  dt { color: #bdd0ca; }
  dd { margin: 0; font-weight: 700; }
  .invite { display: grid; grid-template-columns: 1fr auto; gap: .7rem; align-items: end; }
  .invite p { margin: 0; padding-bottom: .65rem; color: #bdd0ca; font-size: .78rem; }
  .invite strong { display: block; color: #efca7d; font-size: 1.15rem; letter-spacing: .16em; }
  .ready-button.unready { color: #fffaf0; background: #9c3d39; box-shadow: 0 .35rem 0 #652927; }
  .start-button { color: #fffaf0 !important; background: #267356 !important; box-shadow: 0 .35rem 0 #164a37 !important; }
  .history { display: flex; justify-content: center; gap: 1.4rem; padding-top: .85rem; color: #5c716e; font-size: .76rem; }
  .history span + span { padding-left: 1.4rem; border-left: 1px solid rgb(23 63 67 / 20%); }
  .state-output { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (max-width: 720px) {
    main { padding: 4.35rem .6rem .6rem; }
    .topbar { height: 3.8rem; padding: 0 .8rem; }
    .brand { font-size: 1.35rem; }
    .connection { gap: .4rem; font-size: .7rem; }
    .connection p { max-width: 6.8rem; }
    .build { display: none; }
    .landing, .join-room { min-height: calc(100svh - 4.95rem); grid-template-columns: 1fr; grid-template-rows: auto 1fr; border-radius: 1.3rem; }
    .welcome { display: block; padding: 1.25rem 1.25rem 1rem; }
    h1 { margin: .3rem 0 .55rem; font-size: 2.75rem; }
    .lede { font-size: .87rem; line-height: 1.35; }
    .route-notes { grid-template-columns: 1fr 1fr; gap: .25rem .6rem; margin-top: .75rem; padding-top: .65rem; font-size: .68rem; }
    .entry-card, .join-panel { padding: 1rem 1.25rem 1.15rem; }
    h2 { margin-bottom: .65rem; font-size: 1.5rem; }
    input, select { min-height: 2.55rem; padding: .5rem .65rem; }
    button { min-height: 2.65rem; }
    .divider { margin: .65rem 0; }
    .room-ticket { padding: .9rem; }
    .room-ticket strong { font-size: 3.5rem; }
    .join-panel { justify-content: start; }
    .join-panel h1 { font-size: 2.7rem; }
    .lobby { min-height: calc(100svh - 4.95rem); }
    .lobby-heading { margin-bottom: .55rem; }
    .lobby-heading h1 { font-size: 2.35rem; }
    .lobby-heading > div:first-child > p:last-child { display: none; }
    .room-state { min-width: 6.3rem; padding: .55rem; }
    .room-state strong { font-size: 1.55rem; }
    .lobby-grid { grid-template-columns: 1fr; grid-template-rows: auto 1fr; gap: .55rem; }
    .seats-card, .table-card { padding: .8rem; border-radius: 1rem; }
    .card-heading { padding-bottom: .55rem; }
    .card-heading h2 { font-size: 1.35rem; }
    .seats { grid-template-columns: 1fr 1fr; gap: .35rem; margin-top: .55rem; }
    .seats li { min-height: 2.7rem; grid-template-columns: 1.7rem 1fr; gap: .35rem; padding: .35rem .45rem; }
    .seat-number, .readiness { display: none; }
    .merchant-token, .empty-token { grid-row: 1 / 3; width: 1.65rem; height: 1.65rem; border-width: 2px; font-size: .7rem; }
    .seat-copy { line-height: 1; }
    .seat-copy small { font-size: .63rem; }
    .table-card { display: grid; grid-template-columns: 1fr 1fr; gap: .35rem .7rem; align-content: start; }
    .table-card .card-heading { grid-column: 1 / -1; }
    .table-card label { margin-top: .25rem; }
    .layout-note { grid-column: 1 / -1; min-height: 0; margin: .2rem 0; font-size: .7rem; }
    .invite { grid-column: 1 / -1; grid-template-columns: 1fr auto; }
    .invite input { min-height: 2.1rem; font-size: .68rem; }
    .invite p { padding-bottom: .35rem; }
    .ready-button { grid-column: 1 / -1; margin-top: .2rem !important; }
    .history { gap: .55rem; padding-top: .45rem; font-size: .62rem; }
    .history span + span { padding-left: .55rem; }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
</style>
