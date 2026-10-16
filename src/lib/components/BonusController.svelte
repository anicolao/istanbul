<script lang="ts">
  import { bonusCards, type Good } from '$lib/game/manifests';
  import { type PlaceActionChoice } from '$lib/game/actions';
  import type { BonusChoice } from '$lib/game/bonus';
  import { requiredAssistantAction } from '$lib/game/movement';
  import { currentSultanCost } from '$lib/game/ruby-routes';
  import type { GameSetup } from '$lib/game/setup';
  import type { ReplayProjection } from '$lib/game/protocol';
  import UndoButton from './UndoButton.svelte';
  import BonusCardChoices from './BonusCardChoices.svelte';
  import BonusCard from './BonusCard.svelte';
  import AssistantRecallMap from './AssistantRecallMap.svelte';
  import CaravansaryFlow from './CaravansaryFlow.svelte';
  import GameLog from './GameLog.svelte';

  let {
    game,
    userUid,
    selectedBonus,
    onInspectBonus,
    onPlayBonus,
    onTakePrivateAction,
    onResolvePrivateEncounter,
    onUndo,
    onRollback,
    undo,
    undoLog,
    gameLog,
    undoPending = false,
    embedded = false,
    flowOnly = false
  }: {
    game: GameSetup;
    userUid: string;
    selectedBonus: string | null;
    onInspectBonus: (cardId: string) => void;
    onPlayBonus: (cardId: string, choice: BonusChoice) => void;
    onTakePrivateAction: (choice: PlaceActionChoice) => void;
    onResolvePrivateEncounter: (cardId: string) => void;
    onUndo: () => void;
    onRollback: (targetEventId: string) => void;
    undo: ReplayProjection['undo'];
    undoLog: ReplayProjection['undoLog'];
    gameLog: ReplayProjection['gameLog'];
    undoPending?: boolean;
    embedded?: boolean;
    flowOnly?: boolean;
  } = $props();

  const bonusById = new Map(bonusCards.map((card) => [card.id, card]));
  const player = $derived(game.players.find(({ uid }) => uid === userUid)!);
  const currentPlayer = $derived(game.players[game.turnSeat]);
  const selected = $derived(
    selectedBonus ? bonusById.get(selectedBonus) : null
  );
  const isCurrent = $derived(currentPlayer.uid === userUid);
  const goodNames: Record<Good, string> = {
    fabric: 'Fabric',
    spice: 'Spice',
    fruit: 'Fruit',
    jewelry: 'Jewelry'
  };
  const stayAction = $derived(
    requiredAssistantAction(player, player.merchantPlace)
  );
  const sultanCost = $derived(currentSultanCost(game));
  const sultanWildCount = $derived(
    sultanCost.filter((good) => good === 'any').length
  );
  let bonusGood = $state<Good>('jewelry');
  let familyReward = $state<'lira' | 'bonus'>('lira');
  let sultanWildGoods = $state<Good[]>([]);
  const privateActionPlace = $derived(
    game.pending?.kind === 'caravansary-discard'
      ? 6
      : game.phase === 'family-action' && game.pending?.kind === 'family-action'
        ? game.pending.destination
        : currentPlayer.merchantPlace
  );
  const atCaravansary = $derived(
    isCurrent &&
      (game.phase === 'action' ||
        game.phase === 'family-action' ||
        game.pending?.kind === 'caravansary-discard') &&
      privateActionPlace === 6
  );
  const governorCardPayment = $derived(
    isCurrent &&
      game.phase === 'encounters' &&
      game.pending?.kind === 'encounters' &&
      game.pending.governor === 'payment'
  );
  const privateStatus = $derived(
    undo?.blockedReason
      ? `Undo locked · ${undo.blockedReason}`
      : undo?.actorUids.includes(userUid)
        ? `Can undo · ${undo.label}`
        : undoLog.length
          ? `Last log: Undid ${undoLog.at(-1)?.label}`
          : isCurrent
            ? `${game.phase.replace('-', ' ')} · make public choices on the tabletop`
            : `${currentPlayer.name} is using the tabletop`
  );

  const choosingAssistant = $derived(isCurrent && selected?.effect === 'return-assistant' && !atCaravansary && !governorCardPayment);

  let workspaceWidth = $state(0);
  let workspaceHeight = $state(0);
  function measureWorkspace(node: HTMLElement) {
    const observer = new ResizeObserver(([entry]) => {
      workspaceWidth = entry.contentRect.width;
      workspaceHeight = entry.contentRect.height;
    });
    observer.observe(node);
    return { destroy: () => observer.disconnect() };
  }
  const controlSpace = $derived(Math.max(180,
    player.bonusHand.some((id) => bonusById.get(id)?.effect === 'repeat-sultan')
      ? sultanWildCount * 64 + 56 : 0));
  // Reserve play controls so selecting a card never shrinks the hand.
  const cardWidth = $derived.by(() => {
    const count = player.bonusHand.length;
    if (!count || flowOnly || atCaravansary || governorCardPayment || choosingAssistant) return 0;
    let best = 0;
    for (let rows = 1; rows <= count; rows++) {
      const columns = Math.ceil(count / rows);
      best = Math.max(best, Math.min(
        200,
        (workspaceWidth - 24 - (columns - 1) * 12) / columns,
        (workspaceHeight - controlSpace - 20 - (rows - 1) * 12) / (rows * 2)
      ));
    }
    return best >= 160 ? Math.floor(best) : 0;
  });
  const fullHand = $derived(cardWidth > 0);

  function setSultanWild(index: number, good: Good) {
    sultanWildGoods = Array.from({ length: sultanWildCount }, (_, slot) =>
      slot === index ? good : (sultanWildGoods[slot] ?? 'fabric')
    );
  }
</script>

<section
  class="private-controller"
  class:embedded
  class:flowOnly
  aria-labelledby={embedded ? undefined : 'private-title'}
  aria-label={embedded ? 'Bonus cards' : undefined}
  data-e2e-fit
  data-e2e-no-scroll
>
  {#if !embedded}<header>
      <div>
        <p>Private phone · {player.name}</p>
        <span class="private-history"
          ><UndoButton
            {undo}
            {userUid}
            pending={undoPending}
            {onUndo}
          /><GameLog
            entries={gameLog}
            players={game.players}
            {userUid}
            pending={undoPending}
            {onRollback}
          /></span
        >
      </div>
      <h1 id="private-title">Your Bonus cards</h1>
      <span>{privateStatus}</span>
    </header>{/if}

  <div class="private-workspace" class:full-hand={fullHand} style={`--hand-card-width:${cardWidth}px; --hand-control-height:${controlSpace}px`} use:measureWorkspace data-e2e-fit data-e2e-no-scroll>
    {#if !flowOnly}<nav
        class="private-hand"
        aria-label="Private Bonus hand"
        data-e2e-no-scroll
      >
        {#each player.bonusHand as cardId}
          {@const card = bonusById.get(cardId)!}
          <button
            aria-label={`Inspect Bonus card: ${card.title}`}
            aria-pressed={selectedBonus === cardId}
            onclick={() => onInspectBonus(cardId)}
          >
            <BonusCard {card} compact={!fullHand} mini={!fullHand} class="hand-art" />
          </button>
        {:else}<p>No Bonus cards in hand.</p>{/each}
      </nav>{/if}

    {#if !fullHand || selected || atCaravansary || governorCardPayment}<article class="private-decision" class:assistant-selection={choosingAssistant} data-e2e-no-scroll>
      {#if atCaravansary}
        <CaravansaryFlow
          {game}
          disabled={undoPending}
          onAction={onTakePrivateAction}
        />
      {:else if governorCardPayment}
        <p class="kicker">Private Governor payment</p>
        <h2>Discard a Bonus card</h2>
        <p>
          The tabletop can pay 2 Lira. Choose here only if you prefer to discard
          privately.
        </p>
        <BonusCardChoices
          cards={player.bonusHand}
          disabled={undoPending}
          onChoose={onResolvePrivateEncounter}
        />
      {:else if selected}
        <p class="kicker">Selected Bonus card</p>
        <h2>{selected.title}</h2>
        {#if !fullHand && !choosingAssistant}<BonusCard card={selected} class="large-card" />{/if}
        {#if isCurrent}
          {#if selected.effect === 'gain-good'}<label
              >Good to gain<select
                value={bonusGood}
                onchange={(event) =>
                  (bonusGood = event.currentTarget.value as Good)}
                >{#each Object.keys(goodNames) as good}<option
                    value={good}
                    disabled={player.goods[good as Good] >= player.capacity}
                    >{goodNames[good as Good]}</option
                  >{/each}</select
              ></label
            ><button
              class="primary"
              disabled={![
                'action',
                'family-action',
                'turn-end',
                'final-bonus'
              ].includes(game.phase) ||
                player.goods[bonusGood] >= player.capacity}
              onclick={() =>
                onPlayBonus(selected.id, {
                  kind: 'gain-good',
                  good: bonusGood
                })}>Play to gain 1 {bonusGood}</button
            >
          {:else if selected.effect === 'gain-lira'}<button
              class="primary"
              disabled={![
                'movement',
                'action',
                'family-action',
                'turn-end',
                'final-bonus'
              ].includes(game.phase)}
              onclick={() => onPlayBonus(selected.id, { kind: 'gain-lira' })}
              >Play to gain 5 Lira</button
            >
          {:else if selected.effect === 'return-family'}<label
              >Reward<select
                value={familyReward}
                onchange={(event) =>
                  (familyReward = event.currentTarget.value as
                    'lira' | 'bonus')}
                ><option value="lira">3 Lira</option><option value="bonus"
                  >1 Bonus card</option
                ></select
              ></label
            ><button
              class="primary"
              disabled={player.familyPlace === 12}
              onclick={() =>
                onPlayBonus(selected.id, {
                  kind: 'return-family',
                  reward: familyReward
                })}>Return family to Police</button
            >
          {:else if selected.effect === 'return-assistant'}
            <p>Tap an assistant to return it to your merchant.</p>
            <AssistantRecallMap
              {game}
              {player}
              disabled={undoPending || game.phase !== 'movement'}
              onRecall={(place) => onPlayBonus(selected.id, { kind: 'return-assistant', place })}
            />
            {#if !Object.values(player.assistantsByPlace).some((count) => count > 0)}
              <p>All your assistants are with your merchant.</p>
            {:else if game.phase !== 'movement'}
              <p>Play this card before moving your merchant.</p>
            {/if}
          {:else if selected.effect === 'long-move'}<button
              class="primary"
              disabled={game.phase !== 'movement' ||
                game.activeBonusEffects.includes('long-move')}
              onclick={() => onPlayBonus(selected.id, { kind: 'long-move' })}
              >Enable a 3–4 Place move</button
            >
          {:else if selected.effect === 'stay'}<button
              class="primary"
              disabled={game.phase !== 'movement' ||
                player.merchantPlace === 7 ||
                !stayAction ||
                stayAction === 'fountain'}
              onclick={() => onPlayBonus(selected.id, { kind: 'stay' })}
              >{stayAction === 'pick-up'
                ? 'Stay and pick up assistant'
                : 'Stay and leave assistant'}</button
            >
          {:else if selected.effect === 'wild-small-market'}<button
              class="primary"
              disabled={game.phase !== 'action' || player.merchantPlace !== 11}
              onclick={() =>
                onPlayBonus(selected.id, { kind: 'wild-small-market' })}
              >Enable flexible Small Market demand</button
            >
          {:else if selected.effect === 'repeat-post'}<button
              class="primary"
              disabled={game.phase !== 'turn-end' ||
                game.lastAction?.place !== 5}
              onclick={() =>
                onPlayBonus(selected.id, { kind: 'repeat-action' })}
              >Repeat Post Office</button
            >
          {:else if selected.effect === 'repeat-gemstone'}<button
              class="primary"
              disabled={game.phase !== 'turn-end' ||
                game.lastAction?.place !== 16 ||
                player.lira < game.rubyTracks.gemstonePrice}
              onclick={() =>
                onPlayBonus(selected.id, { kind: 'repeat-action' })}
              >Repeat Gemstone Dealer</button
            >
          {:else if selected.effect === 'repeat-sultan'}{#each Array.from( { length: sultanWildCount } ) as _, index}<label
                >Wild good {index + 1}<select
                  value={sultanWildGoods[index] ?? 'fabric'}
                  onchange={(event) =>
                    setSultanWild(index, event.currentTarget.value as Good)}
                  >{#each Object.keys(goodNames) as good}<option value={good}
                      >{goodNames[good as Good]}</option
                    >{/each}</select
                ></label
              >{/each}<button
              class="primary"
              disabled={game.phase !== 'turn-end' ||
                game.lastAction?.place !== 13 ||
                sultanWildGoods.length !== sultanWildCount}
              onclick={() =>
                onPlayBonus(selected.id, {
                  kind: 'repeat-action',
                  wildGoods: sultanWildGoods
                })}>Repeat Sultan’s Palace</button
            >{/if}
        {:else}<p class="waiting">
            Bonus cards can be played only during your turn.
          </p>{/if}
      {:else}
        <p class="kicker">Private information only</p>
        <h2>Select a Bonus card</h2>
        <p>Tap a card to inspect it or play it during your turn.</p>
      {/if}
    </article>{/if}
  </div>
</section>

<style>
  .embedded {
    font-size: inherit;
  }
  .embedded .private-decision {
    color: inherit;
    background: transparent;
    border: 0;
    box-shadow: none;
    padding: 0.5rem;
  }
  .embedded .kicker,
  .embedded .private-decision > h2 {
    display: none;
  }
  .flowOnly .private-workspace {
    display: block;
  }
  .flowOnly .private-decision {
    height: 100%;
  }

  .private-controller {
    height: 100%;
    min-height: 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    color: #fffaf0;
  }
  header {
    padding: 0.7rem 1rem;
    border: 1px solid #efca7d66;
    border-radius: 1rem;
    background: linear-gradient(110deg, #11383b, #205954);
  }
  header > div {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  header p,
  header > span {
    margin: 0;
    color: #efca7d;
    font-size: 0.64rem;
  }
  header p {
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  h1 {
    margin: 0.1rem 0;
    font:
      700 2rem/0.95 'Cormorant Garamond',
      serif;
  }
  .private-history {
    display: flex;
    gap: 0.3rem;
  }
  .private-workspace {
    min-height: 0;
    flex: 1;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: 0.55rem;
  }
  .full-hand {
    grid-template-rows: minmax(0, 1fr) var(--hand-control-height);
  }
  .full-hand .private-hand {
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    justify-content: center;
    gap: 12px;
    padding: 8px;
  }
  .full-hand .private-hand button {
    width: var(--hand-card-width);
    padding: 0;
    border: 0;
    overflow: visible;
    background: transparent;
  }
  .full-hand .private-hand :global(.hand-art) {
    width: 100%;
  }
  .full-hand .private-decision {
    width: min(100%, 32rem);
    justify-self: center;
    align-self: start;
  }
  .private-hand {
    min-height: 5.1rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(3rem, 1fr));
    gap: 0.45rem;
    padding: 0.45rem;
    overflow: hidden;
    border: 1px solid #c98948;
    border-radius: 0.75rem;
    background: #24170f;
  }
  .private-hand button {
    min-width: 0;
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 0.15rem 0.4rem;
    align-items: center;
    overflow: hidden;
    padding: 0.3rem;
    border: 1px solid #c98948;
    border-radius: 0.5rem;
    color: #fffaf0;
    text-align: left;
    background: #173f43;
  }
  .private-hand button[aria-pressed='true'] {
    outline: 2px solid #efca7d;
  }
  .private-hand :global(.hand-art) {
    grid-row: 1 / 3;
    width: 2rem;
    border-radius: 0.25rem;
  }
  .private-hand p {
    margin: auto;
    color: #cabda8;
    font-size: 0.75rem;
  }
  .private-decision {
    min-height: 0;
    overflow: hidden;
    padding: 0.8rem;
    border-radius: 0.9rem;
    color: #173f43;
    background: #fffaf0;
  }
  .assistant-selection {
    container-type: size;
  }
  .assistant-selection :global(.recall-map) {
    width: min(100cqw, calc((100cqh - 88px) * 16 / 9), 720px);
  }
  .kicker {
    margin: 0;
    color: #a43b32;
    font-size: 0.6rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .private-decision h2 {
    margin: 0.2rem 0 0.5rem;
    font:
      700 1.55rem 'Cormorant Garamond',
      serif;
  }
  .private-decision > p:not(.kicker) {
    font-size: 0.7rem;
    line-height: 1.3;
  }
  .private-decision :global(.large-card) {
    width: min(100%, 8rem);
    margin-inline: auto;
  }
  label {
    display: grid;
    gap: 0.25rem;
    margin-top: 0.5rem;
    font-size: 0.65rem;
    font-weight: 700;
  }
  select {
    width: 100%;
    min-height: 2.5rem;
    padding: 0.4rem;
    border: 1px solid #b99a6b;
    border-radius: 0.4rem;
    background: #fff;
  }
  .primary {
    width: 100%;
    min-height: 2.8rem;
    margin-top: 0.55rem;
    border: 0;
    border-radius: 0.5rem;
    color: #fff;
    background: #267356;
    font-weight: 700;
  }
  .primary:disabled {
    opacity: 0.4;
  }
  .waiting {
    color: #6d7c79;
  }
  @media (max-height: 700px) {
    h1 {
      font-size: 1.55rem;
    }
    .private-hand {
      min-height: 4rem;
    }
    .private-hand :global(.hand-art) {
      width: 1.5rem;
    }
    .private-decision {
      padding: 0.55rem;
    }
    .private-decision :global(.large-card) {
      width: min(100%, 5.5rem);
    }
  }
</style>
