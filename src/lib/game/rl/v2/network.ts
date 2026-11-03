import { createRandom, type RandomSource } from "../../random";
import type { GameSetup } from "../../setup";
import type { BotAction } from "../../bot";
import { legalActions } from "./actions";
import { observation } from "./observation";
import { actionFeatures } from "./features";
import { mobilityFeatures } from "./mobility";
import { decisionOptions } from "../options";

export interface Network {
  version: 2;
  mobility?: boolean;
  selection?: "sample" | "greedy";
  inputs: number;
  actions: number;
  hidden: number;
  weights: number[];
}
export type Sparse = Array<[number, number]>;
export const sparse = (x: readonly number[]): Sparse =>
  x.flatMap((v, i) => (v === 0 ? [] : [[i, v] as [number, number]]));
export function initialize(
  inputs: number,
  actions: number,
  hidden = 24,
  seed = "rl-v2",
): Network {
  const random = createRandom(seed);
  const count = hidden * (inputs + actions + 1) + hidden + actions;
  return {
    version: 2,
    inputs,
    actions,
    hidden,
    weights: Array.from(
      { length: count },
      () => (random.nextInt(1_000_000) / 1_000_000 - 0.5) * 0.04,
    ),
  };
}
export interface Frame {
  state: Sparse;
  options: Sparse[];
  hidden: number[][];
  probabilities: number[];
}
export function forward(
  model: Network,
  state: Sparse,
  options: Sparse[],
): Frame {
  const { inputs: S, actions: A, hidden: H, weights: w } = model,
    ao = H * S,
    bo = ao + H * A,
    vo = bo + H,
    lo = vo + H;
  const base = Array.from({ length: H }, (_, h) =>
    state.reduce((sum, [i, v]) => sum + w[h * S + i] * v, w[bo + h]),
  );
  const hidden = options.map((a) =>
    base.map((b, h) =>
      Math.tanh(a.reduce((sum, [i, v]) => sum + w[ao + h * A + i] * v, b)),
    ),
  );
  const logits = options.map((a, k) =>
    hidden[k].reduce(
      (sum, v, h) => sum + v * w[vo + h],
      a.reduce((sum, [i, v]) => sum + w[lo + i] * v, 0),
    ),
  );
  const max = Math.max(...logits),
    exps = logits.map((l) => Math.exp(l - max)),
    sum = exps.reduce((a, b) => a + b, 0);
  return { state, options, hidden, probabilities: exps.map((v) => v / sum) };
}
/** Adds gradient of log pi(selected|state); state contribution is shared across options. */
export function backward(
  model: Network,
  frame: Frame,
  selected: number,
  advantage: number,
  gradient: Float64Array,
) {
  const { inputs: S, actions: A, hidden: H, weights: w } = model,
    ao = H * S,
    bo = ao + H * A,
    vo = bo + H,
    lo = vo + H;
  const shared = new Float64Array(H);
  for (let k = 0; k < frame.options.length; k++) {
    const d = advantage * ((k === selected ? 1 : 0) - frame.probabilities[k]);
    for (const [i, v] of frame.options[k]) gradient[lo + i] += d * v;
    for (let h = 0; h < H; h++) {
      const z = frame.hidden[k][h],
        dh = d * w[vo + h] * (1 - z * z);
      gradient[vo + h] += d * z;
      shared[h] += dh;
      for (const [i, v] of frame.options[k]) gradient[ao + h * A + i] += dh * v;
    }
  }
  for (let h = 0; h < H; h++) {
    gradient[bo + h] += shared[h];
    for (const [i, v] of frame.state) gradient[h * S + i] += shared[h] * v;
  }
}
export function encode(game: GameSetup, model?: Network) {
  const actions = legalActions(game),
    legacy = decisionOptions(game);
  return {
    actions,
    state: sparse(observation(game)),
    options: actions.map((a) =>
      sparse([
        ...actionFeatures(game, a, legacy),
        ...(model?.mobility ? mobilityFeatures(game, a) : []),
      ]),
    ),
  };
}
export function select(probs: number[], random?: RandomSource): number {
  if (!random) return probs.indexOf(Math.max(...probs));
  let value = random.nextInt(1_000_000) / 1_000_000;
  for (let i = 0; i < probs.length; i++) {
    value -= probs[i];
    if (value < 0) return i;
  }
  return probs.length - 1;
}
export function neuralAction(
  game: GameSetup,
  model: Network,
): BotAction | null {
  const encoded = encode(game, model);
  if (!encoded.actions.length) return null;
  if (encoded.actions.length === 1) return encoded.actions[0];
  const frame = forward(model, encoded.state, encoded.options);
  // Frozen training checkpoints sample; the released model uses greedy selection.
  // Sampling RNG observes no hidden state and remains replay-stable.
  const random = createRandom(
    `rl-v2:${game.epoch}:${game.turnNumber}:${game.turnSeat}:${JSON.stringify(encoded.state)}:${JSON.stringify(encoded.options)}`,
  );
  return encoded.actions[
    select(
      frame.probabilities,
      model.selection === "greedy" ? undefined : random,
    )
  ];
}
