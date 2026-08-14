<script lang="ts">
  import { places } from '$lib/game/manifests';
  import { locationStateSummary } from '$lib/game/location-state';
  import type { GameSetup } from '$lib/game/setup';
  import type { PlayerColorName } from '$lib/game/art';
  import GameArt from './GameArt.svelte';
  import LocationState from './LocationState.svelte';

  let {
    game,
    placeId,
    index = 0,
    selected = false,
    reachable = false,
    departed = false,
    arrived = false,
    tabIndex = 0,
    onfocus,
    onkeydown,
    onclick
  }: {
    game: GameSetup;
    placeId: number;
    index?: number;
    selected?: boolean;
    reachable?: boolean;
    departed?: boolean;
    arrived?: boolean;
    tabIndex?: number;
    onfocus?: (event: FocusEvent) => void;
    onkeydown?: (event: KeyboardEvent) => void;
    onclick?: (event: MouseEvent) => void;
  } = $props();

  const place = $derived(places.find(({ id }) => id === placeId)!);
  const merchants = $derived(game.players.filter(({ merchantPlace }) => merchantPlace === placeId));
  const assistants = $derived(game.players.flatMap((player) => Array.from({ length: player.assistantsByPlace[placeId] ?? 0 }, () => player)));
  const families = $derived(game.players.filter(({ familyPlace }) => familyPlace === placeId));
  const stateSummary = $derived(locationStateSummary(game, placeId));
  const hasEncounter = $derived(placeId === game.governorPlace || placeId === game.smugglerPlace);
  const hasStateDisplay = $derived([5, 6, 7, 8, 10, 11, 12, 13, 14, 15, 16].includes(placeId));
  const label = $derived(`${place.id} ${place.name}. ${place.action} Current state: ${stateSummary}.${reachable ? ' Reachable this turn.' : ''}${merchants.length ? ` Merchants: ${merchants.map(({ name }) => name).join(', ')}.` : ''}`);
</script>

<button
  class:selected
  class:reachable
  class:departed
  class:arrived
  class:has-encounter={hasEncounter}
  class={`place family-${place.family}`}
  style={`--row: ${Math.floor(index / 4)}; --column: ${index % 4}`}
  aria-label={label}
  aria-pressed={selected}
  data-place-id={placeId}
  data-component="LocationTile"
  tabindex={tabIndex}
  {onfocus}
  {onkeydown}
  {onclick}
>
  <GameArt kind="location" place={place.id} class="place-art" />
  <span class="place-shade"></span>
  {#if hasStateDisplay}<LocationState {game} {placeId} />{/if}
  <span class="place-number">{place.id}</span>
  <strong>{place.shortName}</strong>
  <span class="occupants" aria-hidden="true">
    {#each merchants as merchant}<GameArt kind="piece" piece="merchant" color={merchant.color as PlayerColorName} class="merchant" label={`${merchant.name}'s merchant`} />{/each}
    {#each assistants as assistant}<GameArt kind="piece" piece="assistant" color={assistant.color as PlayerColorName} class="assistant" label={`${assistant.name}'s assistant`} />{/each}
    {#each placeId === 12 ? [] : families as family}<GameArt kind="piece" piece="family" color={family.color as PlayerColorName} class="family-member" label={`${family.name}'s family member`} />{/each}
    {#each game.neutralMerchants.filter(({ place: neutralPlace }) => neutralPlace === placeId), neutralIndex}<GameArt kind="piece" piece="neutral-merchant" class="merchant neutral" label={`Neutral merchant ${neutralIndex + 1}`} />{/each}
  </span>
  {#if placeId === game.governorPlace}<GameArt kind="piece" piece="governor" class="encounter governor-piece" label="Governor" />{/if}
  {#if placeId === game.smugglerPlace}<GameArt kind="piece" piece="smuggler" class="encounter smuggler-piece" label="Smuggler" />{/if}
</button>

<style>
  .place { position: relative; width: 100%; height: 100%; min-width: 0; min-height: 0; display: grid; grid-template-columns: 1fr; grid-template-rows: auto 1fr; gap: .15rem; align-items: start; overflow: hidden; padding: .42rem; border: 1px solid rgb(255 250 240 / 60%); border-radius: .55rem; color: #fffaf0; text-align: left; background: #173f43; box-shadow: 0 .35rem .7rem rgb(0 0 0 / 30%); cursor: pointer; }
  .place :global(.place-art), .place-shade { position: absolute; inset: 0; }
  .place :global(.place-art) { z-index: 0; transition: scale .25s ease; }.place:hover :global(.place-art), .place:focus-visible :global(.place-art) { scale: 1.05; }
  .place-shade { z-index: 1; background: linear-gradient(to bottom, rgb(5 25 27 / 88%) 0, rgb(5 25 27 / 34%) 27%, transparent 52%, rgb(5 25 27 / 42%) 100%); pointer-events: none; }
  .place:focus-visible { outline: 4px solid #fff2a8; outline-offset: 2px; box-shadow: 0 0 0 7px #173f43, 0 .35rem .7rem rgb(0 0 0 / 30%); }
  .place::after { position: absolute; inset: 0; border: 3px solid transparent; border-radius: inherit; content: ''; pointer-events: none; }
  .place.selected::after { border-color: #e2574f; box-shadow: inset 0 0 0 2px #fff7d6; }
  .place.reachable { border-color: #f4cf75; box-shadow: 0 0 0 2px rgb(244 207 117 / 45%), 0 .35rem .7rem rgb(0 0 0 / 30%); }
  .place.reachable::before { position: absolute; inset: .2rem; border: 1px dashed #a56823; border-radius: .35rem; content: ''; pointer-events: none; }
  .place.departed { animation: departure-pulse .45s ease-out; }.place.arrived { animation: arrival-pulse .6s ease-out; }
  .place-number { position: absolute; z-index: 4; top: .28rem; right: .3rem; width: 1.45rem; height: 1.45rem; display: grid; place-items: center; border: 1px solid #efca7d; border-radius: 50%; color: #fffaf0; background: rgb(10 44 47 / 92%); font-size: .72rem; font-weight: 700; }
  .place > strong { position: relative; z-index: 3; max-width: calc(100% - 1.7rem); align-self: start; overflow: hidden; text-shadow: 0 1px 3px #000; font-size: clamp(.72rem, 1.1vw, .94rem); line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
  .occupants { position: absolute; z-index: 3; inset-block: 0; right: .38rem; left: .38rem; height: 2.8rem; display: flex; gap: .18rem; align-items: center; justify-content: center; margin-block: auto; pointer-events: none; }
  .place.has-encounter .occupants { padding-right: 0; }
  .occupants :global(.merchant), .occupants :global(.family-member), .occupants :global(.assistant) { flex: 0 0 auto; filter: drop-shadow(0 .12rem .1rem #0009); }
  .occupants :global(.merchant) { width: 2.8rem; height: 2.8rem; }.occupants :global(.family-member) { width: 2.35rem; height: 2.35rem; }.occupants :global(.assistant) { width: 2.35rem; height: 2.35rem; }.occupants :global(.merchant.neutral) { background-color: transparent; }
  .place :global(.encounter) { position: absolute; z-index: 3; inset-block: 0; right: .25rem; width: 2.4rem; height: 2.4rem; margin-block: auto; filter: drop-shadow(0 .12rem .1rem #0009); }
  @keyframes departure-pulse { from { filter: brightness(1.45); } to { filter: none; } }
  @keyframes arrival-pulse { 0% { translate: 0 -.25rem; filter: brightness(1.7); } 100% { translate: 0; filter: none; } }
  @media (max-width: 720px) {
    .place { padding: .24rem; border-radius: .38rem; }.place > strong { display: -webkit-box; max-width: calc(100% - 1.25rem); overflow: hidden; font-size: .58rem; line-height: .88; white-space: normal; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; }.place-number { width: 1.05rem; height: 1.05rem; font-size: .5rem; }.occupants { right: .12rem; left: .12rem; height: 1.5rem; gap: .02rem; }.occupants :global(.merchant) { width: 1.4rem; height: 1.4rem; }.occupants :global(.assistant), .occupants :global(.family-member) { width: 1.18rem; height: 1.18rem; }.place :global(.encounter) { right: .1rem; width: 1.2rem; height: 1.2rem; }
  }
  @media (max-height: 500px) and (orientation: landscape) {
    .place { padding: .2rem; }.place > strong { font-size: .52rem; }.occupants { height: 1.35rem; }.occupants :global(.merchant) { width: 1.25rem; height: 1.25rem; }.occupants :global(.assistant), .occupants :global(.family-member) { width: 1.05rem; height: 1.05rem; }
  }
  @media (prefers-reduced-motion: reduce) { .place.departed, .place.arrived { animation: none; } }
</style>
