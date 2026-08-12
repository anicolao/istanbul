<script lang="ts">
  import { base } from '$app/paths';
  import { bonusCards, demandTiles, mosqueTiles, places, type Good } from '$lib/game/manifests';
  import { legalDestinations, requiredAssistantAction, type AssistantAction } from '$lib/game/movement';
  import {
    marketRevenue,
    postOfficeRows,
    previewCaravansary,
    warehouseGood,
    type CardSource,
    type PlaceActionChoice
  } from '$lib/game/actions';
  import type { EncounterChoice } from '$lib/game/encounters';
  import { ownsMosqueAbility, type MosqueAbilityChoice } from '$lib/game/mosques';
  import { currentSultanCost } from '$lib/game/ruby-routes';
  import type { BonusChoice } from '$lib/game/bonus';
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
    onMove,
    onPayMerchants,
    onTakeAction,
    onResolveEncounter,
    onUseMosqueAbility,
    onPlayBonus,
    onGrantE2eResources,
    onEndTurn,
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
    onMove: (destination: number, assistantAction: AssistantAction) => void;
    onPayMerchants: () => void;
    onTakeAction: (choice: PlaceActionChoice) => void;
    onResolveEncounter: (choice: EncounterChoice) => void;
    onUseMosqueAbility: (choice: MosqueAbilityChoice) => void;
    onPlayBonus: (cardId: string, choice: BonusChoice) => void;
    onGrantE2eResources: () => void;
    onEndTurn: () => void;
    onZoomIn: () => void;
    onFit: () => void;
  } = $props();

  const placeById = new Map(places.map((place) => [place.id, place]));
  const bonusById = new Map(bonusCards.map((card) => [card.id, card]));
  const localPlayer = $derived(game.players.find((player) => player.uid === userUid)!);
  const currentPlayer = $derived(game.players[game.turnSeat]);
  const selectedPlaceManifest = $derived(selectedPlace ? placeById.get(selectedPlace) : null);
  const selectedBonusManifest = $derived(selectedBonus ? bonusById.get(selectedBonus) : null);
  const localIsCurrent = $derived(currentPlayer.uid === userUid);
  const reachable = $derived(localIsCurrent && game.phase === 'movement' ? legalDestinations(game, localPlayer) : []);
  const selectedAssistantAction = $derived(selectedPlace && reachable.includes(selectedPlace) ? requiredAssistantAction(localPlayer, selectedPlace) : null);
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
  let flexibleGoods = $state<Good[]>(['fabric']);
  const caravanPreview = $derived(previewCaravansary(game, caravanSources) ?? []);
  const activeDemand = $derived(demandTiles.find(({ id }) => id === (actionPlace.id === 10 ? game.largeDemand[0] : game.smallDemand[0])));
  const marketSelectionLegal = $derived(isMarketSelectionLegal(activeDemand?.goods ?? [], marketSelection));
  const smugglerGainAvailable = $derived(localPlayer.goods[smugglerGood] < localPlayer.capacity);
  const sultanCost = $derived(currentSultanCost(game));
  const sultanWildCount = $derived(sultanCost.filter((good) => good === 'any').length);
  const sultanPayment = $derived((Object.keys(goodNames) as Good[]).reduce<Record<Good, number>>((totals, good) => ({
    ...totals,
    [good]: sultanCost.filter((required) => required === good).length + sultanWildGoods.filter((wild) => wild === good).length
  }), { fabric: 0, spice: 0, fruit: 0, jewelry: 0 }));
  const sultanAffordable = $derived(sultanWildGoods.length === sultanWildCount && (Object.keys(goodNames) as Good[]).every((good) => localPlayer.goods[good] >= sultanPayment[good]));

  function occupants(placeId: number) {
    return game.players.filter(({ merchantPlace }) => merchantPlace === placeId);
  }

  function assistants(placeId: number) {
    return game.players.flatMap((player) => Array.from({ length: player.assistantsByPlace[placeId] ?? 0 }, () => player));
  }

  function families(placeId: number) {
    return game.players.filter(({ familyPlace }) => familyPlace === placeId);
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
    onTakeAction({ kind: 'market-sell', slotIndexes: marketSelection });
    marketSelection = [];
  }

  function setSultanWild(index: number, good: Good) {
    sultanWildGoods = Array.from({ length: sultanWildCount }, (_, slot) => slot === index ? good : sultanWildGoods[slot] ?? 'fabric');
  }

  function setFlexibleGood(index: number, good: Good) {
    flexibleGoods = flexibleGoods.map((value, slot) => slot === index ? good : value);
  }
</script>

<section class="game-table" aria-labelledby="game-title" style={`--courtyard: url('${artUrl}')`}>
  <header class="turn-banner">
    <div><p>Turn {game.turnNumber} · {game.phase.replace('-', ' ')}</p><h1 id="game-title">{game.phase === 'movement' ? `${currentPlayer.name} surveys the bazaar.` : game.phase === 'merchant-payment' ? `${currentPlayer.name} meets another merchant.` : game.phase === 'family-action' ? `${currentPlayer.name} sends family to ${actionPlace.name}.` : game.phase === 'mosque-ability' ? `${currentPlayer.name} considers a Mosque ability.` : game.phase === 'encounters' ? `${currentPlayer.name} resolves bazaar encounters.` : game.phase === 'turn-end' ? `${currentPlayer.name} completed ${actionPlace.name}.` : `${currentPlayer.name} arrives at ${actionPlace.name}.`}</h1>{#if game.lastMovement?.paymentBlocked}<small class="turn-notice">{game.players.find((player) => player.uid === game.lastMovement?.playerUid)?.name} could not pay {game.lastMovement.paymentTotal} Lira; that turn ended immediately.</small>{/if}</div>
    <div class="turn-token"><span class={`player-dot ${currentPlayer.color}`}></span><strong>{currentPlayer.name}</strong><small>{currentPlayer.uid === userUid ? 'Your turn' : game.phase === 'movement' ? 'Planning route' : 'Resolving turn'}</small></div>
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
              class:reachable={reachable.includes(placeId)}
              class:departed={game.lastMovement?.from === placeId}
              class:arrived={game.lastMovement?.to === placeId}
              class={`place family-${place.family}`}
              style={`--row: ${Math.floor(index / 4)}; --column: ${index % 4}`}
              aria-label={`${place.id} ${place.name}. ${place.action}${reachable.includes(placeId) ? ' Reachable this turn.' : ''}${here.length ? ` Merchants: ${here.map(({ name }) => name).join(', ')}.` : ''}`}
              aria-pressed={selectedPlace === placeId}
              onclick={() => onInspectPlace(placeId)}
            >
              <span class="place-number">{place.id}</span>
              <span class="place-glyph"><PlaceGlyph glyph={place.glyph} /></span>
              <strong>{place.shortName}</strong>
              <span class="occupants" aria-hidden="true">
                {#each here as merchant}<span class={`merchant ${merchant.color}`}>{merchant.name.slice(0, 1)}</span>{/each}
                {#each assistants(placeId) as assistant}<span class={`assistant ${assistant.color}`} title={`${assistant.name}'s assistant`}>a</span>{/each}
                {#each families(placeId) as family}<span class={`family-member ${family.color}`} title={`${family.name}'s family member`}>F</span>{/each}
                {#each game.neutralMerchants.filter(({ place: neutralPlace }) => neutralPlace === placeId) as neutral}<span class="merchant neutral">N</span>{/each}
              </span>
              {#if placeId === game.governorPlace}<span class="encounter governor" title="Governor">G</span>{/if}
              {#if placeId === game.smugglerPlace}<span class="encounter smuggler" title="Smuggler">S</span>{/if}
            </button>
          {/each}
        </div>
      </div>
      <p class="board-caption">{room.layout.replace('-', ' ')} · setup seed {game.seed}</p>
      {#if import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true' && localIsCurrent && game.phase === 'movement'}<button class="e2e-resources" onclick={onGrantE2eResources}>Review ruby routes with supplied resources</button>{/if}
    </section>

    <aside class="inspector" class:route-planner={!selectedBonusManifest && game.phase === 'movement' && !selectedPlaceManifest} aria-live="polite">
      {#if selectedBonusManifest}
        <p class="section-kicker">Private Bonus card</p>
        <h2>{selectedBonusManifest.title}</h2>
        <p class="mobile-card-text">{selectedBonusManifest.text}</p>
        <div class="large-card"><span>Bonus</span><strong>{selectedBonusManifest.title}</strong><p>{selectedBonusManifest.text}</p></div>
        {#if localIsCurrent}
          <div class="bonus-play" aria-label={`Play ${selectedBonusManifest.title}`}>
            {#if selectedBonusManifest.effect === 'gain-good'}
              <label class="wager-control">Good to gain<select aria-label="Bonus good to gain" value={bonusGood} onchange={(event) => bonusGood = event.currentTarget.value as Good}>{#each Object.keys(goodNames) as good}<option value={good} disabled={localPlayer.goods[good as Good] >= localPlayer.capacity}>{goodNames[good as Good]}</option>{/each}</select></label><button class="turn-action" disabled={!['action', 'family-action', 'turn-end'].includes(game.phase) || localPlayer.goods[bonusGood] >= localPlayer.capacity} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'gain-good', good: bonusGood })}>Play to gain 1 {bonusGood}</button>
            {:else if selectedBonusManifest.effect === 'gain-lira'}
              <button class="turn-action" disabled={!['movement', 'action', 'family-action', 'turn-end'].includes(game.phase)} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'gain-lira' })}>Play to gain 5 Lira</button>
            {:else if selectedBonusManifest.effect === 'return-family'}
              <label class="wager-control">Catch reward<select aria-label="Family pardon reward" value={bonusFamilyReward} onchange={(event) => bonusFamilyReward = event.currentTarget.value as 'lira' | 'bonus'}><option value="lira">3 Lira</option><option value="bonus">1 Bonus card</option></select></label><button class="turn-action" disabled={localPlayer.familyPlace === 12 || !['movement', 'action', 'family-action', 'turn-end'].includes(game.phase)} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'return-family', reward: bonusFamilyReward })}>Return family to Police</button>
            {:else if selectedBonusManifest.effect === 'return-assistant'}
              <label class="wager-control">Assistant<select aria-label="Bonus assistant to return" value={bonusAssistantPlace} onchange={(event) => bonusAssistantPlace = Number(event.currentTarget.value)}>{#each Object.keys(localPlayer.assistantsByPlace) as placeId}<option value={placeId}>{placeById.get(Number(placeId))?.name}</option>{/each}</select></label><button class="turn-action" disabled={game.phase !== 'movement' || !Object.keys(localPlayer.assistantsByPlace).length} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'return-assistant', place: bonusAssistantPlace })}>Return selected assistant</button>
            {:else if selectedBonusManifest.effect === 'long-move'}
              <button class="turn-action" disabled={game.phase !== 'movement' || game.activeBonusEffects.includes('long-move')} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'long-move' })}>Play for a 3–4 space move</button>
            {:else if selectedBonusManifest.effect === 'stay'}
              <button class="turn-action" disabled={game.phase !== 'movement' || localPlayer.merchantPlace === 7 || !(localPlayer.assistantsByPlace[localPlayer.merchantPlace] ?? 0)} onclick={() => onPlayBonus(selectedBonusManifest.id, { kind: 'stay' })}>Stay and use this Place</button>
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
              <section aria-label="Pay the Governor"><strong>Governor payment</strong><span>The drawn card is already in your hand</span><button class="turn-action" disabled={localPlayer.lira < 2} onclick={() => onResolveEncounter({ kind: 'governor-pay', payment: 'lira' })}>Pay Governor 2 Lira</button><label>Or discard<select aria-label="Governor discard card" value={governorDiscard} onchange={(event) => governorDiscard = event.currentTarget.value}><option value="">Choose a Bonus card</option>{#each localPlayer.bonusHand as cardId}<option value={cardId}>{bonusById.get(cardId)?.title} · {cardId}</option>{/each}</select></label><button class="turn-action alternate" disabled={!governorDiscard} onclick={() => onResolveEncounter({ kind: 'governor-pay', payment: 'card', discardCardId: governorDiscard })}>Discard selected card</button></section>
            {/if}
            {#if encounterPending?.smuggler}
              <section aria-label="Smuggler encounter"><strong>Smuggler</strong><span>Gain one good, then pay 2 Lira or one good</span><label>Good to gain<select aria-label="Smuggler good to gain" value={smugglerGood} onchange={(event) => smugglerGood = event.currentTarget.value as Good}>{#each Object.keys(goodNames) as good}<option value={good} disabled={localPlayer.goods[good as Good] >= localPlayer.capacity}>{goodNames[good as Good]}</option>{/each}</select></label><div><button class="turn-action" disabled={!smugglerGainAvailable || localPlayer.lira < 2} onclick={() => onResolveEncounter({ kind: 'smuggler-trade', accept: true, good: smugglerGood, payment: 'lira' })}>Take {smugglerGood}, pay 2 Lira</button><button class="skip-link" onclick={() => onResolveEncounter({ kind: 'smuggler-trade', accept: false })}>Decline Smuggler</button></div><label>Or pay a good<select aria-label="Smuggler payment good" value={smugglerPaymentGood} onchange={(event) => smugglerPaymentGood = event.currentTarget.value as Good}>{#each Object.keys(goodNames) as good}<option value={good} disabled={localPlayer.goods[good as Good] + (good === smugglerGood ? 1 : 0) < 1}>{goodNames[good as Good]}</option>{/each}</select></label><button class="turn-action alternate" disabled={!smugglerGainAvailable} onclick={() => onResolveEncounter({ kind: 'smuggler-trade', accept: true, good: smugglerGood, payment: 'good', paymentGood: smugglerPaymentGood })}>Take {smugglerGood}, pay {smugglerPaymentGood}</button></section>
            {/if}
          </div>
        {:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to order the encounters.</p>{/if}
      {:else if game.phase === 'turn-end'}
        <p class="section-kicker">Place action complete</p>
        <h2>{actionPlace.name}</h2>
        <div class="inspector-glyph complete-glyph"><PlaceGlyph glyph={actionPlace.glyph} /></div>
        <p>{game.lastAction?.summary}</p>
        {#if game.lastRoll?.playerUid === currentPlayer.uid && game.lastRoll.place === actionPlace.id}<div class="dice-result" aria-label={`Dice result ${game.lastRoll.dice[0]} and ${game.lastRoll.dice[1]}`}><span>{game.lastRoll.dice[0]}</span><span>{game.lastRoll.dice[1]}</span><strong>{game.lastRoll.reward} {actionPlace.id === 8 ? 'jewelry' : 'Lira'}</strong></div>{/if}
        {#if game.encounterLog.length}<div class="encounter-history" aria-label="Resolved encounters">{#each game.encounterLog as entry}<article><strong>{entry.kind.replace('-', ' ')}</strong><span>{entry.summary}</span>{#if entry.dice}<i aria-label={`Encounter dice ${entry.dice[0]} and ${entry.dice[1]}`}>{entry.dice[0]} + {entry.dice[1]}</i>{/if}</article>{/each}</div>{/if}
        {#if localIsCurrent}<button class="turn-action" onclick={onEndTurn}>End turn and pass clockwise</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to end the completed turn.</p>{/if}
      {:else if game.phase === 'action' || game.phase === 'family-action'}
        <p class="section-kicker">Place action ready</p>
        <h2>{actionPlace.name}</h2>
        <div class="inspector-glyph"><PlaceGlyph glyph={actionPlace.glyph} /></div>
        {#if actionPlace.id === 1}
          <p>Pay 7 Lira to expand every goods track by one space. Completing all three extensions also claims a ruby.</p>
          <div class="wheelbarrow-track" aria-label={`${currentPlayer.extensions} of 3 wheelbarrow extensions`}><span class:filled={currentPlayer.extensions >= 1}></span><span class:filled={currentPlayer.extensions >= 2}></span><span class:filled={currentPlayer.extensions >= 3}></span></div>
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
                <i class:covered={!game.postOfficeLower[index]}>{rows[0].lira ? `${rows[0].lira}₺` : goodNames[rows[0].good!].slice(0, 1)}</i>
                <b aria-hidden="true" class:lower={game.postOfficeLower[index]}></b>
                <i class:covered={game.postOfficeLower[index]}>{rows[1].lira ? `${rows[1].lira}₺` : goodNames[rows[1].good!].slice(0, 1)}</i>
              </span>
            {/each}
          </div>
          {#if localIsCurrent}<button class="turn-action" onclick={() => onTakeAction({ kind: 'post-office-collect' })}>Collect uncovered mail resources</button><button class="skip-link" onclick={onEndTurn}>Skip Post Office and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to collect the mail route.</p>{/if}
        {:else if actionPlace.id === 6}
          <p>Take two Bonus cards from the deck or the face-up discard pile, then discard any one card from your hand.</p>
          {#if localIsCurrent}
            <div class="caravan-sources">
              {#each [0, 1] as index}
                <label>Card {index + 1}<select aria-label={`${index === 0 ? 'First' : 'Second'} card source`} value={caravanSources[index]} onchange={(event) => setCaravanSource(index as 0 | 1, event.currentTarget.value as CardSource)}><option value="deck">Draw pile</option><option value="discard" disabled={game.bonusDiscard.length < (caravanSources.slice(0, index).filter((source) => source === 'discard').length + 1)}>Discard pile</option></select></label>
              {/each}
            </div>
            <p class="card-preview" aria-live="polite">Preview: {caravanPreview.map((id) => bonusById.get(id)?.title).join(' · ') || 'That source is empty'}</p>
            <fieldset class="discard-choice"><legend>Discard one</legend>{#each [...localPlayer.bonusHand, ...caravanPreview] as cardId}<label><input type="radio" name="caravan-discard" value={cardId} aria-label={`${bonusById.get(cardId)?.title} · ${cardId}`} checked={caravanDiscardSelection === cardId} onchange={() => caravanDiscardSelection = cardId} /><span>{bonusById.get(cardId)?.title}</span></label>{/each}</fieldset>
            <button class="turn-action" disabled={caravanPreview.length !== 2 || !caravanDiscardSelection} onclick={() => onTakeAction({ kind: 'caravansary-trade', drawSources: caravanSources, discardCardId: caravanDiscardSelection })}>Keep two cards and discard selected</button><button class="skip-link" onclick={onEndTurn}>Skip Caravansary and end turn</button>
          {:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to manage a private Bonus hand.</p>{/if}
        {:else if actionPlace.id === 10 || actionPlace.id === 11}
          <p>Select one to five depicted goods you own. Revenue rises from 2 to 20 Lira, then this Demand rotates.</p>
          <div class="demand-card" aria-label={`${actionPlace.name} demand ${activeDemand?.id}`}>
            {#each activeDemand?.goods ?? [] as good, index}<label class={good}><input type="checkbox" aria-label={`Sell demand slot ${index + 1}: ${good}`} checked={marketSelection.includes(index)} onchange={() => toggleMarketSlot(index)} /><i></i><span>{goodNames[good]}</span></label>{/each}
          </div>
          {#if actionPlace.id === 11 && game.activeBonusEffects.includes('wild-small-market')}
            <label class="wager-control">Flexible sale size<select aria-label="Flexible sale size" value={flexibleGoods.length} onchange={(event) => flexibleGoods = Array.from({ length: Number(event.currentTarget.value) }, (_, index) => flexibleGoods[index] ?? 'fabric')}>{#each [1, 2, 3, 4, 5] as count}<option value={count}>{count} good{count === 1 ? '' : 's'} · {marketRevenue[count]} Lira</option>{/each}</select></label>
            {#each flexibleGoods as good, index}<label class="wager-control">Flexible good {index + 1}<select aria-label={`Flexible good ${index + 1}`} value={good} onchange={(event) => setFlexibleGood(index, event.currentTarget.value as Good)}>{#each Object.keys(goodNames) as option}<option value={option}>{goodNames[option as Good]}</option>{/each}</select></label>{/each}
            {#if localIsCurrent}<button class="turn-action" disabled={!((Object.keys(goodNames) as Good[]).every((good) => flexibleGoods.filter((value) => value === good).length <= localPlayer.goods[good]))} onclick={() => onTakeAction({ kind: 'market-sell', slotIndexes: [], wildGoods: flexibleGoods })}>Sell any {flexibleGoods.length} goods for {marketRevenue[flexibleGoods.length]} Lira</button>{/if}
          {:else}
            <p class="market-revenue">{marketSelection.length ? `${marketSelection.length} selected · ${marketRevenue[marketSelection.length]} Lira` : 'Select goods to sell'}</p>
            {#if localIsCurrent}<button class="turn-action" disabled={!marketSelectionLegal} onclick={sellMarket}>Sell selected goods for {marketRevenue[marketSelection.length]} Lira</button>{/if}
          {/if}
          {#if localIsCurrent}<button class="skip-link" onclick={onEndTurn}>Skip market and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose a sale.</p>{/if}
        {:else if actionPlace.id === 8}
          <p>Choose one basic good, then roll two deterministic dice for zero to three jewelry.</p>
          <fieldset class="basic-good-choice"><legend>Basic good</legend>{#each ['fabric', 'spice', 'fruit'] as good}<label class={good}><input type="radio" name="black-market-good" value={good} checked={blackMarketGood === good} onchange={() => blackMarketGood = good as Exclude<Good, 'jewelry'>} /><i></i><span>{goodNames[good as Good]}</span></label>{/each}</fieldset>
          {#if localIsCurrent}<button class="turn-action" onclick={() => onTakeAction({ kind: 'black-market-roll', good: blackMarketGood })}>Take {blackMarketGood} and roll both dice</button><button class="skip-link" onclick={onEndTurn}>Skip Black Market and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose a basic good.</p>{/if}
        {:else if actionPlace.id === 9}
          <p>Declare 3–12, then roll. Meet or beat the wager to earn it; otherwise receive 2 Lira.</p>
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
              <article class={`${color}-tile`}><span>{mosqueColorNames[color]}</span>{#if tile}<strong>{tile.required} {goodNames[color]}</strong><small>{tile.ability}</small>{:else}<strong>Stack empty</strong>{/if}{#if ownsMosqueAbility(currentPlayer, color)}<b>Owned</b>{:else if tile && localIsCurrent}<button class="turn-action" disabled={localPlayer.goods[color] < tile.required} onclick={() => onTakeAction({ kind: 'mosque-take', tileId: tile.id })}>Pay 1 {color} for {mosqueColorNames[color]} tile</button>{/if}</article>
            {/each}
          </div>
          {#if localIsCurrent}<button class="skip-link" onclick={onEndTurn}>Skip Mosque and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to choose a Mosque tile.</p>{/if}
        {:else if actionPlace.id === 13}
          <p>Deliver every uncovered good to claim the next Palace ruby. Each purchase reveals one additional requirement.</p>
          <div class="ruby-route" aria-label="Sultan's Palace ruby track"><div><span>Ruby available</span><strong>{game.rubyTracks.sultanRubies}</strong></div><div><span>Goods due</span><strong>{sultanCost.length}</strong></div></div>
          <div class="sultan-cost" aria-label="Current Sultan goods cost">{#each sultanCost as good}<span class={`good ${good === 'any' ? 'any' : good}`} title={good === 'any' ? 'Any good' : goodNames[good]}><i></i>{good === 'any' ? 'Any' : goodNames[good]}</span>{/each}</div>
          {#if localIsCurrent}
            {#each Array.from({ length: sultanWildCount }) as _, index}<label class="wager-control">Wild good {index + 1}<select aria-label={`Sultan wild good ${index + 1}`} value={sultanWildGoods[index] ?? 'fabric'} onchange={(event) => setSultanWild(index, event.currentTarget.value as Good)}>{#each Object.keys(goodNames) as good}<option value={good}>{goodNames[good as Good]}</option>{/each}</select></label>{/each}
            <button class="turn-action" disabled={!sultanAffordable || game.rubyTracks.sultanRubies < 1} onclick={() => onTakeAction({ kind: 'sultan-buy', wildGoods: sultanWildGoods })}>Deliver {sultanCost.length} goods for 1 ruby</button><button class="skip-link" onclick={onEndTurn}>Skip Sultan's Palace and end turn</button>
          {:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to deliver goods.</p>{/if}
        {:else if actionPlace.id === 16}
          <p>Pay the greatest uncovered price to claim the next Dealer ruby. The price rises by one after every purchase.</p>
          <div class="ruby-route" aria-label="Gemstone Dealer ruby track"><div><span>Current price</span><strong>{game.rubyTracks.gemstonePrice} Lira</strong></div><div><span>Rubies available</span><strong>{game.rubyTracks.gemstoneRubies}</strong></div></div>
          {#if localIsCurrent}<button class="turn-action" disabled={localPlayer.lira < game.rubyTracks.gemstonePrice || game.rubyTracks.gemstoneRubies < 1} onclick={() => onTakeAction({ kind: 'gemstone-buy' })}>Pay {game.rubyTracks.gemstonePrice} Lira for 1 ruby</button><button class="skip-link" onclick={onEndTurn}>Skip Gemstone Dealer and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to buy or pass.</p>{/if}
        {:else}
          <p>{actionPlace.action}</p>
          {#if localIsCurrent}<button class="turn-action secondary-action" onclick={onEndTurn}>Skip this Place action and end turn</button>{:else}<p class="waiting-copy">Waiting for {currentPlayer.name} to finish the Place action.</p>{/if}
        {/if}
      {:else if selectedPlaceManifest}
        <p class="section-kicker">Place {selectedPlaceManifest.id}</p>
        <h2>{selectedPlaceManifest.name}</h2>
        <div class="inspector-glyph"><PlaceGlyph glyph={selectedPlaceManifest.glyph} /></div>
        <p>{selectedPlaceManifest.action}</p>
        <dl><div><dt>Grid position</dt><dd>Row {Math.floor(game.board.indexOf(selectedPlaceManifest.id) / 4) + 1}, column {(game.board.indexOf(selectedPlaceManifest.id) % 4) + 1}</dd></div><div><dt>Merchants here</dt><dd>{occupants(selectedPlaceManifest.id).map(({ name }) => name).join(', ') || 'None'}</dd></div></dl>
        {#if selectedAssistantAction}<button class="turn-action" onclick={() => onMove(selectedPlaceManifest.id, selectedAssistantAction)}>{selectedAssistantAction === 'pick-up' ? 'Move here and pick up assistant' : selectedAssistantAction === 'fountain' ? 'Move here without leaving an assistant' : 'Move here and leave an assistant'}</button>{:else if localIsCurrent}<p class="route-warning">This Place is not one or two orthogonal spaces away.</p>{/if}
      {:else}
        <p class="section-kicker">Route planner</p>
        <h2>Inspect any Place</h2>
        <p>Select a tile to read its action, exact grid position, and current occupants. Reachable routes are highlighted for the active merchant.</p>
        <div class="encounter-ledger"><span><i class="governor">G</i> Governor at {game.governorPlace}</span><span><i class="smuggler">S</i> Smuggler at {game.smugglerPlace}</span></div>
        {#if localIsCurrent && ownsMosqueAbility(localPlayer, 'fruit') && !game.abilitiesUsedThisTurn.includes('fruit') && Object.keys(localPlayer.assistantsByPlace).length}<div class="yellow-recall" aria-label="Yellow Mosque recall"><strong>Yellow Mosque ability</strong><span>Pay 2 Lira to recall one assistant before moving.</span>{#each Object.keys(localPlayer.assistantsByPlace) as placeId}<button class="turn-action" disabled={localPlayer.lira < 2} onclick={() => onUseMosqueAbility({ kind: 'yellow-recall', place: Number(placeId) })}>Recall from {placeById.get(Number(placeId))?.name} for 2 Lira</button>{/each}</div>{/if}
        <dl class="supply-ledger" aria-label="Public component supply">
          <div><dt>Bonus draw pile</dt><dd>{game.bonusDrawPile.length}</dd></div>
          <div><dt>Mosque tiles</dt><dd>{Object.values(game.mosqueStacks).flat().length}</dd></div>
          <div><dt>Market demands</dt><dd>{game.largeDemand.length + game.smallDemand.length}</dd></div>
          <div><dt>Wheelbarrow extensions</dt><dd>{game.supplies.wheelbarrowExtensions}</dd></div>
          <div><dt>Ruby supply</dt><dd>{game.supplies.wainwrightRubies + game.supplies.smallMosqueRubies + game.supplies.greatMosqueRubies + game.rubyTracks.sultanRubies + game.rubyTracks.gemstoneRubies}</dd></div>
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
        {#if player.mosqueTileIds.length}<div class="mosque-badges" aria-label={`${player.name} Mosque tiles`}>{#each player.mosqueTileIds as tileId}{@const tile = mosqueTiles.find(({ id }) => id === tileId)!}<span class={`${tile.color}-tile`} title={tile.ability}>{mosqueColorNames[tile.color]}</span>{/each}</div>{/if}
        {#if player.uid === userUid}
          <div class="hand"><span>Private hand</span>{#each player.bonusHand as cardId}<button aria-label={`Inspect Bonus card: ${bonusById.get(cardId)?.title}`} aria-pressed={selectedBonus === cardId} onclick={() => onInspectBonus(cardId)}><small>Bonus</small><strong>{bonusById.get(cardId)?.title}</strong></button>{/each}</div>
        {:else}<p class="masked-hand">Bonus hand · {player.bonusHand.length} hidden card{player.bonusHand.length === 1 ? '' : 's'}</p>{/if}
      </article>
    {/each}
  </section>
</section>

<style>
  .game-table { height: 100%; min-height: 0; display: flex; flex-direction: column; gap: .65rem; color: #fffaf0; }
  .turn-banner { min-height: 4.4rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .55rem 1.1rem; border: 1px solid rgb(239 202 125 / 35%); border-radius: 1rem; background: linear-gradient(100deg, rgb(13 48 51 / 96%), rgb(28 76 75 / 92%)); box-shadow: 0 .8rem 2rem rgb(35 21 9 / 22%); }
  .turn-banner p, .section-kicker { margin: 0; color: #efca7d; font-size: .68rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
  .turn-banner h1 { margin: .1rem 0 0; font: 700 clamp(1.65rem, 3vw, 2.5rem)/.95 'Cormorant Garamond', serif; }
  .turn-notice { display: block; margin-top: .2rem; color: #ffd2a4; font-size: .68rem; }
  .turn-token { display: grid; grid-template-columns: 1.8rem auto; gap: 0 .55rem; align-items: center; }
  .turn-token .player-dot { grid-row: 1 / 3; }
  .turn-token small { color: #bdd0ca; }
  .player-dot { width: 1.7rem; height: 1.7rem; display: inline-block; border: 3px solid #f0cd80; border-radius: 50%; box-shadow: inset 0 0 0 2px #fffaf0; }
  .ruby { background: #a63e3a; }.saffron { background: #c98c28; }.teal { background: #28796f; }.indigo { background: #43588f; }.plum { background: #73466e; }
  .ruby-route { display: grid; grid-template-columns: repeat(2, 1fr); gap: .5rem; margin: .9rem 0; }
  .ruby-route div { display: grid; gap: .1rem; padding: .75rem; border: 1px solid #d9bd7b; border-radius: .7rem; background: #f5e6bd; }
  .ruby-route span { color: #55706f; font-size: .66rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
  .ruby-route strong { color: #a43d43; font: 700 1.35rem/1 'Cormorant Garamond', serif; }
  .sultan-cost { display: flex; flex-wrap: wrap; gap: .35rem; margin: .75rem 0; }
  .sultan-cost .good { min-width: 4.4rem; display: flex; align-items: center; gap: .3rem; padding: .4rem .5rem; border: 1px solid #d7c49c; border-radius: .45rem; color: #173f43; background: #fffaf0; font-size: .72rem; font-weight: 700; }
  .sultan-cost .good i { width: .75rem; height: .75rem; display: inline-block; border-radius: .18rem; }
  .sultan-cost .fabric i { background: #b23d43; }.sultan-cost .spice i { background: #27806e; }.sultan-cost .fruit i { background: #e1aa35; }.sultan-cost .jewelry i { background: #3e7da0; }.sultan-cost .any i { background: conic-gradient(#b23d43 0 25%, #27806e 0 50%, #e1aa35 0 75%, #3e7da0 0); }
  .play-area { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0, 1fr) minmax(15rem, .3fr); gap: .65rem; }
  .board-shell { position: relative; min-height: 0; display: flex; flex-direction: column; overflow: hidden; border: 1px solid rgb(239 202 125 / 35%); border-radius: 1rem; background: linear-gradient(rgb(7 31 34 / 47%), rgb(7 31 34 / 68%)), var(--courtyard) center / cover; box-shadow: inset 0 0 5rem rgb(0 0 0 / 38%); }
  .board-tools { position: absolute; z-index: 5; top: .5rem; right: .5rem; display: flex; gap: .3rem; }
  .board-tools button { min-height: 2rem; padding: .3rem .65rem; border: 1px solid rgb(255 255 255 / 32%); border-radius: 2rem; color: #fffaf0; background: rgb(10 44 47 / 80%); font: inherit; font-size: .72rem; font-weight: 700; }
  .board-tools .zoom-button { width: 2rem; padding: 0; display: grid; place-items: center; }
  .e2e-resources { position: absolute; z-index: 5; left: .45rem; bottom: .35rem; max-width: 12rem; min-height: 1.8rem; padding: .25rem .5rem; border: 1px solid rgb(255 255 255 / 28%); border-radius: .45rem; color: #fffaf0; background: rgb(10 44 47 / 88%); font: inherit; font-size: .58rem; font-weight: 700; }
  .zoom-button span { position: relative; width: .7rem; height: .7rem; display: block; }
  .zoom-button span::before, .zoom-button span::after { position: absolute; inset: calc(50% - 1px) 0 auto; height: 2px; border-radius: 1px; background: currentColor; content: ''; }
  .zoom-button span::after { rotate: 90deg; }
  .board-viewport { flex: 1; min-height: 0; display: grid; place-items: center; overflow: hidden; padding: 2.4rem 1.2rem 1rem; }
  .board { width: min(100%, 42rem); aspect-ratio: 1.42; display: grid; grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr); gap: .42rem; scale: var(--board-scale); transform-origin: center; transition: scale .2s ease; }
  .place { position: relative; min-width: 0; min-height: 0; display: grid; grid-template-columns: 2rem 1fr; grid-template-rows: 1fr auto; gap: .15rem .3rem; align-items: center; overflow: hidden; padding: .42rem; border: 1px solid rgb(255 250 240 / 60%); border-radius: .55rem; color: #173f43; text-align: left; background: linear-gradient(150deg, rgb(255 252 239 / 96%), rgb(223 199 151 / 96%)); box-shadow: 0 .35rem .7rem rgb(0 0 0 / 30%); cursor: pointer; }
  .place::after { position: absolute; inset: 0; border: 3px solid transparent; border-radius: inherit; content: ''; pointer-events: none; }
  .place.selected::after { border-color: #e2574f; box-shadow: inset 0 0 0 2px #fff7d6; }
  .place.reachable { border-color: #f4cf75; box-shadow: 0 0 0 2px rgb(244 207 117 / 45%), 0 .35rem .7rem rgb(0 0 0 / 30%); }
  .place.reachable::before { position: absolute; inset: .2rem; border: 1px dashed #a56823; border-radius: .35rem; content: ''; pointer-events: none; }
  .place.departed { animation: departure-pulse .45s ease-out; }.place.arrived { animation: arrival-pulse .6s ease-out; }
  .place-number { position: absolute; top: .25rem; right: .3rem; color: #a43b32; font-size: .7rem; font-weight: 700; }
  .place-glyph { width: 1.9rem; height: 1.9rem; color: #426c68; }
  .place strong { align-self: end; overflow: hidden; font-size: clamp(.58rem, 1vw, .78rem); line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
  .family-ruby { background: linear-gradient(150deg, #fff4df, #dfb36d); }.family-warehouse { background: linear-gradient(150deg, #fffced, #d9e4c2); }.family-chance { background: linear-gradient(150deg, #f5eee5, #d7bed1); }
  .occupants { grid-column: 1 / -1; min-height: 1.2rem; display: flex; gap: .12rem; align-items: end; }
  .merchant { width: 1.1rem; height: 1.1rem; display: grid; place-items: center; border: 1px solid #fffaf0; border-radius: 50%; color: #fff; font-size: .52rem; font-weight: 700; box-shadow: 0 .1rem .2rem #0005; }
  .family-member { width: .95rem; height: .95rem; display: grid; place-items: center; border: 2px solid #fffaf0; border-radius: 50% 50% .25rem .25rem; color: #fff; font-size: .45rem; font-weight: 700; box-shadow: 0 .1rem .2rem #0005; }
  .assistant { width: .9rem; height: .9rem; display: grid; place-items: center; border: 1px solid #fffaf0; border-radius: .2rem; color: #fff; font-size: .48rem; font-weight: 700; text-transform: uppercase; box-shadow: 0 .1rem .2rem #0005; }
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
  .turn-action { width: 100%; min-height: 2.8rem; margin-top: .8rem; padding: .6rem .7rem; border: 0; border-radius: .6rem; color: #fffaf0; background: #267356; box-shadow: 0 .25rem 0 #164a37; font: inherit; font-size: .75rem; font-weight: 700; }.turn-action.secondary-action { background: #a23b36; box-shadow: 0 .25rem 0 #6d2523; }.route-warning, .waiting-copy { color: #9a5046 !important; font-weight: 700; }
  .turn-action:disabled { opacity: .45; box-shadow: none; cursor: not-allowed; }.complete-glyph { color: #267356; }.action-balance { margin: .45rem 0 0 !important; font-size: .68rem !important; text-align: center; }
  .wheelbarrow-track, .crate-track { display: flex; gap: .35rem; margin: .8rem 0; }.wheelbarrow-track span, .crate-track span { width: 2rem; height: 1.6rem; border: 2px solid #9e7145; border-radius: .3rem; background: #e8dbc1; }.wheelbarrow-track span.filled { border-color: #267356; background: linear-gradient(135deg, #efca7d 45%, #267356 46% 55%, #efca7d 56%); }.crate-track span.filled { background: currentColor; }.crate-track.fabric { color: #b7423c; }.crate-track.spice { color: #3b8662; }.crate-track.fruit { color: #d6a82c; }
  .recall-list { display: grid; gap: .35rem; margin-top: .65rem; }.recall-list label { grid-template-columns: auto 1fr; align-items: center; padding: .4rem .5rem; border: 1px solid #d9cdb7; border-radius: .45rem; font-size: .7rem; }.recall-list input { width: 1.2rem; min-height: 1.2rem; accent-color: #267356; }
  .mail-track { display: flex; gap: .45rem; margin: .7rem 0; }.mail-column { position: relative; width: 2.5rem; display: grid; gap: .25rem; }.mail-column i { min-height: 1.6rem; display: grid; place-items: center; border: 1px solid #b99a6b; border-radius: .3rem; color: #173f43; background: #f0d28f; font-size: .68rem; font-style: normal; font-weight: 700; }.mail-column i.covered { opacity: .38; }.mail-column b { position: absolute; top: .15rem; right: .15rem; width: .65rem; height: .65rem; border: 2px solid #fffaf0; border-radius: .15rem; background: #a23b36; box-shadow: 0 .1rem .2rem #0004; transition: top .18s ease; }.mail-column b.lower { top: 2rem; }
  .caravan-sources { display: flex; gap: .5rem; margin-top: .55rem; }.caravan-sources label { flex: 1; color: #6d7c79; font-size: .58rem; text-transform: uppercase; }.caravan-sources select { width: 100%; min-height: 2rem; margin-top: .15rem; border: 1px solid #b99a6b; border-radius: .35rem; color: #173f43; background: #fffaf0; }.card-preview { margin: .35rem 0 !important; font-size: .62rem !important; font-weight: 700; }.discard-choice { display: grid; grid-template-columns: repeat(3, 1fr); gap: .3rem; margin: 0; padding: .35rem; border: 1px solid #d9cdb7; border-radius: .45rem; }.discard-choice legend { padding: 0 .25rem; font-size: .58rem; font-weight: 700; text-transform: uppercase; }.discard-choice label { min-width: 0; display: grid; grid-template-columns: auto 1fr; gap: .2rem; align-items: center; font-size: .55rem; }.discard-choice span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.discard-choice input { width: .9rem; min-height: .9rem; accent-color: #a23b36; }
  .demand-card { display: grid; grid-template-columns: repeat(5, 1fr); gap: .3rem; margin: .7rem 0; padding: .55rem; border: 2px solid #d49d42; border-radius: .55rem; background: #ead8b8; }.demand-card label { min-width: 0; display: grid; place-items: center; gap: .15rem; color: #173f43; font-size: .52rem; }.demand-card input { position: absolute; opacity: 0; }.demand-card i { width: 1.8rem; height: 1.8rem; border: 3px solid #fffaf0; border-radius: .4rem; box-shadow: 0 .15rem .25rem #0003; }.demand-card .fabric i { background: #b7423c; }.demand-card .spice i { background: #3b8662; }.demand-card .fruit i { background: #d6a82c; }.demand-card .jewelry i { background: #4382a9; }.demand-card input:checked + i { outline: 3px solid #173f43; outline-offset: 1px; }.market-revenue { margin: .2rem 0 !important; font-weight: 700; text-align: center; }
  .basic-good-choice { display: grid; grid-template-columns: repeat(3, 1fr); gap: .4rem; margin: .7rem 0 0; padding: .45rem; border: 1px solid #d9cdb7; border-radius: .5rem; }.basic-good-choice legend { padding: 0 .25rem; font-size: .58rem; font-weight: 700; text-transform: uppercase; }.basic-good-choice label { display: grid; grid-template-columns: auto auto 1fr; gap: .25rem; align-items: center; font-size: .62rem; }.basic-good-choice input { accent-color: #173f43; }.basic-good-choice i { width: 1rem; height: 1rem; border-radius: .25rem; }.basic-good-choice .fabric i { background: #b7423c; }.basic-good-choice .spice i { background: #3b8662; }.basic-good-choice .fruit i { background: #d6a82c; }.wager-control { display: grid; gap: .25rem; margin-top: .7rem; color: #6d7c79; font-size: .62rem; font-weight: 700; text-transform: uppercase; }.wager-control select { min-height: 2.35rem; border: 1px solid #b99a6b; border-radius: .4rem; color: #173f43; background: #fffaf0; font: inherit; }.dice-result { display: flex; gap: .45rem; align-items: center; margin-top: .65rem; }.dice-result span { width: 2.4rem; height: 2.4rem; display: grid; place-items: center; border: 2px solid #173f43; border-radius: .5rem; color: #a23b36; background: #fffaf0; box-shadow: .15rem .2rem 0 #d4bd91; font: 700 1.2rem 'Cormorant Garamond', serif; }.dice-result strong { margin-left: .3rem; color: #267356; font-size: .75rem; }
  .skip-link { width: 100%; min-height: 2rem; margin-top: .35rem; border: 0; color: #8d3c37; text-decoration: underline; background: transparent; font: inherit; font-size: .68rem; font-weight: 700; }
  .encounter-choices { display: grid; gap: .55rem; margin-top: .65rem; }.encounter-choices section { display: grid; gap: .35rem; padding: .55rem; border: 1px solid #d4bd91; border-radius: .55rem; background: #f1e5cc; }.encounter-choices section > strong { font: 700 1.1rem 'Cormorant Garamond', serif; }.encounter-choices section > span { color: #627572; font-size: .62rem; }.encounter-choices section > div { display: grid; grid-template-columns: 1fr 1fr; gap: .35rem; }.encounter-choices .turn-action, .encounter-choices .skip-link { min-height: 2.1rem; margin: 0; font-size: .62rem; }.encounter-choices .alternate { background: #744c8b; box-shadow: 0 .2rem 0 #4c315b; }.encounter-choices label { display: grid; gap: .2rem; color: #627572; font-size: .58rem; text-transform: uppercase; }.encounter-choices select { min-height: 2rem; border: 1px solid #b99a6b; border-radius: .35rem; color: #173f43; background: #fffaf0; }
  .encounter-history { display: grid; gap: .35rem; margin-top: .5rem; }.encounter-history article { display: grid; grid-template-columns: auto 1fr auto; gap: .4rem; align-items: center; padding: .4rem; border: 1px solid #d4bd91; border-radius: .4rem; background: #f1e5cc; }.encounter-history strong { color: #744c8b; font-size: .58rem; text-transform: uppercase; }.encounter-history span { font-size: .6rem; }.encounter-history i { color: #a23b36; font-size: .7rem; font-style: normal; font-weight: 700; }
  .mosque-ability-card { display: flex; justify-content: space-between; gap: .5rem; margin-top: .7rem; padding: .65rem; border: 2px solid currentColor; border-radius: .55rem; background: #f1e5cc; }.mosque-ability-card strong { font: 700 1.1rem 'Cormorant Garamond', serif; }.mosque-ability-card span { font-size: .62rem; }.green-tile { color: #28785c; }.fabric-tile { color: #aa413c; }.spice-tile { color: #28785c; }.fruit-tile { color: #b88618; }.jewelry-tile { color: #32769d; }
  .dice-adjustments { display: grid; grid-template-columns: 1fr 1fr; gap: .4rem; margin-top: .6rem; }.dice-adjustments .turn-action, .dice-adjustments .skip-link { margin: 0; }.dice-adjustments .alternate { background: #a23b36; box-shadow: 0 .25rem 0 #6d2523; }
  .mosque-offers { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-top: .65rem; }.mosque-offers article { min-width: 0; display: grid; gap: .35rem; padding: .55rem; border: 2px solid currentColor; border-radius: .55rem; background: #f1e5cc; }.mosque-offers article > span { font-size: .58rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }.mosque-offers article > strong { font: 700 1.05rem 'Cormorant Garamond', serif; }.mosque-offers article > small { min-height: 2.4rem; color: #526b68; font-size: .57rem; }.mosque-offers article > b { padding: .45rem; border-radius: .35rem; color: #fffaf0; text-align: center; background: currentColor; font-size: .62rem; }.mosque-offers .turn-action { margin-top: auto; font-size: .6rem; }
  .yellow-recall { display: grid; gap: .3rem; margin-top: .7rem; padding: .55rem; border: 2px solid #b88618; border-radius: .55rem; color: #173f43; background: #f1e5cc; }.yellow-recall strong { color: #9a7115; font: 700 1rem 'Cormorant Garamond', serif; }.yellow-recall span { font-size: .6rem; }.yellow-recall .turn-action { margin: 0; }
  .large-card { min-height: 13rem; display: flex; flex-direction: column; justify-content: space-between; padding: 1rem; border: 2px solid #d49d42; border-radius: .8rem; color: #fffaf0; background: radial-gradient(circle at 80% 15%, #d27a40, transparent 5rem), #a23b36; box-shadow: 0 .8rem 1.4rem #4b2c2240; }.large-card > span { font-size: .65rem; letter-spacing: .15em; text-transform: uppercase; }.large-card strong { font: 700 1.5rem/1 'Cormorant Garamond', serif; }.large-card p { margin: 0; font-size: .78rem; }
  .mobile-card-text { display: none; }
  .player-rail { display: grid; grid-template-columns: repeat(var(--players, 2), minmax(0, 1fr)); grid-auto-flow: column; gap: .5rem; }
  .player-rail article { min-width: 0; display: grid; grid-template-columns: auto 1fr auto; gap: .35rem .7rem; padding: .55rem .7rem; border: 1px solid rgb(239 202 125 / 30%); border-radius: .85rem; color: #173f43; background: rgb(255 250 239 / 92%); }.player-rail article.local { outline: 2px solid #e7b64c; }
  .player-name { display: grid; grid-template-columns: 1.55rem auto; align-items: center; }.player-name .player-dot { grid-row: 1 / 3; width: 1.4rem; height: 1.4rem; margin-right: .35rem; }.player-name small { color: #6d7c79; font-size: .6rem; }
  .resources { display: flex; margin: 0; }.resources div { padding: 0 .45rem; border-left: 1px solid #d9cdb7; text-align: center; }.resources dt { color: #6d7c79; font-size: .52rem; text-transform: uppercase; }.resources dd { margin: 0; font-weight: 700; }
  .goods { display: flex; gap: .25rem; align-items: center; }.good { display: flex; gap: .15rem; align-items: center; font-size: .65rem; font-weight: 700; }.good i { width: .65rem; height: .65rem; border-radius: .16rem; }.good.fabric i { background: #b7423c; }.good.spice i { background: #3b8662; }.good.fruit i { background: #d6a82c; }.good.jewelry i { background: #4382a9; }
  .mosque-badges { grid-column: 1 / -1; display: flex; gap: .25rem; }.mosque-badges span { padding: .12rem .35rem; border: 1px solid currentColor; border-radius: .3rem; background: #fffaf0; font-size: .5rem; font-weight: 700; }
  .hand { grid-column: 1 / -1; display: flex; gap: .4rem; align-items: center; border-top: 1px solid #d9cdb7; padding-top: .35rem; font-size: .62rem; }.hand > span { color: #6d7c79; text-transform: uppercase; }.hand button { max-width: 12rem; display: grid; padding: .28rem .5rem; border: 1px solid #c98948; border-radius: .35rem; color: #fffaf0; text-align: left; background: #a23b36; }.hand button[aria-pressed='true'] { outline: 2px solid #e7b64c; }.hand button small { font-size: .48rem; text-transform: uppercase; }.hand button strong { overflow: hidden; font-size: .62rem; text-overflow: ellipsis; white-space: nowrap; }
  .masked-hand { grid-column: 1 / -1; margin: 0; padding-top: .35rem; border-top: 1px solid #d9cdb7; color: #6d7c79; font-size: .62rem; }
  @keyframes departure-pulse { from { filter: brightness(1.45); } to { filter: none; } }
  @keyframes arrival-pulse { 0% { translate: 0 -.25rem; filter: brightness(1.7); } 100% { translate: 0; filter: none; } }
  @media (max-width: 720px) {
    .game-table { gap: .4rem; }
    .turn-banner { min-height: 3.4rem; padding: .35rem .6rem; }.turn-banner h1 { font-size: 1.45rem; }.turn-token { font-size: .7rem; }.turn-token small { font-size: .55rem; }
    .play-area { grid-template-columns: 1fr; grid-template-rows: minmax(0, 1fr) auto; gap: .4rem; }
    .board-viewport { padding: 2.1rem .4rem .35rem; }.board { width: 100%; aspect-ratio: 1.18; gap: .25rem; }.place { grid-template-columns: 1.35rem 1fr; padding: .24rem; border-radius: .38rem; }.place-glyph { width: 1.25rem; height: 1.25rem; }.place strong { display: -webkit-box; overflow: hidden; font-size: .52rem; line-height: .88; white-space: normal; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }.place-number { font-size: .5rem; }.occupants { min-height: .85rem; }.merchant, .assistant, .family-member { width: .8rem; height: .8rem; font-size: .4rem; }.encounter { width: .7rem; height: .7rem; font-size: .38rem; }
    .inspector { min-height: 5.5rem; max-height: none; display: grid; grid-template-columns: auto 1fr; gap: .2rem .7rem; align-content: start; padding: .55rem .7rem; }.inspector .section-kicker, .inspector h2, .inspector > p { grid-column: 2; }.inspector h2 { margin: 0; font-size: 1.35rem; }.inspector > p:not(.section-kicker) { margin: 0; font-size: .65rem; }.inspector-glyph { grid-column: 1; grid-row: 1 / 4; width: 3rem; height: 3rem; }.inspector dl { grid-column: 1 / -1; display: flex; gap: .8rem; margin: 0; }.inspector dl div { padding: .15rem 0; border: 0; font-size: .55rem; }.inspector .turn-action, .inspector .skip-link, .inspector .wheelbarrow-track, .inspector .crate-track, .inspector .recall-list, .inspector .action-balance, .inspector .mail-track, .inspector .caravan-sources, .inspector .card-preview, .inspector .discard-choice, .inspector .demand-card, .inspector .market-revenue, .inspector .basic-good-choice, .inspector .wager-control, .inspector .dice-result, .inspector .encounter-choices, .inspector .encounter-history, .inspector .mosque-ability-card, .inspector .dice-adjustments, .inspector .mosque-offers, .inspector .yellow-recall { grid-column: 1 / -1; margin-top: .2rem; }.inspector .turn-action { min-height: 2.2rem; }.inspector .skip-link { min-height: 1.5rem; }.recall-list { grid-template-columns: 1fr 1fr; }.encounter-ledger, .supply-ledger, .large-card { display: none; }.mobile-card-text { display: block; }.encounter-choices { grid-template-columns: 1fr 1fr; }.encounter-choices section { padding: .4rem; }.encounter-choices section > div { grid-template-columns: 1fr; }.mosque-offers article > small { min-height: auto; }.dice-adjustments { grid-template-columns: 1fr 1fr; }
    .inspector.route-planner { position: relative; display: block; height: 8rem; max-height: 8rem; padding: 0; }.route-planner .section-kicker { position: absolute; top: .55rem; left: 1.4rem; margin: 0; }.route-planner h2 { position: absolute; top: 1.45rem; left: 1.4rem; margin: 0; }.route-planner > p:not(.section-kicker) { position: absolute; top: 3.15rem; right: .7rem; left: 1.4rem; margin: 0; line-height: .82rem; }.route-planner .supply-ledger { position: absolute; right: .7rem; bottom: .45rem; left: .7rem; display: flex; justify-content: space-between; margin: 0 !important; }
    .player-rail { grid-auto-flow: row; grid-template-columns: 1fr 1fr; gap: .3rem; }.player-rail article { padding: .35rem .45rem; grid-template-columns: 1fr auto; gap: .2rem; }.resources { display: none; }.goods { justify-content: end; }.hand, .masked-hand { padding-top: .2rem; }.hand { flex-wrap: wrap; }.hand > span { width: 100%; }.hand button { width: 100%; max-width: none; min-height: 1.55rem; }.player-name { font-size: .72rem; }
  }
  @media (prefers-reduced-motion: reduce) { .board { transition: none; } }
</style>
