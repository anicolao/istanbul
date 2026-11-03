import { botPolicyVersion, nextBotAction } from "./bot";
import type { GameSetup } from "./setup";
import { learnedAction } from "./rl/policy";
import model from "./rl/model-v1.json";

export type BotPolicy = "money-v1" | "rl-v1";
export function policyVersion(policy?: BotPolicy): number {
  return policy === "rl-v1" ? 2 : botPolicyVersion;
}
/** Versioned policy weights must never change after release: saved events revalidate decisions. */
export function policyAction(game: GameSetup, policy?: BotPolicy) {
  return policy === "rl-v1"
    ? learnedAction(game, model.weights)
    : nextBotAction(game);
}
