<script lang="ts">
  import type { ReplayProjection } from '$lib/game/protocol';
  let {
    undo,
    userUid,
    pending = false,
    compact = false,
    onUndo
  }: {
    undo: ReplayProjection['undo'];
    userUid: string;
    pending?: boolean;
    compact?: boolean;
    onUndo: () => void;
  } = $props();
  const available = $derived(
    Boolean(
      undo &&
      !undo.blockedReason &&
      undo.actorUids.includes(userUid) &&
      !pending
    )
  );
  const description = $derived(
    !undo
      ? 'Nothing to undo'
      : undo.blockedReason
        ? `Undo unavailable: ${undo.blockedReason}`
        : `Undo ${undo.label}`
  );
</script>

<button
  class="undo-button"
  class:compact
  aria-label={description}
  title={description}
  disabled={!available}
  onclick={onUndo}><span aria-hidden="true">↶</span><span class="label">Undo</span></button
>

<style>
  .undo-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    min-height: 44px;
    min-width: 88px;
    padding: 0.5rem 0.8rem;
    border: 1px solid #e4bd74;
    border-radius: 0.5rem;
    color: #173f43;
    background: #efca7d;
    font:
      700 14px/1.2 'Atkinson Hyperlegible',
      sans-serif;
    cursor: pointer;
    touch-action: manipulation;
  }
  .compact { width: 44px; min-width: 44px; padding: 0.4rem; }
  .compact .label { display: none; }
  .undo-button > span:first-child {
    font-size: 23px;
  }
  .undo-button:disabled {
    color: #b9c4bf;
    background: #173b32;
    border-color: #8d9f9266;
    cursor: default;
  }
  .undo-button:focus-visible {
    outline: 3px solid white;
    outline-offset: 2px;
  }
  @media (max-aspect-ratio: 1/1), (max-width: 600px), (max-height: 600px) {
    .undo-button { min-width: 44px; padding: 0.4rem; }
    .label { display: none; }
  }
</style>
