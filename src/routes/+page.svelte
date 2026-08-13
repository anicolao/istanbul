<script lang="ts">
  import '@fontsource/atkinson-hyperlegible/400.css';
  import '@fontsource/atkinson-hyperlegible/700.css';
  import '@fontsource/cormorant-garamond/700.css';
  import { replaceState } from '$app/navigation';
  import { onMount } from 'svelte';
  import { appTitle } from '$lib/app-metadata';
  import GameTable from '$lib/components/GameTable.svelte';
  import SeatQr from '$lib/components/SeatQr.svelte';
  import SharedTableLobby from '$lib/components/SharedTableLobby.svelte';
  import { initializeFirebase } from '$lib/firebase';
  import { createEventRepository, type EventRepository } from '$lib/game/repository';
  import { mergeReplayEvents, readReplayCache, replayCacheKey, writeReplayCache } from '$lib/game/replay-cache';
  import { replayEvents } from '$lib/game/reducer';
  import type { AssistantAction } from '$lib/game/movement';
  import type { PlaceActionChoice } from '$lib/game/actions';
  import type { EncounterChoice } from '$lib/game/encounters';
  import type { MosqueAbilityChoice } from '$lib/game/mosques';
  import type { BonusChoice } from '$lib/game/bonus';
  import {
    isRoomCode,
    layoutNames,
    maxRoomPlayers,
    modeNames,
    normalizeRoomCode,
    schemaVersion,
    type CanonicalEvent,
    type LayoutKind,
    type ReplayProjection,
    type RoomMode
  } from '$lib/game/protocol';

  type Screen = 'landing' | 'loading-room' | 'join-room' | 'lobby' | 'game' | 'shared-display';

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
  let selectedLayout = $state<LayoutKind>('short-path');
  let selectedMode = $state<RoomMode>('personal-screens');
  let sharedDisplay = $state(false);
  let requestedSeat = $state<number | null>(null);
  let actionPending = $state(false);
  let message = $state('');
  let recoveryNotice = $state('');
  let pendingRetryId = $state<string | null>(null);
  let recoveryReview = $state(false);
  let catchUpRoomCode = $state('');
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
    recovery: { notice: recoveryNotice, pendingRetryId, incompatible: projection.diagnostics.some(({ reason }) => reason === 'invalid-envelope') },
    seatCount: room?.seats.length ?? 0,
    maxPlayers: room?.maxPlayers ?? null,
    layout: room?.layout ?? null,
    mode: room?.mode ?? null,
    sharedDisplay,
    ready: room?.seats.map((seat) => seat.ready) ?? [],
    localSeat: localSeat?.name ?? null,
    game: game ? {
      epoch: game.epoch,
      seed: game.seed,
      board: game.board,
      currentTurn: game.players[game.turnSeat].name,
      turnNumber: game.turnNumber,
      phase: game.phase,
      end: game.end,
      pending: game.pending,
      lastMovement: game.lastMovement,
      lastAction: game.lastAction,
      lastRoll: game.lastRoll,
      encounterLog: game.encounterLog,
      abilitiesUsedThisTurn: game.abilitiesUsedThisTurn,
      activeBonusEffects: game.activeBonusEffects,
      bonusLog: game.bonusLog,
      rubyTracks: game.rubyTracks,
      governorPlace: game.governorPlace,
      smugglerPlace: game.smugglerPlace,
      postOfficeLower: game.postOfficeLower,
      largeDemand: game.largeDemand,
      smallDemand: game.smallDemand,
      bonusDrawCount: game.bonusDrawPile.length,
      bonusDiscard: game.bonusDiscard,
      players: game.players.map((player) => ({
        name: player.name,
        merchantPlace: player.merchantPlace,
        assistantsCarried: player.assistantsCarried,
        assistantsByPlace: player.assistantsByPlace,
        lira: player.lira,
        goods: player.goods,
        capacity: player.capacity,
        extensions: player.extensions,
        rubies: player.rubies,
        familyPlace: player.familyPlace,
        assistantsInSupply: player.assistantsInSupply,
        mosqueTileIds: player.mosqueTileIds
      })),
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
      recoveryReview = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && new URL(location.href).searchParams.get('e2eRecovery') === '1';
      const reviewedCacheCount = Number(new URL(location.href).searchParams.get('e2eCacheCount') ?? '0');
      const reviewedRoom = normalizeRoomCode(new URL(location.href).searchParams.get('room') ?? '');
      sharedDisplay = new URL(location.href).searchParams.get('display') === 'table';
      const seatParameter = Number(new URL(location.href).searchParams.get('seat'));
      requestedSeat = Number.isInteger(seatParameter) && seatParameter > 0 ? seatParameter : null;
      if (recoveryReview && reviewedCacheCount > 0 && isRoomCode(reviewedRoom)) {
        const cached = readReplayCache(reviewedRoom).slice(0, reviewedCacheCount);
        localStorage.setItem(replayCacheKey(reviewedRoom), JSON.stringify({ version: 1, events: cached }));
      }
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

  function makeInviteUrl(roomCode: string, options: { seat?: number; display?: boolean } = {}) {
    if (typeof location === 'undefined') return `?room=${roomCode}`;
    const url = new URL(location.href);
    const e2eSeed = url.searchParams.get('e2eSeed');
    url.search = '';
    url.searchParams.set('room', roomCode);
    if (options.seat) url.searchParams.set('seat', String(options.seat));
    if (options.display) url.searchParams.set('display', 'table');
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
    if (events.length > 0) {
      recoveryNotice = `Restored ${events.length} cached events · catching up`;
      updateProjection(roomCode);
    } else recoveryNotice = 'Opening live history';
    pendingRetryId = repository.pendingId();
    if (recoveryReview && events.length > 0) {
      catchUpRoomCode = roomCode;
      return;
    }
    subscribeLive(roomCode);
  }

  function subscribeLive(roomCode = catchUpRoomCode) {
    if (!repository || !roomCode) return;
    catchUpRoomCode = '';
    unsubscribe?.();
    unsubscribe = repository.subscribe(
      (remoteEvents) => {
        events = mergeReplayEvents(events, remoteEvents);
        updateProjection(roomCode);
        writeReplayCache(roomCode, events);
        recoveryNotice = events.length > 0 ? `Live history synced · ${events.length} events verified` : 'Live history synced';
        pendingRetryId = repository?.pendingId() ?? null;
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
    screen = sharedDisplay && projection.room.mode === 'shared-table'
      ? 'shared-display'
      : seated && projection.game ? 'game' : seated ? 'lobby' : 'join-room';
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
        maxPlayers: maxRoomPlayers,
        layout: selectedLayout,
        mode: selectedMode
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

  function useAsSharedDisplay() {
    if (!room || room.mode !== 'shared-table') return;
    sharedDisplay = true;
    replaceState(makeInviteUrl(room.roomCode, { display: true }), {});
    screen = 'shared-display';
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

  async function configureRoom(layout: string) {
    if (!room || !repository || !isHost || actionPending) return;
    actionPending = true;
    try {
      await repository.append('game/configured', {
        maxPlayers: room.maxPlayers,
        layout,
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

  async function moveTo(destination: number, assistantAction: AssistantAction) {
    if (!repository) return;
    actionPending = true;
    try {
      await repository.append('turn/moved', { destination, assistantAction });
      selectedPlace = null;
    } finally {
      actionPending = false;
    }
  }

  async function payMerchants() {
    const pending = game?.pending?.kind === 'merchant-payment' ? game.pending : null;
    if (!repository || !pending) return;
    actionPending = true;
    try {
      await repository.append('turn/merchant-paid', {
        recipientUids: pending.recipientUids,
        neutralMerchantIds: pending.neutralMerchantIds
      });
    } finally {
      actionPending = false;
    }
  }

  async function endTurn() {
    if (!repository) return;
    actionPending = true;
    try {
      await repository.append('turn/ended', {});
      selectedPlace = null;
    } finally {
      actionPending = false;
    }
  }

  async function takePlaceAction(choice: PlaceActionChoice) {
    if (!repository) return;
    actionPending = true;
    try {
      await repository.append('place/action-taken', { choice: JSON.parse(JSON.stringify(choice)) as PlaceActionChoice });
    } finally {
      actionPending = false;
    }
  }

  async function resolveEncounter(choice: EncounterChoice) {
    if (!repository) return;
    actionPending = true;
    try {
      await repository.append('encounter/resolved', { choice });
    } finally {
      actionPending = false;
    }
  }

  async function useMosqueAbility(choice: MosqueAbilityChoice) {
    if (!repository) return;
    actionPending = true;
    try {
      await repository.append('mosque/ability-used', { choice });
    } finally {
      actionPending = false;
    }
  }

  async function playBonus(cardId: string, choice: BonusChoice) {
    if (!repository) return;
    actionPending = true;
    try {
      await repository.append('bonus/played', { cardId, choice });
      selectedBonus = null;
    } finally {
      actionPending = false;
    }
  }

  async function grantE2eResources() {
    if (!repository || actionPending || import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'true') return;
    actionPending = true;
    try {
      await repository.append('e2e/resources-granted', {
        lira: 35,
        capacity: 3,
        goods: { fabric: 3, spice: 3, fruit: 3, jewelry: 3 },
        bonusCards: [
          'bonus-gain-lira-2', 'bonus-repeat-sultan-1',
          'bonus-long-move-4', 'bonus-long-move-2',
          'bonus-gain-good-1', 'bonus-gain-good-2', 'bonus-gain-good-3', 'bonus-gain-good-4'
        ]
      });
    } finally {
      actionPending = false;
    }
  }

  async function rematch() {
    if (!repository || !room || !isHost || game?.phase !== 'game-over' || actionPending) return;
    actionPending = true;
    try {
      const requested = new URL(location.href).searchParams.get('e2eSeed');
      const seed = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && requested
        ? `${requested.slice(0, 82)}:rematch:${game.epoch + 1}`
        : crypto.randomUUID();
      await repository.append('game/rematched', { seed });
      selectedPlace = null;
      selectedBonus = null;
    } finally {
      actionPending = false;
    }
  }

  async function retryPending() {
    if (!repository || actionPending || !pendingRetryId) return;
    actionPending = true;
    try {
      const retried = await repository.retryPending();
      if (retried) recoveryNotice = `Retried ${retried.slice(-6)} with its original event ID`;
      pendingRetryId = repository.pendingId();
    } catch (error) {
      message = error instanceof Error ? error.message : 'Retry failed';
    } finally { actionPending = false; }
  }

  function injectIncompatibleHistoryForE2e() {
    if (import.meta.env.VITE_USE_FIREBASE_EMULATORS !== 'true' || !room) return;
    const base = events[0];
    if (!base) return;
    events = [...events, { ...base, id: 'future-000001', actorUid: 'future', clientSeq: '000001', schemaVersion: schemaVersion + 1 }];
    updateProjection(room.roomCode);
  }

  function stageCommittedRetryForE2e() {
    if (!recoveryReview || !room) return;
    const source = [...events].reverse().find(({ actorUid }) => actorUid === userUid);
    if (!source) return;
    const { id, createdAt: _, ...data } = source;
    localStorage.setItem(`istanbul:pending:${room.roomCode}:${userUid}`, JSON.stringify({ id, data }));
    pendingRetryId = id;
    recoveryNotice = `Write ${id.slice(-6)} awaits same-ID confirmation`;
  }

  function injectStaleConcurrentForE2e() {
    if (!recoveryReview || !room || events.length === 0) return;
    const source = events.at(-1)!;
    events = [...events, { ...source, id: 'stale-000001', actorUid: 'stale', clientSeq: '000001', createdAt: (source.createdAt ?? 0) + 1, type: 'turn/ended', payload: {} }];
    updateProjection(room.roomCode);
    recoveryNotice = 'Stale concurrent event contained · live projection unchanged';
  }
</script>

<svelte:head><title>{appTitle}</title></svelte:head>

<main data-e2e-layout class:lobby-screen={screen === 'lobby'} class:game-screen={screen === 'game' || screen === 'shared-display'} class:shared-screen={screen === 'shared-display'}>
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

  {#if projection.diagnostics.some(({ reason }) => reason === 'invalid-envelope')}
    <section class="compatibility-block" role="alert" aria-labelledby="compatibility-title">
      <p class="section-kicker">Replay protection</p><h1 id="compatibility-title">This table needs a newer Istanbul build.</h1>
      <p>History was not guessed or partially applied. Update the app, then reopen the same room code.</p>
      <strong>{projection.diagnostics.filter(({ reason }) => reason === 'invalid-envelope').length} incompatible event blocked</strong>
    </section>
  {:else}
    {#if recoveryNotice.includes('Restored') || pendingRetryId || recoveryReview}<aside class="recovery-strip" aria-label="History recovery status"><span>{recoveryNotice}</span>{#if catchUpRoomCode}<button onclick={() => subscribeLive()}>Catch up live history</button>{/if}{#if pendingRetryId}<button onclick={() => void retryPending()}>Retry pending event {pendingRetryId.slice(-6)}</button>{/if}{#if room && recoveryReview && !pendingRetryId}<button class="e2e-compatibility" onclick={stageCommittedRetryForE2e}>Review same-ID retry</button><button class="e2e-compatibility" onclick={injectStaleConcurrentForE2e}>Review stale concurrent event</button><button class="e2e-compatibility" onclick={injectIncompatibleHistoryForE2e}>Review incompatible history</button>{/if}</aside>{/if}

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
            <label>Layout<select bind:value={selectedLayout}><option value="short-path">Short Path</option><option value="long-path">Long Path</option><option value="number-order">Number Order</option><option value="random">Seeded Random</option></select></label>
            <label>Play surface<select bind:value={selectedMode}><option value="personal-screens">Personal screens</option><option value="shared-table">Shared table + private phones</option></select></label>
            <button class="primary" type="submit" disabled={!hostName.trim() || actionPending}>Create {selectedMode === 'shared-table' ? 'shared table' : 'private room'} <svg class="button-arrow" aria-hidden="true" viewBox="0 0 16 16"><path d="M2 8h11M9 4l4 4-4 4" /></svg></button>
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
      <div class="room-ticket"><span>{modeNames[room.mode]}</span><strong>{room.roomCode}</strong><small>{room.seats.length} {room.seats.length === 1 ? 'merchant' : 'merchants'} here · {room.maxPlayers - room.seats.length} open</small></div>
      <div class="join-panel">
        <p class="section-kicker">You were invited</p>
        <h1 id="join-room-title">Take a seat at {room.seats[0].name}’s table.</h1>
        <p>The table is using the <strong>{layoutNames[room.layout]}</strong> layout.{requestedSeat ? ` This invitation is for controller seat ${requestedSeat}.` : ''} Your merchant name is public; Bonus cards stay private once play begins.</p>
        {#if room.mode === 'shared-table'}<button class="display-selector" onclick={useAsSharedDisplay}>Use this screen as the public table</button><div class="divider"><span>or claim a private controller</span></div>{/if}
        <form onsubmit={(event) => { event.preventDefault(); void joinRoom(); }}>
          <label>Your merchant name<input bind:value={guestName} maxlength="24" autocomplete="nickname" required /></label>
          <button class="primary" type="submit" disabled={!guestName.trim() || actionPending || room.seats.length >= room.maxPlayers}>Join the room <svg class="button-arrow" aria-hidden="true" viewBox="0 0 16 16"><path d="M2 8h11M9 4l4 4-4 4" /></svg></button>
        </form>
        {#if message}<p class="error" role="alert">{message}</p>{/if}
      </div>
    </section>
  {:else if screen === 'lobby' && room && localSeat}
    <section class="lobby" aria-labelledby="lobby-title">
      <div class="lobby-heading">
        <div><p class="eyebrow">Private room · {room.roomCode}</p><h1 id="lobby-title">Gather your merchants.</h1><p>{allReady ? 'Everyone here is ready. The room creator can open the bazaar.' : 'Invite everyone who is playing, then each merchant marks themselves ready.'}</p></div>
        <div class:ready-seal={allReady} class="room-state" aria-live="polite"><span>{allReady ? 'Table ready' : 'Waiting'}</span><strong>{room.seats.filter((seat) => seat.ready).length}/{room.seats.length}</strong><small>merchants ready</small></div>
      </div>

      <div class="lobby-grid">
        <section class="seats-card" aria-labelledby="seats-title">
          <div class="card-heading"><div><p class="section-kicker">Ordered clockwise</p><h2 id="seats-title">Merchants at the table</h2></div><span>{room.seats.length} joined</span></div>
          <ol class="seats">
            {#each room.seats as seat, index}
              <li>
                <span class="seat-number">{index + 1}</span>
                <span class="merchant-token" aria-hidden="true">{seat.name.slice(0, 1).toUpperCase()}</span><span class="seat-copy"><strong>{seat.name}{seat.uid === userUid ? ' · you' : ''}</strong><small>{seat.uid === room.hostUid ? 'Room creator' : 'Guest merchant'}</small></span><span class:ready={seat.ready} class="readiness">{seat.ready ? 'Ready' : 'Planning'}</span>
              </li>
            {/each}
            {#if room.seats.length < room.maxPlayers}
              <li class="open"><span class="seat-number">+</span><span class="empty-token" aria-hidden="true">+</span><span class="seat-copy"><strong>Room is open</strong><small>Another merchant may still join</small></span><span class="readiness">Inviting</span></li>
            {/if}
          </ol>
        </section>

        <aside class="table-card" aria-labelledby="table-title">
          <div class="card-heading"><div><p class="section-kicker">Table settings</p><h2 id="table-title">The opening route</h2></div><span class="route-medallion" aria-hidden="true">16</span></div>
          {#if isHost}
            <label>Reviewed layout<select value={room.layout} onchange={(event) => void configureRoom(event.currentTarget.value)} disabled={actionPending}><option value="short-path">Short Path</option><option value="long-path">Long Path</option><option value="number-order">Number Order</option><option value="random">Seeded Random</option></select></label>
          {:else}
            <dl><div><dt>Layout</dt><dd>{layoutNames[room.layout]}</dd></div><div><dt>Room</dt><dd>Open until start</dd></div></dl>
          {/if}
          <p class="layout-note">{room.layout === 'short-path' ? 'Direct trade routes make this a welcoming first table.' : room.layout === 'long-path' ? 'Ruby routes sit farther apart for a more tactical journey.' : room.layout === 'number-order' ? 'The numbered reference arrangement from the rulebook.' : 'A valid arrangement derived from the committed setup seed.'}</p>
          <div class="invite"><label>Invitation link<input readonly value={inviteUrl} aria-label="Invitation link" /></label><p>Room code <strong>{room.roomCode}</strong></p></div>
          {#if room.mode === 'shared-table'}
            <div class="shared-invite"><SeatQr compact url={makeInviteUrl(room.roomCode)} label="Merchant invitation" /><a href={makeInviteUrl(room.roomCode, { display: true })} target="_blank" rel="noreferrer">Open public table display</a></div>
          {/if}
          {#if allReady && isHost}
            <button class="primary ready-button start-button" onclick={() => void startGame()} disabled={actionPending}>Open the bazaar <svg class="button-arrow" aria-hidden="true" viewBox="0 0 16 16"><path d="M2 8h11M9 4l4 4-4 4" /></svg></button>
          {:else}
            <button class:unready={localSeat.ready} class="primary ready-button" onclick={() => void toggleReady()} disabled={actionPending}>{localSeat.ready ? 'Keep planning' : 'I am ready'} <span aria-hidden="true">{localSeat.ready ? '↺' : '✓'}</span></button>
          {/if}
        </aside>
      </div>

      <footer class="history"><span>Immutable history <strong data-testid="event-count">{projection.acceptedEventIds.length} events</strong></span><span>Replay <strong>{projection.diagnostics.length === 0 ? 'clean' : `${projection.diagnostics.length} diagnostics`}</strong></span><span>Mode <strong>{modeNames[room.mode]}</strong></span></footer>
    </section>
  {:else if screen === 'shared-display' && room}
    {#if game}
      <GameTable
        {game} {room} userUid="" selectedPlace={null} selectedBonus={null} {boardScale} displayOnly
        onInspectPlace={() => {}} onInspectBonus={() => {}} onMove={() => {}} onPayMerchants={() => {}}
        onTakeAction={() => {}} onResolveEncounter={() => {}} onUseMosqueAbility={() => {}} onPlayBonus={() => {}}
        onGrantE2eResources={() => {}} onRematch={() => {}} onEndTurn={() => {}}
        onZoomIn={() => boardScale = Math.min(1.18, boardScale + 0.09)} onFit={() => boardScale = 1}
      />
    {:else}<SharedTableLobby {room} invitationFor={() => makeInviteUrl(room.roomCode)} />{/if}
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
      onMove={(destination, assistantAction) => void moveTo(destination, assistantAction)}
      onPayMerchants={() => void payMerchants()}
      onTakeAction={(choice) => void takePlaceAction(choice)}
      onResolveEncounter={(choice) => void resolveEncounter(choice)}
      onUseMosqueAbility={(choice) => void useMosqueAbility(choice)}
      onPlayBonus={(cardId, choice) => void playBonus(cardId, choice)}
      onGrantE2eResources={() => void grantE2eResources()}
      onRematch={() => void rematch()}
      onEndTurn={() => void endTurn()}
      onZoomIn={() => boardScale = Math.min(1.18, boardScale + 0.09)}
      onFit={() => boardScale = 1}
    />
  {/if}
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
  main { min-height: 100svh; overflow: hidden; padding: max(clamp(4.8rem, 8vw, 6rem), env(safe-area-inset-top)) max(clamp(1rem, 4vw, 4rem), env(safe-area-inset-right)) max(clamp(1rem, 3vw, 2rem), env(safe-area-inset-bottom)) max(clamp(1rem, 4vw, 4rem), env(safe-area-inset-left)); background: radial-gradient(circle at 8% 8%, #fff9e9 0 0.5rem, transparent 0.55rem), linear-gradient(90deg, rgb(23 63 67 / 5%) 1px, transparent 1px) 0 0 / 4rem 4rem, linear-gradient(rgb(23 63 67 / 5%) 1px, transparent 1px) 0 0 / 4rem 4rem, linear-gradient(145deg, #f4ead6, #dfc28e); }
  main.game-screen { height: 100svh; min-height: 0; padding: max(4.75rem, env(safe-area-inset-top)) max(.7rem, env(safe-area-inset-right)) max(.6rem, env(safe-area-inset-bottom)) max(.7rem, env(safe-area-inset-left)); background: #102f32; }
  .topbar { position: absolute; inset: 0 0 auto; height: 4.2rem; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(1rem, 4vw, 4rem); border-bottom: 1px solid rgb(23 63 67 / 18%); background: rgb(255 251 240 / 78%); backdrop-filter: blur(12px); }
  .brand { display: flex; align-items: center; gap: .8rem; color: inherit; font: 700 1.7rem/1 'Cormorant Garamond', serif; text-decoration: none; }
  .brand-gem { width: 1.15rem; height: 1.15rem; rotate: 45deg; border: 2px solid #f3aa8c; border-radius: .2rem; background: #aa303f; box-shadow: inset 0 0 0 3px #c84a51; }
  .connection { display: flex; align-items: center; gap: .55rem; font-size: .82rem; }
  .connection p { margin: 0; font-weight: 700; }
  .connection-mark { width: .55rem; height: .55rem; border: 2px solid #173f43; border-radius: 50%; background: #e7c882; }
  .connection:has([data-status='synced']) .connection-mark { border-color: #23664d; background: #58a575; }
  .connection:has([data-status='error']) .connection-mark { border-color: #8b2528; background: #ce4c4f; }
  .recovery-strip { position: absolute; z-index: 8; top: 4.2rem; right: clamp(1rem, 4vw, 4rem); display: flex; gap: .45rem; align-items: center; padding: .3rem .55rem; border-radius: 0 0 .65rem .65rem; color: #173f43; background: #efca7d; font-size: .64rem; font-weight: 700; box-shadow: 0 .25rem .8rem #34210d2b; }.recovery-strip button { min-height: 1.65rem; padding: .2rem .45rem; border: 1px solid #173f43; border-radius: .35rem; color: #fffaf0; background: #173f43; font-size: .58rem; }.recovery-strip .e2e-compatibility { border: 0; color: #704329; background: transparent; text-decoration: underline; }.compatibility-block { width: min(48rem, calc(100% - 2rem)); margin: 6rem auto 0; padding: clamp(2rem, 6vw, 5rem); border: 2px solid #a43b32; border-radius: 1.5rem; background: radial-gradient(circle at 90% 10%, #efca7d66, transparent 12rem), #fffaf0; box-shadow: 0 2rem 5rem #4c30162b; }.compatibility-block h1 { font-size: clamp(2.5rem, 6vw, 5rem); }.compatibility-block p:not(.section-kicker) { max-width: 35rem; color: #496665; font-size: 1.05rem; line-height: 1.5; }.compatibility-block strong { color: #a43b32; }
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
  button { min-height: 2.9rem; border: 0; border-radius: .75rem; font-weight: 700; }
  button.primary { display: flex; align-items: center; justify-content: space-between; margin-top: .65rem; padding: .72rem 1rem; color: #173f43; background: #efca7d; box-shadow: 0 .35rem 0 #bd8b39; }
  .button-arrow { width: 1rem; height: 1rem; fill: none; stroke: currentColor; stroke-width: 1.75; stroke-linecap: round; stroke-linejoin: round; }
  button.primary:active { translate: 0 .2rem; box-shadow: 0 .15rem 0 #bd8b39; }
  button:disabled { opacity: .48; box-shadow: none; }
  .divider { display: flex; align-items: center; gap: .7rem; margin: 1.2rem 0; color: #9cb4af; font-size: .75rem; text-transform: uppercase; }
  .divider::before, .divider::after { height: 1px; flex: 1; content: ''; background: rgb(255 250 240 / 18%); }
  .join-form { grid-template-columns: 1fr auto; align-items: end; }
  .secondary { padding: .6rem 1rem; border: 1px solid rgb(255 250 240 / 40%); color: #fffaf0; background: transparent; }
  .display-selector { width: 100%; padding: .65rem 1rem; border: 1px solid #efca7d; color: #173f43; background: #efca7d; }
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
  .shared-invite { display: grid; grid-template-columns: 1fr auto; gap: .7rem; align-items: center; margin-top: .65rem; padding: .55rem; border: 1px solid rgb(255 255 255 / 17%); border-radius: .7rem; }
  .shared-invite a { padding: .65rem; border: 1px solid #efca7d; border-radius: .55rem; color: #efca7d; font-size: .7rem; font-weight: 700; text-align: center; text-decoration: none; }
  .ready-button.unready { color: #fffaf0; background: #9c3d39; box-shadow: 0 .35rem 0 #652927; }
  .start-button { color: #fffaf0 !important; background: #267356 !important; box-shadow: 0 .35rem 0 #164a37 !important; }
  .history { display: flex; justify-content: center; gap: 1.4rem; padding-top: .85rem; color: #5c716e; font-size: .76rem; }
  .history span + span { padding-left: 1.4rem; border-left: 1px solid rgb(23 63 67 / 20%); }
  .state-output { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (max-width: 720px) {
    main { padding: max(4.35rem, env(safe-area-inset-top)) max(.6rem, env(safe-area-inset-right)) max(.6rem, env(safe-area-inset-bottom)) max(.6rem, env(safe-area-inset-left)); }
    .topbar { height: 3.8rem; padding: 0 .8rem; }
    .recovery-strip { top: 3.8rem; right: .6rem; max-width: calc(100% - 1.2rem); }.recovery-strip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.compatibility-block { margin-top: 4rem; padding: 1.4rem; }.compatibility-block h1 { font-size: 2.7rem; }
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
    .shared-invite { grid-column: 1 / -1; }
    .ready-button { grid-column: 1 / -1; margin-top: .2rem !important; }
    .history { gap: .55rem; padding-top: .45rem; font-size: .62rem; }
    .history span + span { padding-left: .55rem; }
  }
  @media (max-height: 500px) and (orientation: landscape) {
    :global(html), :global(body) { height: 100%; overflow: hidden; }
    main { padding: max(3.35rem, env(safe-area-inset-top)) max(.5rem, env(safe-area-inset-right)) max(.4rem, env(safe-area-inset-bottom)) max(.5rem, env(safe-area-inset-left)); }
    main.game-screen { padding-top: max(3.25rem, env(safe-area-inset-top)); }
    .topbar { height: 3rem; padding: 0 max(.7rem, env(safe-area-inset-right)) 0 max(.7rem, env(safe-area-inset-left)); }
    .brand { font-size: 1.2rem; }.connection { font-size: .62rem; }.build { display: none; }
    .landing, .join-room { min-height: 0; height: calc(100svh - 3.75rem); border-radius: 1rem; }
    .welcome { padding: 1rem; }.welcome h1 { font-size: 2.2rem; }.welcome .lede, .route-notes { display: none; }
    .entry-card, .join-panel { padding: .75rem 1rem; }.entry-card h2 { margin-bottom: .35rem; }.landing .entry-card > .divider, .landing .entry-card > section:last-of-type { display: none; }
    input, select { min-height: 2.2rem; padding: .35rem .55rem; }.entry-card button { min-height: 2.25rem; }
    .join-room { grid-template-columns: .72fr 1.28fr; }.room-ticket strong { font-size: 3.5rem; }.join-panel h1 { font-size: 2.25rem; }.join-panel > p:not(.section-kicker,.error) { margin: .2rem 0 .5rem; font-size: .72rem; }.join-panel .divider { margin: .3rem 0; }
    .lobby { min-height: calc(100svh - 3.7rem); }.lobby-heading { margin: 0 0 .3rem; }.lobby-heading h1 { margin: 0; font-size: 1.8rem; }.lobby-heading > div:first-child > p:last-child { display: none; }.room-state { min-width: 5rem; padding: .25rem .5rem; }.room-state small { display: none; }.room-state span { font-size: .5rem; }.room-state strong { font-size: 1.2rem; }
    .lobby-grid { grid-template-columns: .8fr 1.2fr; gap: .4rem; }.seats-card, .table-card { padding: .5rem; border-radius: .7rem; }.card-heading { padding-bottom: .25rem; }.card-heading h2 { margin: 0; font-size: 1.05rem; }.seats { gap: .2rem; margin-top: .25rem; }.seats li { min-height: 2rem; padding: .2rem .35rem; }.merchant-token, .empty-token { width: 1.5rem; height: 1.5rem; border-width: 2px; }.table-card { display: grid; grid-template-columns: 1fr 1fr; gap: .2rem .4rem; }.table-card .card-heading, .layout-note, .invite, .shared-invite, .ready-button { grid-column: 1 / -1; }.table-card label { margin-top: 0; }.layout-note { min-height: 0; margin: 0; font-size: .55rem; }.invite input { min-height: 1.8rem; font-size: .55rem; }.shared-invite { display: none; }.ready-button { min-height: 2.2rem; margin-top: 0 !important; }.history { display: none; }
  }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; transition: none !important; animation: none !important; } }
</style>
