import { describe, expect, it } from "vitest";
import { createSetup } from "../setup";
import { applyEvent, replayEvents } from "../reducer";
import { botStateKey, nextBotAction } from "../bot";
import { policyAction, policyVersion } from "../bot-policy";
import {
  schemaVersion,
  reducerVersion,
  rulesEdition,
  manifestVersions,
  type CanonicalEvent,
  type LayoutKind,
  type RoomProjection,
} from "../protocol";
import { decisionOptions, featureNames, tacticalAction } from "./options";
import { learnedAction } from "./policy";
import model from "./model-v1.json";
import historicGame from "./replay-v1.json";

const room: RoomProjection = {
  roomCode: "RLBOT",
  hostUid: "host",
  status: "playing",
  maxPlayers: 2,
  mode: "personal-screens",
  layout: "short-path",
  seats: [
    { uid: "host", name: "Ada", ready: true },
    { uid: "guest", name: "Bora", ready: true },
  ],
};
function event(
  n: number,
  type: string,
  payload: Record<string, unknown> = {},
): CanonicalEvent {
  return {
    id: `host-${String(n).padStart(6, "0")}`,
    actorUid: "host",
    clientSeq: String(n).padStart(6, "0"),
    createdAt: n,
    type,
    payload,
    schemaVersion,
    reducerVersion,
    rulesEdition,
    manifestVersions: { ...manifestVersions },
  };
}
function lobby(layout: LayoutKind, count = 2) {
  const events = [
    event(1, "game/created", {
      roomCode: "RLBOT",
      tabletopOwned: true,
      maxPlayers: count,
      mode: "shared-table",
      layout,
    }),
  ];
  for (let i = 0; i < count; i++)
    events.push(
      event(events.length + 1, "bot/added", {
        policy: "rl-v1",
        tablePosition: i + 1,
      }),
    );
  events.push(
    event(events.length + 1, "game/started", { seed: `rl-replay-${layout}` }),
  );
  return events;
}
describe("trained policy v1", () => {
  it('preserves a frozen complete game played with policy v1', () => {
    const replay = replayEvents(historicGame.events);
    expect(replay.diagnostics).toEqual([]);
    expect(replay.game?.phase).toBe('game-over');
    expect(replay.game?.end.winnerUids).toEqual(historicGame.winnerUids);
  });
  it("ships a finite, nonzero model with the exact frozen observation schema", () => {
    expect(model.features).toEqual(featureNames);
    expect(model.weights).toHaveLength(featureNames.length);
    expect(model.weights.every(Number.isFinite)).toBe(true);
    expect(model.weights.some((w) => w !== 0)).toBe(true);
  });
  it("never observes hidden deck order, another hand, or future random seed", () => {
    for (const phase of ["movement", "action", "turn-end"] as const) {
      const game = createSetup(room, "information-boundary");
      game.phase = phase;
      game.players[game.turnSeat].merchantPlace = 12;
      const before = structuredClone(game);
      const changed = structuredClone(game);
      changed.seed = "an entirely different unseen future";
      changed.bonusDrawPile.reverse();
      for (const [i, p] of changed.players.entries())
        if (i !== changed.turnSeat)
          p.bonusHand = ["bonus-repeat-gemstone-1", "bonus-gain-lira-1"];
      changed.largeDemand = [
        changed.largeDemand[0],
        ...changed.largeDemand.slice(1).reverse(),
      ];
      changed.smallDemand = [
        changed.smallDemand[0],
        ...changed.smallDemand.slice(1).reverse(),
      ];
      expect(decisionOptions(changed)).toEqual(decisionOptions(game));
      expect(learnedAction(changed, model.weights)).toEqual(
        learnedAction(game, model.weights),
      );
      expect(game).toEqual(before);
    }
  });
  it("preserves the original money bot and rejects unknown strategies", () => {
    const game = createSetup(room, "legacy");
    expect(policyAction(game)).toEqual(nextBotAction(game));
    expect(policyVersion()).toBe(1);
    expect(policyVersion("rl-v1")).toBe(2);
    const state = replayEvents([
      event(1, "game/created", {
        roomCode: "RLBOT",
        hostName: "Host",
        maxPlayers: 2,
        mode: "personal-screens",
        layout: "short-path",
      }),
      event(2, "bot/added", { policy: "unknown" }),
    ]);
    expect(state.room?.seats).toHaveLength(1);
    expect(state.diagnostics.at(-1)?.reason).toBe("invalid-bot-policy");
  });
  it.each([
    "short-path",
    "long-path",
    "number-order",
    "random",
  ] as LayoutKind[])(
    "finishes %s and replays every versioned bot decision exactly",
    (layout) => {
      const events = lobby(layout, layout === "random" ? 5 : 2);
      const state = replayEvents(events);
      expect(state.diagnostics).toEqual([]);
      expect(state.room?.seats[1].botPolicy).toBe("rl-v1");
      let n = events.length;
      for (
        let step = 0;
        step < 2000 && state.game!.phase !== "game-over";
        step++
      ) {
        const game = state.game!;
        const player = game.players[game.turnSeat];
        const seat = state.room!.seats.find((s) => s.uid === player.uid)!;
        const decision = seat.bot
          ? policyAction(game, seat.botPolicy)
          : learnedAction(game, model.weights);
        expect(decision, `${layout}: ${game.phase}`).not.toBeNull();
        const e = event(++n, decision!.type, {
          ...decision!.payload,
          drawContextVersion: 1,
          automaticFinalBonus: true,
          ...(seat.bot
            ? {
                botUid: player.uid,
                botState: botStateKey(game),
                botVersion: policyVersion(seat.botPolicy),
              }
            : {}),
        });
        if (seat.bot && step === 0) {
          const invalid = structuredClone(state);
          expect(
            applyEvent(invalid, {
              ...e,
              payload: { ...e.payload, botVersion: 1 },
            }),
          ).toBe(false);
        }
        expect(
          applyEvent(state, e),
          JSON.stringify(state.diagnostics.at(-1)),
        ).toBe(true);
        events.push(e);
      }
      expect(state.game!.phase).toBe("game-over");
      const replay = replayEvents(events);
      expect(replay.diagnostics).toEqual([]);
      expect(replay.game).toEqual(state.game);
    },
    30_000,
  );
});
