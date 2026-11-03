import { describe, it, expect } from "vitest";
import { legalActions, multisets } from "./actions";
import { observation } from "./observation";
import { mobilityFeatures } from "./mobility";
import { actionFeatures } from "./features";
import {
  initialize,
  forward,
  backward,
  sparse,
  neuralAction,
  type Network,
} from "./network";
import { applyEvent, replayEvents } from "../../reducer";
import { policyAction, policyVersion } from "../../bot-policy";
import { botStateKey } from "../../bot";
import model from "./model.json";
import frozenGame from "./replay.json";
import type { ReplayProjection } from "../../protocol";
import type { CanonicalEvent, LayoutKind } from "../../protocol";
import { bonusCards, mosqueTiles, type Good } from "../../manifests";
import { setup, event, playV2 } from "../../../../../scripts/rl/environment-v2";
import type { GameSetup } from "../../setup";

function rich() {
  const state = setup("all-actions", 5),
    g = state.game!,
    p = g.players[g.turnSeat];
  p.goods = { fabric: 5, spice: 5, fruit: 5, jewelry: 5 };
  p.capacity = 5;
  p.lira = 30;
  p.bonusHand = bonusCards.map((c) => c.id);
  g.bonusDrawPile = bonusCards.map((c) => c.id);
  g.bonusDiscard = bonusCards.slice(0, 4).map((c) => c.id);
  p.assistantsCarried = 2;
  p.assistantsByPlace = { 2: 1, 3: 2 };
  return state;
}
function audit(state: ReturnType<typeof setup>) {
  const before = JSON.stringify(state),
    actions = legalActions(state.game!);
  expect(actions.length).toBeGreaterThan(0);
  for (const action of actions) {
    const clone = structuredClone(state);
    expect(
      applyEvent(clone, event(clone.game!, action, 1)),
      JSON.stringify({ action, diagnostics: clone.diagnostics }),
    ).toBe(true);
    expect(actionFeatures(state.game!, action).every(Number.isFinite)).toBe(
      true,
    );
  }
  expect(JSON.stringify(state)).toBe(before);
  return actions;
}
const choices = (g: GameSetup, kind: string) =>
  legalActions(g).filter(
    (a) => (a.payload.choice as { kind?: string })?.kind === kind,
  );
describe("complete-action RL v2", () => {
  it("enumerates every location, family visit, optional card and ability as reducer-accepted actions", () => {
    for (let place = 1; place <= 16; place++)
      for (const family of [false, true]) {
        if (family && place === 12) continue;
        const state = rich(),
          g = state.game!,
          p = g.players[g.turnSeat];
        p.merchantPlace = place;
        g.phase = family ? "family-action" : "action";
        g.pending = family
          ? { kind: "family-action", destination: place }
          : null;
        audit(state);
      }
    const state = rich(),
      g = state.game!,
      p = g.players[g.turnSeat];
    g.phase = "movement";
    p.merchantPlace = 8;
    p.mosqueTileIds = [mosqueTiles.find((t) => t.color === "fruit")!.id];
    audit(state);
    expect(choices(g, "long-move")).not.toHaveLength(0);
    expect(choices(g, "stay")).not.toHaveLength(0);
    expect(
      choices(g, "return-assistant").map(
        (a) => (a.payload.choice as any).place,
      ),
    ).toContain(3);
    expect(choices(g, "yellow-recall")).toHaveLength(2);
    for (const place of [5, 13, 16]) {
      g.phase = "turn-end";
      g.lastAction = {
        playerUid: p.uid,
        place,
        kind: "post-office-collect",
        summary: "",
      };
      audit(state);
      expect(choices(g, "repeat-action").length).toBeGreaterThan(0);
    }
  });
  it("offers partial recalls, all market subsets and wild allocations, and all wagers", () => {
    const state = rich(),
      g = state.game!,
      p = g.players[g.turnSeat];
    g.phase = "action";
    p.merchantPlace = 7;
    expect(choices(g, "fountain-recall")).toHaveLength(6);
    audit(state);
    p.merchantPlace = 10;
    expect(choices(g, "market-sell")).toHaveLength(31);
    audit(state);
    p.merchantPlace = 11;
    g.activeBonusEffects = ["wild-small-market"];
    const wild = choices(g, "market-sell").filter(
      (a) => (a.payload.choice as any).wildGoods,
    );
    expect(wild).toHaveLength(125);
    audit(state);
    p.merchantPlace = 9;
    expect(
      choices(g, "tea-house-wager").map((a) => (a.payload.choice as any).wager),
    ).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    p.merchantPlace = 6;
    expect(choices(g, "caravansary-draw")).toHaveLength(4);
  });
  it("offers all NPC payments, rewards, discards and red/green abilities", () => {
    const state = rich(),
      g = state.game!,
      p = g.players[g.turnSeat];
    g.phase = "encounters";
    p.merchantPlace = 8;
    g.players[(g.turnSeat + 1) % 5].familyPlace = 8;
    const familyUid = g.players[(g.turnSeat + 1) % 5].uid;
    g.pending = {
      kind: "encounters",
      familyUids: [familyUid],
      governor: "available",
      smuggler: true,
    };
    p.goods = { fabric: 2, spice: 2, fruit: 2, jewelry: 2 };
    audit(state);
    expect(choices(g, "catch-family")).toHaveLength(2);
    expect(choices(g, "smuggler-trade")).toHaveLength(21);
    g.pending = {
      kind: "encounters",
      familyUids: [],
      governor: "payment",
      smuggler: true,
    };
    audit(state);
    expect(choices(g, "governor-pay")).toHaveLength(p.bonusHand.length + 1);
    g.pending = {
      kind: "encounters",
      familyUids: [],
      governor: null,
      smuggler: true,
      relocation: "governor",
    };
    audit(state);
    g.phase = "action";
    g.pending = { kind: "caravansary-discard", familyAction: false };
    audit(state);
    expect(legalActions(g)).toHaveLength(p.bonusHand.length);
    g.phase = "mosque-ability";
    p.mosqueTileIds = mosqueTiles
      .filter((t) => t.required === 2)
      .map((t) => t.id);
    g.lastAction = {
      playerUid: p.uid,
      place: 3,
      kind: "warehouse-fill",
      summary: "",
    };
    g.pending = {
      kind: "warehouse-extra",
      actionPlace: 3,
      familyAction: false,
    };
    audit(state);
    expect(choices(g, "warehouse-extra")).toHaveLength(5);
    g.pending = {
      kind: "dice-adjust",
      actionPlace: 9,
      originalDice: [2, 5],
      wager: 8,
      familyAction: false,
    };
    audit(state);
    expect(choices(g, "dice-adjust")).toHaveLength(4);
  });
  it("does not condition options or features on hidden information", () => {
    const g = rich().game!,
      other = structuredClone(g),
      own = g.turnSeat;
    other.seed = "secret changed";
    other.bonusDrawPile = other.bonusDrawPile.map(() => bonusCards[0].id);
    other.bonusDrawCounts = { secret: 999 };
    other.largeDemand = [
      other.largeDemand[0],
      ...other.largeDemand.slice(1).reverse(),
    ];
    other.smallDemand = [
      other.smallDemand[0],
      ...other.smallDemand.slice(1).reverse(),
    ];
    other.players.forEach((p, i) => {
      if (i !== own) p.bonusHand = p.bonusHand.map(() => bonusCards.at(-1)!.id);
    });
    expect(observation(other)).toEqual(observation(g));
    expect(neuralAction(other, model as Network)).toEqual(
      neuralAction(g, model as Network),
    );
    expect(legalActions(other)).toEqual(legalActions(g));
    expect(legalActions(other).map((a) => actionFeatures(other, a))).toEqual(
      legalActions(g).map((a) => actionFeatures(g, a)),
    );
    for (const mutate of [
      (g: GameSetup) => g.board.reverse(),
      (g: GameSetup) => g.players[(own + 1) % 5].goods.fabric++,
      (g: GameSetup) => g.bonusDiscard.push(bonusCards.at(-1)!.id),
      (g: GameSetup) => g.players[own].bonusHand.pop(),
      (g: GameSetup) => (g.postOfficeLower[0] = true),
    ]) {
      const changed = structuredClone(g);
      mutate(changed);
      expect(observation(changed)).not.toEqual(observation(g));
    }
  });
  it("keeps the observation/action dimensions fixed across phases", () => {
    const sizes = new Set<number>(),
      actionSizes = new Set<number>();
    for (let count = 2; count <= 5; count++)
      for (const phase of ["movement", "action", "turn-end"] as const) {
        const g = setup("dimensions", count).game!;
        g.phase = phase;
        sizes.add(observation(g).length);
        for (const a of legalActions(g))
          actionSizes.add(actionFeatures(g, a).length);
      }
    expect(sizes.size).toBe(1);
    expect(actionSizes.size).toBe(1);
  });
  it("exposes long-move stranding risk without removing the legal move", () => {
    const g = setup("mobility").game!,
      p = g.players[g.turnSeat];
    g.board = [2, 16, 15, 8, 5, 14, 13, 1, 11, 4, 7, 12, 6, 10, 3, 9];
    p.merchantPlace = 8;
    p.assistantsCarried = 1;
    p.assistantsByPlace = { 1: 1, 8: 1, 12: 1 };
    p.bonusHand = [];
    g.activeBonusEffects = ["long-move"];
    const move = legalActions(g).find(
      (a) => a.type === "turn/moved" && a.payload.destination === 5,
    )!;
    expect(move).toBeDefined();
    expect(mobilityFeatures(g, move)).toEqual([1, 0]);
    const fountain = legalActions(g).find(
      (a) => a.type === "turn/moved" && a.payload.destination === 7,
    )!;
    expect(mobilityFeatures(g, fountain)).toEqual([0, 0]);
    expect(mobilityFeatures(g, neuralAction(g, model as Network)!)).toEqual([
      0, 0,
    ]);
    p.bonusHand = ["bonus-return-assistant-1"];
    expect(mobilityFeatures(g, move)).toEqual([0, 0]);
  });
  it("backpropagates the actual action probability", () => {
    const model = initialize(3, 2, 3),
      state = sparse([0.4, 0, 0.2]),
      options = [
        [1, 0],
        [0, 1],
        [0.3, 0.6],
      ].map(sparse),
      frame = forward(model, state, options),
      gradient = new Float64Array(model.weights.length);
    backward(model, frame, 1, 1, gradient);
    for (let i = 0; i < model.weights.length; i++) {
      const value = model.weights[i],
        eps = 1e-5;
      model.weights[i] = value + eps;
      const high = Math.log(forward(model, state, options).probabilities[1]);
      model.weights[i] = value - eps;
      const low = Math.log(forward(model, state, options).probabilities[1]);
      model.weights[i] = value;
      expect(gradient[i]).toBeCloseTo((high - low) / (2 * eps), 7);
    }
  });
  it.each([
    "short-path",
    "long-path",
    "number-order",
    "random",
  ] as LayoutKind[])(
    "authenticates complete v2 games and replays %s exactly",
    (layout) => {
      const state = setup(
        `v2-integration:${layout}`,
        layout === "random" ? 5 : 2,
        layout,
      );
      state.room!.hostUid = "host";
      for (const seat of state.room!.seats) {
        seat.bot = true;
        seat.botPolicy = "rl-v2";
      }
      const initial = structuredClone(state),
        events: CanonicalEvent[] = [];
      expect(policyVersion("rl-v2")).toBe(3);
      for (let n = 1; n <= 2000 && state.game!.phase !== "game-over"; n++) {
        const game = state.game!,
          action = policyAction(game, "rl-v2");
        expect(action, `${layout}: ${game.phase}`).not.toBeNull();
        const e = event(game, action!, n);
        e.actorUid = "host";
        e.clientSeq = String(n).padStart(6, "0");
        e.id = `host-${e.clientSeq}`;
        Object.assign(e.payload, {
          botUid: game.players[game.turnSeat].uid,
          botState: botStateKey(game),
          botVersion: 3,
        });
        if (n === 1) {
          const wrong = structuredClone(state);
          expect(
            applyEvent(wrong, {
              ...e,
              payload: { ...e.payload, botVersion: 2 },
            }),
          ).toBe(false);
        }
        expect(
          applyEvent(state, e),
          JSON.stringify({ action, diagnostics: state.diagnostics }),
        ).toBe(true);
        events.push(e);
      }
      expect(state.game!.phase).toBe("game-over");
      const replay = replayEvents(events, initial);
      expect(replay.diagnostics).toEqual([]);
      expect(replay.game).toEqual(state.game);
    },
    30000,
  );
  it("preserves the frozen complete v2 replay", () => {
    const result = replayEvents(
      frozenGame.events,
      frozenGame.initial as ReplayProjection,
    );
    expect(result.diagnostics).toEqual([]);
    expect(result.game?.phase).toBe("game-over");
    expect(result.game?.end.winnerUids).toEqual(frozenGame.winnerUids);
  });
  it("ships finite weights matching the observation and action dimensions", () => {
    const game = setup("shape").game!;
    expect(model.inputs).toBe(observation(game).length);
    expect(model.actions).toBe(
      actionFeatures(game, legalActions(game)[0]).length +
        ((model as Network).mobility ? 2 : 0),
    );
    expect(model.weights.length).toBe(
      model.hidden * (model.inputs + model.actions + 1) +
        model.hidden +
        model.actions,
    );
    expect(model.weights.every(Number.isFinite)).toBe(true);
  });
});
