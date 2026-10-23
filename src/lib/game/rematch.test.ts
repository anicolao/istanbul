import { describe, expect, it } from 'vitest';
import { fixture, eventFor } from '../../routes/dev/animations/scenarios';
import { applyEvent, replayEvents } from './reducer';
import { rematchSeats } from './rematch';

function completed(count = 4) {
  const { state, trigger } = fixture('victory', count, 'personal-screens', 6);
  expect(applyEvent(state, eventFor(state, trigger))).toBe(true);
  return state;
}
function command(state: ReturnType<typeof completed>, n: number, type: string, payload: Record<string, unknown>, uid = state.room!.seats[0].uid, at = 100_000 + n) {
  const event = eventFor(state, { type, payload }, n);
  event.actorUid = uid; event.id = `${uid}-${event.clientSeq}`; event.createdAt = at;
  return event;
}

describe('departures and rematches', () => {
  it('lets any connected player start with the chosen map and only present players/bots', () => {
    const initial = completed();
    const [a, b, c, d] = initial.room!.seats;
    d.bot = true;
    const events = [command(initial, 1, 'player/present', { epoch: 1 }, a.uid),
      command(initial, 2, 'player/present', { epoch: 1 }, b.uid),
      command(initial, 3, 'player/present', { epoch: 1 }, c.uid, 1),
      command(initial, 4, 'game/rematched', { rosterVersion: 1, epoch: 1, seed: 'new-seed', layout: 'random' }, b.uid)];
    const result = replayEvents(events, initial);
    expect(result.diagnostics).toEqual([]);
    expect(result.room!.seats.map(seat => seat.uid)).toEqual([a.uid, b.uid, d.uid]);
    expect(result.room!.layout).toBe('random');
    expect(result.game).toMatchObject({ epoch: 2, seed: 'new-seed', phase: 'movement', turnNumber: 1, pending: null, encounterLog: [], bonusLog: [], activeBonusEffects: [] });
    expect(result.game!.players.every(p => p.rubies === 0 && p.capacity === 2 && p.bonusHand.length === 1 && Object.values(p.goods).every(n => n === 0))).toBe(true);
    expect(result.game!.end).toMatchObject({ triggeredByUid: null, finalBonusSeatsCompleted: [], rankings: [], winnerUids: [] });
    expect(result.game!.bonusDrawCounts).toBeUndefined();
    expect(result.game!.postOfficeLower).toEqual([false, false, false, false]);
    expect(result.game!.neutralMerchants).toEqual([]);
    expect(replayEvents([...events].reverse(), initial).game).toEqual(result.game);
  });
  it('leaves only after scoring, excludes departed players immediately, and preserves completed results', () => {
    const initial = completed(3);
    initial.room!.tabletopOwned = false;
    const [a, b] = initial.room!.seats;
    const leave = command(initial, 1, 'player/left', { epoch: 1 }, a.uid);
    const result = replayEvents([leave], initial);
    expect(result.game).toEqual(initial.game);
    expect(result.room!.seats[0].left).toBe(true);
    expect(result.room!.hostUid).toBe(b.uid);
    expect(rematchSeats(result.room!, 1, 100_002, a.uid).map(s => s.uid)).not.toContain(a.uid);
    const playing = structuredClone(initial); playing.game!.phase = 'movement';
    const denied = replayEvents([leave], playing);
    expect(denied.room!.seats[0].left).toBeUndefined();
    expect(denied.diagnostics.at(-1)?.reason).toBe('cannot-leave-during-game');
  });
  it('rejects outsiders and too-small rosters, and treats simultaneous rematches as one start', () => {
    const initial = completed(2);
    const [a,b] = initial.room!.seats;
    const payload = { rosterVersion: 1, epoch: 1, seed: 'fresh', layout: 'long-path' };
    expect(replayEvents([command(initial, 1, 'game/rematched', payload, 'outsider')], initial).game).toEqual(initial.game);
    expect(replayEvents([command(initial, 1, 'game/rematched', payload, a.uid)], initial).diagnostics.at(-1)?.reason).toBe('rematch-needs-two-players');
    const events = [command(initial, 1, 'player/present', { epoch: 1 }, a.uid), command(initial, 2, 'player/present', { epoch: 1 }, b.uid),
      command(initial, 3, 'game/rematched', payload, a.uid), command(initial, 4, 'game/rematched', { ...payload, seed: 'other' }, b.uid)];
    const result = replayEvents(events, initial);
    expect(result.diagnostics).toEqual([]);
    expect(result.game!.epoch).toBe(2);
    expect(result.game!.seed).toBe('fresh');
  });
  it('cannot rewind a completed game after someone has left, or leave a newly started rematch', () => {
    const { state, trigger } = fixture('victory', 2, 'personal-screens', 6);
    const end = command(state, 1, trigger.type, trigger.payload);
    const leave = command(state, 2, 'player/left', { epoch: 1 });
    const ended = replayEvents([end, leave], state);
    expect(ended.game!.phase).toBe('game-over');
    expect(ended.undo!.blockedReason).toBe('A player has left the completed game');
    expect(ended.undo!.consentActorUids).toEqual([]);

    const initial = completed(2);
    const [a, b] = initial.room!.seats;
    const history = [command(initial, 1, 'player/present', { epoch: 1 }, b.uid),
      command(initial, 2, 'game/rematched', { rosterVersion: 1, epoch: 1, seed: 'race', layout: 'random' }, a.uid),
      command(initial, 3, 'player/left', { epoch: 1 }, b.uid)];
    const result = replayEvents(history, initial);
    expect(result.game!.epoch).toBe(2);
    expect(result.room!.seats.every(seat => !seat.left)).toBe(true);
    expect(result.acceptedEventIds).not.toContain(history[2].id);
  });
  it('does not count the shared display as a player, preserves occupied edges, and resets two-player neutral merchants', () => {
    const initial = completed(3);
    initial.room!.mode = 'shared-table'; initial.room!.tabletopOwned = true; initial.room!.hostUid = 'table';
    const [a,b,c] = initial.room!.seats;
    const events = [command(initial, 1, 'player/present', { epoch: 1 }, 'table'), command(initial, 2, 'player/present', { epoch: 1 }, a.uid), command(initial, 3, 'player/present', { epoch: 1 }, b.uid),
      command(initial, 4, 'player/left', { epoch: 1 }, c.uid), command(initial, 5, 'game/rematched', { rosterVersion: 1, epoch: 1, seed: 'shared-fresh', layout: 'number-order' }, b.uid)];
    const result = replayEvents(events, initial);
    expect(result.diagnostics).toEqual([]);
    expect(result.room!.hostUid).toBe('table');
    expect(result.room!.seats.map(s => s.tablePosition)).toEqual([a.tablePosition, b.tablePosition]);
    expect(result.game!.players).toHaveLength(2);
    expect(result.game!.neutralMerchants.map(p => p.place)).toEqual([14,15,16]);
    expect(result.game!.end.target).toBe(6);
  });
});
