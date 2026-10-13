<script lang="ts">
  import { base } from "$app/paths";
  import { places, bonusCards, type Good } from "$lib/game/manifests";
  import { locationArt, type PlayerColorName } from "$lib/game/art";
  import {
    merchantToll,
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
  import { tableSeat } from "./table-layout";
  import LocationTile from "./LocationTile.svelte";
  import TabletopPlayerPanel from "./TabletopPlayerPanel.svelte";
  import TabletopPlaceActions from "./TabletopPlaceActions.svelte";
  import GameArt from "./GameArt.svelte";
  import TabletopArrow from "./TabletopArrow.svelte";
  import BonusCard from "./BonusCard.svelte";
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
  const canControl = $derived(userUid === player.uid || (room.tabletopOwned && userUid === room.hostUid));
  const busy = $derived(undoPending || !canControl);
  const seat = $derived(tableSeat(game, room, game.turnSeat));
  const pending = $derived(game.pending);
  const activePlace = $derived(
    pending?.kind === "caravansary-discard"
      ? 6
      : pending?.kind === "family-action"
        ? pending.destination
        : pending?.kind === "warehouse-extra" || pending?.kind === "dice-adjust"
          ? pending.actionPlace
          : game.phase === "turn-end" &&
              game.lastAction?.playerUid === player.uid
            ? game.lastAction.place
            : player.merchantPlace,
  );
  const warehouseEncounters = $derived(
    pending?.kind === "warehouse-extra" && !pending.familyAction
      ? {
          kind: "encounters" as const,
          familyUids: game.players
            .filter(
              (p) =>
                p.uid !== player.uid &&
                p.familyPlace === activePlace &&
                activePlace !== 12,
            )
            .map((p) => p.uid),
          governor:
            game.governorPlace === activePlace ? ("available" as const) : null,
          smuggler: game.smugglerPlace === activePlace,
        }
      : null,
  );
  const actionReady = $derived(
    game.phase === "action" || game.phase === "family-action",
  );
  const reachable = $derived(
    game.phase === "movement" ? legalDestinations(game, player) : [],
  );
  const canUndo = $derived(
    Boolean(
      undo &&
      !undo.blockedReason &&
      undo.actorUids.includes(userUid) &&
      !undoPending,
    ),
  );
  const canEnd = $derived(
    pending?.kind !== "caravansary-discard" &&
      (["action", "family-action", "turn-end", "final-bonus"].includes(
        game.phase,
      ) ||
        (pending?.kind === "warehouse-extra" &&
          !game.players.some(
            (p) =>
              p.uid !== player.uid &&
              p.familyPlace === player.merchantPlace &&
              p.familyPlace !== 12,
          )) ||
        (pending?.kind === "encounters" &&
          pending.governor !== "payment" &&
          !pending.familyUids.length)),
  );
  let zoom = $state<number | null>(null),
    zoomAngle = $state(0),
    history = $state(false),
    yellow = $state(false),
    power = $state<Good | null>(null),
    inspectedCard = $state<string | null>(null);
  let arrivalContext = $state("");
  let context = $state(""),
    gain = $state<Good>("fabric"),
    smuggler = $state(false);
  const publicCard = $derived(bonusCards.find((c) => c.id === inspectedCard));
  const title = $derived(places.find((p) => p.id === zoom)?.name ?? "");
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
    }
    const arrival = `${next}:${game.phase}:${activePlace}:${seat.angle}`;
    if (arrival !== arrivalContext) {
      arrivalContext = arrival;
      if (game.phase !== "movement" && game.phase !== "game-over") {
        zoom = activePlace;
        zoomAngle = seat.angle;
      }
    }
  });
  // Manual collapse stays collapsed until the next arrival/phase, without changing the board.
  let collapsed = $state(false);
  $effect(() => {
    game.turnNumber;
    collapsed = game.phase === "movement";
  });
  function open(id = activePlace) {
    zoom = id;
    zoomAngle = seat.angle;
    collapsed = false;
    power = null;
  }
  function tapRoom(id: number, event: MouseEvent) {
    if (busy) return;
    const card = (event.target as HTMLElement).closest<HTMLElement>(
      "[data-inspect-pile-card]",
    )?.dataset.inspectPileCard;
    if (card && !reachable.includes(id)) {
      inspectedCard = card;
      open(id);
      return;
    }
    if (yellow) {
      if (player.assistantsByPlace[id]) {
        onUseMosqueAbility({ kind: "yellow-recall", place: id });
        yellow = false;
      }
      return;
    }
    if (reachable.includes(id)) {
      const assistant = requiredAssistantAction(player, id);
      if (assistant) {
        open(id);
        if (merchantToll(game, player, id) <= player.lira) onMove(id, assistant);
      }
      return;
    }
    open(id);
  }
  function showPower(good: Good) {
    if (
      good === "fruit" &&
      game.phase === "movement" &&
      !game.abilitiesUsedThisTurn.includes("fruit") &&
      player.lira >= 2
    ) {
      yellow = !yellow;
      collapsed = true;
      return;
    }
    open();
    power = good;
  }
  function tileZoom(
    _node: Element,
    { id, angle }: { id: number; angle: number },
  ) {
    const index = game.board.indexOf(id),
      x = (((index % 4) + 0.5) / 4 - 0.5) * 66,
      y = ((Math.floor(index / 4) + 0.5) / 4 - 0.5) * 36.56;
    const shortest = ((((angle + 180) % 360) + 360) % 360) - 180;
    return {
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 260,
      css: (t: number) =>
        `transform:translate(-50%,-50%) translate(${x * (1 - t)}cqw,${y * (1 - t)}cqw) scale(${0.45 + 0.55 * t}) rotate(${shortest * t}deg)`,
    };
  }
</script>

{#snippet encounterChoices(
  encounters: Extract<GameSetup["pending"], { kind: "encounters" }>,
)}
  {#each encounters.familyUids as uid}{@const family = game.players.find(
      (p) => p.uid === uid,
    )!}
    <div class="row">
      <GameArt
        kind="piece"
        piece="family"
        color={family.color as PlayerColorName}
      /><button
        aria-label="Catch family for 3 Lira"
        onclick={() =>
          onResolveEncounter({
            kind: "catch-family",
            familyUid: uid,
            reward: "lira",
          })}><GameArt kind="component" component="lira" />+3</button
      ><button
        class="card-choice small-card"
        aria-label="Catch family for a Bonus card"
        onclick={() =>
          onResolveEncounter({
            kind: "catch-family",
            familyUid: uid,
            reward: "bonus",
          })}><BonusCard reverse="card-back" /></button
      >
    </div>{/each}
  {#if encounters.governor === "payment"}<div class="row">
      <GameArt kind="piece" piece="governor" />
      <div class="small-card"><BonusCard reverse="card-back" /></div>
      <button
        class="primary"
        disabled={player.lira < 2}
        onclick={() =>
          onResolveEncounter({ kind: "governor-pay", payment: "lira" })}
        ><GameArt kind="component" component="lira" />Pay 2 & roll</button
      >
    </div>
    <p>Or discard a card from your phone.</p>
  {:else}
    {#if encounters.governor === "available"}<div class="row">
        <GameArt kind="piece" piece="governor" /><button
          class="card-choice small-card"
          aria-label="Draw a Bonus card from the Governor"
          onclick={() =>
            onResolveEncounter({ kind: "governor-visit", accept: true })}
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
      {#if smuggler}<p>Pay & roll</p>
        <div class="goods">
          <button
            aria-label="Smuggler: pay 2 Lira"
            disabled={player.lira < 2 || player.goods[gain] >= player.capacity}
            onclick={() => {
              onResolveEncounter({
                kind: "smuggler-trade",
                accept: true,
                good: gain,
                payment: "lira",
              });
              smuggler = false;
            }}><GameArt kind="component" component="lira" />2</button
          >{#each goods as good}<button
              aria-label={`Smuggler: pay 1 ${good}`}
              disabled={!player.goods[good] ||
                player.goods[gain] >= player.capacity}
              onclick={() => {
                onResolveEncounter({
                  kind: "smuggler-trade",
                  accept: true,
                  good: gain,
                  payment: "good",
                  paymentGood: good,
                });
                smuggler = false;
              }}><GameArt kind="component" component={good} /></button
            >{/each}
        </div>{/if}{/if}
  {/if}
{/snippet}
<svelte:window
  onkeydown={(e) => {
    if (e.key === "Escape") {
      collapsed = true;
      history = false;
      power = null;
    }
  }}
/>
<section
  class="tabletop-surface"
  aria-label="Shared Istanbul table"
  data-e2e-fit
  data-e2e-no-scroll
>
  <div
    class="table"
    style={`--courtyard:url('${base}/art/bazaar-courtyard.png')`}
  >
    {#if !canControl}<p class="table-hint">Watching this table · Play from the browser that opened it.</p>{/if}
    <TabletopPlayerPanel
      {game}
      {room}
      {canUndo}
      {canEnd}
      {busy}
      {onUndo}
      onEnd={onEndTurn}
      onPower={showPower}
      onOpen={() => open()}
    />
    <fieldset
      class="board"
      aria-label="Bazaar"
      disabled={busy}
      data-testid="bazaar-board"
    >
      {#each game.board as id, index}<LocationTile
          {game}
          placeId={id}
          {index}
          reachable={yellow
            ? Boolean(player.assistantsByPlace[id])
            : reachable.includes(id)}
          selected={zoom === id && !collapsed}
          arrived={id === activePlace && game.phase !== "movement"}
          onclick={(e) => tapRoom(id, e)}
        />{/each}
    </fieldset>
    {#if yellow}<div class="table-hint">
        <GameArt kind="component" component="mosque-fruit" /><span
          >Tap an assistant’s room · 2 Lira</span
        ><button onclick={() => (yellow = false)}>×</button>
      </div>{/if}
    {#if zoom !== null && !collapsed}
      {#key `${zoom}-${zoomAngle}`}
        <section
          class="zoom-tile"
          aria-label={`${title} actions`}
          style={`--facing:${zoomAngle}deg;background-image:url('${base}/${locationArt[zoom]}')`}
          transition:tileZoom={{ id: zoom, angle: zoomAngle }}
        >
          <header>
            <h1>{title}</h1>
            <button
              aria-label="Back to table"
              onclick={() => (collapsed = true)}><TabletopArrow back /></button
            >
          </header>
          <fieldset class="room-flow" disabled={busy}>
            <div class="content" aria-live="polite">
              {#if publicCard}<div class="public-card">
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
                    fabric: "After a roll, turn a die to 4 or reroll both.",
                    spice: "At a warehouse, pay 2 Lira for an extra good.",
                    fruit: "Once each turn, pay 2 Lira to recall an assistant.",
                    jewelry: "Your fifth assistant joins your merchant.",
                  }[power]}
                </p>
                <button onclick={() => (power = null)}>Back</button>
              {:else if game.phase === "movement" && reachable.includes(zoom) && merchantToll(game, player, zoom) > player.lira}
                <div class="components">
                  {#each game.neutralMerchants.filter((merchant) => merchant.place === zoom) as merchant (merchant.id)}
                    <GameArt kind="piece" piece="neutral-merchant" />
                  {/each}
                  {#each game.players.filter((other) => other.uid !== player.uid && other.merchantPlace === zoom) as other (other.uid)}
                    <GameArt kind="piece" piece="merchant" color={other.color as PlayerColorName} />
                  {/each}
                </div>
                <p>You have {player.lira} Lira; the merchants here require {merchantToll(game, player, zoom)}. Moving here ends your turn without an action.</p>
                <button class="primary" onclick={() => {
                  const assistant = requiredAssistantAction(player, zoom!);
                  if (assistant) onMove(zoom!, assistant);
                }}>Move here & lose this turn</button>
                <button onclick={() => (collapsed = true)}>Choose another room</button>
              {:else if zoom !== activePlace || game.phase === "movement"}<p>
                  {places.find((p) => p.id === zoom)?.action}
                </p>
              {:else if actionReady}{#key `${game.epoch}:${game.turnNumber}:${activePlace}`}<TabletopPlaceActions
                    {game}
                    {player}
                    placeId={activePlace}
                    onAction={onTakeAction}
                    onSkip={onEndTurn}
                  />{/key}
              {:else if game.phase === "merchant-payment" && pending?.kind === "merchant-payment"}
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
              {:else if pending?.kind === "warehouse-extra"}
                <p>{game.lastAction?.summary}</p>
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
                        onUseMosqueAbility({ kind: "warehouse-extra", good })}
                      ><GameArt kind="component" component={good} /></button
                    >{/each}
                </div>
                {#if warehouseEncounters}{@render encounterChoices(
                    warehouseEncounters,
                  )}{/if}
              {:else if pending?.kind === "dice-adjust"}
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
                          kind: "dice-adjust",
                          adjustment:
                            i === 0 ? "first-to-four" : "second-to-four",
                        })}
                      ><b>{["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][die]}</b><small
                        >→ ⚃</small
                      ></button
                    >{/each}
                </div>
                <div class="row">
                  <button
                    onclick={() =>
                      onUseMosqueAbility({
                        kind: "dice-adjust",
                        adjustment: "reroll",
                      })}>Reroll both</button
                  ><button
                    class="primary"
                    onclick={() =>
                      onUseMosqueAbility({
                        kind: "dice-adjust",
                        adjustment: "none",
                      })}>Keep dice</button
                  >
                </div>
              {:else if pending?.kind === "encounters"}{@render encounterChoices(
                  pending,
                )}
              {:else if game.phase === "turn-end"}<p>
                  {game.lastAction?.summary}
                </p>
                {#if game.lastRoll?.playerUid === player.uid && game.lastRoll.place === activePlace}<div
                    class="dice"
                  >
                    {#each game.lastRoll.dice as die}<b
                        >{["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"][die]}</b
                      >{/each}
                  </div>{/if}
              {:else if game.phase === "final-bonus"}<div class="small-card">
                  <BonusCard reverse="card-back" />
                </div>
                <p>Play your final cards on your phone.</p>{/if}
            </div>
            <footer>
              <button
                aria-label={undo ? `Undo ${undo.label}` : "Nothing to undo"}
                disabled={!canUndo}
                onclick={onUndo}>↶ Undo</button
              >{#if canEnd}<button class="primary" onclick={onEndTurn}
                  >{game.phase === "final-bonus"
                    ? "Finish trading"
                    : "End turn"}
                  <TabletopArrow /></button
                >{/if}
            </footer>
          </fieldset>
        </section>
      {/key}
    {/if}
    <span class="last-move"
      >{game.phase === "movement"
        ? (gameLog.filter((e) => e.active).at(-1)?.summary ??
          "Move your merchant")
        : ""}</span
    >
    <button
      class="log-toggle"
      onclick={() => (history = !history)}
      aria-expanded={history}>Game log</button
    >
    {#if history}<section
        class="history"
        style={`transform:translate(-50%,-50%) rotate(${seat.angle}deg)`}
      >
        <header>
          <h2>Game log</h2>
          <button onclick={() => (history = false)}>×</button>
        </header>
        {#each [...gameLog].reverse() as entry}<p class:undone={!entry.active}>
            {entry.summary}{#if entry.active && !entry.blockedReason && entry.rollbackActorUids.includes(userUid)}<button
                disabled={busy}
                onclick={() => {
                  onRollback(entry.eventId);
                  history = false;
                }}>Undo to here</button
              >{/if}
          </p>{/each}
      </section>{/if}
    {#if game.phase === "game-over"}<section class="finish">
        <h1>{game.end.rankings[0]?.name} wins!</h1>
        {#each game.end.rankings as standing}<p>
            {standing.name} · {standing.rubies} rubies · {standing.lira} Lira
          </p>{/each}<button onclick={onRematch}>Play again</button>
      </section>{/if}
  </div>
</section>

<style>
  .tabletop-surface {
    width: 100%;
    height: 100%;
    container-type: size;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: #071b17;
    color: #f6e8c4;
    font-family: "Atkinson Hyperlegible", sans-serif;
  }
  .table {
    position: relative;
    width: min(100cqw, 177.7778cqh);
    aspect-ratio: 16/9;
    container-type: inline-size;
    background:
      radial-gradient(ellipse at center, #17392dda, #091f1ae8),
      var(--courtyard) center/cover;
    isolation: isolate;
  }
  fieldset {
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }
  .board {
    position: absolute;
    left: 17%;
    top: 17%;
    width: 66%;
    height: 65%;
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
  .board :global(.place > strong) {
    font:
      700 6cqw "Cormorant Garamond",
      serif;
    text-shadow:
      0 1px 3px #000,
      0 0 5px #000;
  }
  .board :global(.place-number) {
    width: 7cqw;
    height: 7cqw;
    font-size: 4cqw;
  }
  .board :global(.occupants) {
    inset: 22% 8%;
    height: auto;
    align-items: center;
  }
  .board :global(.occupants .merchant) {
    width: 24cqw;
    height: 24cqw;
  }
  .board :global(.occupants .assistant),
  .board :global(.occupants .family-member) {
    width: 13cqw;
    height: 13cqw;
  }
  .board :global(.encounter) {
    width: 12cqw;
    height: 16cqw;
  }
  .board :global(.place:hover .place-art) {
    scale: 1;
  }
  .zoom-tile {
    position: absolute;
    z-index: 10;
    left: 50%;
    top: 49.5%;
    width: 34cqw;
    height: 34cqw;
    transform: translate(-50%, -50%) rotate(var(--facing));
    background-size: cover;
    background-position: center;
    border: 1px solid #947d49;
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
    inset: 0 0 auto;
    padding: 0.7cqw 1cqw;
  }
  .zoom-tile h1 {
    margin: 0;
    font:
      700 2.1cqw "Cormorant Garamond",
      serif;
  }
  .zoom-tile > header button {
    width: 2.7cqw;
    height: 2.7cqw;
    border-radius: 50%;
    font-size: 1.6cqw;
    padding: 0;
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
  .room-flow {
    position: absolute;
    inset: 4.4cqw 0 0;
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
  .last-move {
    position: absolute;
    left: 18%;
    bottom: 1%;
    max-width: 18%;
    font-size: 0.65cqw;
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
  .log-toggle {
    position: absolute;
    right: 1%;
    bottom: 1%;
    font-size: 0.65cqw;
  }
  .history,
  .finish {
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
  .finish {
    transform: translate(-50%, -50%);
  }
  .finish h1 {
    font-size: 2cqw;
  }
</style>
