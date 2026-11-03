import { applyEvent } from "../../src/lib/game/reducer";
import { createSetup, type GameSetup } from "../../src/lib/game/setup";
import {
  manifestVersions,
  reducerVersion,
  rulesEdition,
  schemaVersion,
  type CanonicalEvent,
  type LayoutKind,
  type ReplayProjection,
  type RoomProjection,
} from "../../src/lib/game/protocol";
import {
  nextBotAction,
  matchesBotAction,
  type BotAction,
} from "../../src/lib/game/bot";
import { learnedAction } from "../../src/lib/game/rl/policy";
import oldModel from "../../src/lib/game/rl/model-v1.json";
import { createRandom } from "../../src/lib/game/random";
import {
  encode,
  forward,
  select,
  neuralAction,
  type Network,
  type Sparse,
} from "../../src/lib/game/rl/v2/network";
export type Policy = "money" | "v1" | Network;
export interface Sample {
  state: Sparse;
  options: Sparse[];
  selected: number;
  potential: number;
  value: number;
  phase: string;
}
export function setup(
  seed: string,
  players = 2,
  layout: LayoutKind = "random",
): ReplayProjection {
  const room: RoomProjection = {
    roomCode: "TRAIN",
    hostUid: "p0",
    status: "playing",
    maxPlayers: players,
    layout,
    mode: "personal-screens",
    seats: Array.from({ length: players }, (_, i) => ({
      uid: `p${i}`,
      name: `Player ${i}`,
      ready: true,
    })),
  };
  return {
    room,
    game: createSetup(room, seed),
    acceptedEventIds: [],
    diagnostics: [],
    undo: null,
    undoLog: [],
    gameLog: [],
  };
}
export function event(
  game: GameSetup,
  action: BotAction,
  n: number,
): CanonicalEvent {
  return {
    id: `train-${n}`,
    actorUid: game.players[game.turnSeat].uid,
    clientSeq: String(n),
    createdAt: n,
    manifestVersions: { ...manifestVersions },
    reducerVersion,
    rulesEdition,
    schemaVersion,
    type: action.type,
    payload: {
      ...action.payload,
      drawContextVersion: 1,
      automaticFinalBonus: true,
    },
  };
}
function potential(game: GameSetup, seat: number) {
  const p = game.players[seat];
  return (
    2 *
      (p.rubies -
        Math.max(
          ...game.players.filter((_, i) => i !== seat).map((p) => p.rubies),
        )) +
    0.02 * Math.min(p.lira, 35) +
    0.08 * Object.values(p.goods).reduce((a, b) => a + b, 0) +
    0.25 * p.mosqueTileIds.length +
    0.25 * p.extensions +
    0.02 * p.bonusHand.length
  );
}
function equivalent(a: BotAction, b: BotAction) {
  const { separateRelocation, ...payload } = a.payload;
  const { separateRelocation: _, ...other } = b.payload;
  return matchesBotAction({ ...a, payload }, b.type, other);
}
export function playV2(
  seed: string,
  policies: Policy[],
  layout: LayoutKind,
  learner = -1,
  teacher = false,
  audit = false,
) {
  const state = setup(seed, policies.length, layout),
    game = state.game!,
    random = createRandom(`policy:${seed}`),
    samples: Sample[] = [];
  let count = 0,
    failure: string | null = null;
  const used: Record<string, number> = {};
  const usedBySeat: Record<string, number>[] = policies.map(() => ({}));
  while (game.phase !== "game-over" && game.turnNumber < 240 && count < 2200) {
    const seat = game.turnSeat,
      policy = policies[seat];
    let action: BotAction | null;
    if (typeof policy === "string")
      action =
        policy === "money"
          ? nextBotAction(game)
          : learnedAction(game, oldModel.weights);
    else if (seat === learner) {
      const encoded = encode(game, policy);
      if (!encoded.actions.length) {
        failure = `no-action:${game.phase}:seat${seat}`;
        break;
      }
      let selected: number;
      if (teacher) {
        const target = learnedAction(game, oldModel.weights);
        selected = target
          ? encoded.actions.findIndex((a) => equivalent(a, target))
          : -1;
        if (selected < 0)
          throw new Error(
            `Teacher action absent ${JSON.stringify({ target, phase: game.phase })}`,
          );
      } else
        selected = select(
          forward(policy, encoded.state, encoded.options).probabilities,
          random,
        );
      if (encoded.actions.length > 1)
        samples.push({
          state: encoded.state,
          options: encoded.options,
          selected,
          potential: potential(game, seat),
          value: 0,
          phase: game.phase,
        });
      if (audit)
        for (const candidate of encoded.actions) {
          const clone = structuredClone(state);
          if (!applyEvent(clone, event(clone.game!, candidate, count + 1)))
            throw new Error(
              `Illegal option ${JSON.stringify({ phase: game.phase, candidate, diagnostics: clone.diagnostics })}`,
            );
        }
      action = encoded.actions[selected];
    } else action = neuralAction(game, policy);
    if (!action) {
      failure = `no-action:${game.phase}:seat${seat}`;
      break;
    }
    const key = String(
      (action.payload.choice as { kind?: string })?.kind ?? action.type,
    );
    used[key] = (used[key] ?? 0) + 1;
    usedBySeat[seat][key] = (usedBySeat[seat][key] ?? 0) + 1;
    const command = event(game, action, ++count);
    if (!applyEvent(state, command))
      throw new Error(
        `Rejected ${JSON.stringify({ seed, phase: game.phase, action, diagnostic: state.diagnostics.at(-1) })}`,
      );
  }
  const truncated = game.phase !== "game-over";
  if (truncated && !failure)
    failure = count >= 2200 ? "event-limit" : "turn-limit";
  const scores = policies.map((_, i) =>
    truncated
      ? 0
      : game.end.winnerUids.includes(`p${i}`)
        ? 1 / game.end.winnerUids.length
        : 0,
  );
  if (learner >= 0) {
    let next = potential(game, learner),
      value = truncated ? -8 : (scores[learner] - 0.5) * 12;
    for (let i = samples.length - 1; i >= 0; i--) {
      value = next - samples[i].potential + 0.995 * value - 0.002;
      samples[i].value = value;
      next = samples[i].potential;
    }
  }
  return {
    scores,
    turns: game.turnNumber,
    truncated,
    failure,
    samples,
    used,
    usedBySeat,
  };
}
