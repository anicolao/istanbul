<script lang="ts">
  import { tick } from 'svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { base } from '$app/paths';
  import { bonusCards, demandTiles, mosqueTiles, places, type Good } from '$lib/game/manifests';
  import { legalDestinations, requiredAssistantAction, type AssistantAction } from '$lib/game/movement';
  import {
    marketRevenueFor,
    postOfficeRows,
    previewCaravansary,
    warehouseGood,
    type CardSource,
    type PlaceActionChoice
  } from '$lib/game/actions';
  import type { EncounterChoice } from '$lib/game/encounters';
  import { ownsMosqueAbility, type MosqueAbilityChoice } from '$lib/game/mosques';
  import { currentSultanCost, sultanCostSequence } from '$lib/game/ruby-routes';
  import type { BonusChoice } from '$lib/game/bonus';
  import type { ReplayProjection, RoomProjection } from '$lib/game/protocol';
  import type { GameSetup } from '$lib/game/setup';
  import GameArt from './GameArt.svelte';
  import BonusCard from './BonusCard.svelte';
  import GemstoneOffer from './GemstoneOffer.svelte';
  import GameLog from './GameLog.svelte';
  import LocationTile from './LocationTile.svelte';
  import PlayerTray from './PlayerTray.svelte';
  import SultanOffer from './SultanOffer.svelte';
  import TeaHousePayoffs from './TeaHousePayoffs.svelte';

  let {
    game,
    room,
    userUid,
    selectedPlace,
    selectedBonus,
    boardScale,
    onInspectPlace,
    onInspectBonus,
    onMove,
    onPayMerchants,
    onTakeAction,
    onResolveEncounter,
    onUseMosqueAbility,
    onPlayBonus,
    onGrantE2eResources,
    onRematch,
    onEndTurn,
    onUndo,
    onRollback,
    undo,
    undoLog,
    gameLog,
    undoPending = false,
    onZoomIn,
    onFit,
    e2eResourceReview = 'ruby-routes',
    displayOnly = false,
    tabletopControls = false
  }: {
    game: GameSetup;
    room: RoomProjection;
    userUid: string;
    selectedPlace: number | null;
    selectedBonus: string | null;
    boardScale: number;
    onInspectPlace: (place: number) => void;
    onInspectBonus: (cardId: string) => void;
    onMove: (destination: number, assistantAction: AssistantAction) => void;
    onPayMerchants: () => void;
    onTakeAction: (choice: PlaceActionChoice) => void;
    onResolveEncounter: (choice: EncounterChoice) => void;
    onUseMosqueAbility: (choice: MosqueAbilityChoice) => void;
    onPlayBonus: (cardId: string, choice: BonusChoice) => void;
    onGrantE2eResources: () => void;
    onRematch: () => void;
    onEndTurn: () => void;
    onUndo: () => void;
    onRollback: (targetEventId: string) => void;
    undo: ReplayProjection['undo'];
    undoLog: ReplayProjection['undoLog'];
    gameLog: ReplayProjection['gameLog'];
    undoPending?: boolean;
    onZoomIn: () => void;
    onFit: () => void;
    e2eResourceReview?: 'ruby-routes' | 'yellow-recall' | 'zero-move' | 'flexible-market';
    displayOnly?: boolean;
    tabletopControls?: boolean;
  } = $props();

  const placeById = new Map(places.map((place) => [place.id, place]));
  const bonusById = new Map(bonusCards.map((card) => [card.id, card]));
  const desktopViewport = new MediaQuery('(min-width: 961px) and (min-height: 600px)');
  const tableLayout = $derived(tabletopControls || desktopViewport.current);
  const currentPlayer = $derived(game.players[game.turnSeat]);
  const localPlayer = $derived(tabletopControls ? currentPlayer : game.players.find((player) => player.uid === userUid) ?? currentPlayer);
  const selectedPlaceManifest = $derived(selectedPlace ? placeById.get(selectedPlace) : null);
  const selectedBonusManifest = $derived(selectedBonus ? bonusById.get(selectedBonus) : null);
  const localIsCurrent = $derived(tabletopControls || currentPlayer.uid === userUid);
  const undoOwner = $derived(undo ? game.players.find(({ uid }) => uid === undo.actorUid)?.name ?? (undo.actorUid === room.hostUid ? 'the tabletop' : 'another merchant') : null);
  const canUndo = $derived(Boolean(undo && undo.actorUids.includes(userUid) && !undo.blockedReason && !undoPending));
  const undoText = $derived(!undo ? 'Nothing to undo' : undo.blockedReason ? `Undo locked · ${undo.blockedReason}` : undo.actorUids.includes(userUid) ? `Undo ${undo.label}` : `Undo belongs to ${undoOwner}`);
  const undoButtonText = $derived(undo?.blockedReason ? 'Locked' : 'Undo');
  const undoStatusText = $derived(!undo ? 'Undo log · no active action' : undo.blockedReason ? `Locked · ${undo.blockedReason}` : undo.actorUids.includes(userUid) ? `Can undo · ${undo.label}` : `Waiting · ${undoOwner}`);
  const currentTurnLog = $derived(gameLog.filter((entry) => entry.active && entry.epoch === game.epoch && entry.turnNumber === game.turnNumber && entry.ownerUid === currentPlayer.uid));
  const undoTurnTarget = $derived(currentTurnLog.find((entry) => !entry.blockedReason) ?? null);
  const reachable = $derived(localIsCurrent && game.phase === 'movement' ? legalDestinations(game, localPlayer) : []);
  const selectedAssistantAction = $derived(selectedPlace && reachable.includes(selectedPlace) ? requiredAssistantAction(localPlayer, selectedPlace) : null);
  const stayAssistantAction = $derived(requiredAssistantAction(localPlayer, localPlayer.merchantPlace));
  const abilityPending = $derived(game.pending?.kind === 'warehouse-extra' || game.pending?.kind === 'dice-adjust' ? game.pending : null);
  const actionPlaceId = $derived(game.phase === 'family-action' && game.pending?.kind === 'family-action'
    ? game.pending.destination : game.phase === 'mosque-ability' && abilityPending
    ? abilityPending.actionPlace
    : game.phase === 'turn-end' && game.lastAction ? game.lastAction.place : currentPlayer.merchantPlace);
  const actionPlace = $derived(placeById.get(actionPlaceId)!);
  const merchantPending = $derived(game.pending?.kind === 'merchant-payment' ? game.pending : null);
  const encounterPending = $derived(game.pending?.kind === 'encounters' ? game.pending : null);
  const paymentNames = $derived(merchantPending?.recipientUids.map((uid) => game.players.find((player) => player.uid === uid)?.name ?? uid) ?? []);
  const goodNames: Record<Good, string> = { fabric: 'Fabric', spice: 'Spice', fruit: 'Fruit', jewelry: 'Jewelry' };
  const mosqueColorNames: Record<Good, string> = { fabric: 'Red', spice: 'Green', fruit: 'Yellow', jewelry: 'Blue' };
  const artUrl = `${base}/art/bazaar-courtyard.png`;
  let recallSelection = $state<number[]>([]);
  let caravanSources = $state<[CardSource, CardSource]>(['deck', 'deck']);
  let caravanDiscardSelection = $state('');
  let caravanRevealed = $state(false);
  let marketSelection = $state<number[]>([]);
  let blackMarketGood = $state<Exclude<Good, 'jewelry'>>('fabric');
  let teaWager = $state(7);
  let policeDestination = $state(1);
  let governorDiscard = $state('');
  let smugglerGood = $state<Good>('fabric');
  let smugglerPaymentGood = $state<Good>('fabric');
  let warehouseExtraGood = $state<Good>('jewelry');
  let sultanWildGoods = $state<Good[]>([]);
  let bonusGood = $state<Good>('jewelry');
  let bonusFamilyReward = $state<'lira' | 'bonus'>('lira');
  let bonusAssistantPlace = $state(1);
  let flexibleGoods = $state<Good[]>([]);
  let keyboardPlace = $state(0);
  let mobileBoardOpen = $state(false);
  let inspectedPileCardId = $state<string | null>(null);
  let inspectedPileSource = $state<'deck' | 'discard' | null>(null);
  let previousPhase: typeof game.phase | undefined = $state();
  $effect(() => {
    if (previousPhase !== undefined && game.phase !== previousPhase) {
      mobileBoardOpen = game.phase === 'movement';
    }
    previousPhase = game.phase;
  });
  const caravanPreview = $derived(previewCaravansary(game, caravanSources) ?? []);
  const inspectedPileCard = $derived(inspectedPileCardId ? bonusById.get(inspectedPileCardId) : null);
  const activeDemand = $derived(demandTiles.find(({ id }) => id === (actionPlace.id === 10 ? game.largeDemand[0] : game.smallDemand[0])));
  const flexibleMarketActive = $derived(actionPlace.id === 11 && game.activeBonusEffects.includes('wild-small-market'));
  const marketPaymentGoods = $derived((activeDemand?.goods ?? []).map((good, index) => flexibleMarketActive ? flexibleGoods[index] ?? good : good));
  const marketSelectionLegal = $derived(isMarketSelectionLegal(marketPaymentGoods, marketSelection));
  const smugglerGainAvailable = $derived(localPlayer.goods[smugglerGood] < localPlayer.capacity);
  const sultanCost = $derived(currentSultanCost(game));
  const nextSultanGood = $derived(sultanCostSequence[sultanCost.length]);
  const nextSultanCost = $derived(sultanCostSequence.slice(0, Math.min(game.rubyTracks.sultanIndex + 1, sultanCostSequence.length)));
  const nextGemstonePrice = $derived(Math.min(25, game.rubyTracks.gemstonePrice + 1));
  const sultanWildCount = $derived(sultanCost.filter((good) => good === 'any').length);
  const sultanPayment = $derived((Object.keys(goodNames) as Good[]).reduce<Record<Good, number>>((totals, good) => ({
    ...totals,
    [good]: sultanCost.filter((required) => required === good).length + sultanWildGoods.filter((wild) => wild === good).length
  }), { fabric: 0, spice: 0, fruit: 0, jewelry: 0 }));
  const sultanAffordable = $derived(sultanWildGoods.length === sultanWildCount && (Object.keys(goodNames) as Good[]).every((good) => localPlayer.goods[good] >= sultanPayment[good]));

  function occupants(placeId: number) {
    return game.players.filter(({ merchantPlace }) => merchantPlace === placeId);
  }

  function inspectPileCard(cardId: string, source: 'deck' | 'discard') {
    inspectedPileCardId = cardId;
    inspectedPileSource = source;
    mobileBoardOpen = false;
  }

  function inspectPlace(event: MouseEvent, placeId: number) {
    const pile = (event.target as HTMLElement).closest<HTMLElement>('[data-inspect-pile-card]');
    const cardId = pile?.dataset.inspectPileCard;
    const source = pile?.dataset.pileSource;
    if (cardId && (source === 'deck' || source === 'discard')) {
      inspectPileCard(cardId, source);
      return;
    }
    inspectedPileCardId = null;
    inspectedPileSource = null;
    onInspectPlace(placeId);
  }

  function inspectBonus(cardId: string) {
    inspectedPileCardId = null;
    inspectedPileSource = null;
    onInspectBonus(cardId);
  }

  function toggleRecall(placeId: number) {
    recallSelection = recallSelection.includes(placeId)
      ? recallSelection.filter((place) => place !== placeId)
      : [...recallSelection, placeId];
  }

  function recallAssistants() {
    onTakeAction({ kind: 'fountain-recall', assistantPlaces: recallSelection });
    recallSelection = [];
  }

  function setCaravanSource(index: 0 | 1, source: CardSource) {
    caravanSources = index === 0 ? [source, caravanSources[1]] : [caravanSources[0], source];
    caravanRevealed = false;
    caravanDiscardSelection = '';
  }

  function tradeCaravansary() {
    onTakeAction({ kind: 'caravansary-trade', drawSources: caravanSources, discardCardId: caravanDiscardSelection });
    caravanRevealed = false;
    caravanDiscardSelection = '';
  }

  function toggleMarketSlot(index: number) {
    marketSelection = marketSelection.includes(index)
      ? marketSelection.filter((slot) => slot !== index)
      : [...marketSelection, index];
  }

  function isMarketSelectionLegal(goods: Good[], indexes: number[]) {
    if (indexes.length < 1 || indexes.length > 5 || new Set(indexes).size !== indexes.length) return false;
    const used: Record<Good, number> = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
    for (const index of indexes) {
      const good = goods[index];
      if (!good) return false;
      used[good] += 1;
    }
    return (Object.keys(used) as Good[]).every((good) => used[good] <= localPlayer.goods[good]);
  }

  function sellMarket() {
    onTakeAction({
      kind: 'market-sell',
      slotIndexes: marketSelection,
      ...(flexibleMarketActive ? { wildGoods: marketSelection.map((index) => marketPaymentGoods[index]) } : {})
    });
    marketSelection = [];
  }

  function setSultanWild(index: number, good: Good) {
    sultanWildGoods = Array.from({ length: sultanWildCount }, (_, slot) => slot === index ? good : sultanWildGoods[slot] ?? 'fabric');
  }

  function setFlexibleGood(index: number, good: Good) {
    flexibleGoods = Array.from({ length: 5 }, (_, slot) => slot === index ? good : flexibleGoods[slot] ?? activeDemand?.goods[slot] ?? 'fabric');
  }

  function moveBoardFocus(index: number, key: string) {
    const row = Math.floor(index / 4);
    const column = index % 4;
    const next = key === 'ArrowRight' ? row * 4 + ((column + 1) % 4)
      : key === 'ArrowLeft' ? row * 4 + ((column + 3) % 4)
      : key === 'ArrowDown' ? ((row + 1) % 4) * 4 + column
      : key === 'ArrowUp' ? ((row + 3) % 4) * 4 + column
      : index;
    keyboardPlace = game.board[next];
    document.querySelector<HTMLElement>(`[data-place-id="${keyboardPlace}"]`)?.focus();
  }

  async function inspectPlaceFromKeyboard(placeId: number) {
    inspectedPileCardId = null;
    inspectedPileSource = null;
    onInspectPlace(placeId);
    await tick();
    document.querySelector<HTMLElement>('[data-testid="place-inspector-title"]')?.focus();
  }
</script>

<section class:many={game.players.length > 3} class:display-only={displayOnly} class:table-layout={tableLayout} class:tabletop={tabletopControls} class="game-table" aria-labelledby="game-title" style={`--courtyard: url('${artUrl}')`} data-e2e-fit data-e2e-no-scroll>
  <p class="visually-hidden" aria-live="polite" aria-atomic="true" data-testid="turn-announcement">Turn {game.turnNumber}. {currentPlayer.name}. {game.phase.replace('-', ' ')}. {currentPlayer.uid === userUid ? 'Your action.' : 'Waiting for this merchant.'}</p>
  <header class="turn-banner" data-e2e-fit data-e2e-no-scroll>
    <div><p>{game.phase === 'game-over' ? `Game ${game.epoch} · final ranking` : game.phase === 'final-bonus' ? 'Final Bonus cards' : `Turn ${game.turnNumber} · ${game.phase.replace('-', ' ')}`}</p><h1 id="game-title">{game.phase === 'game-over' ? `${game.end.winnerUids.length > 1 ? 'The merchants share the victory.' : `${game.end.rankings[0]?.name} wins the ruby race.`}` : game.phase === 'final-bonus' ? `${currentPlayer.name} makes final trades.` : game.phase === 'movement' ? `${currentPlayer.name} surveys the bazaar.` : game.phase === 'merchant-payment' ? `${currentPlayer.name} meets another merchant.` : game.phase === 'family-action' ? `${currentPlayer.name} sends family to ${actionPlace.name}.` : game.phase === 'mosque-ability' ? `${currentPlayer.name} considers a Mosque ability.` : game.phase === 'encounters' ? `${currentPlayer.name} resolves bazaar encounters.` : game.phase === 'turn-end' ? `${currentPlayer.name} completed ${actionPlace.name}.` : `${currentPlayer.name} arrives at ${actionPlace.name}.`}</h1>{#if undo?.blockedReason}<small class="turn-notice">Undo locked · {undo.blockedReason}.</small>{:else if game.lastMovement?.paymentBlocked}<small class="turn-notice">{game.players.find((player) => player.uid === game.lastMovement?.playerUid)?.name} could not pay {game.lastMovement.paymentTotal} Lira; that turn ended immediately.</small>{:else if undoLog.length}<small class="turn-notice">Undo event recorded · restored before {undoLog.at(-1)?.label}.</small>{:else if tabletopControls && game.bonusLog.length}<small class="turn-notice">{game.bonusLog.at(-1)?.summary}</small>{/if}</div>
    <div class="turn-token"><span class={`player-dot ${currentPlayer.color}`}></span><strong>{game.phase === 'game-over' ? game.end.rankings[0]?.name : currentPlayer.name}</strong><small>{game.phase === 'game-over' ? 'Result locked' : tabletopControls ? 'Use the tabletop controls' : displayOnly ? 'Public display' : currentPlayer.uid === userUid ? 'Your turn' : game.phase === 'movement' ? 'Planning route' : 'Resolving turn'}</small></div>
    {#if !tableLayout}<div class="history-actions"><button class="undo-action" aria-label={undoText} disabled={!canUndo} onclick={onUndo}><span aria-hidden="true">↶</span>{undoButtonText}</button><GameLog entries={gameLog} players={game.players} {userUid} pending={undoPending} {onRollback} /></div>{/if}
  </header>

  <div class:mobile-board-open={mobileBoardOpen || displayOnly} class="play-area" data-e2e-fit data-e2e-no-scroll>
    {#if game.phase !== 'movement'}<nav class="mobile-view-switch" aria-label="Phone game view"><button class:active={mobileBoardOpen} aria-pressed={mobileBoardOpen} onclick={() => mobileBoardOpen = true}>Board</button><button class:active={!mobileBoardOpen} aria-pressed={!mobileBoardOpen} onclick={() => mobileBoardOpen = false}>Decision</button></nav>{/if}
    <section class:hidden-at-finish={game.phase === 'game-over'} class="board-shell" aria-label="Istanbul bazaar board" data-e2e-fit data-e2e-no-scroll>
      <div class="board-tools" aria-label="Board view controls">
        <button class="zoom-button" onclick={onZoomIn} aria-label="Zoom board in" disabled={boardScale >= 1}><span aria-hidden="true"></span></button>
        <button onclick={onFit}>Fit board</button>
      </div>
      <div class="board-viewport" data-e2e-fit>
        <div class="board" style={`--board-scale: ${boardScale}`} data-testid="bazaar-board" data-e2e-fit>
          {#each game.board as placeId, index}
            <LocationTile
              {game}
              {placeId}
              {index}
              selected={selectedPlace === placeId}
              reachable={reachable.includes(placeId)}
              departed={game.lastMovement?.from === placeId}
              arrived={game.lastMovement?.to === placeId}
              tabIndex={(keyboardPlace || game.board[0]) === placeId ? 0 : -1}
              onfocus={() => keyboardPlace = placeId}
              onkeydown={(event) => {
                if (event.key.startsWith('Arrow')) { event.preventDefault(); moveBoardFocus(index, event.key); }
                else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); void inspectPlaceFromKeyboard(placeId); }
              }}
              onclick={(event) => inspectPlace(event, placeId)}
            />
          {/each}
        </div>
      </div>
      <p class="board-caption">{room.layout.replace('-', ' ')} · setup seed {game.seed}</p>
      {#if import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && localIsCurrent && game.phase === 'movement'}<button class="e2e-resources" onclick={onGrantE2eResources}>{e2eResourceReview === 'yellow-recall' ? 'Review Yellow Mosque recall' : e2eResourceReview === 'zero-move' ? 'Review zero-distance Bonus move' : e2eResourceReview === 'flexible-market' ? 'Review Flexible Demand market sale' : 'Review ruby routes with supplied resources'}</button>{/if}
    </section>

    <aside class:finish={game.phase === 'game-over'} class:decision={game.phase !== 'movement'} class="inspector" class:route-planner={!selectedBonusManifest && game.phase === 'movement' && !selectedPlaceManifest} aria-live="polite" data-e2e-fit data-e2e-no-scroll>
      {#if inspectedPileCard}
        <p class="section-kicker">{inspectedPileSource === 'deck' ? 'Top of Bonus draw pile' : 'Top of Bonus discard pile'}</p>
        <h2 data-testid="pile-card-title">{inspectedPileCard.title}</h2>
        <p class="mobile-card-text">{inspectedPileCard.text}</p>
        <BonusCard card={inspectedPileCard} class="large-card public-card-detail" testId="pile-card-detail" />
        <p class="pile-source-note">{inspectedPileSource === 'deck' ? `${game.bonusDrawPile.length} cards remain in the draw pile.` : `${game.bonusDiscard.length} cards are in the discard pile.`}</p>
      {:else if selectedBonusManifest}
        <p class="section-kicker">Private Bonus card</p>
        <h2>{selectedBonusManifest.title}</h2>
        <p class="mobile-card-text">{selectedBonusManifest.text}</p>
        <BonusCard card={selectedBonusManifest} class="large-card" testId="illustrated-bonus-card" />
        {#if localIsCurrent}
          <div class="bonus-play" aria-label={`Play ${selectedBonusManifest.title}`}>
            {#if selectedBonusManifest.effect === 'gain-good'}
              <label class="wager-control">Good to gain<select aria-label="Bonus good to gain" value={bonusGood} onchange={(event) => bonusGood = event.currentTarget.value as Good}>{#each Object.keys(goodNames) as good}<option value={good} disabled={localPlayer.goods[good as Good] >= localPlayer.capacity}>{goodNames[good as Good]}</option>{/each}</select></label><button class="turn-action" disabled={!['action', 'family-action', 'turn-end', 'final-bonus'].includes(game.phase) || localPlayer.goods[bonusGood] >= localPlayer.capacity} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'gain-good', good: bonusGood })}>Play to gain 1 {bonusGood}</button>
            {:else if selectedBonusManifest.effect === 'gain-lira'}
              <button class="turn-action" disabled={!['movement', 'action', 'family-action', 'turn-end', 'final-bonus'].includes(game.phase)} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'gain-lira' })}>Play to gain 5 Lira</button>
            {:else if selectedBonusManifest.effect === 'return-family'}
              <label class="wager-control">Catch reward<select aria-label="Family pardon reward" value={bonusFamilyReward} onchange={(event) => bonusFamilyReward = event.currentTarget.value as 'lira' | 'bonus'}><option value="lira">3 Lira</option><option value="bonus">1 Bonus card</option></select></label><button class="turn-action" disabled={localPlayer.familyPlace === 12 || !['movement', 'action', 'family-action', 'turn-end'].includes(game.phase)} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'return-family', reward: bonusFamilyReward })}>Return family to Police</button>
            {:else if selectedBonusManifest.effect === 'return-assistant'}
              <label class="wager-control">Assistant<select aria-label="Bonus assistant to return" value={bonusAssistantPlace} onchange={(event) => bonusAssistantPlace = Number(event.currentTarget.value)}>{#each Object.keys(localPlayer.assistantsByPlace) as placeId}<option value={placeId}>{placeById.get(Number(placeId))?.name}</option>{/each}</select></label><button class="turn-action" disabled={game.phase !== 'movement' || !Object.keys(localPlayer.assistantsByPlace).length} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'return-assistant', place: bonusAssistantPlace })}>Return selected assistant</button>
            {:else if selectedBonusManifest.effect === 'long-move'}
              <button class="turn-action" disabled={game.phase !== 'movement' || game.activeBonusEffects.includes('long-move')} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'long-move' })}>Play for a 3–4 space move</button>
            {:else if selectedBonusManifest.effect === 'stay'}
              <button class="turn-action" disabled={game.phase !== 'movement' || localPlayer.merchantPlace === 7 || !stayAssistantAction || stayAssistantAction === 'fountain'} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'stay' })}>{stayAssistantAction === 'pick-up' ? 'Stay and pick up assistant' : 'Stay and leave assistant'}</button>
            {:else if selectedBonusManifest.effect === 'wild-small-market'}
              <button class="turn-action" disabled={game.phase !== 'action' || localPlayer.merchantPlace !== 11} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'wild-small-market' })}>Use flexible Small Market demand</button>
            {:else if selectedBonusManifest.effect === 'repeat-post'}
              <button class="turn-action" disabled={game.phase !== 'turn-end' || game.lastAction?.place !== 5} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'repeat-action' })}>Repeat Post Office action</button>
            {:else if selectedBonusManifest.effect === 'repeat-gemstone'}
              <button class="turn-action" disabled={game.phase !== 'turn-end' || game.lastAction?.place !== 16 || localPlayer.lira < game.rubyTracks.gemstonePrice} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'repeat-action' })}>Repeat at {game.rubyTracks.gemstonePrice} Lira</button>
            {:else if selectedBonusManifest.effect === 'repeat-sultan'}
              <button class="turn-action" disabled={game.phase !== 'turn-end' || game.lastAction?.place !== 13 || !sultanAffordable} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'repeat-action', wildGoods: sultanWildGoods })}>Repeat for {sultanCost.length} goods</button>
            {/if}
          </div>
        {:else}<p class="waiting-copy">Bonus cards may only be played by the active merchant.</p>{/if}
      {:else if game.phase === 'game-over'}
        <p class="section-kicker">The bazaar closes</p>
        <h2>Final ranking</h2>
        <p>Rubies decide first, followed by Lira, goods, and unplayed Bonus cards. Exact ties share the win.</p>
        <ol class="final-ranking" aria-label="Final ranking">{#each game.end.rankings as standing}<li class:winner={standing.rank === 1}><b>{standing.rank}</b><strong>{standing.name}</strong><span>{standing.rubies} rubies</span><small>{standing.lira} Lira · {standing.goods} goods · {standing.bonusCards} cards</small></li>{/each}</ol>
        {#if room.hostUid === userUid}<button class="turn-action" onclick={onRematch}>Open a rematch</button>{:else}<p class="waiting-copy">Waiting for the host to open a rematch.</p>{/if}
      {:else if game.phase === 'final-bonus'}
        <p class="section-kicker">Final direct resources</p>
        <h2>{currentPlayer.name}’s last trade</h2>
        <p>Play any Bonus cards that directly gain goods or Lira. Other effects are closed after the final turn.</p>
        {#if localIsCurrent}<button class="turn-action" onclick={onEndTurn}>Finish final Bonus window</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to finish final Bonus cards.</p>{/if}
      {:else if game.phase === 'merchant-payment'}
        <p class="section-kicker">Mandatory encounter</p>
        <h2>Pay the merchant toll</h2>
        <p>{paymentNames.length ? `Pay ${paymentNames.join(', ')} 2 Lira each.` : ''}{merchantPending?.neutralMerchantIds.length ? ` Pay ${merchantPending.neutralMerchantIds.length * 2} Lira to the supply for the neutral merchant.` : ''}</p>
        <dl><div><dt>Total due</dt><dd>{merchantPending?.total} Lira</dd></div><div><dt>After payment</dt><dd>{localIsCurrent ? localPlayer.lira - (merchantPending?.total ?? 0) : 'Hidden until resolved'}</dd></div></dl>
        {#if localIsCurrent}<button class="turn-action" onclick={onPayMerchants}>Pay {merchantPending?.total} Lira and continue</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to confirm the toll.</p>{/if}
      {:else if game.phase === 'mosque-ability'}
        <p class="section-kicker">Mosque ability</p>
        {#if abilityPending?.kind === 'warehouse-extra'}
          <h2>Green tile privilege</h2>
          <p>The Warehouse is filled. Pay 2 Lira for one additional good of any type with open capacity, or decline.</p>
          <div class="mosque-ability-card green-tile"><strong>Green</strong><span>Warehouse favour · once after this action</span></div>
          {#if localIsCurrent}<label class="wager-control">Additional good<select aria-label="Warehouse extra good" value={warehouseExtraGood} onchange={(event) => warehouseExtraGood = event.currentTarget.value as Good}>{#each Object.keys(goodNames) as good}<option value={good} disabled={localPlayer.goods[good as Good] >= localPlayer.capacity}>{goodNames[good as Good]}</option>{/each}</select></label><button class="turn-action" disabled={localPlayer.lira < 2 || localPlayer.goods[warehouseExtraGood] >= localPlayer.capacity} onclick={() => onUseMosqueAbility({ kind: 'warehouse-extra', good: warehouseExtraGood })}>Pay 2 Lira for 1 {warehouseExtraGood}</button><button class="skip-link" onclick={() => onUseMosqueAbility({ kind: 'warehouse-extra', good: null })}>Decline green Mosque ability</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose the extra good.</p>{/if}
        {:else if abilityPending?.kind === 'dice-adjust'}
          <h2>Red tile privilege</h2>
          <p>After seeing the roll, turn either die to 4, reroll both once, or keep the original result.</p>
          <div class="dice-result" aria-label={`Original dice ${abilityPending.originalDice[0]} and ${abilityPending.originalDice[1]}`}><span>{abilityPending.originalDice[0]}</span><span>{abilityPending.originalDice[1]}</span><strong>Original</strong></div>
          {#if localIsCurrent}<div class="dice-adjustments"><button class="turn-action" onclick={() => onUseMosqueAbility({ kind: 'dice-adjust', adjustment: 'first-to-four' })}>Turn first die to 4</button><button class="turn-action" onclick={() => onUseMosqueAbility({ kind: 'dice-adjust', adjustment: 'second-to-four' })}>Turn second die to 4</button><button class="turn-action alternate" onclick={() => onUseMosqueAbility({ kind: 'dice-adjust', adjustment: 'reroll' })}>Reroll both dice once</button><button class="skip-link" onclick={() => onUseMosqueAbility({ kind: 'dice-adjust', adjustment: 'none' })}>Keep original roll</button></div>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to adjust or keep the roll.</p>{/if}
        {/if}
      {:else if game.phase === 'encounters'}
        <p class="section-kicker">Encounter order</p>
        <h2>Choose who to meet</h2>
        <p>Catch every family member. The Governor and Smuggler are optional and may be resolved in any order.</p>
        {#if localIsCurrent}
          <div class="encounter-choices">
            {#each encounterPending?.familyUids ?? [] as familyUid}
              {@const family = game.players.find(({ uid }) => uid === familyUid)!}
              <section aria-label={`Catch ${family.name}'s family`}><strong>{family.name}’s family</strong><span>Mandatory · return to Police</span><div><button class="turn-action" onclick={() => onResolveEncounter({ kind: 'catch-family', familyUid, reward: 'lira' })}>Catch for 3 Lira</button><button class="turn-action alternate" onclick={() => onResolveEncounter({ kind: 'catch-family', familyUid, reward: 'bonus' })}>Catch for 1 Bonus card</button></div></section>
            {/each}
            {#if encounterPending?.governor === 'available'}
              <section aria-label="Governor encounter"><strong>Governor</strong><span>Draw a Bonus card, then pay</span><div><button class="turn-action" onclick={() => onResolveEncounter({ kind: 'governor-visit', accept: true })}>Visit the Governor</button><button class="skip-link" onclick={() => onResolveEncounter({ kind: 'governor-visit', accept: false })}>Decline Governor</button></div></section>
            {:else if encounterPending?.governor === 'payment'}
              <section aria-label="Pay the Governor"><strong>Governor payment</strong><span>{tabletopControls ? 'The drawn card is already in the private hand' : 'The drawn card is already in your hand'}</span><button class="turn-action" disabled={localPlayer.lira < 2} onclick={() => onResolveEncounter({ kind: 'governor-pay', payment: 'lira' })}>Pay Governor 2 Lira</button>{#if tabletopControls}<p>To discard instead, use {currentPlayer.name}’s private phone.</p>{:else}<label>Or discard<select aria-label="Governor discard card" value={governorDiscard} onchange={(event) => governorDiscard = event.currentTarget.value}><option value="">Choose a Bonus card</option>{#each localPlayer.bonusHand as cardId}<option value={cardId}>{bonusById.get(cardId)?.title} · {cardId}</option>{/each}</select></label><button class="turn-action alternate" disabled={!governorDiscard} onclick={() => onResolveEncounter({ kind: 'governor-pay', payment: 'card', discardCardId: governorDiscard })}>Discard selected card</button>{/if}</section>
            {/if}
            {#if encounterPending?.smuggler}
              <section aria-label="Smuggler encounter"><strong>Smuggler</strong><span>Gain one good, then pay 2 Lira or one good</span><label>Good to gain<select aria-label="Smuggler good to gain" value={smugglerGood} onchange={(event) => smugglerGood = event.currentTarget.value as Good}>{#each Object.keys(goodNames) as good}<option value={good} disabled={localPlayer.goods[good as Good] >= localPlayer.capacity}>{goodNames[good as Good]}</option>{/each}</select></label><div><button class="turn-action" disabled={!smugglerGainAvailable || localPlayer.lira < 2} onclick={() => onResolveEncounter({ kind: 'smuggler-trade', accept: true, good: smugglerGood, payment: 'lira' })}>Take {smugglerGood}, pay 2 Lira</button><button class="skip-link" onclick={() => onResolveEncounter({ kind: 'smuggler-trade', accept: false })}>Decline Smuggler</button></div><label>Or pay a good<select aria-label="Smuggler payment good" value={smugglerPaymentGood} onchange={(event) => smugglerPaymentGood = event.currentTarget.value as Good}>{#each Object.keys(goodNames) as good}<option value={good} disabled={localPlayer.goods[good as Good] + (good === smugglerGood ? 1 : 0) < 1}>{goodNames[good as Good]}</option>{/each}</select></label><button class="turn-action alternate" disabled={!smugglerGainAvailable} onclick={() => onResolveEncounter({ kind: 'smuggler-trade', accept: true, good: smugglerGood, payment: 'good', paymentGood: smugglerPaymentGood })}>Take {smugglerGood}, pay {smugglerPaymentGood}</button></section>
            {/if}
          </div>
        {:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to order the encounters.</p>{/if}
      {:else if game.phase === 'turn-end'}
        <p class="section-kicker">Review completed turn</p>
        <h2>{currentPlayer.name}’s turn log</h2>
        <p>Pass clockwise, or roll back every still-reversible action in this turn with one immutable undo event.</p>
        {#if game.lastRoll?.playerUid === currentPlayer.uid && game.lastRoll.place === actionPlace.id}<div class="dice-result" aria-label={`Dice result ${game.lastRoll.dice[0]} and ${game.lastRoll.dice[1]}`}><span>{game.lastRoll.dice[0]}</span><span>{game.lastRoll.dice[1]}</span><strong>{game.lastRoll.reward} {actionPlace.id === 8 ? 'jewelry' : 'Lira'}</strong></div>{/if}
        <ol class="turn-log" aria-label={`${currentPlayer.name}'s turn actions`}>{#each currentTurnLog as entry}<li class:blocked={Boolean(entry.blockedReason) || !entry.rollbackActorUids.includes(userUid)} class:reachable={undoTurnTarget?.eventId === entry.eventId}><span>#{currentTurnLog.indexOf(entry) + 1}</span><strong>{entry.label}</strong><small>{entry.summary}</small><em aria-label={entry.dice ? `Encounter dice ${entry.dice[0]} and ${entry.dice[1]}` : undefined}>{entry.dice ? `${entry.dice[0]} + ${entry.dice[1]} · ` : ''}{entry.barrierReason ? `Barrier · ${entry.barrierReason}` : entry.blockedReason ?? (entry.rollbackActorUids.includes(userUid) ? `${entry.rollbackCount} action${entry.rollbackCount === 1 ? '' : 's'}` : 'Not controlled here')}</em></li>{:else}<li class="blocked"><strong>No reversible action was recorded.</strong></li>{/each}</ol>
        {#if localIsCurrent}<div class="turn-completion-actions"><button class="turn-action" onclick={onEndTurn}>End turn and pass clockwise</button><button class="undo-turn" aria-label={undoTurnTarget ? `Undo turn back before ${undoTurnTarget.label}` : 'Undo Turn unavailable'} disabled={!undoTurnTarget || undoPending} onclick={() => undoTurnTarget && onRollback(undoTurnTarget.eventId)}>↶ Undo Turn{undoTurnTarget ? ` · ${undoTurnTarget.rollbackCount} actions` : ''}</button></div>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to end the completed turn.</p>{/if}
      {:else if game.phase === 'action' || game.phase === 'family-action'}
        <p class="section-kicker">Place action ready</p>
        <h2>{actionPlace.name}</h2>
        <div class="inspector-glyph"><GameArt kind="location" place={actionPlace.id} /></div>
        {#if actionPlace.id === 1}
          <p>Pay 7 Lira to expand every goods track by one space. Completing all three extensions also claims a ruby.</p>
          <div class="wheelbarrow-track" aria-label={`${currentPlayer.extensions} of 3 wheelbarrow extensions`}>{#each Array(3) as _, index}<span class:filled={currentPlayer.extensions > index}><GameArt kind="component" component="wheelbarrow" class="track-art" /></span>{/each}</div>
          {#if localIsCurrent}<button class="turn-action" disabled={localPlayer.lira < 7 || localPlayer.extensions >= 3 || game.supplies.wheelbarrowExtensions < 1} onclick={() => onTakeAction({ kind: 'wainwright-buy' })}>Buy extension for 7 Lira</button><p class="action-balance">You have {localPlayer.lira} Lira · {game.supplies.wheelbarrowExtensions} extensions remain</p><button class="skip-link" onclick={onEndTurn}>Skip Wainwright and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose.</p>{/if}
        {:else if warehouseGood(actionPlace.id)}
          {@const good = warehouseGood(actionPlace.id)!}
          <p>Fill {good} from {currentPlayer.goods[good]} to wheelbarrow capacity {currentPlayer.capacity}.</p>
          <div class={`crate-track ${good}`} aria-label={`${currentPlayer.goods[good]} of ${currentPlayer.capacity} ${good}`}>{#each Array(currentPlayer.capacity) as _, index}<span class:filled={index < currentPlayer.goods[good]}></span>{/each}</div>
          {#if localIsCurrent}<button class="turn-action" onclick={() => onTakeAction({ kind: 'warehouse-fill', good })}>Fill {good} to {localPlayer.capacity}</button><button class="skip-link" onclick={onEndTurn}>Skip warehouse and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to fill the warehouse good.</p>{/if}
        {:else if actionPlace.id === 7}
          <p>Choose any of your assistants on the board and return them to the merchant stack.</p>
          {#if localIsCurrent && Object.keys(localPlayer.assistantsByPlace).length}
            <div class="recall-list" aria-label="Assistants available to recall">{#each Object.entries(localPlayer.assistantsByPlace) as [placeId, count]}<label><input type="checkbox" checked={recallSelection.includes(Number(placeId))} onchange={() => toggleRecall(Number(placeId))} /><span>{placeById.get(Number(placeId))?.name} · {count}</span></label>{/each}</div>
            <button class="turn-action" onclick={recallAssistants}>Recall {recallSelection.length} assistant{recallSelection.length === 1 ? '' : 's'}</button><button class="skip-link" onclick={onEndTurn}>Skip Fountain and end turn</button>
          {:else if localIsCurrent}<p class="action-balance">Every assistant is already with your merchant.</p><button class="skip-link" onclick={onEndTurn}>End turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose assistants.</p>{/if}
        {:else if actionPlace.id === 5}
          <p>Collect the four resources not covered by the mail indicators, then advance the leftmost upper indicator.</p>
          <div class="mail-track" aria-label={`Post Office indicators ${game.postOfficeLower.map((lower) => lower ? 'lower' : 'upper').join(', ')}`}>
            {#each postOfficeRows as rows, index}
              <span class="mail-column">
                <i class:covered={!game.postOfficeLower[index]}>{rows[1].lira ? `${rows[1].lira}₺` : goodNames[rows[1].good!].slice(0, 1)}</i>
                <b aria-hidden="true" class:lower={game.postOfficeLower[index]}></b>
                <i class:covered={game.postOfficeLower[index]}>{rows[0].lira ? `${rows[0].lira}₺` : goodNames[rows[0].good!].slice(0, 1)}</i>
              </span>
            {/each}
          </div>
          {#if localIsCurrent}<button class="turn-action" onclick={() => onTakeAction({ kind: 'post-office-collect' })}>Collect uncovered mail resources</button><button class="skip-link" onclick={onEndTurn}>Skip Post Office and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to collect the mail route.</p>{/if}
        {:else if actionPlace.id === 6}
          <p>Choose each card from the face-down draw pile or the face-up discard pile. Commit both sources before any face-down card is revealed, then discard any one card from your hand.</p>
          {#if tabletopControls}<div class="private-choice-callout" aria-label="Private Caravansary choice"><BonusCard reverse="card-back" compact class="private-card-back" /><strong>{currentPlayer.name}, use your private phone</strong><span>The tabletop will update after the two cards are chosen and one is discarded.</span></div><button class="skip-link" onclick={onEndTurn}>Skip Caravansary and end turn</button>
          {:else if localIsCurrent}
            <div class="caravan-sources">
              {#each [0, 1] as index}
                <label>Card {index + 1}<select aria-label={`${index === 0 ? 'First' : 'Second'} card source`} value={caravanSources[index]} onchange={(event) => setCaravanSource(index as 0 | 1, event.currentTarget.value as CardSource)}><option value="deck">Face-down draw pile</option><option value="discard" disabled={game.bonusDiscard.length < (caravanSources.slice(0, index).filter((source) => source === 'discard').length + 1)}>Face-up discard pile</option></select>
                  <span class:face-up={caravanSources[index] === 'discard'} class="source-card" aria-label={caravanSources[index] === 'deck' ? `Chosen card ${index + 1} remains face down` : `Chosen face-up card ${bonusById.get(caravanPreview[index])?.title}`}>
                    {#if caravanSources[index] === 'deck'}<BonusCard reverse="card-back" compact mini class="source-card-art" /><strong>Face down</strong>{:else}<BonusCard card={bonusById.get(caravanPreview[index])!} compact mini class="source-card-art" /><strong>{bonusById.get(caravanPreview[index])?.title}</strong>{/if}
                  </span>
                </label>
              {/each}
            </div>
            {#if caravanRevealed}
              <div class="card-preview revealed-cards" aria-label="Revealed chosen cards" aria-live="polite">{#each caravanPreview as cardId}<span><BonusCard card={bonusById.get(cardId)!} compact mini class="revealed-card-art" /><strong>{bonusById.get(cardId)?.title}</strong></span>{/each}</div>
              <fieldset class="discard-choice"><legend>Discard one after reveal</legend>{#each [...localPlayer.bonusHand, ...caravanPreview] as cardId}<label><input type="radio" name="caravan-discard" value={cardId} aria-label={`${bonusById.get(cardId)?.title} · ${cardId}`} checked={caravanDiscardSelection === cardId} onchange={() => caravanDiscardSelection = cardId} /><span>{bonusById.get(cardId)?.title}</span></label>{/each}</fieldset>
              <button class="turn-action" disabled={!caravanDiscardSelection} onclick={tradeCaravansary}>Keep two cards and discard selected</button>
            {:else}
              <p class="card-preview concealed-cards" aria-live="polite">{caravanSources.filter((source) => source === 'deck').length} face-down · {caravanSources.filter((source) => source === 'discard').length} face-up selected</p>
              <button class="turn-action" disabled={caravanPreview.length !== 2} onclick={() => caravanRevealed = true}>Reveal 2 chosen cards</button>
            {/if}
            <button class="skip-link" onclick={onEndTurn}>Skip Caravansary and end turn</button>
          {:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to manage a private Bonus hand.</p>{/if}
        {:else if actionPlace.id === 10 || actionPlace.id === 11}
          <p>Select one to five depicted goods you own. {actionPlace.id === 10 ? 'Large Market revenue rises from 3 to 25 Lira.' : 'Small Market revenue rises from 2 to 20 Lira.'} Then this Demand rotates.</p>
          <div class="demand-card" aria-label={`${actionPlace.name} demand ${activeDemand?.id}`}><GameArt kind="component" component={actionPlace.id === 10 ? 'demand-large' : 'demand-small'} class="demand-art" />
            {#each activeDemand?.goods ?? [] as good, index}<label class={marketPaymentGoods[index]}><input type="checkbox" aria-label={`Sell demand slot ${index + 1}: ${good}`} checked={marketSelection.includes(index)} onchange={() => toggleMarketSlot(index)} /><i></i>{#if flexibleMarketActive}<select aria-label={`Payment for demand slot ${index + 1}`} value={marketPaymentGoods[index]} onchange={(event) => setFlexibleGood(index, event.currentTarget.value as Good)}>{#each Object.keys(goodNames) as option}<option value={option}>{goodNames[option as Good]}{option === good ? ' (shown)' : ''}</option>{/each}</select>{:else}<span>{goodNames[good]}</span>{/if}</label>{/each}
          </div>
          <p class="market-revenue">{marketSelection.length ? `${marketSelection.length} selected · ${marketRevenueFor(actionPlace.id, marketSelection.length)} Lira` : flexibleMarketActive ? 'Select slots, then keep or substitute each good' : 'Select goods to sell'}</p>
          {#if localIsCurrent}<button class="turn-action" disabled={!marketSelectionLegal} onclick={sellMarket}>{flexibleMarketActive ? 'Sell flexible goods' : 'Sell selected goods'} for {marketRevenueFor(actionPlace.id, marketSelection.length)} Lira</button>{/if}
          {#if localIsCurrent}<button class="skip-link" onclick={onEndTurn}>Skip market and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose a sale.</p>{/if}
        {:else if actionPlace.id === 8}
          <p>Choose one basic good, then roll two deterministic dice for zero to three jewelry.</p>
          <fieldset class="basic-good-choice"><legend>Basic good</legend>{#each ['fabric', 'spice', 'fruit'] as good}<label class={good}><input type="radio" name="black-market-good" value={good} checked={blackMarketGood === good} onchange={() => blackMarketGood = good as Exclude<Good, 'jewelry'>} /><i></i><span>{goodNames[good as Good]}</span></label>{/each}</fieldset>
          {#if localIsCurrent}<button class="turn-action" onclick={() => onTakeAction({ kind: 'black-market-roll', good: blackMarketGood })}>Take {blackMarketGood} and roll both dice</button><button class="skip-link" onclick={onEndTurn}>Skip Black Market and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose a basic good.</p>{/if}
        {:else if actionPlace.id === 9}
          <p>Declare 3–12, then roll. Meet or beat the wager to earn it; otherwise receive 2 Lira.</p>
          <TeaHousePayoffs panel />
          <label class="wager-control">Declared wager<select aria-label="Tea House wager" value={teaWager} onchange={(event) => teaWager = Number(event.currentTarget.value)}>{#each Array.from({ length: 10 }, (_, index) => index + 3) as wager}<option value={wager}>{wager} Lira</option>{/each}</select></label>
          {#if localIsCurrent}<button class="turn-action" onclick={() => onTakeAction({ kind: 'tea-house-wager', wager: teaWager })}>Wager {teaWager} and roll both dice</button><button class="skip-link" onclick={onEndTurn}>Skip Tea House and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to declare a wager.</p>{/if}
        {:else if actionPlace.id === 12}
          <p>Send your family member from Police Station to any other Place, perform that action, and leave the family member there.</p>
          {#if localIsCurrent && localPlayer.familyPlace === 12}
            <label class="wager-control">Family destination<select aria-label="Family destination" value={policeDestination} onchange={(event) => policeDestination = Number(event.currentTarget.value)}>{#each places.filter(({ id }) => id !== 12) as place}<option value={place.id}>{place.id} · {place.name}</option>{/each}</select></label>
            <button class="turn-action" onclick={() => onTakeAction({ kind: 'police-send', destination: policeDestination })}>Send family to {placeById.get(policeDestination)?.name}</button><button class="skip-link" onclick={onEndTurn}>Skip Police Station and end turn</button>
          {:else if localIsCurrent}<p class="action-balance">Your family member is already at {placeById.get(localPlayer.familyPlace)?.name}.</p><button class="skip-link" onclick={onEndTurn}>End turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to dispatch family.</p>{/if}
        {:else if actionPlace.id === 14 || actionPlace.id === 15}
          {@const colors = actionPlace.id === 14 ? ['fabric', 'spice'] as Good[] : ['fruit', 'jewelry'] as Good[]}
          <p>Have at least the depicted number of goods, pay one matching good, and keep the permanent ability. Owning both colors here claims a ruby.</p>
          <div class="mosque-offers" aria-label={`${actionPlace.name} tile offers`}>
            {#each colors as color}
              {@const tile = mosqueTiles.find(({ id }) => id === game.mosqueStacks[color][0])}
              <article class={`${color}-tile`}><GameArt kind="component" component={`mosque-${color}` as `mosque-${Good}`} class="mosque-tile-art" /><span>{mosqueColorNames[color]} power</span>{#if tile}<strong>Hold {tile.required} {goodNames[color]} · pay 1</strong><small>{tile.ability}</small>{:else}<strong>Stack empty</strong>{/if}{#if ownsMosqueAbility(currentPlayer, color)}<b>Enabled in tray</b>{:else if tile && localIsCurrent}<button class="turn-action" disabled={localPlayer.goods[color] < tile.required} onclick={() => onTakeAction({ kind: 'mosque-take', tileId: tile.id })}>Pay 1 {color} for {mosqueColorNames[color]} power</button>{/if}</article>
            {/each}
          </div>
          {#if localIsCurrent}<button class="skip-link" onclick={onEndTurn}>Skip Mosque and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose a Mosque tile.</p>{/if}
        {:else if actionPlace.id === 13}
          <p>Deliver every uncovered good to claim the next Palace ruby. Each purchase reveals one additional requirement.</p>
          <SultanOffer cost={sultanCost} nextGood={nextSultanGood} panel label={`Current Sultan goods cost: ${sultanCost.map((good) => good === 'any' ? 'any good' : goodNames[good]).join(', ')}`} />
          {#if localIsCurrent}
            {#each Array.from({ length: sultanWildCount }) as _, index}<label class="wager-control">Wild good {index + 1}<select aria-label={`Sultan wild good ${index + 1}`} value={sultanWildGoods[index] ?? 'fabric'} onchange={(event) => setSultanWild(index, event.currentTarget.value as Good)}>{#each Object.keys(goodNames) as good}<option value={good}>{goodNames[good as Good]}</option>{/each}</select></label>{/each}
            <button class="turn-action" disabled={!sultanAffordable} onclick={() => onTakeAction({ kind: 'sultan-buy', wildGoods: [...sultanWildGoods] })}>Deliver {sultanCost.length} goods for 1 ruby</button><button class="skip-link" onclick={onEndTurn}>Skip Sultan's Palace and end turn</button>
          {:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to deliver goods.</p>{/if}
        {:else if actionPlace.id === 16}
          <p>Pay the greatest uncovered price to claim the next Dealer ruby. The price rises by one after every purchase.</p>
          <GemstoneOffer price={game.rubyTracks.gemstonePrice} panel />
          {#if localIsCurrent}<button class="turn-action" disabled={localPlayer.lira < game.rubyTracks.gemstonePrice} onclick={() => onTakeAction({ kind: 'gemstone-buy' })}>Pay {game.rubyTracks.gemstonePrice} Lira for 1 ruby</button><button class="skip-link" onclick={onEndTurn}>Skip Gemstone Dealer and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to buy or pass.</p>{/if}
        {:else}
          <p>{actionPlace.action}</p>
          {#if localIsCurrent}<button class="turn-action secondary-action" onclick={onEndTurn}>Skip this Place action and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to finish the Place action.</p>{/if}
        {/if}
      {:else if selectedPlaceManifest}
        <p class="section-kicker">Place {selectedPlaceManifest.id}</p>
        <h2 data-testid="place-inspector-title" tabindex="-1">{selectedPlaceManifest.name}</h2>
        <div class="inspector-glyph"><GameArt kind="location" place={selectedPlaceManifest.id} /></div>
        <p>{selectedPlaceManifest.action}</p>
        {#if selectedPlaceManifest.id === 13}
          <div class="next-route-cost" aria-label={`After the next Sultan trade: ${nextSultanCost.length} goods`}><span>After the next trade</span><strong>{nextSultanCost.length} goods</strong><small>{nextSultanCost.map((good) => good === 'any' ? 'Any' : goodNames[good]).join(' · ')}</small></div>
        {:else if selectedPlaceManifest.id === 16}
          <div class="next-route-cost" aria-label={`After the next Gemstone Dealer trade: ${nextGemstonePrice} Lira`}><span>After the next trade</span><strong>{nextGemstonePrice} Lira</strong><small>{nextGemstonePrice === game.rubyTracks.gemstonePrice ? 'Maximum price' : `Current price ${game.rubyTracks.gemstonePrice} Lira`}</small></div>
        {/if}
        <dl><div><dt>Grid position</dt><dd>Row {Math.floor(game.board.indexOf(selectedPlaceManifest.id) / 4) + 1}, column {(game.board.indexOf(selectedPlaceManifest.id) % 4) + 1}</dd></div><div><dt>Merchants here</dt><dd>{occupants(selectedPlaceManifest.id).map(({ name }) => name).join(', ') || 'None'}</dd></div></dl>
        {#if selectedAssistantAction}<button class="turn-action" onclick={() => onMove(selectedPlaceManifest.id, selectedAssistantAction)}>{selectedAssistantAction === 'pick-up' ? 'Move here and pick up assistant' : selectedAssistantAction === 'fountain' ? 'Move here without leaving an assistant' : 'Move here and leave an assistant'}</button>{:else if localIsCurrent}<p class="route-warning">This Place is not one or two orthogonal spaces away.</p>{/if}
      {:else}
        <p class="section-kicker">Route planner</p>
        <h2>Inspect any Place</h2>
        <p>Select a tile to read its action, exact grid position, and current occupants. Reachable routes are highlighted for the active merchant.</p>
        <div class="encounter-ledger"><span><GameArt kind="piece" piece="governor" class="ledger-piece" /> Governor at {game.governorPlace}</span><span><GameArt kind="piece" piece="smuggler" class="ledger-piece" /> Smuggler at {game.smugglerPlace}</span></div>
        {#if localIsCurrent && ownsMosqueAbility(localPlayer, 'fruit') && !game.abilitiesUsedThisTurn.includes('fruit') && Object.keys(localPlayer.assistantsByPlace).length}
          <div class="yellow-recall" aria-label="Yellow Mosque recall">
            <GameArt kind="component" component="mosque-fruit" class="yellow-power-art" label="Enabled Yellow Mosque power" />
            <div class="yellow-recall-copy"><strong>Invoke Yellow Mosque</strong><span>Before moving, pay 2 Lira and bring one assistant back to your merchant stack.</span></div>
            <div class="yellow-recall-actions">{#each Object.keys(localPlayer.assistantsByPlace) as placeId}<button class="turn-action" disabled={localPlayer.lira < 2} onclick={() => onUseMosqueAbility({ kind: 'yellow-recall', place: Number(placeId) })}>Recall from {placeById.get(Number(placeId))?.name} · 2 Lira</button>{/each}</div>
          </div>
        {/if}
        <dl class="supply-ledger" aria-label="Public component supply">
          <div><dt>Bonus draw pile</dt><dd>{game.bonusDrawPile.length}</dd></div>
          <div><dt>Mosque tiles</dt><dd>{Object.values(game.mosqueStacks).flat().length}</dd></div>
          <div><dt>Market demands</dt><dd>{game.largeDemand.length + game.smallDemand.length}</dd></div>
          <div><dt>Wheelbarrow extensions</dt><dd>{game.supplies.wheelbarrowExtensions}</dd></div>
        </dl>
      {/if}
    </aside>
  </div>

  <section class:hidden-at-finish={game.phase === 'game-over'} class:many={game.players.length > 3} class="player-rail" aria-label="Player resources" style={`--players: ${game.players.length}`} data-e2e-fit data-e2e-no-scroll>
    {#each game.players as player, index}
      <article class:local={!tabletopControls && player.uid === userUid} aria-label={`${player.name} resources`} data-player-color={player.color} data-e2e-fit data-e2e-no-scroll>
        <PlayerTray
          {player}
          seat={index + 1}
          starting={index === game.startingSeat}
          local={!tabletopControls && player.uid === userUid}
          compact={tableLayout}
          {selectedBonus}
          onInspectBonus={inspectBonus}
        />
      </article>
    {/each}
  </section>
  {#if tableLayout}<footer class="tabletop-strip" data-e2e-fit data-e2e-no-scroll><span class="table-identity"><strong>{tabletopControls ? 'Istanbul tabletop' : 'Istanbul'}</strong><i>{room.roomCode} · {room.layout.replace('-', ' ')}</i></span><span class="table-history-actions"><button class="undo-action" aria-label={undoText} disabled={!canUndo} onclick={onUndo}><span aria-hidden="true">↶</span>{undoButtonText}</button><GameLog entries={gameLog} players={game.players} {userUid} pending={undoPending} {onRollback} /></span><span class="undo-record" aria-live="polite">{undoStatusText}{undoLog.length ? ` · last log: ${undoLog.at(-1)?.label}` : ''}</span></footer>{/if}
</section>

<style>
  .game-table { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: .65rem; color: #fffaf0; }
  .visually-hidden { position: fixed; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  .game-table.display-only .board { --board-limit: 92rem; }
  .game-table.display-only .play-area { grid-template-columns: minmax(0, 3fr) minmax(19rem, 1fr); }
  .game-table.display-only .player-rail article { padding: clamp(.55rem, 1vw, 1.2rem); }
  .game-table.table-layout { display: grid; grid-template-columns: clamp(13rem, 17vw, 20rem) minmax(0, 1fr) clamp(18rem, 22vw, 28rem); grid-template-rows: auto minmax(0, 1fr) auto; gap: .45rem; }
  .table-layout .turn-banner { grid-column: 1; grid-row: 1; min-height: 0; gap: .35rem; padding: .4rem .55rem; border-radius: .65rem; }
  .table-layout .turn-banner > div:first-child { min-width: 0; }.table-layout .turn-banner h1 { overflow: hidden; font-size: clamp(1rem, 1.3vw, 1.35rem); line-height: 1; text-overflow: ellipsis; white-space: nowrap; }.table-layout .turn-banner p { font-size: .48rem; }.table-layout .turn-notice { overflow: hidden; font-size: .48rem; text-overflow: ellipsis; white-space: nowrap; }
  .table-layout .turn-token { flex: 0 0 auto; grid-template-columns: 1.2rem; gap: .08rem; justify-items: center; font-size: .48rem; }.table-layout .turn-token .player-dot { grid-row: auto; width: 1.15rem; height: 1.15rem; border-width: 2px; }.table-layout .turn-token small { display: none; }
  .table-layout .play-area { display: contents; }
  .table-layout .play-area > .mobile-view-switch { display: none; }
  .table-layout .board-shell { grid-column: 2; grid-row: 1 / 4; }
  .table-layout .board { --board-limit: 100%; }
  .table-layout .inspector { grid-column: 3; grid-row: 1 / 4; }
  .table-layout .play-area:has(.inspector.finish) .board-shell { display: none; }
  .table-layout .inspector.finish { grid-column: 2 / 4; }
  .table-layout .player-rail { grid-column: 1; grid-row: 2; min-height: 0; grid-template-columns: 1fr; grid-auto-flow: row; grid-auto-rows: minmax(0, 1fr); align-content: center; gap: .3rem; overflow: hidden; }
  .table-layout .player-rail.many { grid-template-columns: repeat(2, minmax(0, 1fr)); grid-auto-flow: row; grid-auto-rows: auto; overflow: hidden; }
  .table-layout .player-rail article { min-width: 0; min-height: 0; display: grid; place-items: center; overflow: hidden; padding: 0; border: 0; aspect-ratio: 1; background: transparent; }
  .tabletop-strip { grid-column: 1; grid-row: 3; min-width: 0; display: grid; grid-template-columns: 1fr; gap: .2rem; overflow: visible; padding: .25rem .35rem; border: 1px solid rgb(239 202 125 / 35%); border-radius: .55rem; color: #d3dfd8; background: rgb(5 29 31 / 78%); font-size: .48rem; letter-spacing: .04em; text-transform: uppercase; }
  .tabletop-strip .table-identity { min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: .4rem; }.tabletop-strip .table-identity strong, .tabletop-strip .table-identity i { white-space: nowrap; }.tabletop-strip .table-identity i { font-style: normal; }.undo-record { color: #9fb8b2; font-size: .43rem; line-height: .55rem; text-align: center; }.table-history-actions, .history-actions { display: flex; gap: .35rem; }.table-history-actions > :global(*) { flex: 1; }.tabletop-strip .table-history-actions .undo-action { width: auto; flex: 1; }
  .undo-action { min-width: 0; min-height: 2rem; display: inline-flex; align-items: center; justify-content: center; gap: .3rem; padding: .25rem .55rem; border: 1px solid #e8c573; border-radius: .45rem; color: #173f43; background: #efca7d; font: inherit; font-size: .58rem; font-weight: 700; white-space: nowrap; }.tabletop-strip .undo-action { width: 100%; min-height: 1.7rem; }.undo-action span { font-size: .9rem; line-height: 0; }.undo-action:disabled { border-color: rgb(255 255 255 / 18%); color: #9fb0ad; background: rgb(255 255 255 / 7%); }
  .turn-banner { min-height: 4.4rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .55rem 1.1rem; border: 1px solid rgb(239 202 125 / 35%); border-radius: 1rem; background: linear-gradient(100deg, rgb(13 48 51 / 96%), rgb(28 76 75 / 92%)); box-shadow: 0 .8rem 2rem rgb(35 21 9 / 22%); }
  .turn-banner p, .section-kicker { margin: 0; color: #efca7d; font-size: .68rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .turn-banner h1 { margin: .1rem 0 0; font: 700 clamp(1.65rem, 3vw, 2.5rem)/.95 'Cormorant Garamond', serif; }
  .turn-notice { display: block; margin-top: .2rem; color: #ffd2a4; font-size: .68rem; }
  .turn-token { display: grid; grid-template-columns: 1.8rem auto; gap: 0 .55rem; align-items: center; }
  .turn-token .player-dot { grid-row: 1 / 3; }
  .turn-token small { color: #bdd0ca; }
  .turn-banner .history-actions { flex: 0 0 auto; }.turn-banner .history-actions .undo-action { min-height: 2.5rem; }
  .turn-log { display: grid; gap: .3rem; margin: .6rem 0; padding: 0; list-style: none; }.turn-log li { min-width: 0; display: grid; grid-template-columns: 1.7rem minmax(0, 1fr) auto; gap: 0 .45rem; align-items: center; padding: .4rem .5rem; border: 1px solid #d7bd83; border-radius: .45rem; background: #f4e6c4; }.turn-log li > span { grid-row: 1 / 3; display: grid; place-items: center; align-self: stretch; border-radius: .3rem; color: #fff; background: #267356; font-size: .58rem; font-weight: 700; }.turn-log strong, .turn-log small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.turn-log strong { font-size: .7rem; }.turn-log small { color: #59706c; font-size: .52rem; }.turn-log em { grid-column: 3; grid-row: 1 / 3; max-width: 8.5rem; overflow: hidden; color: #267356; font-size: .5rem; font-style: normal; font-weight: 700; text-overflow: ellipsis; white-space: nowrap; }.turn-log li.blocked { border-color: #c8c3b9; color: #818481; background: #e6e4de; filter: grayscale(1); }.turn-log li.blocked > span { background: #969a97; }.turn-log li.blocked em { color: #777; }.turn-log li.reachable { outline: 2px solid #267356; }.turn-completion-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .45rem; }.undo-turn { min-height: 2.8rem; border: 1px solid #a43b32; border-radius: .5rem; color: #842e28; background: #fff; font-size: .7rem; font-weight: 700; }.undo-turn:disabled { border-color: #bbb; color: #888; background: #e7e5df; }
  .player-dot { width: 1.7rem; height: 1.7rem; display: inline-block; border: 3px solid #f0cd80; border-radius: 50%; box-shadow: inset 0 0 0 2px #fffaf0; }
  .ruby { background: #a63e3a; }.saffron { background: #c98c28; }.teal { background: #28796f; }.indigo { background: #43588f; }.plum { background: #73466e; }
  .final-ranking { display: grid; gap: .45rem; margin: .7rem 0; padding: 0; list-style: none; }.final-ranking li { display: grid; grid-template-columns: 1.5rem 1fr auto; gap: .1rem .45rem; align-items: center; padding: .5rem; border: 1px solid #d4bd91; border-radius: .5rem; background: #f1e5cc; }.final-ranking li.winner { border-color: #b27b23; background: #f4df9e; }.final-ranking b { grid-row: 1 / 3; color: #a43b32; font: 700 1.3rem 'Cormorant Garamond', serif; }.final-ranking small { grid-column: 2 / 4; color: #607371; }
  .play-area:has(.inspector.finish) { grid-template-columns: 1fr; }.hidden-at-finish { display: none !important; }.inspector.finish { width: min(54rem, 100%); margin: auto; padding: clamp(1.2rem, 4vw, 2.5rem); background: radial-gradient(circle at 90% 10%, rgb(239 202 125 / 35%), transparent 12rem), #fffaf0; }.inspector.finish .final-ranking { grid-template-columns: repeat(5, 1fr); }.inspector.finish .final-ranking li { grid-template-columns: 1.5rem 1fr; }.inspector.finish .final-ranking li > span, .inspector.finish .final-ranking li > small { grid-column: 1 / -1; }
  .play-area { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(23rem, .48fr); gap: .65rem; }
  .mobile-view-switch { display: none; }
  .board-shell { position: relative; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgb(239 202 125 / 35%); border-radius: 1rem; background: linear-gradient(rgb(7 31 34 / 47%), rgb(7 31 34 / 68%)), var(--courtyard) center / cover; box-shadow: inset 0 0 5rem rgb(0 0 0 / 38%); }
  .board-tools { position: absolute; z-index: 5; top: .5rem; right: .5rem; display: flex; gap: .3rem; }
  .board-tools button { min-height: 2rem; padding: .3rem .65rem; border: 1px solid rgb(255 255 255 / 32%); border-radius: 2rem; color: #fffaf0; background: rgb(10 44 47 / 80%); font: inherit; font-size: .72rem; font-weight: 700; }
  .board-tools .zoom-button { width: 2rem; padding: 0; display: grid; place-items: center; }
  .e2e-resources { position: absolute; z-index: 5; left: .45rem; bottom: .35rem; max-width: 12rem; min-height: 1.8rem; padding: .25rem .5rem; border: 1px solid rgb(255 255 255 / 28%); border-radius: .45rem; color: #fffaf0; background: rgb(10 44 47 / 88%); font: inherit; font-size: .58rem; font-weight: 700; }
  .zoom-button span { position: relative; width: .7rem; height: .7rem; display: block; }
  .zoom-button span::before, .zoom-button span::after { position: absolute; inset: calc(50% - 1px) 0 auto; height: 2px; border-radius: 1px; background: currentColor; content: ''; }
  .zoom-button span::after { rotate: 90deg; }
  .board-viewport { container-type: size; flex: 1; min-height: 0; display: grid; place-items: center; overflow: hidden; padding: 2.4rem 1.2rem 1rem; }
  .board { --board-ratio: 1.42; --board-limit: 42rem; --board-scale: 1; width: min(calc(100% / var(--board-scale) - .75rem), calc(var(--board-limit) / var(--board-scale)), calc(100cqh * var(--board-ratio) / var(--board-scale) - .75rem)); aspect-ratio: var(--board-ratio); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); grid-template-rows: repeat(4, minmax(0, 1fr)); gap: .42rem; scale: var(--board-scale); transform-origin: center; transition: scale .2s ease; }
  .pile-source-note { color: #627572; font-size: .72rem; font-weight: 700; }
  .governor { background: #744c8b; }.smuggler { background: #263235; }:global(.governor-piece), :global(.smuggler-piece) { background-color: transparent; }
  .board-caption { margin: 0; padding: .28rem .7rem; color: #d3dfd8; font-size: .62rem; text-align: center; text-transform: capitalize; background: rgb(5 29 31 / 58%); }
  .inspector { min-height: 0; overflow: hidden; padding: 1rem; border: 1px solid rgb(23 63 67 / 18%); border-radius: 1rem; color: #173f43; background: rgb(255 250 239 / 94%); }
  .inspector h2 { margin: .15rem 0 .6rem; font: 700 1.8rem/1 'Cormorant Garamond', serif; }
  .inspector > p:not(.section-kicker) { color: #526b68; font-size: .84rem; line-height: 1.4; }
  .inspector-glyph { width: 5.2rem; height: 5.2rem; overflow: hidden; padding: 0; border: 3px solid #d49d42; border-radius: .65rem; background: #173f43; box-shadow: 0 .35rem .7rem #173f4333; }
  .inspector dl { margin: 1rem 0 0; font-size: .72rem; }
  .inspector dl div { display: grid; gap: .1rem; padding: .5rem 0; border-top: 1px solid #d9cdb7; }.inspector dt { color: #73817e; }.inspector dd { margin: 0; font-weight: 700; }
  .encounter-ledger { display: grid; gap: .5rem; margin-top: 1rem; }.encounter-ledger span { display: flex; align-items: center; gap: .5rem; font-size: .75rem; font-weight: 700; }:global(.ledger-piece) { width: 2.15rem; height: 2.15rem; border-radius: .35rem; }
  .supply-ledger { display: grid; grid-template-columns: 1fr 1fr; gap: 0 .7rem; margin-top: .8rem !important; }.supply-ledger div { grid-template-columns: 1fr auto; align-items: baseline; }.supply-ledger dd { color: #a43b32; font-size: .9rem; }
  .turn-action { width: 100%; min-height: 2.8rem; margin-top: .8rem; padding: .6rem .7rem; border: 0; border-radius: .6rem; color: #fffaf0; background: #267356; box-shadow: 0 .25rem 0 #164a37; font: inherit; font-size: .75rem; font-weight: 700; }.turn-action.secondary-action { background: #a23b36; box-shadow: 0 .25rem 0 #6d2523; }.route-warning, .waiting-copy { color: #9a5046 !important; font-weight: 700; }
  .turn-action:disabled { opacity: .45; box-shadow: none; cursor: not-allowed; }.complete-glyph { color: #267356; }.action-balance { margin: .45rem 0 0 !important; font-size: .68rem !important; text-align: center; }
  .wheelbarrow-track, .crate-track { display: flex; gap: .35rem; margin: .8rem 0; }.wheelbarrow-track span, .crate-track span { width: 2rem; height: 1.6rem; overflow: hidden; border: 2px solid #9e7145; border-radius: .3rem; background: #e8dbc1; }.wheelbarrow-track :global(.track-art) { width: 100%; height: 100%; opacity: .35; filter: grayscale(1); }.wheelbarrow-track span.filled { border-color: #267356; background: #efca7d; }.wheelbarrow-track span.filled :global(.track-art) { opacity: 1; filter: none; }.crate-track span.filled { background: currentColor; }.crate-track.fabric { color: #b7423c; }.crate-track.spice { color: #3b8662; }.crate-track.fruit { color: #d6a82c; }
  .recall-list { display: grid; gap: .35rem; margin-top: .65rem; }.recall-list label { grid-template-columns: auto 1fr; align-items: center; padding: .4rem .5rem; border: 1px solid #d9cdb7; border-radius: .45rem; font-size: .7rem; }.recall-list input { width: 1.2rem; min-height: 1.2rem; accent-color: #267356; }
  .mail-track { display: flex; gap: .45rem; margin: .7rem 0; }.mail-column { position: relative; width: 2.5rem; display: grid; gap: .25rem; }.mail-column i { min-height: 1.6rem; display: grid; place-items: center; border: 1px solid #b99a6b; border-radius: .3rem; color: #173f43; background: #f0d28f; font-size: .68rem; font-style: normal; font-weight: 700; }.mail-column i.covered { opacity: .38; }.mail-column b { position: absolute; top: .15rem; right: .15rem; width: .65rem; height: .65rem; border: 2px solid #fffaf0; border-radius: .15rem; background: #a23b36; box-shadow: 0 .1rem .2rem #0004; transition: top .18s ease; }.mail-column b.lower { top: 2rem; }
  .caravan-sources { display: flex; gap: .5rem; margin-top: .55rem; }.caravan-sources label { flex: 1; color: #6d7c79; font-size: .58rem; text-transform: uppercase; }.caravan-sources select { width: 100%; min-height: 2rem; margin-top: .15rem; border: 1px solid #b99a6b; border-radius: .35rem; color: #173f43; background: #fffaf0; }.source-card { height: 3.4rem; display: grid; grid-template-columns: 1.4rem 1fr; gap: .35rem; align-items: center; overflow: hidden; margin-top: .3rem; padding: .25rem; border: 1px solid #b99a6b; border-radius: .4rem; color: #efe3c5; background: #173f43; text-transform: none; }.source-card :global(.source-card-art) { width: 1.4rem; border-radius: .2rem; }.source-card strong { overflow: hidden; font-size: .57rem; line-height: 1.05; text-overflow: ellipsis; }.source-card:not(.face-up) strong { color: #efca7d; letter-spacing: .08em; text-transform: uppercase; }.card-preview { margin: .35rem 0 !important; font-size: .62rem !important; font-weight: 700; }.concealed-cards { text-align: center; }.revealed-cards { display: grid; grid-template-columns: 1fr 1fr; gap: .3rem; }.revealed-cards span { min-width: 0; display: grid; grid-template-columns: 1.35rem 1fr; gap: .3rem; align-items: center; padding: .25rem; border: 1px solid #d4bd91; border-radius: .35rem; background: #f1e5cc; }.revealed-cards :global(.revealed-card-art) { width: 1.35rem; border-radius: .18rem; }.revealed-cards strong { overflow: hidden; text-overflow: ellipsis; }.discard-choice { display: grid; grid-template-columns: repeat(3, 1fr); gap: .3rem; margin: 0; padding: .35rem; border: 1px solid #d9cdb7; border-radius: .45rem; }.discard-choice legend { padding: 0 .25rem; font-size: .58rem; font-weight: 700; text-transform: uppercase; }.discard-choice label { min-width: 0; display: grid; grid-template-columns: auto 1fr; gap: .2rem; align-items: center; font-size: .55rem; }.discard-choice span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.discard-choice input { width: .9rem; min-height: .9rem; accent-color: #a23b36; }
  .demand-card { position: relative; display: grid; grid-template-columns: repeat(5, 1fr); gap: .3rem; overflow: hidden; margin: .7rem 0; padding: .55rem; border: 2px solid #d49d42; border-radius: .55rem; background: #ead8b8; }:global(.demand-art) { position: absolute; inset: 0; width: 100%; height: 100%; opacity: .32; }.demand-card label { position: relative; z-index: 1; min-width: 0; display: grid; place-items: center; gap: .15rem; color: #173f43; font-size: .52rem; font-weight: 700; }.demand-card input { position: absolute; opacity: 0; }.demand-card i { width: 1.8rem; height: 1.8rem; border: 3px solid #fffaf0; border-radius: .4rem; box-shadow: 0 .15rem .25rem #0003; }.demand-card .fabric i { background: #b7423c; }.demand-card .spice i { background: #3b8662; }.demand-card .fruit i { background: #d6a82c; }.demand-card .jewelry i { background: #4382a9; }.demand-card input:checked + i { outline: 3px solid #173f43; outline-offset: 1px; }.demand-card select { width: 100%; min-width: 0; min-height: 1.8rem; border: 1px solid #9f8055; border-radius: .3rem; color: #173f43; background: #fffaf0; font-size: .5rem; font-weight: 700; }.market-revenue { margin: .2rem 0 !important; font-weight: 700; text-align: center; }
  .next-route-cost { display: grid; gap: .12rem; margin: .55rem 0; padding: .55rem .7rem; border: 2px solid #d49d42; border-radius: .55rem; color: #173f43; background: linear-gradient(115deg, #fff6dd, #ead8b8); }.next-route-cost span { color: #8f672a; font-size: .55rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }.next-route-cost strong { font: 700 1.25rem 'Cormorant Garamond', serif; }.next-route-cost small { color: #526b68; font-size: .58rem; }
  .basic-good-choice { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; margin: .7rem 0 0; padding: .45rem; border: 1px solid #d9cdb7; border-radius: .5rem; }.basic-good-choice legend { padding: 0 .25rem; font-size: .58rem; font-weight: 700; text-transform: uppercase; }.basic-good-choice label { display: grid; grid-template-columns: auto auto 1fr; gap: .25rem; align-items: center; font-size: .62rem; }.basic-good-choice input { accent-color: #173f43; }.basic-good-choice i { width: 1rem; height: 1rem; border-radius: .25rem; }.basic-good-choice .fabric i { background: #b7423c; }.basic-good-choice .spice i { background: #3b8662; }.basic-good-choice .fruit i { background: #d6a82c; }.wager-control { display: grid; gap: .25rem; margin-top: .7rem; color: #6d7c79; font-size: .62rem; font-weight: 700; text-transform: uppercase; }.wager-control select { min-height: 2.35rem; border: 1px solid #b99a6b; border-radius: .4rem; color: #173f43; background: #fffaf0; font: inherit; }.dice-result { display: flex; gap: .45rem; align-items: center; margin-top: .65rem; }.dice-result span { width: 2.4rem; height: 2.4rem; display: grid; place-items: center; border: 2px solid #173f43; border-radius: .5rem; color: #a23b36; background: #fffaf0; box-shadow: .15rem .2rem 0 #d4bd91; font: 700 1.2rem 'Cormorant Garamond', serif; }.dice-result strong { margin-left: .3rem; color: #267356; font-size: .75rem; }
  .skip-link { width: 100%; min-height: 2rem; margin-top: .35rem; border: 0; color: #8d3c37; text-decoration: underline; background: transparent; font: inherit; font-size: .68rem; font-weight: 700; }
  .encounter-choices { display: grid; gap: .55rem; margin-top: .65rem; }.encounter-choices section { display: grid; gap: .35rem; padding: .55rem; border: 1px solid #d4bd91; border-radius: .55rem; background: #f1e5cc; }.encounter-choices section > strong { font: 700 1.1rem 'Cormorant Garamond', serif; }.encounter-choices section > span { color: #627572; font-size: .62rem; }.encounter-choices section > div { display: grid; grid-template-columns: 1fr 1fr; gap: .35rem; }.encounter-choices .turn-action, .encounter-choices .skip-link { min-height: 2.1rem; margin: 0; font-size: .62rem; }.encounter-choices .alternate { background: #744c8b; box-shadow: 0 .2rem 0 #4c315b; }.encounter-choices label { display: grid; gap: .2rem; color: #627572; font-size: .58rem; text-transform: uppercase; }.encounter-choices select { min-height: 2rem; border: 1px solid #b99a6b; border-radius: .35rem; color: #173f43; background: #fffaf0; }
  .mosque-ability-card { display: flex; justify-content: space-between; gap: .5rem; margin-top: .7rem; padding: .65rem; border: 2px solid currentColor; border-radius: .55rem; background: #f1e5cc; }.mosque-ability-card strong { font: 700 1.1rem 'Cormorant Garamond', serif; }.mosque-ability-card span { font-size: .62rem; }.green-tile { color: #28785c; }.fabric-tile { color: #aa413c; }.spice-tile { color: #28785c; }.fruit-tile { color: #b88618; }.jewelry-tile { color: #32769d; }
  .dice-adjustments { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; margin-top: .6rem; }.dice-adjustments .turn-action, .dice-adjustments .skip-link { margin: 0; }.dice-adjustments .alternate { background: #a23b36; box-shadow: 0 .25rem 0 #6d2523; }
  .mosque-offers { display: grid; grid-template-columns: 1fr; gap: .5rem; margin-top: .65rem; }.mosque-offers article { min-width: 0; display: grid; grid-template-columns: minmax(5.5rem, 38%) 1fr; grid-template-rows: auto auto 1fr auto; gap: .25rem .65rem; padding: .55rem; border: 2px solid currentColor; border-radius: .55rem; background: #f1e5cc; }:global(.mosque-tile-art) { grid-row: 1 / 5; width: 100%; aspect-ratio: 1; border-radius: .45rem; box-shadow: 0 .35rem .55rem #4b2c2244; }.mosque-offers article > span { font-size: .58rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }.mosque-offers article > strong { font: 700 1.05rem 'Cormorant Garamond', serif; }.mosque-offers article > small { min-height: 2.4rem; color: #526b68; font-size: .57rem; }.mosque-offers article > b { padding: .45rem; border-radius: .35rem; color: #fffaf0; text-align: center; background: currentColor; font-size: .62rem; }.mosque-offers .turn-action { margin-top: auto; font-size: .6rem; }
  .yellow-recall { display: grid; grid-template-columns: 4.4rem 1fr; gap: .4rem .65rem; align-items: center; margin-top: .7rem; padding: .55rem; border: 2px solid #b88618; border-radius: .55rem; color: #173f43; background: linear-gradient(115deg, #f6e7b3, #f1e5cc); box-shadow: inset 0 0 0 1px #fff7d6; }.yellow-recall :global(.yellow-power-art) { grid-row: 1 / 3; width: 4.4rem; height: 4.4rem; border-radius: .42rem; box-shadow: 0 .25rem .45rem #4b2c2255; }.yellow-recall-copy { display: grid; gap: .15rem; }.yellow-recall strong { color: #9a7115; font: 700 1.1rem 'Cormorant Garamond', serif; }.yellow-recall span { font-size: .6rem; }.yellow-recall-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .3rem; }.yellow-recall .turn-action { min-height: 2.2rem; margin: 0; padding: .35rem; font-size: .62rem; }
  .private-choice-callout { display: grid; grid-template-columns: 2.25rem 1fr; gap: .2rem .6rem; align-items: center; margin-top: .65rem; padding: .6rem; border: 2px solid #744c8b; border-radius: .55rem; background: #eee4f2; }.private-choice-callout :global(.private-card-back) { grid-row: 1 / 3; width: 2.25rem; }.private-choice-callout strong { color: #633f76; font: 700 1.05rem 'Cormorant Garamond', serif; }.private-choice-callout span { color: #526b68; font-size: .62rem; }
  .mobile-card-text { display: none; }
  .player-rail { display: grid; grid-template-columns: repeat(var(--players, 2), minmax(0, 1fr)); grid-auto-flow: column; gap: .5rem; }
  .player-rail article { position: relative; min-width: 0; overflow: hidden; padding: 0; border: 1px solid rgb(239 202 125 / 55%); border-radius: .65rem; color: #fffaf0; background: #24170f; }.player-rail article.local { outline: 2px solid #e7b64c; outline-offset: -2px; }
  .player-rail.many { grid-template-columns: repeat(var(--players, 2), minmax(11rem, 1fr)); overflow-x: auto; }
  @media (min-width: 721px) {
    .inspector.decision { padding: .7rem; }
    .inspector.decision h2 { margin: .1rem 0 .35rem; font-size: 1.55rem; }
    .inspector.decision > p:not(.section-kicker) { margin: .35rem 0; line-height: 1.25; }
    .inspector.decision .mosque-offers { grid-template-columns: 1fr 1fr; gap: .35rem; margin-top: .35rem; }
    .inspector.decision .mosque-offers article { grid-template-columns: 4.4rem 1fr; grid-template-rows: auto auto 1fr auto; gap: .15rem .35rem; padding: .35rem; }
    .inspector.decision .mosque-offers article > small { min-height: 0; }
    .inspector.decision .mosque-offers .turn-action { min-height: 2.25rem; padding: .35rem; }
    .inspector.decision .encounter-choices { gap: .35rem; margin-top: .35rem; }
    .inspector.decision .encounter-choices section { gap: .2rem; padding: .35rem; }
  }
  @media (min-width: 721px) and (max-width: 960px) {
    .player-rail article { min-width: 0; }
    .inspector.route-planner { padding: .65rem; }
    .inspector.route-planner > p:not(.section-kicker) { margin: .35rem 0; font-size: .72rem; line-height: 1.2; }
    .inspector.route-planner .encounter-ledger { gap: .25rem; margin-top: .45rem; }
    .inspector.route-planner .supply-ledger { margin-top: .3rem !important; }
    .inspector.route-planner dl div { padding: .25rem 0; }
    .inspector:has([data-testid="place-inspector-title"]) { padding: .65rem; }
    .inspector:has([data-testid="place-inspector-title"]) > .inspector-glyph { width: 3.25rem; height: 3.25rem; }
    .inspector:has([data-testid="place-inspector-title"]) > p:not(.section-kicker) { margin: .35rem 0; line-height: 1.2; }
    .inspector:has([data-testid="place-inspector-title"]) > dl { display: flex; gap: 1rem; margin: .35rem 0; }
    .inspector:has([data-testid="place-inspector-title"]) > dl div { padding: .2rem 0; border: 0; }
    .inspector:has([data-testid="place-inspector-title"]) > .turn-action { min-height: 2.75rem; margin-top: .35rem; }
    .inspector.decision > .inspector-glyph { display: none; }
  }
  @media (max-width: 720px) {
    .inspector .next-route-cost { grid-column: 1 / -1; margin-top: .2rem; }
    .game-table { gap: .4rem; }
    .game-table.table-layout { display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: auto minmax(0, 1fr) auto auto; gap: .3rem; }
    .table-layout .turn-banner { grid-column: 1 / 3; grid-row: 1; }
    .table-layout .board-shell { grid-column: 1 / 3; grid-row: 2; }
    .table-layout .inspector { grid-column: 1 / 3; grid-row: 3; }
    .table-layout .player-rail, .table-layout .player-rail.many { grid-column: 1 / 3; grid-row: 4; grid-template-columns: repeat(var(--players, 2), minmax(0, 1fr)); grid-auto-flow: row; grid-auto-rows: auto; overflow: hidden; }
    .table-layout .player-rail article { aspect-ratio: 1; }
    .tabletop-strip { display: none; }
    .game-table.display-only .play-area { grid-template-columns: 1fr; }
    .turn-banner { min-height: 3.4rem; padding: .35rem .6rem; }.turn-banner h1 { font-size: 1.45rem; }.turn-token { font-size: .7rem; }.turn-token small { font-size: .55rem; }
    .play-area { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; gap: .4rem; }
    .play-area:has(.inspector.decision) { grid-template-rows: auto minmax(0, 1fr); }
    .play-area:has(.inspector.decision) .board-shell { display: none; }
    .play-area.mobile-board-open:has(.inspector.decision) .board-shell { display: flex; }
    .play-area.mobile-board-open:has(.inspector.decision) .inspector { display: none; }
    .mobile-view-switch { grid-column: 1; display: grid; grid-template-columns: 1fr 1fr; gap: .25rem; padding: .2rem; border: 1px solid #efca7d66; border-radius: .65rem; background: #0b292c; }.mobile-view-switch button { min-height: 2.2rem; border: 0; border-radius: .45rem; color: #bdd0ca; background: transparent; font-size: .68rem; font-weight: 700; }.mobile-view-switch button.active { color: #173f43; background: #efca7d; }
    .board-viewport { padding: 2.1rem .4rem .35rem; }.board { --board-ratio: 1.18; --board-limit: 100%; gap: .25rem; }.game-table.many .board { --board-ratio: 1.42; }
    .inspector { min-height: 5.5rem; max-height: none; display: grid; grid-template-columns: auto 1fr; gap: .2rem .7rem; align-content: start; padding: .55rem .7rem; }.inspector .section-kicker, .inspector h2, .inspector > p { grid-column: 2; }.inspector h2 { margin: 0; font-size: 1.35rem; }.inspector > p:not(.section-kicker) { margin: 0; font-size: .65rem; }.inspector-glyph { grid-column: 1; grid-row: 1 / 4; width: 3rem; height: 3rem; }.inspector dl { grid-column: 1 / -1; display: flex; gap: .8rem; margin: 0; }.inspector dl div { padding: .15rem 0; border: 0; font-size: .55rem; }.inspector .turn-action, .inspector .skip-link, .inspector .wheelbarrow-track, .inspector .crate-track, .inspector .recall-list, .inspector .action-balance, .inspector .mail-track, .inspector .caravan-sources, .inspector .card-preview, .inspector .discard-choice, .inspector .demand-card, .inspector .market-revenue, .inspector .basic-good-choice, .inspector .wager-control, .inspector .dice-result, .inspector .encounter-choices, .inspector .encounter-history, .inspector .mosque-ability-card, .inspector .dice-adjustments, .inspector .mosque-offers, .inspector .yellow-recall, .inspector .turn-log, .inspector .turn-completion-actions { grid-column: 1 / -1; margin-top: .2rem; }.inspector .turn-action { min-height: 2.75rem; }.inspector .skip-link { min-height: 2.75rem; }.recall-list { grid-template-columns: 1fr 1fr; }.encounter-ledger, .supply-ledger { display: none; }.inspector :global(.large-card) { grid-column: 1; grid-row: 1 / 5; width: 5.1rem; min-height: 0; padding: .35rem; display: flex; }.mobile-card-text { display: none; }.encounter-choices { grid-template-columns: 1fr 1fr; }.encounter-choices section { padding: .4rem; }.encounter-choices section > div { grid-template-columns: 1fr; }.mosque-offers article > small { min-height: auto; }.dice-adjustments { grid-template-columns: 1fr 1fr; }
    .inspector:has(.turn-log) { gap: .02rem .35rem; padding: .14rem .4rem; }.inspector:has(.turn-log) > p:not(.section-kicker) { display: none; }.inspector:has(.turn-log) > .section-kicker { font-size: .52rem; }.inspector:has(.turn-log) > h2 { font-size: 1.05rem; }.inspector:has(.turn-log) .turn-log { gap: .06rem; margin: .04rem 0; }.inspector:has(.turn-log) .turn-log li { grid-template-columns: 1.25rem minmax(0, 1fr) auto; gap: 0 .25rem; padding: .04rem .22rem; }.inspector:has(.turn-log) .turn-log li > span { font-size: .45rem; }.inspector:has(.turn-log) .turn-log strong { font-size: .56rem; }.inspector:has(.turn-log) .turn-log small, .inspector:has(.turn-log) .turn-log em { font-size: .42rem; }.inspector:has(.turn-log) .turn-completion-actions { gap: .25rem; }.inspector:has(.turn-log) .turn-action, .inspector:has(.turn-log) .undo-turn { min-height: 1.45rem; margin: 0; padding: .1rem; font-size: .54rem; }.inspector:has(.turn-log) .dice-result { margin-top: .02rem; }.inspector:has(.turn-log) .dice-result span { width: 1.35rem; height: 1.35rem; font-size: .8rem; }
    .inspector:has(:global(.public-card-detail)) { grid-template-columns: 3rem minmax(0, 1fr); grid-template-rows: auto auto 1fr auto; align-content: start; padding: .35rem; }
    .inspector:has(:global(.public-card-detail)) > .section-kicker { grid-column: 2; grid-row: 1; }
    .inspector:has(:global(.public-card-detail)) > h2 { grid-column: 2; grid-row: 2; min-width: 0; }
    .inspector:has(:global(.public-card-detail)) > .mobile-card-text { grid-column: 2; grid-row: 3; }
    .inspector:has(:global(.public-card-detail)) > :global(.public-card-detail) { grid-column: 1; grid-row: 1 / 4; width: 3rem; min-height: 0; }
    .inspector:has(:global(.public-card-detail)) > .pile-source-note { grid-column: 1 / -1; grid-row: 4; margin-top: .15rem; }
    .inspector:has(:global([data-testid="illustrated-bonus-card"])) { grid-template-columns: 2.8rem minmax(0, 1fr); grid-template-rows: auto auto auto; align-content: start; padding: .25rem; }.inspector:has(:global([data-testid="illustrated-bonus-card"])) > .section-kicker, .inspector:has(:global([data-testid="illustrated-bonus-card"])) > h2, .inspector:has(:global([data-testid="illustrated-bonus-card"])) > .mobile-card-text { grid-column: 2; }.inspector:has(:global([data-testid="illustrated-bonus-card"])) > h2 { font-size: 1.1rem; line-height: 1; }.inspector:has(:global([data-testid="illustrated-bonus-card"])) > :global([data-testid="illustrated-bonus-card"]) { grid-column: 1; grid-row: 1 / 4; width: 2.8rem; }.inspector:has(:global([data-testid="illustrated-bonus-card"])) > .bonus-play, .inspector:has(:global([data-testid="illustrated-bonus-card"])) > .waiting-copy { grid-column: 1 / -1; margin-top: .05rem; }.inspector:has(:global([data-testid="illustrated-bonus-card"])) > .bonus-play .turn-action { min-height: 2.35rem; margin-top: .05rem; padding: .25rem; }
    .inspector:has([data-testid="place-inspector-title"]) { height: 8rem; max-height: 8rem; grid-template-columns: 2.75rem minmax(0, 1fr); grid-template-rows: auto auto 1fr auto; align-content: start; padding: .3rem; }.inspector:has([data-testid="place-inspector-title"]) > .inspector-glyph { width: 2.75rem; height: 2.75rem; }.inspector:has([data-testid="place-inspector-title"]) > .section-kicker, .inspector:has([data-testid="place-inspector-title"]) > h2, .inspector:has([data-testid="place-inspector-title"]) > p { grid-column: 2; }.inspector:has([data-testid="place-inspector-title"]) > p { overflow: hidden; font-size: .52rem; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }.inspector:has([data-testid="place-inspector-title"]) > dl { display: none; }.inspector:has([data-testid="place-inspector-title"]) > .next-route-cost, .inspector:has([data-testid="place-inspector-title"]) > .turn-action, .inspector:has([data-testid="place-inspector-title"]) > .route-warning { grid-column: 1 / -1; }.inspector:has([data-testid="place-inspector-title"]) > .next-route-cost { min-height: 1.25rem; grid-template-columns: 1fr auto; align-items: center; margin: .05rem 0; padding: .08rem .3rem; }.inspector:has([data-testid="place-inspector-title"]) > .next-route-cost small { grid-column: 1 / -1; }.inspector:has([data-testid="place-inspector-title"]) > .turn-action { min-height: 2.75rem; margin-top: .05rem; padding: .15rem; }
    .inspector.route-planner { position: relative; display: block; height: 8rem; max-height: 8rem; padding: 0; }.route-planner .section-kicker { position: absolute; top: .55rem; left: 1.4rem; margin: 0; }.route-planner h2 { position: absolute; top: 1.45rem; left: 1.4rem; margin: 0; }.route-planner > p:not(.section-kicker) { position: absolute; top: 3.15rem; right: .7rem; left: 1.4rem; margin: 0; line-height: .82rem; }.route-planner .supply-ledger { position: absolute; right: .7rem; bottom: .45rem; left: .7rem; display: flex; justify-content: space-between; margin: 0 !important; }
    .inspector.route-planner:has(.yellow-recall) { height: 9rem; max-height: 9rem; padding: .4rem; }.route-planner:has(.yellow-recall) > .section-kicker, .route-planner:has(.yellow-recall) > h2, .route-planner:has(.yellow-recall) > p, .route-planner:has(.yellow-recall) > .encounter-ledger, .route-planner:has(.yellow-recall) > .supply-ledger { display: none; }.route-planner .yellow-recall { height: 100%; grid-template-columns: 4.5rem minmax(0, 1fr); grid-template-rows: auto 1fr; margin: 0; padding: .35rem; }.route-planner .yellow-recall :global(.yellow-power-art) { width: 4.5rem; height: 4.5rem; }.route-planner .yellow-recall-actions { align-content: start; }.route-planner .yellow-recall .turn-action { min-height: 2.35rem; }
    .inspector.decision:has(.encounter-choices) { gap: .08rem .4rem; padding: .25rem .4rem; }.inspector.decision:has(.encounter-choices) > p:not(.section-kicker) { display: none; }.inspector.decision:has(.encounter-choices) h2 { font-size: 1.15rem; }
    .inspector.decision:has(.dice-adjustments) > p:not(.section-kicker), .inspector.decision:has(:global(.tea-house-payoffs.panel)) > p:not(.section-kicker) { display: none; }.inspector.decision:has(.dice-adjustments) .dice-result { margin-top: .08rem; }.inspector.decision:has(.dice-adjustments) .dice-result span { width: 1.45rem; height: 1.45rem; font-size: .8rem; }.inspector.decision:has(.dice-adjustments) .dice-adjustments { gap: .2rem; margin-top: .08rem; }.inspector.decision:has(.dice-adjustments) .dice-adjustments .turn-action, .inspector.decision:has(.dice-adjustments) .dice-adjustments .skip-link { min-height: 1.65rem; padding: .16rem; }
    .inspector.decision:has(.caravan-sources) { padding-block: .35rem; }.inspector.decision:has(.caravan-sources) > p:not(.section-kicker), .inspector.decision:has(.caravan-sources) > .inspector-glyph { display: none; }.inspector.decision:has(.caravan-sources) > .section-kicker, .inspector.decision:has(.caravan-sources) > h2 { grid-column: 1 / -1; }.inspector.decision:has(.caravan-sources) .caravan-sources { margin-top: .02rem; }.inspector.decision:has(.caravan-sources) .caravan-sources select { min-height: 1.5rem; }.inspector.decision:has(.caravan-sources) .source-card { height: 2.05rem; margin-top: .04rem; }.inspector.decision:has(.caravan-sources) .revealed-cards span { grid-template-columns: .8rem 1fr; padding: .08rem; }.inspector.decision:has(.caravan-sources) .revealed-cards :global(.revealed-card-art) { width: .8rem; }.inspector.decision:has(.caravan-sources) .discard-choice { gap: .08rem; padding: .1rem; }
    .inspector.decision { align-content: center; padding: .4rem .55rem; }.inspector.decision > p:not(.section-kicker) { line-height: 1.1; }.inspector.decision .turn-action, .inspector.decision .skip-link { min-height: 2.2rem; }.inspector.decision .wager-control { margin-top: .18rem; }.inspector.decision .skip-link { min-height: 1.8rem; }.inspector.decision .encounter-choices { gap: .1rem; }.inspector.decision .encounter-choices section { gap: .06rem; padding: .1rem; }.inspector.decision .encounter-choices section > strong { font-size: .8rem; }.inspector.decision .encounter-choices section > span { display: none; }.inspector.decision .encounter-choices section[aria-label="Smuggler encounter"] { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; }.inspector.decision .encounter-choices section[aria-label="Smuggler encounter"] > strong { grid-column: 1 / -1; }.inspector.decision .encounter-choices section[aria-label="Smuggler encounter"] > div { display: contents; }.inspector.decision .encounter-choices label { gap: .04rem; font-size: .45rem; }.inspector.decision .encounter-choices select { min-height: 1.4rem; }.inspector.decision .encounter-choices .turn-action, .inspector.decision .encounter-choices .skip-link { min-height: 1.5rem; padding: .12rem; }.inspector.decision :global(.tea-house-payoffs.panel), .inspector.decision :global(.gemstone-payoffs.panel), .inspector.decision :global(.sultan-offer.panel) { height: 2.4rem; margin: .1rem 0; padding: .16rem; }.inspector.decision .mosque-offers { grid-template-columns: 1fr 1fr; gap: .3rem; }.inspector.decision .mosque-offers article { grid-template-columns: 4rem 1fr; grid-template-rows: auto auto auto; gap: .12rem .3rem; padding: .3rem; }.inspector.decision .mosque-offers :global(.mosque-tile-art) { grid-row: 1 / 4; }.inspector.decision .mosque-offers article > small { display: none; }.inspector.decision .mosque-offers article > b { padding: .2rem; }.inspector.decision .mosque-offers .turn-action { min-height: 2.2rem; }
    .player-rail { grid-auto-flow: row; grid-template-columns: 1fr 1fr; gap: .3rem; }.player-rail article { min-width: 0; }
    .player-rail.many { grid-auto-flow: row; grid-template-columns: repeat(var(--players, 2), minmax(0, 1fr)); gap: .18rem; overflow: visible; }
    .inspector.finish { display: block; padding: .85rem; }.inspector.finish .section-kicker, .inspector.finish h2, .inspector.finish > p { display: block; }.inspector.finish .final-ranking { display: grid; grid-template-columns: 1fr; }.inspector.finish .final-ranking li { display: grid; grid-template-columns: 1.5rem 1fr auto; }.inspector.finish .final-ranking li > span { grid-column: auto; }.inspector.finish .final-ranking li > small { grid-column: 2 / 4; }
  }
  @media (max-height: 500px) and (orientation: landscape) {
    .game-table { gap: .25rem; }
    .turn-banner { min-height: 2.8rem; padding: .25rem .6rem; }.turn-banner h1 { font-size: 1.25rem; }.turn-banner p { font-size: .5rem; }.turn-token { font-size: .62rem; }
    .play-area { grid-template-columns: minmax(0, 1.35fr) minmax(14rem, .65fr); gap: .3rem; }
    .board-viewport { padding: .25rem; }.board { --board-ratio: 1.42; --board-limit: 25rem; gap: .2rem; }.board-tools, .board-caption, .e2e-resources { display: none; }
    .inspector { padding: .35rem; overflow: hidden; }.inspector h2 { margin: 0; font-size: 1.15rem; }.inspector > p:not(.section-kicker) { margin: .2rem 0; font-size: .58rem; }.inspector:not(.route-planner) > p:not(.section-kicker), .inspector:not(.route-planner):not(.decision) dl { display: none; }.inspector-glyph, .encounter-ledger, .supply-ledger { display: none; }.inspector :global(.large-card) { display: flex; }.inspector .turn-action { min-height: 2.75rem; margin-top: .15rem; }.inspector.decision .mail-track { margin: .15rem 0; }.inspector.decision .mail-column i { min-height: 1.25rem; }.inspector.decision .mail-column b.lower { top: 1.65rem; }.inspector.decision .skip-link { min-height: 2.2rem; margin-top: .1rem; }
    .player-rail { grid-template-columns: repeat(2, minmax(0, 15rem)); justify-content: center; gap: .25rem; }.player-rail.many { grid-template-columns: repeat(var(--players, 2), minmax(0, 1fr)); }.player-rail article { padding: 0; }.player-rail :global(.hand), .player-rail :global(.masked-hand) { display: none; }
  }
  @media (pointer: coarse) { .turn-action, .skip-link, .board-tools button, .hand button { min-height: 2.75rem; } }
  @media (prefers-reduced-motion: reduce) { .board { transition: none; } }
</style>
