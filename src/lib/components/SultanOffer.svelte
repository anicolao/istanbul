<script lang="ts">
  import type { Good } from '$lib/game/manifests';
  import type { GameSetup, SetupPlayer } from '$lib/game/setup';
  import type { PlaceActionChoice } from '$lib/game/actions';
  import { currentSultanCost, sultanCostSequence } from '$lib/game/ruby-routes';
  import GameArt from './GameArt.svelte';
  let {
    game,
    player = game.players[game.turnSeat],
    active = false,
    disabled = false,
    onAction = () => {}
  }: {
    game: GameSetup;
    player?: SetupPlayer;
    active?: boolean;
    disabled?: boolean;
    onAction?: (choice: PlaceActionChoice) => void;
  } = $props();
  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
  const cost = $derived(currentSultanCost(game));
  let sultanWild = $state<Good[]>([]);
  const resolvedWild = $derived.by(() => {
    const remaining = Object.fromEntries(
      goods.map((good) => [
        good,
        player.goods[good] - cost.filter((item) => item === good).length
      ])
    ) as Record<Good, number>;
    return cost
      .filter((good) => good === 'any')
      .map((_, i) => {
        const good =
          sultanWild[i] ??
          goods.find((good) => remaining[good] > 0) ??
          'fabric';
        remaining[good] -= 1;
        return good;
      });
  });
  const affordable = $derived(
    goods.every(
      (good) =>
        player.goods[good] >=
        cost.filter((item) => item === good).length +
          resolvedWild.filter((item) => item === good).length
    )
  );

  const nextGood = $derived(sultanCostSequence[cost.length]);
</script>

<span class="sultan-offer" data-component="SultanOffer">
  <span class="cost">
    {#each cost as good, i}
      {@const index = cost.slice(0, i).filter((g) => g === 'any').length}
      <svelte:element
        this={active && good === 'any' ? 'button' : 'span'}
        role={active && good === 'any' ? 'button' : undefined}
        class="good"
        data-sultan-slot={i}
        data-sultan-payment={good === 'any' ? resolvedWild[index] : good}
        disabled={active && good === 'any' ? disabled : undefined}
        aria-label={good === 'any'
          ? `Choose payment ${index + 1}: ${resolvedWild[index]}`
          : good}
        onclick={active && good === 'any'
          ? () =>
              (sultanWild[index] =
                goods[(goods.indexOf(resolvedWild[index]) + 1) % 4])
          : undefined}
      >
        <GameArt
          kind="component"
          component={good === 'any' ? resolvedWild[index] : good}
        />
        {#if good === 'any'}<small>↻</small>{/if}
      </svelte:element>
    {/each}
    {#if nextGood}<span
        class="good next"
        aria-label={`Next offer adds ${nextGood}`}
      >
        {#if nextGood === 'any'}<span class="wild">✦</span>{:else}<GameArt
            kind="component"
            component={nextGood}
          />{/if}
      </span>{/if}
  </span><span class="arrow">→</span>
  <svelte:element
    this={active ? 'button' : 'span'}
    role={active ? 'button' : undefined}
    class="ruby"
    aria-label="Deliver goods for one ruby"
    disabled={active ? disabled || !affordable : undefined}
    onclick={active
      ? () => onAction({ kind: 'sultan-buy', wildGoods: resolvedWild })
      : undefined}><GameArt kind="component" component="ruby" /></svelte:element
  >
</span>

<style>
  .sultan-offer {
    container-type: inline-size;
    display: flex;
    align-items: center;
    gap: 2%;
    width: 100%;
    padding: 2%;
    box-sizing: border-box;
    border: 1px solid #ba924d;
    border-radius: 0.4em;
    background: #e4cf9d;
    color: #452c17;
  }
  .cost {
    display: flex;
    flex: 1;
    gap: 2%;
    align-items: center;
    min-width: 0;
  }
  .good {
    position: relative;
    display: grid;
    place-items: center;
    flex: 1;
    min-width: 0;
    aspect-ratio: 1;
    border: 1px solid #b49864;
    border-radius: 0.2em;
    background: #f2e4bd;
    padding: 0;
  }
  .good :global(.game-art) {
    width: 100%;
    height: 100%;
    filter: none;
  }
  .next {
    opacity: 0.35;
    border-style: dashed;
  }
  .arrow {
    font-size: 6cqw;
  }
  .ruby {
    display: grid;
    place-items: center;
    width: 12%;
    aspect-ratio: 1;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 50%;
    background: transparent;
  }
  .ruby :global(.game-art) {
    width: 100%;
    height: 100%;
    filter: none;
  }
  button {
    cursor: pointer;
  }
  button:hover {
    outline: 2px solid #fff0b8;
  }
  button:disabled {
    cursor: default;
  }
  small {
    position: absolute;
    right: 0;
    bottom: 0;
    font-size: 3cqw;
    color: #173f43;
  }
  .wild {
    font-size: 7cqw;
    color: #507649;
  }
</style>
