<script lang="ts">
  import { mosqueTiles, type Good } from '$lib/game/manifests';
  import { ownsMosqueAbility } from '$lib/game/mosques';
  import type { GameSetup, SetupPlayer } from '$lib/game/setup';
  import type { PlaceActionChoice } from '$lib/game/actions';
  import GameArt from './GameArt.svelte';
  let {
    game,
    player = game.players[game.turnSeat],
    placeId,
    active = false,
    disabled = false,
    onAction = () => {}
  }: {
    game: GameSetup;
    player?: SetupPlayer;
    placeId: 14 | 15;
    active?: boolean;
    disabled?: boolean;
    onAction?: (choice: PlaceActionChoice) => void;
  } = $props();
  const colors = $derived(
    (placeId === 14 ? ['fabric', 'spice'] : ['fruit', 'jewelry']) as Good[]
  );
</script>

<span class="mosque-offers" data-component="MosqueOffers">
  <span class="powers">
    {#each colors as good}
      {@const tile = mosqueTiles.find(
        (t) => t.id === game.mosqueStacks[good][0]
      )}
      {@const owned = ownsMosqueAbility(player, good)}
      <svelte:element
        this={active ? 'button' : 'span'}
        role={active ? 'button' : undefined}
        class="power"
        data-mosque-power={good}
        class:owned={active && owned}
        disabled={active
          ? disabled || !tile || owned || player.goods[good] < tile.required
          : undefined}
        onclick={active && tile
          ? () => onAction({ kind: 'mosque-take', tileId: tile.id })
          : undefined}
        aria-label={tile
          ? `${good} power: hold ${tile.required} ${good}, pay 1. ${tile.ability}${active && owned ? ' Already owned.' : ''}`
          : `${good} power sold out`}
      >
        <span class="requirement"
          ><span>≥{tile?.required ?? '—'}</span><GameArt
            kind="component"
            component={good}
          /></span
        >
        <GameArt
          kind="component"
          component={`mosque-${good}`}
          class="power-art"
        />
        <span class="payment" data-mosque-payment={good}
          ><span>−1</span><GameArt
            kind="component"
            component={good}
          />{#if active && owned}<b>✓</b>{/if}</span
        >
      </svelte:element>
    {/each}
  </span>
  <span class="pair" aria-label="Collect both powers to earn one ruby"
    ><GameArt kind="component" component={`mosque-${colors[0]}`} /><span>+</span
    ><GameArt kind="component" component={`mosque-${colors[1]}`} /><span>→</span
    ><GameArt kind="component" component="ruby" /></span
  >
</span>

<style>
  .mosque-offers {
    display: block;
    width: 100%;
    container-type: inline-size;
    color: #f5e5b6;
  }
  .powers {
    display: flex;
    gap: 8%;
    justify-content: center;
  }
  .power {
    position: relative;
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center;
    gap: 2%;
    width: 42%;
    padding: 3%;
    box-sizing: border-box;
    border: 1px solid #c5a15c;
    border-radius: 8%;
    background: #20382dea;
    color: inherit;
    font: inherit;
  }
  .power :global(.power-art) {
    width: 100%;
    aspect-ratio: 1;
    height: auto;
    filter: none;
  }
  .requirement,
  .payment {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8cqw;
    line-height: 1;
    font-weight: 700;
    gap: 0.15em;
  }
  .requirement :global(.game-art),
  .payment :global(.game-art) {
    width: 9cqw;
    height: 9cqw;
    filter: none;
  }
  .payment {
    font-size: 6cqw;
  }
  .payment :global(.game-art) {
    width: 7cqw;
    height: 7cqw;
  }
  .payment b {
    position: absolute;
    right: 3%;
    bottom: 3%;
    color: #f4d178;
  }
  .pair {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3%;
    margin-top: 4%;
    font-size: 7cqw;
  }
  .pair :global(.game-art) {
    width: 11cqw;
    height: 11cqw;
    filter: none;
  }
  button {
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    outline: 2px solid #ffe1a1;
  }
  button:disabled {
    cursor: default;
  }
  button:disabled:not(.owned) {
    opacity: 0.55;
  }
  .owned {
    border-color: #f4d178;
  }
</style>
