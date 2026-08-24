<script lang="ts">
  import { onMount } from 'svelte';
  import TabletopControlMockup from '$lib/components/mockups/TabletopControlMockup.svelte';
  import { isTablePosition, type TablePosition } from '$lib/game/protocol';

  let activePlace = $state(1);
  let previewPosition = $state<TablePosition>(1);

  onMount(() => {
    const requested = Number(new URL(location.href).searchParams.get('place'));
    const requestedPosition = Number(new URL(location.href).searchParams.get('seat'));
    if (Number.isInteger(requested) && requested >= 1 && requested <= 16) activePlace = requested;
    if (isTablePosition(requestedPosition)) previewPosition = requestedPosition;
  });

  function selectPlace(place: number) {
    activePlace = place;
    const url = new URL(location.href);
    url.searchParams.set('place', String(place));
    history.replaceState({}, '', url);
  }
</script>

<svelte:head><title>Tabletop controls mock-up · Istanbul</title><meta name="description" content="Design exploration for player-facing mats and graphical room controls." /></svelte:head>

<TabletopControlMockup {activePlace} {previewPosition} onSelect={selectPlace} />
