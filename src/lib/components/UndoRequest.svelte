<script lang="ts">
  import type { ReplayProjection, RoomProjection } from '$lib/game/protocol';
  let { request, room, userUid, pending = false, previewAllVoters = false, onVote, onCancel }: {
    request: NonNullable<ReplayProjection['undoRequest']>; room: RoomProjection; userUid: string; pending?: boolean; previewAllVoters?: boolean;
    onVote: (uid: string, approve: boolean) => void; onCancel: () => void;
  } = $props();
  const controlsTable = $derived(room.mode === 'shared-table' && room.tabletopOwned && room.hostUid === userUid);
  const name = (uid: string) => room.seats.find(seat => seat.uid === uid)?.name ?? 'Tabletop';
</script>
<section class="undo-request" class:preview={previewAllVoters} aria-label="Undo request" aria-live="polite">
  <strong>{name(request.requesterUid)} requests a rewind</strong>
  <p>Undo {request.actionCount} action{request.actionCount === 1 ? '' : 's'}, starting with “{request.label}”. Everyone must agree.</p>
  <small>Repeating the same action on the same turn gives the same cards and dice. Later turns draw with a different shuffle. Playing on cancels this request.</small>
  <details><summary>Review affected actions</summary><ol>{#each request.actions as action}<li><strong>{name(action.ownerUid)} · {action.label}</strong><br />{action.summary}</li>{/each}</ol></details>
  <div class="votes">
    {#each request.requiredUids as uid}
      <div class="vote"><span>{name(uid)} · {request.approvedUids.includes(uid) ? 'agreed' : 'waiting'}</span>
        {#if !request.approvedUids.includes(uid) && (uid === userUid || controlsTable || previewAllVoters)}
          <button disabled={pending} aria-label={`Agree to rewind: ${name(uid)}`} onclick={() => onVote(uid, true)}>Agree</button>
          <button disabled={pending} aria-label={`Keep playing: ${name(uid)}`} onclick={() => onVote(uid, false)}>Keep playing</button>
        {/if}
      </div>
    {/each}
  </div>
  {#if request.requesterUid === userUid}<button disabled={pending} onclick={onCancel}>Cancel request</button>{/if}
</section>
<style>
  .undo-request { position: fixed; z-index: 250; top: 12px; left: 50%; transform: translateX(-50%); width: min(520px, calc(100vw - 24px)); max-height: calc(100dvh - 24px); overflow: auto; box-sizing: border-box; padding: 16px; border: 2px solid #dfbc73; border-radius: 12px; background: #163c36; color: #fff3d4; box-shadow: 0 6px 30px #0009; font: 16px/1.35 'Atkinson Hyperlegible', sans-serif; }
  .undo-request.preview { top: 64px; max-height: calc(100dvh - 76px); }
  p { margin: 8px 0; } small { display: block; color: #d5dfd9; }
  details { margin-top: 8px; } summary { cursor: pointer; } ol { max-height: 180px; overflow: auto; padding-left: 24px; font-size: 14px; } li { margin: 8px 0; }
  .votes { display: grid; gap: 8px; margin: 12px 0; }
  .vote { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
  .vote span { flex: 1 0 120px; }
  button { min-height: 44px; padding: 8px 12px; border: 1px solid #e2c582; border-radius: 6px; background: #f0d394; color: #193b32; font: inherit; cursor: pointer; }
  button:disabled { opacity: .5; }
</style>
