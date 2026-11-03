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
import { nextBotAction } from "../../src/lib/game/bot";
import { createRandom } from "../../src/lib/game/random";
import { decisionOptions, tacticalAction } from "../../src/lib/game/rl/options";
import {
  chooseOption,
  probabilities,
  deployedChoice,
} from "../../src/lib/game/rl/policy";

export type Policy =
  | "money"
  | { weights: readonly number[]; sample?: boolean; record?: boolean };
export interface Experience {
  gradient: number[];
  potential: number;
  return: number;
}
export interface Result {
  scores: number[];
  rubies: number[];
  turns: number;
  truncated: boolean;
  traces: Experience[][];
  failure?: {
    seed: string;
    phase: string;
    turn: number;
    seat: number;
    reason: string;
  };
}
export const layouts: LayoutKind[] = [
  "short-path",
  "long-path",
  "number-order",
  "random",
];
function potential(game: GameSetup, seat: number): number {
  const p = game.players[seat];
  const opponent = Math.max(
    ...game.players.filter((_, i) => i !== seat).map((p) => p.rubies),
  );
  return (
    0.65 * (p.rubies - opponent) +
    0.012 * Math.min(35, p.lira) +
    0.025 * Object.values(p.goods).reduce((a, b) => a + b, 0) +
    0.06 * p.mosqueTileIds.length +
    0.04 * p.extensions
  );
}
export function play(
  seed: string,
  policies: Policy[],
  layout: LayoutKind,
): Result {
  const room: RoomProjection = {
    roomCode: "TRAIN",
    hostUid: "p0",
    status: "playing",
    maxPlayers: policies.length,
    layout,
    mode: "personal-screens",
    seats: policies.map((_, i) => ({
      uid: `p${i}`,
      name: `Player ${i}`,
      ready: true,
    })),
  };
  const state: ReplayProjection = {
    room,
    game: createSetup(room, seed),
    acceptedEventIds: [],
    diagnostics: [],
    undo: null,
    undoLog: [],
    gameLog: [],
  };
  const game = state.game!;
  const random = createRandom(`exploration:${seed}`);
  const traces: Experience[][] = policies.map(() => []);
  let n = 0;
  let stopped = "turn-limit";
  while (game.phase !== "game-over" && game.turnNumber < 320 && n < 2400) {
    const seat = game.turnSeat;
    const policy = policies[seat];
    let action;
    if (policy === "money") action = nextBotAction(game);
    else {
      action = tacticalAction(game);
      if (!action) {
        const options = decisionOptions(game);
        if (!options.length) {
          stopped = "no-action";
          break;
        }
        const probs = probabilities(options, policy.weights);
        const selected = policy.sample
          ? chooseOption(options, policy.weights, random)
          : deployedChoice(game, options, policy.weights);
        if (policy.record)
          traces[seat].push({
            potential: potential(game, seat),
            return: 0,
            gradient: options[selected].features.map(
              (x, j) =>
                x -
                options.reduce(
                  (sum, o, i) => sum + probs[i] * o.features[j],
                  0,
                ),
            ),
          });
        action = options[selected].action;
      }
    }
    if (!action) {
      stopped = "no-action";
      break;
    }
    const event: CanonicalEvent = {
      id: `train-${++n}`,
      actorUid: game.players[seat].uid,
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
    if (!applyEvent(state, event))
      throw new Error(
        JSON.stringify({
          seed,
          phase: game.phase,
          action,
          diagnostic: state.diagnostics.at(-1),
        }),
      );
  }
  const truncated = game.phase !== "game-over";
  const scores = policies.map((_, seat) =>
    truncated
      ? 0
      : game.end.winnerUids.includes(`p${seat}`)
        ? 1 / game.end.winnerUids.length
        : 0,
  );
  for (let seat = 0; seat < traces.length; seat++) {
    let nextPotential = potential(game, seat);
    let value = truncated ? -2 : (scores[seat] - 0.5) * 6;
    const trace = traces[seat];
    for (let i = trace.length - 1; i >= 0; i--) {
      value = nextPotential - trace[i].potential + 0.985 * value;
      trace[i].return = value;
      nextPotential = trace[i].potential;
    }
  }
  return {
    ...(truncated
      ? {
          failure: {
            seed,
            reason: stopped,
            phase: game.phase,
            turn: game.turnNumber,
            seat: game.turnSeat,
            player: game.players[game.turnSeat],
            board: game.board,
          },
        }
      : {}),
    scores,
    rubies: game.players.map((p) => p.rubies),
    turns: game.turnNumber,
    truncated,
    traces,
  };
}
