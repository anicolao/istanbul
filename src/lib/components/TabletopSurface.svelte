<script lang="ts">
  import '$lib/assets/fonts/game-symbols.css';
  import { unfinishedDestination, availableRepeatCard } from '$lib/game/unfinished-destination';
  import { gemstoneDisplay } from './gemstone-offer';
  import { untrack } from 'svelte';
  import ActionMotion from './ActionMotion.svelte';
  import {
    planActionMotion,
    projectMotion,
    type ActionMotion as MotionPlan
  } from './action-motion';
  import LocationFace from './LocationFace.svelte';
  import { warehouseGood } from '$lib/game/actions';
  import { cubicInOut } from 'svelte/easing';
  import BonusController from './BonusController.svelte';
  import CaravansaryFlow from './CaravansaryFlow.svelte';
  import type { BonusChoice } from '$lib/game/bonus';
  import { base } from '$app/paths';
  import { places, bonusCards, type Good } from '$lib/game/manifests';
  import { type PlayerColorName } from '$lib/game/art';
  import {
    merchantToll,
    legalDestinations,
    requiredAssistantAction,
    type AssistantAction
  } from '$lib/game/movement';
  import type { PlaceActionChoice } from '$lib/game/actions';
  import type { EncounterChoice } from '$lib/game/encounters';
  import {
    ownsMosqueAbility,
    type MosqueAbilityChoice
  } from '$lib/game/mosques';
  import type { GameSetup } from '$lib/game/setup';
  import type { RoomProjection, ReplayProjection } from '$lib/game/protocol';
  import { occupiedPositions, sharedTableLayout, tableAngle, tableControls } from './table-layout';
  import LocationTile from './LocationTile.svelte';
  import TabletopPlayerPanel from './TabletopPlayerPanel.svelte';
  import ComponentHelp from './ComponentHelp.svelte';
  import DockPlayerSummary from './DockPlayerSummary.svelte';
  import TabletopPlaceActions from './TabletopPlaceActions.svelte';
  import GameArt from './GameArt.svelte';
  import TabletopArrow from './TabletopArrow.svelte';
  import UndoButton from './UndoButton.svelte';
  import BonusCardChoices from './BonusCardChoices.svelte';
  import GameResults from './GameResults.svelte';
  import FamilyRewardChoices from './FamilyRewardChoices.svelte';
  import BonusCard from './BonusCard.svelte';
  let {
    game: incomingGame,
    room,
    userUid,
    onMove,
    onPayMerchants,
    onTakeAction,
    onResolveEncounter,
    onUseMosqueAbility,
    onEndTurn,
    onUndo,
    onRollback,
    onRematch,
    onLeave,
    connectedUids = room.seats.filter(seat => !seat.left).map(seat => seat.uid),
    undo,
    gameLog,
    undoPending = false,
    selectedBonus = null,
    onInspectBonus = () => {},
    onPlayBonus = () => {},
    undoLog = [],
    onGrantE2eResources = () => {},
    e2eResourceReview = 'ruby-routes'
  }: {
    game: GameSetup;
    room: RoomProjection;
    userUid: string;
    onMove: (place: number, assistant: AssistantAction) => void;
    onPayMerchants: () => void;
    onTakeAction: (choice: PlaceActionChoice) => void;
    onResolveEncounter: (choice: EncounterChoice) => void;
    onUseMosqueAbility: (choice: MosqueAbilityChoice) => void;
    onEndTurn: () => void;
    onUndo: () => void;
    onRollback: (id: string) => void;
    onRematch: (layout: RoomProjection['layout']) => void;
    onLeave?: () => void;
    connectedUids?: string[];
    undo: ReplayProjection['undo'];
    gameLog: ReplayProjection['gameLog'];
    undoPending?: boolean;
    selectedBonus?: string | null;
    onInspectBonus?: (id: string) => void;
    onPlayBonus?: (id: string, choice: BonusChoice) => void;
    undoLog?: ReplayProjection['undoLog'];
    onGrantE2eResources?: () => void;
    e2eResourceReview?: string;
  } = $props();
  function openDockPlayer(uid: string) {
    dockSelected = dockSelected === uid ? null : uid;
    requestAnimationFrame(() => {
      const seats = surface?.querySelector<HTMLElement>('.mat-dock .seats');
      const mat = Array.from(seats?.querySelectorAll<HTMLElement>('.mat') ?? []).find(el => el.dataset.playerUid === uid);
      if (seats && mat) seats.scrollTo({ left: mat.offsetLeft - (seats.clientWidth - mat.clientWidth) / 2, behavior: 'smooth' });
    });
  }
  let dockSelected = $state<string | null>(null);
  let endWarning = $state<string | null>(null);
  let finishEncountersForRepeat = $state(false);
  let repeatEncounterStep = '';
  let game = $state.raw(untrack(() => incomingGame));
  let surface = $state<HTMLElement>();
  let tableWidth = $state(0), tableHeight = $state(0);
  const dockFits = $derived(tableWidth >= game.players.length * 280 + 16 + (game.players.length - 1) * 10);
  const dockPlayers = $derived.by(() => {
    const local = Math.max(0, matGame.players.findIndex(p => p.uid === userUid));
    return [...matGame.players.slice(local), ...matGame.players.slice(0, local)];
  });
  const positions = $derived(occupiedPositions(game, room));
  const sharedLayout = $derived(sharedTableLayout(positions, tableWidth, tableHeight));
  const controls = $derived(tableControls(sharedLayout, tableWidth, tableHeight));
  let zoomReady = $state(false);
  let previousGame: GameSetup | undefined;
  let motion = $state.raw<MotionPlan | null>(null);
  const pendingMotions: MotionPlan[] = [];
  let landedSteps = $state<number[]>([]);
  let boardMotion = $state(false);
  let undoMotion = false;
  let motionChoice: PlaceActionChoice | undefined;
  let queuedUndo = $state(false);
  let dismissAfterMotion = $state(false);
  const visualGame = $derived(
    motion ? projectMotion(motion, new Set(landedSteps)) : game
  );
  const gemstone = $derived.by(() => {
    const flight = motion?.steps.find(
      (s) =>
        s.from.place === 16 && s.from.selector?.includes('data-gemstone-ruby')
    );
    if (motion && flight && !motion.reverse)
      return {
        price: motion.before.rubyTracks.gemstonePrice,
        taken: landedSteps.includes(flight.id)
      };
    return gemstoneDisplay(game);
  });
  const matGame = $derived(visualGame),
    boardGame = $derived(visualGame),
    mailGame = $derived(
      motion
        ? {
            ...visualGame,
            players: visualGame.players.map((p) => ({
              ...p,
              goods:
                motion!.before.players.find((old) => old.uid === p.uid)
                  ?.goods ?? p.goods
            }))
          }
        : visualGame
    );
  const cardDraw = $derived(
    motion?.steps.some((s) => s.card && !landedSteps.includes(s.id)) ?? false
  );
  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
  const player = $derived(game.players[game.turnSeat]);
  const fillMessage = $derived(
    game.lastAction?.kind === 'warehouse-fill'
      ? `${warehouseGood(game.lastAction.place)!.replace(/^./, (letter) => letter.toUpperCase())} ${visualGame.players[game.turnSeat].goods[warehouseGood(game.lastAction.place)!]} / ${player.capacity} · ${motion ? 'Filling wheelbarrow' : 'Wheelbarrow full'}`
      : null
  );
  function recordAction(choice: PlaceActionChoice) {
    motionChoice = choice;
    onTakeAction(choice);
  }
  function animateUndo() {
    if (motion) {
      queuedUndo = true;
      return;
    }
    undoMotion = true;
    onUndo();
  }
  function closeRoom() {
    endWarning = null;
    if (motion) dismissAfterMotion = true;
    else collapsed = true;
  }
  function finishMotion() {
    motion = null;
    boardMotion = false;
    landedSteps = [];
    while (pendingMotions.length) {
      const next = pendingMotions.shift()!;
      startMotion(next);
      if (motion) return;
    }
    if (queuedUndo) {
      queuedUndo = false;
      undoMotion = true;
      onUndo();
    }
    if (dismissAfterMotion) {
      dismissAfterMotion = false;
      collapsed = true;
    }
  }
  function startMotion(next: MotionPlan) {
    game = next.after;
    motion = next.steps.length ? next : null;
    landedSteps = [];
    boardMotion = next.steps.some((s) => s.stage === 'board');
  }
  $effect(() => {
    const current = incomingGame;
    untrack(() => {
      const snapshot = structuredClone($state.snapshot(current));
      // Optimistic writes, acknowledgements and replay can publish the same
      // position repeatedly. They must not restart an unfinished flight.
      if (previousGame && JSON.stringify(snapshot) === JSON.stringify(previousGame)) return;
      endWarning = null;
      if (
        previousGame &&
        previousGame.epoch === current.epoch &&
        previousGame.seed === current.seed
      ) {
        const next = planActionMotion(
          previousGame,
          snapshot,
          undoMotion,
          undoMotion ? undefined : motionChoice
        );
        // A fast bot may publish its next action before this one lands.
        // Play each transition once, in order, from its committed position.
        if (motion) pendingMotions.push(next);
        else startMotion(next);
      } else {
        pendingMotions.length = 0;
        game = snapshot;
        finishMotion();
      }
      undoMotion = false;
      motionChoice = undefined;
      previousGame = snapshot;
    });
  });

  const canControl = $derived(
    userUid === player.uid || (room.tabletopOwned && userUid === room.hostUid)
  );
  const busy = $derived(undoPending || !canControl || Boolean(motion));
  const personal = $derived(room.mode === 'personal-screens');
  const localPlayer = $derived(game.players.find((p) => p.uid === userUid));
  const seat = $derived(
    { angle: personal ? 0 : tableAngle(positions[game.turnSeat]) }
  );
  let handOpen = $state(false);
  $effect(() => {
    if (personal && selectedBonus) handOpen = true;
  });
  const pending = $derived(game.pending);
  const activePlace = $derived(
    pending?.kind === 'caravansary-discard'
      ? 6
      : pending?.kind === 'family-action'
        ? pending.destination
        : pending?.kind === 'warehouse-extra' || pending?.kind === 'dice-adjust'
          ? pending.actionPlace
          : game.phase === 'turn-end' &&
              game.lastAction?.playerUid === player.uid
            ? game.lastAction.place
            : player.merchantPlace
  );
  const warehouseEncounters = $derived(
    pending?.kind === 'warehouse-extra' && !pending.familyAction
      ? {
          kind: 'encounters' as const,
          familyUids: game.players
            .filter(
              (p) =>
                p.uid !== player.uid &&
                p.familyPlace === activePlace &&
                activePlace !== 12
            )
            .map((p) => p.uid),
          governor:
            game.governorPlace === activePlace ? ('available' as const) : null,
          smuggler: game.smugglerPlace === activePlace
        }
      : null
  );
  const actionReady = $derived(
    game.phase === 'action' || game.phase === 'family-action'
  );
  const fountainRecall = $derived(activePlace === 7 && actionReady);
  const fountainEncounter = $derived(activePlace === 7 && pending?.kind === 'encounters');
  let recalledPlaces = $state<number[]>([]);
  $effect(() => {
    if (!fountainRecall) recalledPlaces = [];
  });
  const reachable = $derived(
    game.phase === 'movement' ? legalDestinations(game, player) : []
  );
  const repeatCard = $derived(bonusCards.find(card => card.id === availableRepeatCard(game)));
  const canEnd = $derived(
    pending?.kind !== 'caravansary-discard' &&
      (['action', 'family-action', 'turn-end', 'final-bonus'].includes(
        game.phase
      ) ||
        (pending?.kind === 'warehouse-extra' &&
          !game.players.some(
            (p) =>
              p.uid !== player.uid &&
              p.familyPlace === player.merchantPlace &&
              p.familyPlace !== 12
          )) ||
        (pending?.kind === 'encounters' &&
          pending.governor !== 'payment' &&
          !pending.relocation &&
          !pending.familyUids.length))
  );
  let zoom = $state<number | null>(null),
    zoomAngle = $state(0),
    history = $state(false),
    yellow = $state(false),
    power = $state<Good | null>(null),
    inspectedCard = $state<string | null>(null);
  let collapsed = $state(false);
  let arrivalContext = $state('');
  let context = $state(''),
    gain = $state<Good>('fabric'),
    smuggler = $state(false);
  const publicCard = $derived(bonusCards.find((c) => c.id === inspectedCard));
  const title = $derived(places.find((p) => p.id === zoom)?.name ?? '');
  $effect(() => {
    const next = `${game.epoch}:${game.turnNumber}:${game.turnSeat}`;
    if (next !== context) {
      context = next;
      zoom = null;
      history = false;
      yellow = false;
      power = null;
      smuggler = false;
      inspectedCard = null;
      finishEncountersForRepeat = false;
    }
    if (boardMotion) {
      if (fountainEncounter) arrivalContext = '';
      collapsed = true;
      return;
    }
    const arrival = `${next}:${game.phase}:${activePlace}:${seat.angle}`;
    if (arrival !== arrivalContext) {
      arrivalContext = arrival;
      collapsed = game.phase === 'movement';
      if (game.phase !== 'movement' && game.phase !== 'game-over') {
        if (!personal || canControl) zoom = activePlace;
        zoomAngle = seat.angle;
      }
    }
  });
  $effect(() => {
    if (!finishEncountersForRepeat || busy || !canControl) return;
    const step = JSON.stringify([game.epoch, game.turnNumber, game.turnSeat, game.phase, pending]);
    if (step === repeatEncounterStep) return;
    repeatEncounterStep = step;
    untrack(() => {
      if (pending?.kind === 'encounters' && canEnd) {
        if (pending.governor === 'available') onResolveEncounter({ kind: 'governor-visit', accept: false });
        else if (pending.smuggler) onResolveEncounter({ kind: 'smuggler-trade', accept: false });
      } else {
        finishEncountersForRepeat = false;
        if (game.phase === 'turn-end') requestEndTurn();
      }
    });
  });
  function requestEndTurn() {
    if (busy || !canEnd || finishEncountersForRepeat) return;
    // Ending already declines optional visitors; preserve the chance to repeat
    // the destination action once those encounter events have completed.
    if (pending?.kind === 'encounters' && availableRepeatCard({ ...game, phase: 'turn-end' })) {
      repeatEncounterStep = '';
      finishEncountersForRepeat = true;
      return;
    }
    const unfinished = unfinishedDestination(game);
    if (unfinished) {
      endWarning = `You didn't choose to ${unfinished}. End your turn anyway?`;
      open();
    } else if (repeatCard) {
      endWarning = repeatCard.effect === 'repeat-post'
        ? 'You can collect the Post Office resources again with a Bonus card. End your turn anyway?'
        : 'You can gain another ruby with a Bonus card. End your turn anyway?';
      open();
    } else onEndTurn();
  }
  function confirmEndTurn() {
    if (busy || !canEnd) return;
    endWarning = null;
    onEndTurn();
  }
  function open(id = activePlace) {
    zoom = id;
    zoomAngle = seat.angle;
    collapsed = false;
    power = null;
  }
  function navigateBoard(event: KeyboardEvent, index: number) {
    const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -4, ArrowDown: 4 }[
      event.key
    ];
    if (delta === undefined) return;
    event.preventDefault();
    const target = Math.max(0, Math.min(15, index + delta));
    (event.currentTarget as HTMLElement)
      .closest('.board')
      ?.querySelector<HTMLElement>(`[data-place-id="${game.board[target]}"]`)
      ?.focus();
  }
  function tapRoom(id: number, event: MouseEvent) {
    if (busy) return;
    if (id === 7 && activePlace === 7 && canEnd && !fountainEncounter) {
      requestEndTurn();
      return;
    }
    if (fountainRecall) {
      const count = player.assistantsByPlace[id] ?? 0;
      if (id !== 7 && count) {
        const selected = recalledPlaces.filter((place) => place === id).length;
        recalledPlaces =
          selected === count
            ? recalledPlaces.filter((place) => place !== id)
            : [...recalledPlaces, id];
      }
      return;
    }
    const card = (event.target as HTMLElement).closest<HTMLElement>(
      '[data-inspect-pile-card]'
    )?.dataset.inspectPileCard;
    if (card && !reachable.includes(id)) {
      inspectedCard = card;
      open(id);
      return;
    }
    if (yellow) {
      if (player.assistantsByPlace[id]) {
        onUseMosqueAbility({ kind: 'yellow-recall', place: id });
        yellow = false;
      }
      return;
    }
    if (reachable.includes(id)) {
      const assistant = requiredAssistantAction(player, id);
      if (assistant) {
        if (merchantToll(game, player, id) <= player.lira)
          onMove(id, assistant);
        else open(id);
      }
      return;
    }
    open(id);
  }
  function showPower(good: Good) {
    if (
      good === 'fruit' &&
      game.phase === 'movement' &&
      !game.abilitiesUsedThisTurn.includes('fruit') &&
      player.lira >= 2
    ) {
      yellow = !yellow;
      collapsed = true;
      return;
    }
    open();
    power = good;
  }
  const roomGeometry = new WeakMap<
    HTMLElement,
    { origin: DOMRect; bounds: DOMRect; scale: number; sourceAngle: number;
      area: { x: number; y: number; width: number; height: number } }
  >();
  function fitRoom(node: HTMLElement, id: number, angle: number) {
    const table = node.parentElement;
    if (!table) return roomGeometry.get(node);
    const source = table.querySelector<HTMLElement>(`[data-place-id="${id}"]`);
    // The board can unmount before a global outro finishes (reload/rematch).
    if (!source) return roomGeometry.get(node);
    const origin = source.getBoundingClientRect();
    const bounds = table.getBoundingClientRect();
    const layout = getComputedStyle(table);
    const sourceAngle = personal ? parseFloat(layout.getPropertyValue('--board-angle')) || 0 : 0;
    const sourceSideways = Math.abs(sourceAngle % 180) === 90;
    const sourceWidth = sourceSideways ? origin.height : origin.width;
    const sourceHeight = sourceSideways ? origin.width : origin.height;
    const left = 8;
    const bottom = bounds.height - 34;
    const area = personal
      ? { x: left, y: 8, width: bounds.width - left - 8, height: bottom - 8 }
      : sharedTableLayout(positions, bounds.width, bounds.height).playArea;
    const availableHeight = area.height;
    const availableWidth = area.width;
    node.style.top = `${area.y + availableHeight / 2}px`;
    node.style.left = `${area.x + availableWidth / 2}px`;
    const sideways = Math.abs(angle % 180) === 90;
    const scale = Math.min(
      4,
      (sideways ? availableHeight : availableWidth) / sourceWidth,
      (sideways ? availableWidth : availableHeight) / sourceHeight
    );
    node.style.width = `${sourceWidth * scale}px`;
    node.style.height = `${sourceHeight * scale}px`;
    const geometry = { origin, bounds, scale, sourceAngle, area };
    roomGeometry.set(node, geometry);
    return geometry;
  }
  function roomSize(
    node: HTMLElement,
    { id, angle }: { id: number; angle: number }
  ) {
    zoomReady = false;
    const observer = new ResizeObserver(() => fitRoom(node, id, angle));
    observer.observe(node.parentElement!);
    // Shared-board dimensions settle after the table's ResizeObserver updates
    // its layout. Observe the source too, so an open room follows that change.
    const source = node.parentElement?.querySelector(`[data-place-id="${id}"]`);
    if (source) observer.observe(source);
    return { destroy: () => observer.disconnect() };
  }
  function tileZoom(
    node: HTMLElement,
    { id, angle }: { id: number; angle: number }
  ) {
    const geometry = fitRoom(node, id, angle);
    if (!geometry) return { duration: 0 };
    const { origin, bounds, scale, sourceAngle, area } = geometry;
    const targetX = parseFloat(node.style.left), targetY = parseFloat(node.style.top);
    const dx = origin.left + origin.width / 2 - (bounds.left + targetX);
    const dy = origin.top + origin.height / 2 - (bounds.top + targetY);
    const shortest = ((((angle - sourceAngle + 180) % 360) + 360) % 360) - 180;
    const width = parseFloat(node.style.width), height = parseFloat(node.style.height);
    return {
      duration: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 0
        : 1000,
      easing: cubicInOut,
      css: (t: number) => {
        const rotation = sourceAngle + shortest * t;
        const radians = rotation * Math.PI / 180;
        const rotatedWidth = width * Math.abs(Math.cos(radians)) + height * Math.abs(Math.sin(radians));
        const rotatedHeight = width * Math.abs(Math.sin(radians)) + height * Math.abs(Math.cos(radians));
        const x = targetX + dx * (1 - t), y = targetY + dy * (1 - t);
        // The diagonal swept by a rotating rectangle can be wider than either
        // endpoint. Keep every frame inside the same area as the final room.
        const fittedScale = Math.min(
          1 / scale + (1 - 1 / scale) * t,
          2 * Math.min(x - area.x, area.x + area.width - x) / rotatedWidth,
          2 * Math.min(y - area.y, area.y + area.height - y) / rotatedHeight
        );
        return `transform:translate(-50%,-50%) translate(${dx * (1 - t)}px,${dy * (1 - t)}px) rotate(${rotation}deg) scale(${fittedScale})`;
      }
    };
  }
</script>

{#snippet encounterChoices(
  encounters: Extract<GameSetup['pending'], { kind: 'encounters' }>
)}
  {#if encounters.relocation}
    <div class="row">
      <GameArt kind="piece" piece={encounters.relocation} />
      <button class="primary" aria-label={`Roll to move the ${encounters.relocation === 'governor' ? 'Governor' : 'Smuggler'}`} onclick={() => onResolveEncounter({ kind: encounters.relocation === 'governor' ? 'governor-roll' : 'smuggler-roll' })}>
        <GameArt kind="piece" piece="dice-pair" />Roll to move
      </button>
    </div>
    <p>Payment complete. You can undo before rolling.</p>
  {:else}
  {#each encounters.familyUids as uid}{@const family = game.players.find(
      (p) => p.uid === uid
    )!}
    <div class="row">
      <GameArt
        kind="piece"
        piece="family"
        color={family.color as PlayerColorName}
      /><FamilyRewardChoices verb="Catch family" onChoose={reward => onResolveEncounter({ kind: 'catch-family', familyUid: uid, reward })} />
    </div>{/each}
  {#if encounters.governor === 'payment'}<div class="row">
      <GameArt kind="piece" piece="governor" />
      <div class="small-card"><BonusCard reverse="card-back" /></div>
      <button
        class="primary"
        disabled={player.lira < 2}
        aria-label="Governor: pay 2 Lira"
        onclick={() =>
          onResolveEncounter({ kind: 'governor-pay', payment: 'lira' })}
        ><GameArt kind="component" component="lira" />Pay 2</button
      >
    </div>
    {#if personal && canControl}<div class="card-payments">
        <BonusCardChoices
          cards={player.bonusHand}
          disabled={busy}
          onChoose={(discardCardId) =>
            onResolveEncounter({
              kind: 'governor-pay',
              payment: 'card',
              discardCardId
            })}
        />
      </div>{:else}<p>Or discard a card from your phone.</p>{/if}
  {:else}
    {#if encounters.governor === 'available'}<div class="row">
        <GameArt kind="piece" piece="governor" /><button
          class="card-choice small-card"
          aria-label="Draw a Bonus card from the Governor"
          onclick={() =>
            onResolveEncounter({ kind: 'governor-visit', accept: true })}
          ><BonusCard reverse="card-back" /></button
        >
      </div>{/if}
    {#if encounters.smuggler}<div class="row">
        <GameArt kind="piece" piece="smuggler" />
        <div class="goods">
          {#each goods as good}<button
              class:selected={gain === good && smuggler}
              aria-label={`Smuggler: take ${good}`}
              disabled={player.goods[good] >= player.capacity}
              onclick={() => {
                gain = good;
                smuggler = true;
              }}><GameArt kind="component" component={good} /></button
            >{/each}
        </div>
      </div>
      {#if smuggler}<p>Pay</p>
        <div class="goods">
          <button
            aria-label="Smuggler: pay 2 Lira"
            disabled={player.lira < 2 || player.goods[gain] >= player.capacity}
            onclick={() => {
              onResolveEncounter({
                kind: 'smuggler-trade',
                accept: true,
                good: gain,
                payment: 'lira'
              });
              smuggler = false;
            }}><GameArt kind="component" component="lira" />2</button
          >{#each goods as good}<button
              aria-label={`Smuggler: pay 1 ${good}`}
              disabled={!player.goods[good] ||
                player.goods[gain] >= player.capacity}
              onclick={() => {
                onResolveEncounter({
                  kind: 'smuggler-trade',
                  accept: true,
                  good: gain,
                  payment: 'good',
                  paymentGood: good
                });
                smuggler = false;
              }}><GameArt kind="component" component={good} /></button
            >{/each}
        </div>{/if}{/if}
  {/if}
  {/if}
{/snippet}
<svelte:window
  onpointerdown={(e) => { if (!(e.target instanceof Element) || !e.target.closest('.mat-dock, .component-help')) dockSelected = null; }}
  onkeydown={(e) => {
    if (e.key === 'Escape') {
      dockSelected = null;
      closeRoom();
      history = false;
      power = null;
    }
  }}
/>
<section
  class="tabletop-surface"
  bind:this={surface}
  class:personal
  class:docked={personal}
  style={`--log-x:${controls.log.x}px;--log-y:${controls.log.y}px;--undo-x:${controls.undo.x}px;--undo-y:${controls.undo.y}px;--players:${game.players.length};--compact-rows:${Math.ceil(game.players.length / 2)};--courtyard:url('${base}/art/bazaar-courtyard.png')`}
  aria-label="Shared Istanbul table"
  data-motion-active={Boolean(motion)}
  data-e2e-fit
  data-e2e-no-scroll
>
  <div class="table" bind:clientWidth={tableWidth} bind:clientHeight={tableHeight}
    style={`--board-x:${sharedLayout.board.x}px;--board-y:${sharedLayout.board.y}px;--board-width:${sharedLayout.board.width}px;--board-height:${sharedLayout.board.height}px`}>
    {#if !canControl}<p class="table-hint">
        {personal
          ? `${player.name}’s turn`
          : 'Watching this table · Play from the browser that opened it.'}
      </p>{/if}
    <p
      class="visually-hidden"
      aria-live="polite"
      data-testid="turn-announcement"
    >
      Turn {game.turnNumber}. {player.name}. {game.phase.replaceAll('-', ' ')}. {canControl
        ? 'Your action.'
        : 'Waiting for this merchant.'}
    </p>
    <div role="group" aria-label="Player mat dock" class:mat-dock={personal} class:revealed={!handOpen && (Boolean(dockSelected) || Boolean(motion))} class:dock-aligned={dockFits}>
    {#if personal}<div class="dock-pull">
      <div class="dock-summaries" aria-label="Player summaries">
        {#each dockPlayers as p}
          <DockPlayerSummary player={p} active={p.uid === player.uid} onOpen={() => openDockPlayer(p.uid)} />
        {/each}
      </div>
    </div>{/if}
    <TabletopPlayerPanel
      layout={sharedLayout}
      game={matGame}
      {room}
      {userUid}
      onHand={() => {
        dockSelected = null;
        handOpen = true;
        collapsed = true;
      }}
      {canEnd}
      {busy}
      onEnd={requestEndTurn}
      onPower={showPower}
      onOpen={() => open()}
    />
    </div>
    {#if !handOpen && !history}<ComponentHelp {surface} />{/if}
    <fieldset
      class="board"
      aria-label="Bazaar"
      disabled={busy}
      data-testid="bazaar-board"
    >
      {#each game.board as id, index}<LocationTile
          {gemstone}
          game={boardGame}
          actionReady={id === 7 && activePlace === 7 && canEnd && !fountainEncounter}
          actionHint={id === 7 && activePlace === 7 && canEnd && !fountainEncounter
            ? 'End turn →'
            : undefined}
          placeId={id}
          {index}
          reachable={fountainRecall
            ? id !== 7 && Boolean(player.assistantsByPlace[id])
            : yellow
              ? Boolean(player.assistantsByPlace[id])
              : reachable.includes(id)}
          selected={fountainRecall
            ? recalledPlaces.includes(id)
            : zoom === id && !collapsed}
          arrived={id === activePlace && game.phase !== 'movement'}
          onkeydown={(e) => navigateBoard(e, index)}
          onclick={(e) => tapRoom(id, e)}
        />{/each}
    </fieldset>
    {#if yellow}<div class="table-hint">
        <GameArt kind="component" component="mosque-fruit" /><span
          >Tap an assistant’s room · 2 Lira</span
        ><button onclick={() => (yellow = false)}>×</button>
      </div>{/if}
    {#if fountainRecall}<div
        class="table-hint fountain-recall"
        aria-label="Fountain recall"
      >
        <span>Tap your assistants’ rooms</span>
        <button
          disabled={busy || !recalledPlaces.length}
          onclick={() =>
            onTakeAction({
              kind: 'fountain-recall',
              assistantPlaces: recalledPlaces
            })}>Recall {recalledPlaces.length || 'selected'}</button
        >
        <button
          disabled={busy ||
            !Object.values(player.assistantsByPlace).some(Boolean)}
          onclick={() =>
            onTakeAction({
              kind: 'fountain-recall',
              assistantPlaces: Object.entries(player.assistantsByPlace)
                .filter(([place]) => Number(place) !== 7)
                .flatMap(([place, count]) => Array(count).fill(Number(place)))
            })}>Recall all</button
        >
      </div>{/if}
    {#if zoom !== null && (zoom !== 7 || fountainEncounter || endWarning) && !collapsed && (!fountainRecall || endWarning)}
      {#key `${zoom}-${zoomAngle}`}
        <section
          class="zoom-tile"
          data-zoom-place={zoom}
          aria-label={`${title} actions`}
          style={`--facing:${zoomAngle}deg`}
          use:roomSize={{ id: zoom, angle: zoomAngle }}
          transition:tileZoom|global={{ id: zoom, angle: zoomAngle }}
          onintroend={() => (zoomReady = true)}
        >
          <LocationFace
            {gemstone}
            game={mailGame}
            placeId={zoom}
            expanded
            offerActive={zoom === activePlace && actionReady}
            caravanActive={zoom === activePlace &&
              actionReady &&
              pending?.kind !== 'caravansary-discard'}
            caravanHidden={personal &&
              pending?.kind === 'caravansary-discard' &&
              !cardDraw}
            disabled={busy}
            onAction={recordAction}
          />
          <header>
            <h1 class="visually-hidden">{title}</h1>
            <button aria-label="Back to table" onclick={closeRoom}
              ><TabletopArrow back /></button
            >
          </header>
          <fieldset
            class="room-flow"
            class:market-offer={[10, 11, 13, 14, 15].includes(zoom)}
            class:caravan-piles={zoom === 6 &&
              actionReady &&
              pending?.kind !== 'caravansary-discard'}
            disabled={undoPending || !canControl}
          >
            <div class="content" aria-live="polite">
              {#if endWarning && repeatCard}
                {#if personal}<button class="repeat-card" aria-label={`Play ${repeatCard.title}`} onclick={() => {
                    onInspectBonus(repeatCard.id);
                    endWarning = null;
                    handOpen = true;
                    collapsed = true;
                  }}><BonusCard card={repeatCard} /></button>
                {:else}<div class="repeat-card"><BonusCard reverse="card-back" /></div>
                  <p>Play the Bonus card on your phone.</p>
                {/if}
              {:else if motion}<p class="motion-status" aria-live="polite">
                  {motion.reverse
                    ? 'Undoing…'
                    : motion.steps.some(
                          (s) =>
                            s.effect === 'dice' && !landedSteps.includes(s.id)
                        )
                      ? 'Rolling…'
                      : (motion.after.encounterLog.length > motion.before.encounterLog.length
                          ? game.encounterLog.at(-1)?.summary
                          : fillMessage ?? game.lastAction?.summary ?? '')}
                </p>
              {:else if publicCard}<div class="public-card">
                  <BonusCard card={publicCard} />
                </div>
                <button onclick={() => (inspectedCard = null)}>Back</button>
              {:else if power}<GameArt
                  kind="component"
                  component={`mosque-${power}`}
                  class="power-detail"
                />
                <p>
                  {{
                    fabric: 'After a roll, turn a die to 4 or reroll both.',
                    spice: 'At a warehouse, pay 2 Lira for an extra good.',
                    fruit: 'Once each turn, pay 2 Lira to recall an assistant.',
                    jewelry: 'Your fifth assistant joins your merchant.'
                  }[power]}
                </p>
                <button onclick={() => (power = null)}>Back</button>
              {:else if game.phase === 'movement' && reachable.includes(zoom) && merchantToll(game, player, zoom) > player.lira}
                <div class="components">
                  {#each game.neutralMerchants.filter((merchant) => merchant.place === zoom) as merchant (merchant.id)}
                    <GameArt kind="piece" piece="neutral-merchant" />
                  {/each}
                  {#each game.players.filter((other) => other.uid !== player.uid && other.merchantPlace === zoom) as other (other.uid)}
                    <GameArt
                      kind="piece"
                      piece="merchant"
                      color={other.color as PlayerColorName}
                    />
                  {/each}
                </div>
                <p>
                  You have {player.lira} Lira; the merchants here require {merchantToll(
                    game,
                    player,
                    zoom
                  )}. Moving here ends your turn without an action.
                </p>
                <button
                  class="primary"
                  onclick={() => {
                    const assistant = requiredAssistantAction(player, zoom!);
                    if (assistant) onMove(zoom!, assistant);
                  }}>Move here & lose this turn</button
                >
                <button
                  onclick={() => {
                    collapsed = true;
                  }}>Choose another room</button
                >
              {:else if zoom !== activePlace || game.phase === 'movement'}{#if zoom !== 5}<p
                  >
                    {places.find((p) => p.id === zoom)?.action}
                  </p>{/if}
              {:else if activePlace === 6 && actionReady && pending?.kind !== 'caravansary-discard'}
                <!-- The piles are interactive components on the location face. -->
              {:else if activePlace === 6 && pending?.kind === 'caravansary-discard'}
                {#if !cardDraw}
                  {#if personal}{#key `${game.epoch}:${game.turnNumber}:${player.uid}`}<CaravansaryFlow
                        {game}
                        disabled={busy}
                        onAction={recordAction}
                      />{/key}
                  {:else}<p>Choose a card to discard on your phone.</p>{/if}
                {/if}
              {:else if [10, 11, 13, 14, 15].includes(activePlace) && actionReady}
                <!-- Interact directly with the location offer. -->
              {:else if actionReady}{#key `${game.epoch}:${game.turnNumber}:${activePlace}`}<TabletopPlaceActions
                    {game}
                    {player}
                    placeId={activePlace}
                    onAction={recordAction}
                    onSkip={requestEndTurn}
                  />{/key}
              {:else if game.phase === 'merchant-payment' && pending?.kind === 'merchant-payment'}
                <div class="components">
                  {#each pending.recipientUids as uid}{@const other =
                      game.players.find((p) => p.uid === uid)!}<GameArt
                      kind="piece"
                      piece="merchant"
                      color={other.color as PlayerColorName}
                    />{/each}{#each pending.neutralMerchantIds as _}<GameArt
                      kind="piece"
                      piece="neutral-merchant"
                    />{/each}
                </div>
                <button class="primary" onclick={onPayMerchants}
                  ><GameArt kind="component" component="lira" />Pay {pending.total}
                  & roll</button
                >
              {:else if pending?.kind === 'warehouse-extra'}
                <p>{fillMessage ?? game.lastAction?.summary}</p>
                <div class="components">
                  <GameArt kind="component" component="mosque-spice" /><span
                    >+1 · 2 Lira</span
                  >
                </div>
                <div class="goods">
                  {#each goods as good}<button
                      aria-label={`Pay 2 Lira for 1 ${good}`}
                      disabled={player.lira < 2 ||
                        player.goods[good] >= player.capacity}
                      onclick={() =>
                        onUseMosqueAbility({ kind: 'warehouse-extra', good })}
                      ><GameArt kind="component" component={good} /></button
                    >{/each}
                </div>
                {#if warehouseEncounters}{@render encounterChoices(
                    warehouseEncounters
                  )}{/if}
              {:else if pending?.kind === 'dice-adjust'}
                <GameArt
                  kind="component"
                  component="mosque-fabric"
                  class="ability"
                />
                <div class="dice">
                  {#each pending.originalDice as die, i}<button
                      aria-label={`Turn die ${i + 1} to 4`}
                      onclick={() =>
                        onUseMosqueAbility({
                          kind: 'dice-adjust',
                          adjustment:
                            i === 0 ? 'first-to-four' : 'second-to-four'
                        })}
                      ><b>{['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][die]}</b><small
                        >→ ⚃</small
                      ></button
                    >{/each}
                </div>
                <div class="row">
                  <button
                    onclick={() =>
                      onUseMosqueAbility({
                        kind: 'dice-adjust',
                        adjustment: 'reroll'
                      })}>Reroll both</button
                  ><button
                    class="primary"
                    onclick={() =>
                      onUseMosqueAbility({
                        kind: 'dice-adjust',
                        adjustment: 'none'
                      })}>Keep dice</button
                  >
                </div>
              {:else if pending?.kind === 'encounters'}{@render encounterChoices(
                  pending
                )}
              {:else if game.phase === 'turn-end'}{#if zoom !== 5}<p>
                    {['tea-house-wager', 'black-market-roll'].includes(game.lastAction?.kind ?? '') && game.encounterLog.length
                      ? game.encounterLog.at(-1)?.summary
                      : fillMessage ?? game.lastAction?.summary}
                  </p>{/if}
                {#if !game.encounterLog.length && game.lastRoll?.playerUid === player.uid && game.lastRoll.place === activePlace}<div
                    class="dice"
                  >
                    {#each game.lastRoll.dice as die}<b
                        >{['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][die]}</b
                      >{/each}
                  </div>{/if}
              {:else if game.phase === 'final-bonus'}<div class="small-card">
                  <BonusCard reverse="card-back" />
                </div>
                <p>
                  Remaining money and goods Bonus cards will be applied automatically.
                </p>{/if}
            </div>
            <footer class:warning={Boolean(endWarning)}>
              {#if endWarning}<div class="end-warning" role="alert">
                  <p>{endWarning}</p>
                  <div class="row">
                    <button class="primary" onclick={() => (endWarning = null)}>Continue choosing</button>
                    <button onclick={confirmEndTurn}>End turn anyway</button>
                  </div>
                </div>
              {:else}<UndoButton
                {undo}
                {userUid}
                pending={undoPending}
                onUndo={animateUndo}
              />{#if canEnd && !motion}<button
                  class="primary"
                  onclick={requestEndTurn}
                  >{game.phase === 'final-bonus'
                    ? 'Show results'
                    : 'End turn'}
                  <TabletopArrow /></button
                >{/if}{/if}
            </footer>
          </fieldset>
        </section>
      {/key}
    {/if}
    {#if personal && localPlayer && handOpen}
      <section class="hand-panel" aria-label="Your Bonus cards">
        <button
          class="close-hand"
          aria-label="Back to table"
          onclick={() => {
            handOpen = false;
            collapsed = game.phase === 'movement';
          }}>×</button
        >
        <BonusController
          embedded
          {game}
          {userUid}
          {selectedBonus}
          {onInspectBonus}
          onPlayBonus={(id, choice) => {
            onPlayBonus(id, choice);
            handOpen = false;
            collapsed = game.phase === 'movement';
          }}
          onTakePrivateAction={recordAction}
          onResolvePrivateEncounter={(discardCardId) =>
            onResolveEncounter({
              kind: 'governor-pay',
              payment: 'card',
              discardCardId
            })}
          onUndo={animateUndo}
          onRollback={(id) => {
            undoMotion = true;
            onRollback(id);
          }}
          {undo}
          {undoLog}
          {gameLog}
          {undoPending}
        />
      </section>
    {/if}
    {#if import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && canControl && personal && game.phase === 'movement'}
      <button class="e2e-resources" onclick={onGrantE2eResources}
        >{e2eResourceReview === 'yellow-recall'
          ? 'Review Yellow Mosque recall'
          : e2eResourceReview === 'zero-move'
            ? 'Review zero-distance Bonus move'
            : e2eResourceReview === 'flexible-market'
              ? 'Review Flexible Demand market sale'
              : 'Review ruby routes with supplied resources'}</button
      >
    {/if}
    {#if game.activeBonusEffects.length}
      <aside class="active-effects" aria-label="Active Bonus cards">
        {#each game.activeBonusEffects as effect}{@const card = bonusCards.find(
            (c) => c.effect === effect
          )}
          <span><BonusCard {card} /></span>
        {/each}
      </aside>
    {/if}
    {#if history}<section
        class="history"
        style={`transform:translate(-50%,-50%) rotate(${seat.angle}deg)`}
      >
        <header>
          <h2>Game log</h2>
          <button onclick={() => (history = false)}>×</button>
        </header>
        {#each [...gameLog].reverse() as entry}<p class:undone={!entry.active}>
            {entry.summary}{#if entry.active && ((!entry.blockedReason && entry.rollbackActorUids.includes(userUid)) || entry.consentActorUids?.includes(userUid))}<button
                disabled={busy}
                onclick={() => {
                  undoMotion = true;
                  onRollback(entry.eventId);
                  history = false;
                }}>{entry.blockedReason ? 'Request undo to here' : 'Undo to here'}</button
              >{/if}
          </p>{/each}
      </section>{/if}

  </div>
    {#if game.phase === 'game-over' && !motion}<GameResults {game} {room} {userUid} {connectedUids} pending={undoPending} {onRematch} {onLeave} />{/if}
  <nav class="table-controls" aria-label="Game controls">
    {#if !personal}<UndoButton compact {undo} {userUid} pending={undoPending} onUndo={animateUndo} />{/if}
    <button onclick={() => (history = !history)} aria-expanded={history} aria-label="Game log" data-help="Game log: review previous actions."
      ><span class="log-icon" aria-hidden="true">☰</span><span class="log-label">Game log</span></button
    >
  </nav>
  <ActionMotion
    plan={motion}
    {surface}
    ready={!boardMotion &&
      (zoomReady || collapsed || zoom === 7 || zoom === null)}
    onArrival={(id) => {
      if (!landedSteps.includes(id)) landedSteps = [...landedSteps, id];
    }}
    onBoardComplete={() => {
      const moved = boardMotion;
      boardMotion = false;
      if (
        moved &&
        game.phase !== 'movement' &&
        game.phase !== 'game-over' &&
        activePlace !== 7 &&
        (!personal || canControl)
      ) {
        zoom = activePlace;
        zoomAngle = seat.angle;
        collapsed = false;
        zoomReady = false;
      }
    }}
    onComplete={finishMotion}
  />
</section>

<style>
  .active-effects {
    position: absolute;
    left: 16%;
    bottom: 2%;
    display: flex;
    gap: 1cqw;
    z-index: 5;
  }
  .active-effects > span {
    width: 3.5cqw;
  }

  @keyframes score-in {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    }

  .visually-hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }
  .hand-panel {
    position: absolute;
    inset: 4% 3%;
    z-index: 20;
    padding: 2cqw;
    background: #12352ff5;
    border: 1px solid #947d49;
    border-radius: 1cqw;
  }
  .close-hand {
    position: absolute;
    right: 0;
    top: 0;
    z-index: 1;
    min-width: 44px;
    min-height: 44px;
    font-size: 24px;
  }
  .card-payments {
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 0.5cqw;
    min-height: 0;
  }
  .e2e-resources {
    position: absolute;
    top: 0;
    left: 0;
    font-size: 0.65rem;
  }
  @media (max-aspect-ratio: 1/1) {
    .personal .zoom-tile {
      --choice-card-width: 7cqw;
      top: 48%;
    }
    .personal .hand-panel {
      inset: 8px 2%;
      padding-top: 48px;
    }
    .personal .zoom-tile h1 {
      font-size: 5cqw;
    }
    .personal .zoom-tile :global(button:not(.destinations button)),
    .personal .zoom-tile :global(p) {
      font-size: 3cqw;
    }
    .personal .zoom-tile :global(.caravansary-flow) {
      --choice-card-width: 7cqw;
    }
  }

  .tabletop-surface {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    container-type: size;
    display: grid;
    place-items: center;
    overflow: hidden;
    background:
      radial-gradient(ellipse at center, #17392dda, #091f1ae8),
      var(--courtyard) center/cover;
    color: #f6e8c4;
    /* Bundle the arrows and comparison signs missing from Atkinson rather than
       depending on the platform's system-symbol fallback. */
    font-family: 'Atkinson Hyperlegible', 'Istanbul Symbols', sans-serif;
  }
  .tabletop-surface :global(button) {
    font-family: inherit;
  }
  .table {
    position: relative;
    width: 100%;
    height: 100%;
    container-type: size;
    isolation: isolate;
    /* Rotated children can retain an unrotated scroll-overflow box even when
       every painted frame fits. Keep that overflow inside the game canvas. */
    overflow: clip;
  }
  .tabletop-surface:not(.personal) :global(.mat) {
    box-sizing: border-box;
    height: auto;
    aspect-ratio: 1 / 0.325;
  }
  .personal .table {
    --side-trays: 0;
    --board-angle: 0deg;
    --tray-columns: var(--players);
    --tray-rows: 1;
    --tray-right: 104px;
    --tray-bottom: 8px;
    --mat-width: min(calc((100cqw - var(--tray-right) - var(--tray-columns) * 8px) / var(--tray-columns)), 32cqh);
    --mat-height: calc(var(--mat-width) * 0.325);
    --tray-height: calc(var(--tray-rows) * var(--mat-height) + (var(--tray-rows) - 1) * 8px);
  }
  .personal .board {
    box-sizing: border-box;
    left: 50%;
    top: calc((100% - var(--tray-height) - var(--tray-bottom) - 8px) / 2);
    transform: translate(-50%, -50%);
    width: min(calc(100cqw - 16px), calc((100cqh - var(--tray-height) - var(--tray-bottom) - 16px) * 16 / 9));
    height: auto;
    aspect-ratio: 16 / 9;
  }
  .personal :global(.seats) {
    inset: auto var(--tray-right) var(--tray-bottom) 8px;
    display: grid;
    grid-template-columns: repeat(var(--tray-columns), var(--mat-width));
    grid-auto-rows: var(--mat-height);
    justify-content: center;
    gap: 8px;
  }
  .personal :global(.mat) {
    position: relative;
    box-sizing: border-box;
    left: auto;
    top: auto;
    width: 100%;
    height: 100%;
    transform: none;
    order: var(--seat-order);
  }
  @media (max-aspect-ratio: 1/1) {
    .personal .table {
      --tray-columns: 2;
      --tray-rows: var(--compact-rows);
      --tray-right: 8px;
      --tray-bottom: 8px;
      --board-angle: 90deg;
    }
    .personal .board {
      width: min(calc(100cqh - var(--tray-height) - 24px), calc((100cqw - 16px) * 16 / 9));
      transform: translate(-50%, -50%) rotate(90deg);
    }
  }
  @media (min-width: 601px) and (max-aspect-ratio: 1/1) {
    .personal .table {
      --tray-columns: var(--players);
      --tray-rows: 1;
    }
  }
  @media (max-height: 600px) and (min-aspect-ratio: 1/1) {
    .personal .table {
      --side-trays: 1;
      --tray-columns: 1;
      --tray-rows: var(--players);
      --mat-width: min(30cqw, calc((100cqh - 16px - (var(--players) - 1) * 8px) / var(--players) / 0.325));
    }
    .personal :global(.seats) {
      inset: 8px auto 8px 8px;
      align-content: center;
    }
    .personal .board {
      left: calc(var(--mat-width) + 16px + (100% - var(--mat-width) - 24px) / 2);
      top: 50%;
      width: min(calc(100cqw - var(--mat-width) - 24px), calc((100cqh - 16px) * 16 / 9));
    }
  }
  @media (min-width: 601px) and (max-width: 1366px) and (min-height: 601px) and (min-aspect-ratio: 1/1) {
    .personal .table {
      --tray-right: 8px;
      --mat-width: calc((100cqw - 8px - var(--tray-columns) * 8px) / var(--tray-columns));
    }
  }
  .docked .table { --side-trays: 0; --tray-height: 18px; --tray-bottom: 8px; }
  .docked .board { left: 50%; top: calc((100% - 34px) / 2); width: min(calc(100cqw - 16px), calc((100cqh - 42px) * 16 / 9)); }
  @media (max-aspect-ratio: 1/1) {
    .docked .board { width: min(calc(100cqh - 42px), calc((100cqw - 16px) * 16 / 9)); }
  }
  .mat-dock { position: absolute; z-index: 35; bottom: 0; left: 0; right: 0; height: calc(var(--dock-player-width) * 0.325 + 13px); --dock-player-width: clamp(280px, calc((100cqw - 16px - (var(--players) - 1) * 10px) / var(--players)), 500px); transform: translateY(100%); transition: transform 220ms ease; background: #092b27ed; border-top: 1px solid #bc995c; padding: 6px 8px; box-sizing: border-box; }
  .mat-dock:not(.revealed) :global(.seats) { visibility: hidden; }
  .mat-dock.revealed, .mat-dock:has(:global(.seats :focus-visible)) { transform: translateY(0); }
  .dock-pull { position: absolute; bottom: calc(100% + 1px); left: 8px; right: 8px; }
  .dock-summaries { display: flex; justify-content: safe center; gap: 10px; overflow-x: auto; scrollbar-width: thin; scrollbar-color: #bc995c #092b27; scroll-snap-type: x proximity; }
  .dock-aligned .dock-summaries :global(.summary) { flex: 0 0 var(--dock-player-width); max-width: none; box-sizing: border-box; }
  @media (max-width: 600px) { .dock-summaries { gap: 6px; } }
  .docked .mat-dock :global(.seats) { position: relative; inset: auto; height: 100%; display: flex; justify-content: safe center; align-items: center; overflow-x: auto; overflow-y: hidden; gap: 10px; pointer-events: auto; }
  .docked .mat-dock :global(.mat) { flex: 0 0 var(--dock-player-width); height: auto; width: var(--dock-player-width); aspect-ratio: 1 / 0.325; }
  @media (prefers-reduced-motion: reduce) { .mat-dock { transition: none; } }
  fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .board {
    position: absolute;
    box-sizing: border-box;
    left: var(--board-x);
    top: var(--board-y);
    width: var(--board-width);
    height: var(--board-height);
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    gap: 0.3cqw;
    padding: 0.35cqw;
    background: #100f09;
    border: 1px solid #a08043;
    box-shadow: 0 1cqw 2cqw #0009;
  }
  .board :global(.place) {
    border-radius: 0.18cqw;
    padding: 0.25cqw;
  }
  .board :global(.place-shade) {
    background: none;
  }
  .zoom-tile {
    position: absolute;
    z-index: 10;
    left: 50%;
    top: 49.5%;
    box-sizing: border-box;
    transform: translate(-50%, -50%) rotate(var(--facing));
    border: 0;
    border-radius: 0.18cqw;
    box-shadow: 0 0.5cqw 1cqw #0009;
    overflow: hidden;
    text-shadow:
      0 1px 3px #000,
      0 0 5px #000;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5cqw;
  }
  .zoom-tile > header {
    position: absolute;
    z-index: 4;
    top: 3%;
    right: 3%;
  }
  .zoom-tile h1 {
    margin: 0;
    font:
      700 2.1cqw 'Cormorant Garamond',
      serif;
  }
  .zoom-tile > header button {
    width: 2.7cqw;
    height: 2.7cqw;
    border-radius: 50%;
    font-size: 1.6cqw;
    padding: 0;
  }
  @media (pointer: coarse) {
    .zoom-tile > header button {
      min-width: 44px;
      min-height: 44px;
      font-size: 18px;
    }
  }
  button {
    font: inherit;
    font-size: 0.9cqw;
    border: 1px solid #a98d50;
    background: #14362de8;
    color: inherit;
    padding: 0.55cqw;
    border-radius: 0.35cqw;
    cursor: pointer;
    touch-action: manipulation;
    text-shadow: none;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  button:focus-visible {
    outline: 2px solid #fff0b0;
    outline-offset: 2px;
  }
  .primary,
  button.selected {
    background: linear-gradient(#d6b76c, #ad8846);
    color: #17291e;
    font-weight: 700;
  }
  .room-flow.caravan-piles,
  .room-flow.market-offer {
    pointer-events: none;
  }
  .room-flow.caravan-piles footer,
  .room-flow.market-offer footer,
  .room-flow.caravan-piles :global(button),
  .room-flow.caravan-piles :global(input),
  .room-flow.caravan-piles :global(select),
  .room-flow.market-offer :global(button),
  .room-flow.market-offer :global(input),
  .room-flow.market-offer :global(select) {
    pointer-events: auto;
  }
  .room-flow {
    position: absolute;
    z-index: 4;
    inset: 20% 16% 8%;
    display: flex;
    flex-direction: column;
  }
  .content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 0.6cqw 1.2cqw;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65cqw;
    scrollbar-width: thin;
  }
  p {
    font-size: 0.87cqw;
    text-align: center;
    margin: 0;
    line-height: 1.3;
  }
  footer {
    display: flex;
    justify-content: space-between;
    padding: 0.6cqw 1cqw;
    gap: 0.5cqw;
  }
  .repeat-card {
    width: min(35%, 10cqw);
    padding: 0;
    flex-shrink: 0;
  }
  footer.warning {
    background: #14362df5;
    border: 1px solid #efd28e;
    border-radius: 0.35cqw;
  }
  .end-warning { width: 100%; }
  .end-warning p { margin-bottom: 0.5cqw; }
  footer button {
    min-width: 7cqw;
  }
  .goods,
  .row,
  .components {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5cqw;
    width: 100%;
  }
  .goods button {
    flex: 1;
    min-width: 0;
  }
  .goods :global(.game-art),
  button :global(.game-art) {
    width: 2.6cqw;
    height: 2.6cqw;
  }
  .row > :global(.game-art),
  .components > :global(.game-art) {
    width: 3.6cqw;
    height: 4cqw;
  }
  .components span {
    font-size: 1cqw;
  }
  .row button {
    display: flex;
    align-items: center;
    gap: 0.4cqw;
  }
  .small-card {
    width: 4cqw;
    flex: none;
  }
  .card-choice {
    background: none;
    border: 0;
    padding: 0;
  }
  .public-card {
    width: 9cqw;
  }
  .content :global(.power-detail) {
    width: 12cqw;
    height: 12cqw;
  }
  .content :global(.ability) {
    width: 3cqw;
    height: 3cqw;
  }
  .dice {
    display: flex;
    gap: 1cqw;
    align-items: center;
    justify-content: center;
  }
  .dice b {
    font-size: 4cqw;
    line-height: 1;
  }
  .dice small {
    display: block;
  }
  .table-hint {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    align-items: center;
    gap: 0.5cqw;
    background: #14362def;
    padding: 0.5cqw;
    z-index: 5;
    font-size: 1cqw;
  }
  .table-hint :global(.game-art) {
    width: 3cqw;
    height: 3cqw;
  }
  .table-controls {
    position: absolute;
    right: 8px;
    bottom: 6px;
    display: flex;
    gap: 0.5rem;
    z-index: 6;
  }
  .table-controls > button {
    min-height: 44px;
    font-size: 14px;
    padding: 0.5rem 0.8rem;
  }
  .log-icon { display: none; }
  .tabletop-surface:not(.personal) .table-controls {
    display: contents;
  }
  .tabletop-surface:not(.personal) .table-controls > button {
    position: absolute;
    z-index: 6;
    left: var(--log-x);
    top: var(--log-y);
    width: 44px;
    padding: 0;
    border: 0;
    background: #12352faa;
    border-radius: 50%;
  }
  .tabletop-surface:not(.personal) :global(.table-controls .undo-button) {
    position: absolute;
    z-index: 6;
    left: var(--undo-x);
    top: var(--undo-y);
  }
  .tabletop-surface:not(.personal) .log-icon { display: inline; font-size: 20px; }
  .tabletop-surface:not(.personal) .log-label { display: none; }
  @media (min-width: 601px) and (max-width: 1366px) and (min-height: 601px) and (min-aspect-ratio: 1/1) {
    .personal .table-controls { top: 4px; left: 4px; right: auto; bottom: auto; }
    .personal .table-controls > button { width: 44px; padding: 0; border: 0; background: #12352faa; border-radius: 50%; }
    .personal .log-icon { display: inline; font-size: 20px; }
    .personal .log-label { display: none; }
  }
  @media (max-aspect-ratio: 1/1), (max-width: 600px), (max-height: 600px) {
    .table-controls { top: 4px; left: 4px; right: auto; bottom: auto; }
    .table-controls > button { width: 44px; padding: 0; border: 0; background: #12352faa; border-radius: 50%; }
    .log-icon { display: inline; font-size: 20px; }
    .log-label { display: none; }
  }
  .history {
    position: absolute;
    z-index: 20;
    left: 50%;
    top: 50%;
    width: 40cqw;
    max-height: 34cqw;
    overflow: auto;
    padding: 1cqw;
    background: #122c22f2;
    border: 1px solid #a98d50;
  }
  .history p {
    text-align: left;
    margin: 0.5cqw 0;
  }
  .history h2 {
    font-size: 1.5cqw;
  }
  .history button {
    margin-left: 0.5cqw;
  }
  .undone {
    opacity: 0.45;
  }
  .docked .table-controls { top: 4px; left: 4px; right: auto; bottom: auto; }
  .docked .table-controls > button { width: 44px; padding: 0; border: 0; background: #12352faa; border-radius: 50%; }
  .docked .log-icon { display: inline; font-size: 20px; }
  .docked .log-label { display: none; }
</style>
