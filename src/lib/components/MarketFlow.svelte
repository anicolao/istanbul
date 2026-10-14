<script lang="ts">
  import { demandTiles, type Good } from '$lib/game/manifests';
  import { marketRevenueFor, type PlaceActionChoice } from '$lib/game/actions';
  import { defaultMarketSelection } from '$lib/game/market-selection';
  import type { GameSetup, SetupPlayer } from '$lib/game/setup';
  import MarketDemand from './MarketDemand.svelte';
  let {
    game,
    player,
    placeId,
    active = false,
    disabled = false,
    onAction = () => {}
  }: {
    game: GameSetup;
    player: SetupPlayer;
    placeId: 10 | 11;
    active?: boolean;
    disabled?: boolean;
    onAction?: (choice: PlaceActionChoice) => void;
  } = $props();
  const kinds: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
  const demand = $derived(
    demandTiles.find(
      (t) =>
        t.id === (placeId === 10 ? game.largeDemand[0] : game.smallDemand[0])
    )
  );
  const flexible = $derived(
    placeId === 11 && game.activeBonusEffects.includes('wild-small-market')
  );
  let selected = $state<number[]>([]);
  let wild = $state<Good[]>([]);
  $effect(() => {
    selected = defaultMarketSelection(demand?.goods ?? [], player.goods);
    wild = [...(demand?.goods ?? [])];
  });
  const payment = $derived(
    (demand?.goods ?? []).map((good, i) =>
      flexible ? (wild[i] ?? good) : good
    )
  );
  const legal = $derived(
    selected.length > 0 &&
      kinds.every(
        (good) =>
          selected.filter((i) => payment[i] === good).length <=
          player.goods[good]
      )
  );
</script>

<span class="market-flow">
  <span class="coin-source" data-market-coins aria-hidden="true"></span>
  <MarketDemand
    market={placeId === 10 ? 'large' : 'small'}
    goods={demand?.goods ?? []}
    fluid
    interactive={active}
    {disabled}
    {selected}
    {payment}
    {flexible}
    onToggle={(i) =>
      (selected = selected.includes(i)
        ? selected.filter((slot) => slot !== i)
        : [...selected, i])}
    onCycle={(i) => (wild[i] = kinds[(kinds.indexOf(payment[i]) + 1) % 4])}
  />
  {#if active}<button
      class="sell"
      disabled={disabled || !legal}
      onclick={() =>
        onAction({
          kind: 'market-sell',
          slotIndexes: selected,
          ...(flexible ? { wildGoods: selected.map((i) => payment[i]) } : {})
        })}>Sell · {marketRevenueFor(placeId, selected.length)} Lira</button
    >{/if}
</span>

<style>
  .coin-source {
    position: absolute;
    left: 40%;
    bottom: 0;
    width: 20%;
    height: 20%;
    pointer-events: none;
  }
  .market-flow {
    position: relative;
    display: block;
    width: 100%;
    container-type: inline-size;
  }
  .sell {
    position: absolute;
    z-index: 3;
    bottom: 3%;
    left: 15%;
    width: 70%;
    padding: 0.3em 0.2em;
    border: 1px solid #dbb667;
    border-radius: 0.3em;
    background: #eed799;
    color: #24392b;
    font:
      700 4.5cqw/1.1 'Atkinson Hyperlegible',
      sans-serif;
    cursor: pointer;
  }
  .sell:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>
