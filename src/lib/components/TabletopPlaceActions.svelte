<script lang="ts">
  import {
    marketRevenueFor,
    postOfficeRows,
    warehouseGood,
    type PlaceActionChoice,
  } from "$lib/game/actions";
  import { demandTiles, mosqueTiles, type Good } from "$lib/game/manifests";
  import { defaultMarketSelection } from "$lib/game/market-selection";
  import { ownsMosqueAbility } from "$lib/game/mosques";
  import { currentSultanCost } from "$lib/game/ruby-routes";
  import type { GameSetup, SetupPlayer } from "$lib/game/setup";
  import GameArt from "./GameArt.svelte";
  let {
    game,
    player,
    placeId,
    onAction,
    onSkip,
  }: {
    game: GameSetup;
    player: SetupPlayer;
    placeId: number;
    onAction: (choice: PlaceActionChoice) => void;
    onSkip: () => void;
  } = $props();
  const goods: Good[] = ["fabric", "spice", "fruit", "jewelry"];
  const warehouse = $derived(warehouseGood(placeId));
  const demand = $derived(
    demandTiles.find(
      (tile) =>
        tile.id ===
        (placeId === 10 ? game.largeDemand[0] : game.smallDemand[0]),
    ),
  );
  let selected = $state<number[]>([]),
    wild = $state<Good[]>([]),
    wager = $state(7);
  const flexible = $derived(
    placeId === 11 && game.activeBonusEffects.includes("wild-small-market"),
  );
  $effect(() => {
    selected = defaultMarketSelection(demand?.goods ?? [], player.goods);
    wild = [...(demand?.goods ?? [])];
  });
  const payment = $derived(
    (demand?.goods ?? []).map((good, i) =>
      flexible ? (wild[i] ?? good) : good,
    ),
  );
  const marketLegal = $derived(
    selected.length > 0 &&
      goods.every(
        (good) =>
          selected.filter((i) => payment[i] === good).length <=
          player.goods[good],
      ),
  );
  const cost = $derived(currentSultanCost(game));
  let sultanWild = $state<Good[]>([]);
  const resolvedWild = $derived.by(() => {
    const remaining = Object.fromEntries(
      goods.map((good) => [
        good,
        player.goods[good] - cost.filter((item) => item === good).length,
      ]),
    ) as Record<Good, number>;
    return cost
      .filter((good) => good === "any")
      .map((_, i) => {
        const good =
          sultanWild[i] ??
          goods.find((good) => remaining[good] > 0) ??
          "fabric";
        remaining[good] -= 1;
        return good;
      });
  });
  const affordable = $derived(
    goods.every(
      (good) =>
        player.goods[good] >=
        cost.filter((item) => item === good).length +
          resolvedWild.filter((item) => item === good).length,
    ),
  );
</script>

<div class="choices" aria-label="Place action">
  {#if warehouse}
    <button
      class="offer primary"
      onclick={() => onAction({ kind: "warehouse-fill", good: warehouse })}
      aria-label={`Fill ${warehouse} to ${player.capacity}`}
      ><GameArt kind="component" component={warehouse} /><span
        >Fill {warehouse}<b>{player.goods[warehouse]} → {player.capacity}</b
        ></span
      ></button
    >
  {:else if placeId === 1}
    <button
      class="offer primary"
      disabled={player.lira < 7 ||
        player.extensions >= 3 ||
        game.supplies.wheelbarrowExtensions < 1}
      onclick={() => onAction({ kind: "wainwright-buy" })}
      ><GameArt kind="component" component="wheelbarrow" /><span
        >Extend all tracks<b>7 Lira · capacity {player.capacity + 1}</b></span
      ></button
    >
  {:else if placeId === 5}
    <button
      class="offer primary"
      onclick={() => onAction({ kind: "post-office-collect" })}
      ><span>Collect</span>{#each postOfficeRows as rows, i}{@const reward =
          rows[game.postOfficeLower[i] ? 1 : 0]}<span class="reward"
          ><GameArt
            kind="component"
            component={reward.good ?? "lira"}
          />{#if !reward.good}<b>{reward.lira}</b>{/if}</span
        >{/each}</button
    >
  {:else if placeId === 6}
    <p>Choose your Bonus cards on your phone.</p>
  {:else if placeId === 7}
    <button
      class="offer primary"
      onclick={() =>
        onAction({
          kind: "fountain-recall",
          assistantPlaces: Object.entries(player.assistantsByPlace).flatMap(
            ([place, count]) => Array(count).fill(Number(place)),
          ),
        })}>Recall all assistants</button
    >
    <p>Tap a room once per assistant to recall; tap again to clear.</p>
  {:else if placeId === 8}
    <p>Take a good and roll for jewelry.</p>
    {#each goods.slice(0, 3) as good}<button
        class="offer primary"
        aria-label={`Take ${good} and roll`}
        onclick={() =>
          onAction({
            kind: "black-market-roll",
            good: good as Exclude<Good, "jewelry">,
          })}
        ><GameArt kind="component" component={good} /><span>+1 & roll</span
        ></button
      >{/each}
  {:else if placeId === 9}
    <div class="wagers" aria-label="Tea House wager">
      {#each Array.from({ length: 10 }, (_, i) => i + 3) as n}<button
          class:selected={wager === n}
          aria-pressed={wager === n}
          onclick={() => (wager = n)}>{n}</button
        >{/each}
    </div>
    <button
      class="primary"
      onclick={() => onAction({ kind: "tea-house-wager", wager })}
      >Roll for {wager} Lira</button
    ><small>Roll {wager}+ to win; otherwise gain 2 Lira.</small>
  {:else if placeId === 10 || placeId === 11}
    <div class="demand">
      {#each demand?.goods ?? [] as good, i}<div>
          <button
            class:selected={selected.includes(i)}
            aria-pressed={selected.includes(i)}
            aria-label={`Sell demand slot ${i + 1}: ${payment[i]}`}
            onclick={() =>
              (selected = selected.includes(i)
                ? selected.filter((slot) => slot !== i)
                : [...selected, i])}
            ><GameArt kind="component" component={payment[i]} /><span
              >{selected.includes(i) ? "✓" : "−"}</span
            ></button
          >{#if flexible}<select
              aria-label={`Payment for demand slot ${i + 1}`}
              bind:value={wild[i]}
              >{#each goods as option}<option value={option}>{option}</option
                >{/each}</select
            >{/if}
        </div>{/each}
    </div>
    <button
      class="primary"
      disabled={!marketLegal}
      onclick={() =>
        onAction({
          kind: "market-sell",
          slotIndexes: selected,
          ...(flexible ? { wildGoods: selected.map((i) => payment[i]) } : {}),
        })}>Sell · {marketRevenueFor(placeId, selected.length)} Lira</button
    >
  {:else if placeId === 12}
    <p>
      {player.familyPlace === 12
        ? "Tap a room to send your family there."
        : "Your family is already in the bazaar."}
    </p>
  {:else if placeId === 13}
    <div class="cost">
      {#each cost as good, i}{#if good !== "any"}<GameArt
            kind="component"
            component={good}
          />{:else}{@const index = cost
            .slice(0, i)
            .filter((g) => g === "any").length}<select
            aria-label={`Sultan wild good ${index + 1}`}
            value={resolvedWild[index]}
            onchange={(event) =>
              (sultanWild[index] = event.currentTarget.value as Good)}
            >{#each goods as option}<option value={option}>{option}</option
              >{/each}</select
          >{/if}{/each}<span>→</span><GameArt
        kind="component"
        component="ruby"
      />
    </div>
    <button
      class="primary"
      disabled={!affordable}
      onclick={() => onAction({ kind: "sultan-buy", wildGoods: resolvedWild })}
      >Deliver goods</button
    >
  {:else if placeId === 14 || placeId === 15}
    {#each placeId === 14 ? ["fabric", "spice"] : ["fruit", "jewelry"] as color}{@const good =
        color as Good}{@const tile = mosqueTiles.find(
        (tile) => tile.id === game.mosqueStacks[good][0],
      )}<button
        class="offer"
        disabled={!tile ||
          ownsMosqueAbility(player, good) ||
          player.goods[good] < tile.required}
        onclick={() =>
          tile && onAction({ kind: "mosque-take", tileId: tile.id })}
        ><GameArt kind="component" component={`mosque-${good}`} /><span
          >{tile?.ability ?? "Sold out"}<b
            >{ownsMosqueAbility(player, good)
              ? "Owned"
              : `Hold ${tile?.required ?? 0}; pay 1 ${good}`}</b
          ></span
        ></button
      >{/each}
  {:else if placeId === 16}
    <button
      class="offer primary"
      disabled={player.lira < game.rubyTracks.gemstonePrice}
      onclick={() => onAction({ kind: "gemstone-buy" })}
      ><GameArt kind="component" component="ruby" /><span
        >Buy ruby<b>{game.rubyTracks.gemstonePrice} Lira</b></span
      ></button
    >
  {/if}
  <button class="skip" onclick={onSkip}>Skip & end turn</button>
</div>

<style>
  .choices {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.5em;
    width: 100%;
    min-width: 0;
  }
  .choices p {
    margin: 0;
    max-width: 22em;
    font-size: 0.9em;
  }
  .choices small {
    font-size: 0.75em;
  }
  button,
  select {
    font: inherit;
    color: #fff5da;
    background: #194943;
    border: 1px solid #8bac98;
    border-radius: 0.5em;
    padding: 0.5em 0.7em;
    min-height: 2.75rem;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .primary,
  button.selected {
    background: #efd28e;
    color: #163b37;
    border-color: #efd28e;
  }
  .offer {
    display: flex;
    align-items: center;
    gap: 0.5em;
    text-align: left;
    max-width: 47%;
  }
  .offer > span {
    display: grid;
    gap: 0.2em;
  }
  .offer b {
    font-size: 0.8em;
  }
  .offer :global(.game-art) {
    width: 3em;
    height: 3em;
    flex-shrink: 0;
  }
  .offer .reward {
    position: relative;
  }
  .reward b {
    position: absolute;
    bottom: 0;
    right: 0;
  }
  .skip {
    font-size: 0.8em;
    background: transparent;
    margin-left: auto;
  }
  .wagers {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.2em;
  }
  .wagers button {
    padding: 0.3em;
    min-width: 2.75rem;
  }
  .demand {
    display: flex;
    gap: 0.25em;
  }
  .demand > div {
    display: grid;
    gap: 0.2em;
  }
  .demand button {
    position: relative;
    padding: 0.2em;
  }
  .demand :global(.game-art) {
    width: 2.6em;
    height: 2.6em;
  }
  .demand button span {
    position: absolute;
    bottom: 0;
    right: 0.15em;
  }
  .demand select {
    max-width: 5em;
    font-size: 0.65em;
  }
  .cost {
    display: flex;
    align-items: center;
    gap: 0.2em;
  }
  .cost :global(.game-art) {
    width: 2em;
    height: 2em;
  }
  .cost select {
    max-width: 6em;
    font-size: 0.8em;
  }
  button:focus-visible,
  select:focus-visible {
    outline: 3px solid white;
    outline-offset: 2px;
  }
  @media (max-width: 600px) {
    .choices {
      gap: 0.3em;
    }
    button,
    select {
      min-height: 2.2rem;
      padding: 0.3em;
    }
    .offer :global(.game-art) {
      width: 2em;
      height: 2em;
    }
    .demand :global(.game-art) {
      width: 2em;
      height: 2em;
    }
    .wagers button {
      min-width: 2rem;
    }
    .skip {
      margin-left: 0;
    }
    .offer {
      max-width: 100%;
    }
  }
</style>
