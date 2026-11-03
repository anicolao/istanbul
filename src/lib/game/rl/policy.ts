import type { GameSetup } from "../setup";
import { createRandom, type RandomSource } from "../random";
import type { BotAction } from "../bot";
import { decisionOptions, tacticalAction, type Option } from "./options";

export function probabilities(
  options: Option[],
  weights: readonly number[],
  temperature = 1,
): number[] {
  const logits = options.map(
    (o) =>
      o.features.reduce((sum, x, i) => sum + x * (weights[i] ?? 0), 0) /
      temperature,
  );
  const max = Math.max(...logits);
  const exps = logits.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((x) => x / sum);
}
export function chooseOption(
  options: Option[],
  weights: readonly number[],
  random?: RandomSource,
): number {
  if (!random) {
    const scores = options.map((o) =>
      o.features.reduce((sum, x, i) => sum + x * (weights[i] ?? 0), 0),
    );
    return scores.indexOf(Math.max(...scores));
  }
  const probs = probabilities(options, weights);
  let draw = random.nextInt(1_000_000) / 1_000_000;
  for (let i = 0; i < probs.length; i++) {
    draw -= probs[i];
    if (draw < 0) return i;
  }
  return probs.length - 1;
}
/** A small exploration floor avoids deterministic movement cycles. Its PRNG uses only
 * public observations, never the game's hidden random seed or deck order. */
export function deployedChoice(
  game: GameSetup,
  options: Option[],
  weights: readonly number[],
): number {
  const random = createRandom(
    `rl-v1:${game.epoch}:${game.turnNumber}:${game.turnSeat}:${game.phase}:${game.board.join(",")}:${options.map((o) => o.features.join(",")).join(";")}`,
  );
  return random.nextInt(100) < 5
    ? random.nextInt(options.length)
    : chooseOption(options, weights);
}
export function learnedAction(
  game: GameSetup,
  weights: readonly number[],
): BotAction | null {
  const tactical = tacticalAction(game);
  if (tactical) return tactical;
  const options = decisionOptions(game);
  return options.length
    ? options[deployedChoice(game, options, weights)].action
    : null;
}
