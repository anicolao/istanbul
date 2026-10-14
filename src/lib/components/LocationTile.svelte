<script lang="ts">
  import { places } from '$lib/game/manifests';
  import { locationStateSummary } from '$lib/game/location-state';
  import type { GameSetup } from '$lib/game/setup';
  import type { GemstoneDisplay } from './gemstone-offer';
  import TurnHighlight from './TurnHighlight.svelte';
  import { playerHighlightColors } from '$lib/game/art';
  import LocationFace from './LocationFace.svelte';

  let {
    game,
    gemstone,
    placeId,
    index = 0,
    selected = false,
    reachable = false,
    actionReady = false,
    actionHint,
    departed = false,
    arrived = false,
    tabIndex = 0,
    onfocus,
    onkeydown,
    onclick
  }: {
    game: GameSetup;
    gemstone?: GemstoneDisplay;
    placeId: number;
    index?: number;
    selected?: boolean;
    reachable?: boolean;
    actionReady?: boolean;
    actionHint?: string;
    departed?: boolean;
    arrived?: boolean;
    tabIndex?: number;
    onfocus?: (event: FocusEvent) => void;
    onkeydown?: (event: KeyboardEvent) => void;
    onclick?: (event: MouseEvent) => void;
  } = $props();

  const place = $derived(places.find(({ id }) => id === placeId)!);
  const merchants = $derived(
    game.players.filter(({ merchantPlace }) => merchantPlace === placeId)
  );
  const stateSummary = $derived(locationStateSummary(game, placeId));
  const hasEncounter = $derived(
    placeId === game.governorPlace || placeId === game.smugglerPlace
  );
  const label = $derived(
    `${place.id} ${place.name}. ${place.action} Current state: ${stateSummary}.${reachable ? ' Reachable this turn.' : ''}${actionHint ? ` ${actionHint}.` : actionReady ? ' Active now; tap to use this room.' : ''}${merchants.length ? ` Merchants: ${merchants.map(({ name }) => name).join(', ')}.` : ''}`
  );
</script>

<button
  class:selected
  class:reachable
  class:action-ready={actionReady}
  class:departed
  class:arrived
  class:has-encounter={hasEncounter}
  class={`place family-${place.family}`}
  style={`--row: ${Math.floor(index / 4)}; --column: ${index % 4};--seat-color:${playerHighlightColors[game.players[game.turnSeat].color]}`}
  aria-label={label}
  aria-pressed={selected}
  data-place-id={placeId}
  data-action-ready={actionReady || undefined}
  data-component="LocationTile"
  tabindex={tabIndex}
  {onfocus}
  {onkeydown}
  {onclick}
>
  <LocationFace {game} {placeId} {gemstone} />
  {#if reachable}<TurnHighlight />{/if}
  {#if actionReady}<span class="action-ready-label"
      >{actionHint ?? 'Your action'}</span
    >{/if}
</button>

<style>
  .place {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    padding: 0;
    border: 0;
    border-radius: 2px;
    background: #173f43;
    color: #fffaf0;
    cursor: pointer;
    box-shadow: 0 0.35rem 0.7rem #0005;
  }
  .place::after {
    position: absolute;
    inset: 0;
    border: 2px solid transparent;
    content: '';
    pointer-events: none;
    z-index: 5;
  }
  .place.selected::after {
    border-color: #ffdf91;
    box-shadow: inset 0 0 6px #efca7d;
  }
  .place.reachable {
    filter: drop-shadow(0 0 0.35cqw var(--seat-color))
      drop-shadow(0 0.35cqw 0.4cqw #000a);
  }
  .place:focus-visible {
    outline: 3px solid #fff2a8;
    outline-offset: 2px;
  }
  .place[data-place-id='7'] .action-ready-label {
    bottom: 10%;
    left: 25%;
    right: 25%;
    padding: 0.3rem;
    border-radius: 0.25rem;
    font-size: 0.85rem;
  }
  .action-ready-label {
    position: absolute;
    z-index: 6;
    bottom: 1%;
    left: 18%;
    right: 18%;
    text-align: center;
    background: #efca7d;
    color: #173f43;
    font-size: 0.6rem;
  }
</style>
