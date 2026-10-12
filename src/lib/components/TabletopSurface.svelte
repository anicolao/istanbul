<script lang="ts">
  import { base } from "$app/paths";
  import { bonusCards, places, type Good } from "$lib/game/manifests";
  import {
    legalDestinations,
    requiredAssistantAction,
    type AssistantAction,
  } from "$lib/game/movement";
  import type { PlaceActionChoice } from "$lib/game/actions";
  import type { EncounterChoice } from "$lib/game/encounters";
  import {
    ownsMosqueAbility,
    type MosqueAbilityChoice,
  } from "$lib/game/mosques";
  import type { GameSetup } from "$lib/game/setup";
  import type { RoomProjection, ReplayProjection } from "$lib/game/protocol";
  import LocationTile from "./LocationTile.svelte";
  import TabletopPlayerPanel from "./TabletopPlayerPanel.svelte";
  import TabletopPlaceActions from "./TabletopPlaceActions.svelte";
  import GameArt from "./GameArt.svelte";

  let {
    game,
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
    undo,
    gameLog,
    undoPending = false,
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
    onRematch: () => void;
    undo: ReplayProjection["undo"];
    gameLog: ReplayProjection["gameLog"];
    undoPending?: boolean;
  } = $props();
  const goods: Good[] = ["fabric", "spice", "fruit", "jewelry"];
  const player = $derived(game.players[game.turnSeat]);
  const position = $derived(
    room.seats.find((seat) => seat.uid === player.uid)?.tablePosition ??
      game.turnSeat + 1,
  );
  const angle = $derived(
    position <= 3 ? 180 : position === 4 ? -90 : position === 8 ? 90 : 0,
  );
  const activePlace = $derived(
    game.phase === "family-action" && game.pending?.kind === "family-action"
      ? game.pending.destination
      : game.phase === "mosque-ability" &&
          (game.pending?.kind === "warehouse-extra" ||
            game.pending?.kind === "dice-adjust")
        ? game.pending.actionPlace
        : game.phase === "turn-end" && game.lastAction
          ? game.lastAction.place
          : player.merchantPlace,
  );
  const place = $derived(places.find((place) => place.id === activePlace)!);
  const actionReady = $derived(
    game.phase === "action" || game.phase === "family-action",
  );
  const reachable = $derived(
    game.phase === "movement" ? legalDestinations(game, player) : [],
  );
  const police = $derived(
    actionReady && activePlace === 12 && player.familyPlace === 12,
  );
  const fountain = $derived(actionReady && activePlace === 7);
  const canUndo = $derived(
    Boolean(
      undo &&
      !undo.blockedReason &&
      undo.actorUids.includes(userUid) &&
      !undoPending,
    ),
  );
  const lastEntry = $derived(
    gameLog
      .filter((entry) => entry.active && entry.epoch === game.epoch)
      .at(-1),
  );
  const pending = $derived(game.pending);
  let inspectedCard = $state<string | null>(null);
  const publicCard = $derived(
    bonusCards.find((card) => card.id === inspectedCard),
  );
  let history = $state(false),
    inspected = $state<number | null>(null),
    recall = $state<number[]>([]),
    yellow = $state(false);
  let gain = $state<Good>("fabric"),
    payment = $state<Good>("fabric");
  $effect(() => {
    game.turnNumber;
    game.phase;
    recall = [];
    inspected = null;
    inspectedCard = null;
    yellow = false;
  });
  const headline = $derived(
    game.phase === "movement"
      ? "Choose your next room"
      : game.phase === "turn-end"
        ? "Ready to pass"
        : game.phase === "merchant-payment"
          ? "Merchant toll"
          : game.phase === "encounters"
            ? "Meet the traders"
            : game.phase === "mosque-ability"
              ? "Use your Mosque power"
              : game.phase === "final-bonus"
                ? "Last trades"
                : game.phase === "game-over"
                  ? "The bazaar closes"
                  : place.name,
  );
  function tapRoom(id: number, event: MouseEvent) {
    const cardId = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-inspect-pile-card]",
    )?.dataset.inspectPileCard;
    if (cardId && !police && !fountain && !yellow && !reachable.includes(id)) {
      inspectedCard = cardId;
      return;
    }
    inspectedCard = null;
    if (undoPending) return;
    if (yellow) {
      if (player.assistantsByPlace[id])
        onUseMosqueAbility({ kind: "yellow-recall", place: id });
      return;
    }
    if (police && id !== 12) {
      onTakeAction({ kind: "police-send", destination: id });
      return;
    }
    if (fountain && player.assistantsByPlace[id]) {
      const count = recall.filter((place) => place === id).length;
      recall =
        count < player.assistantsByPlace[id]
          ? [...recall, id]
          : recall.filter((place) => place !== id);
      return;
    }
    if (reachable.includes(id)) {
      const assistant = requiredAssistantAction(player, id);
      if (assistant) onMove(id, assistant);
      return;
    }
    inspected = inspected === id ? null : id;
  }
</script>

<section
  class="tabletop-surface"
  style={`--courtyard:url('${base}/art/bazaar-courtyard.png')`}
  aria-label="Shared Istanbul table"
  data-e2e-fit
  data-e2e-no-scroll
>
  <TabletopPlayerPanel {game} {room} />
  <div class="playfield" style={`--facing:${angle}deg`} data-facing={angle}>
    <header>
      <span class={`player-dot ${player.color}`}></span><strong
        >{player.name}</strong
      >
      <h1>{headline}</h1>
      <span>Turn {game.turnNumber}</span>
    </header>
    <fieldset disabled={undoPending} aria-label="Bazaar" class="board-field">
      <div class="board" data-testid="bazaar-board">
        {#each game.board as id, index}<LocationTile
            {game}
            placeId={id}
            {index}
            selected={recall.includes(id) || inspected === id}
            reachable={yellow
              ? Boolean(player.assistantsByPlace[id])
              : police
                ? id !== 12
                : fountain
                  ? Boolean(player.assistantsByPlace[id])
                  : reachable.includes(id)}
            actionReady={false}
            actionHint={yellow && player.assistantsByPlace[id]
              ? "Recall · 2 Lira"
              : police && id !== 12
                ? "Send family"
                : fountain && player.assistantsByPlace[id]
                  ? `${recall.filter((place) => place === id).length}/${player.assistantsByPlace[id]} selected`
                  : reachable.includes(id)
                    ? requiredAssistantAction(player, id) === "pick-up"
                      ? "Pick up assistant"
                      : id === 7
                        ? "Visit Fountain"
                        : "Leave assistant"
                    : undefined}
            arrived={id === activePlace && game.phase !== "movement"}
            onclick={(event) => tapRoom(id, event)}
          />{/each}
      </div>
    </fieldset>
    <section
      class="action-area"
      aria-label={`${player.name}'s turn`}
      aria-live="polite"
    >
      <fieldset disabled={undoPending}>
        {#if history}
          <div class="history">
            <h2>Game log</h2>
            {#each [...gameLog].reverse() as entry}<div
                class:undone={!entry.active}
              >
                <span
                  ><strong
                    >{game.players.find((p) => p.uid === entry.ownerUid)
                      ?.name}</strong
                  >
                  · {entry.summary}</span
                >{#if entry.active && !entry.blockedReason && entry.rollbackActorUids.includes(userUid)}<button
                    onclick={() => {
                      onRollback(entry.eventId);
                      history = false;
                    }}>Undo to here</button
                  >{/if}
              </div>{/each}
          </div>
        {:else if game.phase === "game-over"}
          <h2>
            {game.end.winnerUids.length > 1
              ? "Shared victory"
              : `${game.end.rankings[0]?.name} wins!`}
          </h2>
          <ol class="rankings">
            {#each game.end.rankings as standing}<li>
                {standing.rank}. {standing.name} · {standing.rubies} rubies · {standing.lira}
                Lira
              </li>{/each}
          </ol>
          <button class="primary" onclick={onRematch}>Play again</button>
        {:else if game.phase === "movement"}
          {#if yellow}<p>Tap an assistant’s room to recall one for 2 Lira.</p>
            <button onclick={() => (yellow = false)}>Keep assistants</button
            >{:else}<p>Tap a lit room to move there.</p>
            {#if ownsMosqueAbility(player, "fruit")}<button
                disabled={player.lira < 2 ||
                  !Object.keys(player.assistantsByPlace).length}
                onclick={() => (yellow = true)}
                >Recall an assistant · 2 Lira</button
              >{/if}{/if}
        {:else if actionReady}
          {#key `${game.epoch}:${game.turnNumber}:${activePlace}`}<TabletopPlaceActions
              {game}
              {player}
              placeId={activePlace}
              onAction={onTakeAction}
              onSkip={onEndTurn}
            />{/key}
          {#if fountain && recall.length}<button
              class="primary"
              onclick={() =>
                onTakeAction({
                  kind: "fountain-recall",
                  assistantPlaces: recall,
                })}>Recall {recall.length} assistants</button
            >{/if}
        {:else if game.phase === "turn-end"}
          <p>{lastEntry?.summary ?? "Your action is complete."}</p>
          {#if game.lastRoll?.playerUid === player.uid && game.lastRoll.place === activePlace}<div
              class="dice"
              aria-label={`Dice result ${game.lastRoll.dice[0]} and ${game.lastRoll.dice[1]}`}
            >
              <b>{game.lastRoll.dice[0]}</b><b>{game.lastRoll.dice[1]}</b><span
                >+{game.lastRoll.reward}
                {activePlace === 8 ? "jewelry" : "Lira"}</span
              >
            </div>{/if}
          <button class="primary" onclick={onEndTurn}>End turn</button>
        {:else if game.phase === "merchant-payment" && pending?.kind === "merchant-payment"}
          <p>
            Pay {pending.recipientUids
              .map((id) => game.players.find((p) => p.uid === id)?.name)
              .join(", ")}{pending.neutralMerchantIds.length
              ? " and the neutral merchant"
              : ""}.
          </p>
          <button class="primary" onclick={onPayMerchants}
            >Pay {pending.total} Lira</button
          >
        {:else if game.phase === "mosque-ability" && pending?.kind === "warehouse-extra"}
          <p>Take one extra good for 2 Lira.</p>
          <div class="offers">
            {#each goods as good}<button
                aria-label={`Pay 2 Lira for 1 ${good}`}
                disabled={player.lira < 2 ||
                  player.goods[good] >= player.capacity}
                onclick={() =>
                  onUseMosqueAbility({ kind: "warehouse-extra", good })}
                ><GameArt kind="component" component={good} /></button
              >{/each}<button
              onclick={() =>
                onUseMosqueAbility({ kind: "warehouse-extra", good: null })}
              >No extra good</button
            >
          </div>
        {:else if game.phase === "mosque-ability" && pending?.kind === "dice-adjust"}
          <div class="offers">
            <button
              onclick={() =>
                onUseMosqueAbility({
                  kind: "dice-adjust",
                  adjustment: "first-to-four",
                })}>Die {pending.originalDice[0]} → 4</button
            ><button
              onclick={() =>
                onUseMosqueAbility({
                  kind: "dice-adjust",
                  adjustment: "second-to-four",
                })}>Die {pending.originalDice[1]} → 4</button
            ><button
              onclick={() =>
                onUseMosqueAbility({
                  kind: "dice-adjust",
                  adjustment: "reroll",
                })}>Reroll both</button
            ><button
              class="primary"
              onclick={() =>
                onUseMosqueAbility({ kind: "dice-adjust", adjustment: "none" })}
              >Keep {pending.originalDice.join(" + ")}</button
            >
          </div>
        {:else if game.phase === "encounters" && pending?.kind === "encounters"}
          <div class="encounters">
            {#each pending.familyUids as id}<div>
                <strong
                  >{game.players.find((p) => p.uid === id)?.name}’s family</strong
                ><button
                  onclick={() =>
                    onResolveEncounter({
                      kind: "catch-family",
                      familyUid: id,
                      reward: "lira",
                    })}>Catch · +3 Lira</button
                ><button
                  onclick={() =>
                    onResolveEncounter({
                      kind: "catch-family",
                      familyUid: id,
                      reward: "bonus",
                    })}>Catch · +1 Bonus card</button
                >
              </div>{/each}
            {#if pending.governor === "available"}<div>
                <strong>Governor</strong><button
                  onclick={() =>
                    onResolveEncounter({
                      kind: "governor-visit",
                      accept: true,
                    })}>Draw a Bonus card</button
                ><button
                  onclick={() =>
                    onResolveEncounter({
                      kind: "governor-visit",
                      accept: false,
                    })}>Pass Governor</button
                >
              </div>{:else if pending.governor === "payment"}<div>
                <strong>Governor</strong><button
                  disabled={player.lira < 2}
                  onclick={() =>
                    onResolveEncounter({
                      kind: "governor-pay",
                      payment: "lira",
                    })}>Pay 2 Lira</button
                ><span>Or discard a card on your phone.</span>
              </div>{/if}
            {#if pending.smuggler}<div>
                <strong>Smuggler</strong><label
                  >Take<select
                    aria-label="Smuggler good to gain"
                    bind:value={gain}
                    >{#each goods as good}<option
                        value={good}
                        disabled={player.goods[good] >= player.capacity}
                        >{good}</option
                      >{/each}</select
                  ></label
                ><button
                  disabled={player.lira < 2 ||
                    player.goods[gain] >= player.capacity}
                  onclick={() =>
                    onResolveEncounter({
                      kind: "smuggler-trade",
                      accept: true,
                      good: gain,
                      payment: "lira",
                    })}>Pay 2 Lira</button
                ><label
                  >Give<select
                    aria-label="Smuggler payment good"
                    bind:value={payment}
                    >{#each goods as good}<option value={good}>{good}</option
                      >{/each}</select
                  ></label
                ><button
                  disabled={player.goods[gain] >= player.capacity ||
                    player.goods[payment] + (gain === payment ? 1 : 0) < 1}
                  onclick={() =>
                    onResolveEncounter({
                      kind: "smuggler-trade",
                      accept: true,
                      good: gain,
                      payment: "good",
                      paymentGood: payment,
                    })}>Trade</button
                ><button
                  onclick={() =>
                    onResolveEncounter({
                      kind: "smuggler-trade",
                      accept: false,
                    })}>Pass Smuggler</button
                >
              </div>{/if}
          </div>
        {:else if game.phase === "final-bonus"}<p>
            Play any final goods or Lira Bonus cards on your phone.
          </p>
          <button class="primary" onclick={onEndTurn}>Finish trading</button>
        {/if}
      </fieldset>
      {#if publicCard && !history}
        <div class="room-info">
          <strong>{publicCard.title}</strong><span>{publicCard.text}</span
          ><button
            aria-label="Close card details"
            onclick={() => (inspectedCard = null)}>×</button
          >
        </div>
      {/if}
      {#if inspected && !history}{@const info = places.find(
          (place) => place.id === inspected,
        )!}
        <div class="room-info">
          <strong>{info.name}</strong><span>{info.action}</span><button
            aria-label="Close room details"
            onclick={() => (inspected = null)}>×</button
          >
        </div>{/if}
    </section>
    <footer>
      <button
        aria-label={undo ? `Undo ${undo.label}` : "Nothing to undo"}
        disabled={!canUndo}
        onclick={onUndo}>↶ Undo</button
      ><span class="last-move"
        >{game.phase === "movement"
          ? (lastEntry?.summary ?? "The bazaar is open.")
          : (undo?.blockedReason ?? "")}</span
      ><button aria-expanded={history} onclick={() => (history = !history)}
        >{history ? "Back to play" : "Game log"}</button
      >
    </footer>
  </div>
</section>

<style>
  .tabletop-surface {
    font-family: "Atkinson Hyperlegible", sans-serif;
    container-type: size;
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    background:
      linear-gradient(#062425d9, #062425e8),
      var(--courtyard) center/cover;
    color: #fff5da;
  }
  .playfield {
    position: absolute;
    width: 66cqw;
    height: 64cqh;
    left: 50%;
    top: 50%;
    translate: -50% -50%;
    transform: rotate(var(--facing));
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    gap: 0.45em;
    font-size: clamp(0.85rem, 1.7cqmin, 2.2rem);
  }
  .playfield[data-facing="90"],
  .playfield[data-facing="-90"] {
    width: 64cqh;
    height: 66cqw;
  }
  header {
    display: flex;
    align-items: center;
    gap: 0.6em;
    min-width: 0;
  }
  header h1 {
    font:
      700 1.25em "Cormorant Garamond",
      serif;
    margin: 0;
    flex: 1;
  }
  header > span:last-child {
    font-size: 0.75em;
  }
  header strong {
    font-size: 0.95em;
  }
  .player-dot {
    width: 0.8em;
    height: 0.8em;
    border-radius: 50%;
    background: #a63e3a;
  }
  .saffron {
    background: #c98c28;
  }
  .teal {
    background: #28796f;
  }
  .indigo {
    background: #43588f;
  }
  .plum {
    background: #73466e;
  }
  fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .board-field {
    min-height: 0;
  }
  .board {
    height: 100%;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    grid-template-rows: repeat(4, minmax(0, 1fr));
    gap: 0.4em;
  }
  .board :global(.place) {
    padding: 0.3em;
  }
  .board :global(.place > strong) {
    font-size: 1em;
  }
  .board :global(.action-ready-label) {
    font-size: 0.65em;
    padding: 0.15em 0.3em;
    bottom: 0.25em;
    text-transform: none;
    letter-spacing: 0;
  }
  .board :global(.place-number) {
    font-size: 0.8em;
    width: 1.5em;
    height: 1.5em;
  }
  .board :global(.occupants) {
    height: 3em;
  }
  .board :global(.occupants .merchant) {
    width: 3em;
    height: 3em;
  }
  .board :global(.occupants .assistant),
  .board :global(.occupants .family-member) {
    width: 2.3em;
    height: 2.3em;
  }
  .board :global(.encounter) {
    width: 2.6em;
    height: 2.6em;
  }
  .board :global(.place.reachable) {
    box-shadow: 0 0 0 2px #efca7d88;
  }
  .board :global(.place:not(.reachable):not(.arrived)) {
    filter: saturate(0.8);
  }
  .action-area {
    min-height: 5em;
    max-height: 20cqh;
    overflow: auto;
    background: #0a2929e8;
    border-top: 2px solid #d6b768;
    border-radius: 0.3em;
    padding: 0.6em;
    box-sizing: border-box;
  }
  .action-area > fieldset {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5em;
  }
  .action-area p {
    margin: 0.2em 0;
    flex: 1;
  }
  button,
  select {
    font: inherit;
    border: 1px solid #9abaaa;
    color: #fff3d4;
    background: #19443e;
    padding: 0.5em 0.75em;
    border-radius: 0.5em;
    min-height: 2.75rem;
    cursor: pointer;
  }
  button.primary {
    background: #efd28e;
    color: #123733;
    border-color: #efd28e;
  }
  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
  button:focus-visible,
  select:focus-visible {
    outline: 3px solid white;
    outline-offset: 2px;
  }
  footer {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
  footer button {
    font-size: 0.85em;
  }
  .last-move {
    flex: 1;
    font-size: 0.75em;
  }
  .offers {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    gap: 0.4em;
  }
  .offers :global(.game-art) {
    width: 2.5em;
    height: 2.5em;
  }
  .dice {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
  .dice b {
    padding: 0.4em;
    background: #fff3d4;
    color: #123733;
    border-radius: 0.2em;
  }
  .encounters {
    width: 100%;
    display: grid;
    gap: 0.5em;
  }
  .encounters > div {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4em;
  }
  .encounters strong {
    min-width: 5em;
  }
  .encounters label {
    display: flex;
    align-items: center;
    gap: 0.2em;
  }
  .encounters button,
  .encounters select {
    font-size: 0.85em;
  }
  .history {
    width: 100%;
  }
  .history h2 {
    font-size: 1.1em;
    margin: 0;
  }
  .history > div {
    display: flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.4em 0;
    border-bottom: 1px solid #ffffff22;
  }
  .history > div span {
    flex: 1;
  }
  .undone {
    opacity: 0.5;
  }
  .rankings {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .room-info {
    display: flex;
    gap: 0.6em;
    align-items: center;
    font-size: 0.85em;
    padding-top: 0.5em;
  }
  .room-info span {
    flex: 1;
  }
  .room-info button {
    min-height: 2rem;
  }
  @media (max-width: 600px) {
    .playfield,
    .playfield[data-facing="90"],
    .playfield[data-facing="-90"] {
      width: 94cqw;
      height: 68cqh;
      top: 30%;
      translate: -50% 0;
      transform: none;
      font-size: 0.7rem;
    }
    .action-area {
      max-height: 24cqh;
    }
    .board :global(.place > strong) {
      font-size: 0.65rem;
    }
    .board :global(.occupants .merchant) {
      width: 2em;
      height: 2em;
    }
    .board :global(.occupants .assistant),
    .board :global(.occupants .family-member) {
      width: 1.7em;
      height: 1.7em;
    }
    .board :global(.encounter) {
      width: 1.6em;
      height: 1.6em;
    }
    button,
    select {
      min-height: 2.2rem;
    }
    header h1 {
      font-size: 1.1em;
    }
  }
</style>
