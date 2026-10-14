<script lang="ts">
  import { base } from '$app/paths';
  import { locationStateSummary } from '$lib/game/location-state';
  import { places } from '$lib/game/manifests';
  import { warehouseGood } from '$lib/game/actions';
  import { locationArt, type PlayerColorName } from '$lib/game/art';
  import type { GameSetup } from '$lib/game/setup';
  import GameArt from './GameArt.svelte';
  import PlayingPiece from './PlayingPiece.svelte';
  import LocationState from './LocationState.svelte';
  import MailTrack from './MailTrack.svelte';
  import CaravansaryFlow from './CaravansaryFlow.svelte';
  import type { PlaceActionChoice } from '$lib/game/actions';
  let {
    game,
    placeId,
    expanded = false,
    caravanActive = false,
    caravanHidden = false,
    disabled = false,
    onAction = () => {}
  }: {
    game: GameSetup;
    placeId: number;
    expanded?: boolean;
    caravanActive?: boolean;
    caravanHidden?: boolean;
    disabled?: boolean;
    onAction?: (choice: PlaceActionChoice) => void;
  } = $props();
  const place = $derived(places.find((p) => p.id === placeId)!);
  const merchants = $derived(
    game.players.filter((p) => p.merchantPlace === placeId)
  );
  const workers = $derived(
    game.players.flatMap((p) => [
      ...Array.from({ length: p.assistantsByPlace[placeId] ?? 0 }, () => ({
        piece: 'assistant' as const,
        player: p
      })),
      ...(p.familyPlace === placeId
        ? [{ piece: 'family' as const, player: p }]
        : [])
    ])
  );
  const reward = $derived(
    warehouseGood(placeId) ??
      ([1, 13, 14, 15, 16].includes(placeId) ? 'ruby' : null)
  );
</script>

<span class="location-face" class:expanded data-component="LocationFace" data-testid={[5, 6].includes(placeId) ? `place-state-${placeId}` : undefined} data-state-summary={[5, 6].includes(placeId) ? locationStateSummary(game, placeId) : undefined}>
  <img
    class="artwork"
    src={`${base}/${locationArt[placeId]}`}
    alt=""
    draggable="false"
  />
  <img
    class="frame"
    src={`${base}/art/game/frames/location-frame-v1.png`}
    alt=""
    draggable="false"
  />
  <strong class="location-title">{place.name}</strong>
  <span
    class="piece-well merchants"
    style={`--occupants:${Math.max(1, merchants.length + game.neutralMerchants.filter((p) => p.place === placeId).length + Number(game.governorPlace === placeId) + Number(game.smugglerPlace === placeId))}`}
    aria-label="Merchants and visitors"
  >
    {#each merchants as p}<PlayingPiece
        piece="merchant"
        ownerUid={p.uid}
        assistantCount={p.assistantsCarried}
        color={p.color as PlayerColorName}
        label={`${p.name}'s merchant`}
      />{/each}
    {#each game.neutralMerchants.filter((p) => p.place === placeId) as p (p.id)}<PlayingPiece
        piece="neutral-merchant"
      />{/each}
    {#if game.governorPlace === placeId}<PlayingPiece piece="governor" />{/if}
    {#if game.smugglerPlace === placeId}<PlayingPiece piece="smuggler" />{/if}
  </span>
  <span
    class="piece-well workers"
    style={`--occupants:${Math.max(1, workers.length)}`}
    aria-label="Assistants and family members"
  >
    {#each workers as worker}<PlayingPiece
        ownerUid={worker.player.uid}
        piece={worker.piece}
        color={worker.player.color as PlayerColorName}
        label={`${worker.player.name}'s ${worker.piece}`}
      />{/each}
  </span>
  {#if placeId === 1}<span
      class="wheelbarrow-source"
      data-wheelbarrow-source
      aria-hidden="true"
    ></span>{/if}
  {#if reward}<span
      class="reward"
      data-location-reward={reward}
      aria-label={reward === 'ruby' ? 'Ruby available' : `${reward} supply`}
      ><GameArt kind="component" component={reward} /></span
    >{/if}
  <span class="location-number" aria-label={`Location ${placeId}`}
    >{placeId}</span
  >
  {#if placeId === 5}<span class="mail-position"
      ><MailTrack lower={game.postOfficeLower} /></span
    >{/if}
  {#if placeId === 6 && !caravanHidden}
    <span class="caravan-position"
      ><CaravansaryFlow
        {game}
        displayOnly={!expanded || !caravanActive}
        {disabled}
        {onAction}
      /></span
    >
  {/if}
  {#if !expanded && placeId !== 12 && placeId !== 5 && placeId !== 6}<span
      class="state-area"><LocationState {game} {placeId} /></span
    >{/if}
</span>

<style>
  .caravan-position {
    position: absolute;
    z-index: 3;
    left: 34%;
    right: 34%;
    bottom: 25%;
    --pile-width: 42%;
    --picked-width: 30%;
    --pile-count-size: 1.2cqw;
  }
  .expanded .caravan-position {
    pointer-events: auto;
  }
  .caravan-position :global(.piles) {
    gap: 8%;
  }
  .caravan-position :global(.caravansary-flow > p) {
    position: absolute;
    width: 100%;
    margin: 0.6cqw 0 0;
    font-size: 1.2cqw;
  }

  .mail-position {
    position: absolute;
    z-index: 3;
    left: 34%;
    right: 34%;
    bottom: 10%;
  }
  .wheelbarrow-source {
    position: absolute;
    left: 3%;
    bottom: 23%;
    width: 11%;
    height: 20%;
  }
  .location-face {
    position: absolute;
    inset: 0;
    container-type: inline-size;
    isolation: isolate;
    pointer-events: none;
    display: block;
    color: #fae8b8;
  }
  .artwork,
  .frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .artwork {
    object-fit: cover;
    z-index: 0;
  }
  .frame {
    z-index: 2;
    object-fit: fill;
  }
  .location-title {
    position: absolute;
    z-index: 3;
    left: 21%;
    top: 4.8%;
    width: 58%;
    height: 10.8%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    font:
      700 4.5cqw/1 'Cormorant Garamond',
      serif;
    white-space: nowrap;
    text-shadow: 0 1px 2px #000;
  }
  .piece-well {
    position: absolute;
    z-index: 3;
    top: 24%;
    width: 9%;
    height: 50%;
    display: grid;
    grid-template-rows: repeat(var(--occupants), minmax(0, 1fr));
    place-items: center;
  }
  .merchants {
    left: 3.8%;
  }
  .workers {
    right: 3.8%;
  }
  .piece-well :global(.playing-piece) {
    width: 7cqw;
    height: 7cqw;
    min-height: 0;
    filter: drop-shadow(0 0.2cqw 0.2cqw #000);
  }
  .merchants :global([data-piece-kind='merchant']),
  .merchants :global([data-piece-kind='neutral-merchant']) {
    width: 9cqw;
    height: 9cqw;
  }
  .workers :global(.playing-piece) {
    width: 5.8cqw;
    height: 5.8cqw;
  }
  .reward,
  .location-number {
    position: absolute;
    z-index: 3;
    bottom: 9%;
    width: 7.3%;
    height: 12%;
    display: grid;
    place-items: center;
  }
  .reward {
    left: 4.8%;
  }
  .reward :global(.game-art) {
    width: 95%;
    height: 95%;
    filter: drop-shadow(0 0.2cqw 0.3cqw #000);
  }
  .location-number {
    right: 4.8%;
    font:
      700 4.5cqw/1 'Cormorant Garamond',
      serif;
    text-shadow: 0 1px 3px #000;
  }
  .state-area {
    position: absolute;
    z-index: 1;
    left: 16%;
    right: 16%;
    top: 20%;
    bottom: 10%;
  }
  .state-area :global(.location-state) {
    left: 0;
    right: 0;
    bottom: 0;
    min-height: 0;
    max-width: 100%;
  }
  .state-area :global(.location-state > *) {
    max-width: 100%;
  }
</style>
