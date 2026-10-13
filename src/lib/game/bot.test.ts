import { describe, expect, it } from 'vitest';
import {
  botStateKey,
  nextBotAction,
  matchesBotAction,
  botPolicyVersion
} from './bot';
import { replayEvents } from './reducer';
import {
  manifestVersions,
  reducerVersion,
  rulesEdition,
  schemaVersion,
  type CanonicalEvent,
  type LayoutKind
} from './protocol';

function event(
  n: number,
  type: string,
  payload: Record<string, unknown>,
  actorUid = 'host'
): CanonicalEvent {
  const clientSeq = String(n).padStart(6, '0');
  return {
    id: `${actorUid}-${clientSeq}`,
    actorUid,
    clientSeq,
    createdAt: n,
    type,
    payload,
    manifestVersions: { ...manifestVersions },
    reducerVersion,
    rulesEdition,
    schemaVersion
  };
}
function lobby(layout: LayoutKind = 'number-order', count = 2) {
  const events = [
    event(1, 'game/created', {
      roomCode: 'BOTTS',
      tabletopOwned: true,
      maxPlayers: 5,
      mode: 'shared-table',
      layout
    })
  ];
  for (let i = 0; i < count; i++)
    events.push(
      event(events.length + 1, 'bot/added', { tablePosition: i + 1 })
    );
  return events;
}
function step(events: CanonicalEvent[], actorUid = 'host') {
  const game = replayEvents(events).game!;
  const decision = nextBotAction(game)!;
  return event(
    events.length + 1,
    decision.type,
    {
      ...decision.payload,
      botUid: game.players[game.turnSeat].uid,
      botState: botStateKey(game),
      botVersion: botPolicyVersion
    },
    actorUid
  );
}

describe('simple bot', () => {
  it('accepts reordered Firestore maps without allowing a different action', () => {
    const decision = {
      type: 'place/action-taken',
      payload: { choice: { kind: 'tea-house-wager', wager: 7 } }
    };
    expect(
      matchesBotAction(decision, decision.type, {
        choice: { wager: 7, kind: 'tea-house-wager' }
      })
    ).toBe(true);
    expect(
      matchesBotAction(decision, decision.type, {
        choice: { wager: 12, kind: 'tea-house-wager' }
      })
    ).toBe(false);
  });
  it('only lets the host add and remove bots, enforces seats and keeps bots ready after configuration', () => {
    const events = lobby();
    let state = replayEvents(events);
    expect(state.room?.seats.every((s) => s.bot && s.ready)).toBe(true);
    expect(
      replayEvents([
        ...events,
        event(4, 'bot/added', { tablePosition: 3 }, 'guest')
      ]).diagnostics.at(-1)?.reason
    ).toBe('host-only');
    expect(
      replayEvents([
        ...events,
        event(4, 'bot/added', { tablePosition: 1 })
      ]).diagnostics.at(-1)?.reason
    ).toBe('invalid-table-position');
    events.push(
      event(4, 'game/configured', {
        maxPlayers: 5,
        layout: 'random',
        mode: 'shared-table'
      })
    );
    state = replayEvents(events);
    expect(state.room?.seats.every((s) => s.ready)).toBe(true);
    events.push(event(5, 'bot/removed', { botUid: state.room!.seats[0].uid }));
    expect(replayEvents(events).room?.seats).toHaveLength(1);
    const full = lobby('number-order', 5);
    expect(
      replayEvents([
        ...full,
        event(7, 'bot/added', { tablePosition: 6 })
      ]).diagnostics.at(-1)?.reason
    ).toBe('room-full');
  });
  it('rejects impersonation and forged decisions, and ignores concurrent stale decisions', () => {
    const events = [...lobby(), event(4, 'game/started', { seed: 'bots' })];
    const move = step(events);
    const after = replayEvents([...events, move]);
    expect(after.diagnostics).toEqual([]);
    expect(
      replayEvents([...events, step(events, 'guest')]).diagnostics.at(-1)
        ?.reason
    ).toBe('bot-not-authorized');
    expect(
      replayEvents([
        ...events,
        { ...move, payload: { ...move.payload, destination: 99 } }
      ]).diagnostics.at(-1)?.reason
    ).toBe('invalid-bot-decision');
    const duplicate = event(6, move.type, move.payload);
    const replayed = replayEvents([...events, move, duplicate]);
    expect(replayed.game).toEqual(after.game);
    expect(replayed.diagnostics).toEqual([]);
    expect(replayed.undo?.blockedReason).toBe('The bot has acted');
  });
  it('does not use hidden cards or the random seed to choose a move', () => {
    const game = replayEvents([
      ...lobby(),
      event(4, 'game/started', { seed: 'public-info' })
    ]).game!;
    const decision = nextBotAction(game);
    const changed = structuredClone(game);
    changed.seed = 'different-future-rolls';
    changed.bonusDrawPile.reverse();
    for (const p of changed.players) p.bonusHand = ['unseen-card'];
    expect(nextBotAction(changed)).toEqual(decision);
  });
  it.each([
    'short-path',
    'long-path',
    'number-order',
    'random'
  ] as LayoutKind[])(
    'finishes a complete legal game on %s, with deterministic replay',
    (layout) => {
      const events = lobby(layout, layout === 'random' ? 5 : 2);
      events.push(
        event(events.length + 1, 'game/started', { seed: `bot-test-${layout}` })
      );
      let state = replayEvents(events);
      for (let i = 0; i < 1800 && state.game!.phase !== 'game-over'; i++) {
        const decision = nextBotAction(state.game!);
        expect(
          decision,
          JSON.stringify({
            turn: state.game!.turnNumber,
            phase: state.game!.phase
          })
        ).not.toBeNull();
        events.push(
          event(events.length + 1, decision!.type, {
            ...decision!.payload,
            botUid: state.game!.players[state.game!.turnSeat].uid,
            botState: botStateKey(state.game!),
            botVersion: botPolicyVersion
          })
        );
        state = replayEvents(events);
        expect(state.diagnostics, `Step ${i}`).toEqual([]);
      }
      expect(
        state.game!.phase,
        `Stopped at turn ${state.game!.turnNumber}`
      ).toBe('game-over');
      expect(state.game!.end.winnerUids.length).toBeGreaterThan(0);
      expect(replayEvents(events).game).toEqual(state.game);
    },
    60_000
  );
});
