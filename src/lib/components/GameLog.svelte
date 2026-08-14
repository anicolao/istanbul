<script lang="ts">
  import type { ReplayProjection } from '$lib/game/protocol';

  let {
    entries,
    players,
    userUid,
    pending = false,
    onRollback
  }: {
    entries: ReplayProjection['gameLog'];
    players: Array<{ uid: string; name: string }>;
    userUid: string;
    pending?: boolean;
    onRollback: (targetEventId: string) => void;
  } = $props();

  const pageSize = 7;
  let open = $state(false);
  let page = $state(0);
  const newestFirst = $derived([...entries].reverse());
  const pageCount = $derived(Math.max(1, Math.ceil(newestFirst.length / pageSize)));
  const visibleEntries = $derived(newestFirst.slice(page * pageSize, (page + 1) * pageSize));

  function playerName(uid: string) {
    return players.find((player) => player.uid === uid)?.name ?? 'Tabletop';
  }

  function canRollback(entry: ReplayProjection['gameLog'][number]) {
    return entry.active && !entry.blockedReason && entry.rollbackActorUids.includes(userUid) && !pending;
  }

  function blockedCopy(entry: ReplayProjection['gameLog'][number]) {
    if (!entry.active) return 'Already undone';
    if (entry.blockedReason) return entry.blockedReason;
    if (!entry.rollbackActorUids.includes(userUid)) return `Only ${playerName(entry.ownerUid)} or the controlling tabletop can roll this back`;
    return null;
  }

  function rollback(entry: ReplayProjection['gameLog'][number]) {
    if (!canRollback(entry)) return;
    open = false;
    onRollback(entry.eventId);
  }
</script>

<svelte:window onkeydown={(event) => { if (open && event.key === 'Escape') open = false; }} />

<button class="log-trigger" aria-haspopup="dialog" aria-expanded={open} onclick={() => { page = 0; open = true; }}><span aria-hidden="true">☰</span>Game log</button>

{#if open}
  <div class="log-backdrop" role="presentation" onclick={() => open = false}>
    <div class="log-dialog" role="dialog" aria-modal="true" aria-labelledby="game-log-title" tabindex="-1" data-e2e-fit data-e2e-no-scroll onclick={(event) => event.stopPropagation()} onkeydown={(event) => event.stopPropagation()}>
      <header><div><p>Immutable action history</p><h2 id="game-log-title">Game log</h2></div><button aria-label="Close game log" onclick={() => open = false}>×</button></header>
      <p class="log-help">Choose an available row to restore the game to immediately before that action. Grey rows cannot be crossed.</p>
      <ol aria-label="Game actions">
        {#each visibleEntries as entry}
          {@const reason = blockedCopy(entry)}
          <li class:blocked={Boolean(reason)} class:barrier={Boolean(entry.barrierReason)} class:undone={!entry.active}>
            <span class="log-index">T{entry.turnNumber}</span>
            <span class="log-copy"><strong>{entry.label}</strong><small>{entry.summary}</small><i>{playerName(entry.ownerUid)}{entry.dice ? ` · rolled ${entry.dice[0]} + ${entry.dice[1]}` : ''}{entry.barrierReason ? ' · information barrier' : entry.active ? '' : ' · removed from state'}</i></span>
            {#if canRollback(entry)}
              <button class="rollback" aria-label={`Roll back before ${entry.label}`} onclick={() => rollback(entry)}>Rollback {entry.rollbackCount}</button>
            {:else}<span class="blocked-reason">{reason}</span>{/if}
          </li>
        {:else}<li class="empty">No gameplay actions have been recorded yet.</li>{/each}
      </ol>
      <footer><span>{entries.length} action{entries.length === 1 ? '' : 's'} · page {page + 1} of {pageCount}</span><div><button aria-label="Newer game log page" disabled={page === 0} onclick={() => page -= 1}>Newer</button><button aria-label="Older game log page" disabled={page + 1 >= pageCount} onclick={() => page += 1}>Older</button></div></footer>
    </div>
  </div>
{/if}

<style>
  .log-trigger { min-width: 0; min-height: 2rem; display: inline-flex; align-items: center; justify-content: center; gap: .3rem; padding: .25rem .55rem; border: 1px solid #efca7d80; border-radius: .45rem; color: #f5dda8; background: #ffffff0c; font: inherit; font-size: .58rem; font-weight: 700; white-space: nowrap; }.log-trigger span { font-size: .72rem; }
  .log-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: center; padding: clamp(.5rem, 2vw, 1.5rem); background: #031719d9; backdrop-filter: blur(5px); }
  .log-dialog { width: min(42rem, 100%); max-height: 100%; display: grid; grid-template-rows: auto auto minmax(0, 1fr) auto; gap: .55rem; overflow: hidden; padding: clamp(.7rem, 2vw, 1.15rem); border: 1px solid #e7c474; border-radius: 1rem; color: #173f43; background: #fffaf0; box-shadow: 0 1.5rem 5rem #0009; }
  .log-dialog header { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }.log-dialog header p, .log-dialog h2 { margin: 0; }.log-dialog header p { color: #a23e34; font-size: .58rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }.log-dialog h2 { font: 700 clamp(1.7rem, 4vw, 2.4rem)/1 'Cormorant Garamond', serif; }.log-dialog header button { width: 2.4rem; height: 2.4rem; border: 1px solid #b99a6b; border-radius: 50%; color: #173f43; background: #fff; font-size: 1.5rem; }
  .log-help { margin: 0; color: #536a67; font-size: .72rem; }.log-dialog ol { min-height: 0; display: grid; gap: .35rem; align-content: start; margin: 0; padding: 0; list-style: none; }.log-dialog li { min-width: 0; display: grid; grid-template-columns: 2.4rem minmax(0, 1fr) auto; gap: .55rem; align-items: center; padding: .5rem .6rem; border: 1px solid #d7bd83; border-radius: .55rem; background: #f4e6c4; }.log-dialog li.blocked { border-color: #c8c3b9; color: #7c827f; background: #e8e6df; filter: grayscale(.8); }.log-dialog li.barrier { border-style: dashed; }.log-dialog li.undone { opacity: .58; }.log-index { display: grid; place-items: center; align-self: stretch; border-radius: .35rem; color: #fff; background: #1e5d58; font-size: .62rem; font-weight: 700; }.log-copy { min-width: 0; display: grid; }.log-copy strong, .log-copy small, .log-copy i, .blocked-reason { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }.log-copy strong { font-size: .76rem; }.log-copy small { color: #526b68; font-size: .58rem; }.log-copy i { color: #7a8986; font-size: .49rem; font-style: normal; text-transform: uppercase; }.rollback { min-height: 2.1rem; padding: .3rem .65rem; border: 0; border-radius: .4rem; color: #fff; background: #267356; font-size: .62rem; font-weight: 700; }.blocked-reason { max-width: 14rem; font-size: .55rem; text-align: right; }.log-dialog li.empty { display: block; color: #687a76; text-align: center; }
  .log-dialog footer { display: flex; align-items: center; justify-content: space-between; gap: .7rem; color: #687a76; font-size: .62rem; }.log-dialog footer div { display: flex; gap: .35rem; }.log-dialog footer button { min-height: 2rem; padding: .25rem .6rem; border: 1px solid #b99a6b; border-radius: .35rem; color: #173f43; background: #fff; font-size: .62rem; font-weight: 700; }.log-dialog footer button:disabled { opacity: .35; }
  @media (max-height: 650px), (max-width: 520px) { .log-dialog { gap: .35rem; padding: .55rem; }.log-help { font-size: .62rem; }.log-dialog ol { gap: .2rem; }.log-dialog li { grid-template-columns: 2rem minmax(0, 1fr) auto; gap: .35rem; padding: .32rem .4rem; }.blocked-reason { max-width: 7rem; }.log-dialog h2 { font-size: 1.55rem; }.log-dialog header button { width: 2rem; height: 2rem; }.log-copy strong { font-size: .68rem; } }
</style>
