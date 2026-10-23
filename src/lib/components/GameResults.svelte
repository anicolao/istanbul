<script lang="ts">
  import type { GameSetup } from '$lib/game/setup';
  import { layoutNames, type LayoutKind, type RoomProjection } from '$lib/game/protocol';
  let { game, room, userUid, connectedUids, pending = false, onRematch, onLeave }: {
    game: GameSetup; room: RoomProjection; userUid: string; connectedUids: string[];
    pending?: boolean; onRematch: (layout: LayoutKind) => void; onLeave?: () => void;
  } = $props();
  let layout = $state<LayoutKind>('short-path');
  const roomLayout = $derived(room.layout);
  $effect(() => { layout = roomLayout; });
  const eligible = $derived(room.seats.some(seat => seat.uid === userUid && !seat.left && !seat.bot)
    || (room.tabletopOwned && room.hostUid === userUid));
  const roster = $derived(room.seats.filter(seat => !seat.left && connectedUids.includes(seat.uid)));
</script>
<section class="finish" aria-label="Game results">
  <h1>{game.end.winnerUids.length > 1 ? 'Shared victory!' : `${game.end.rankings[0]?.name} wins!`}</h1>
  {#each game.end.rankings as standing}
    <p>{standing.name} · {standing.rubies} rubies · {standing.lira} Lira · {standing.goods} goods · {standing.bonusCards} {standing.bonusCards === 1 ? 'card' : 'cards'}
      {#each game.end.finalBonuses?.filter(reward => reward.uid === standing.uid) ?? [] as reward}<small>Final Bonus cards: +{reward.lira} Lira · +{reward.goods} {reward.goods === 1 ? 'good' : 'goods'}</small>{/each}
    </p>
  {/each}
  {#if eligible}
    <label>Next map<select aria-label="Rematch map" bind:value={layout} disabled={pending}>{#each Object.entries(layoutNames) as [value, name]}<option value={value}>{name}</option>{/each}</select></label>
    <p class="roster">Playing again: {roster.map(seat => seat.name).join(', ') || 'Waiting for players…'}</p>
    <small>Only connected players and bots join the next game. Closed windows may take up to 90 seconds to disappear.</small>
    <div class="actions"><button disabled={pending || roster.length < 2} onclick={() => onRematch(layout)}>Play again</button>
      {#if onLeave && room.seats.some(seat => seat.uid === userUid && !seat.left)}<button disabled={pending} onclick={onLeave}>Leave game</button>{/if}
    </div>
    {#if roster.length < 2}<small>At least two players are needed for a rematch.</small>{/if}
  {/if}
</section>
<style>
  .finish { position: fixed; z-index: 60; left: 50%; top: 50%; transform: translate(-50%, -50%); box-sizing: border-box; width: min(640px, calc(100% - 24px)); max-height: calc(100dvh - 32px); overflow: auto; padding: 20px; background: #122c22fa; border: 1px solid #a98d50; border-radius: 12px; color: #fff0cf; font: 16px/1.4 'Atkinson Hyperlegible', sans-serif; }
  h1 { margin: 0 0 16px; font-size: 28px; } p { font-size: 16px; margin: 12px 0; } small { display: block; font-size: 13px; color: #e0ddc9; } label { display: grid; gap: 5px; margin-top: 20px; } select { min-height: 44px; width: 100%; font: inherit; padding: 8px; border-radius: 6px; background: #f4e5be; color: #16382e; } .actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; } button { min-height: 44px; padding: 8px 16px; font: inherit; border: 1px solid #d2b16e; border-radius: 6px; background: #eacd91; color: #18382e; cursor: pointer; } button:disabled { opacity: .45; cursor: default; }
</style>
