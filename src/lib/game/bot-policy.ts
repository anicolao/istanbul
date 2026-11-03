import { botPolicyVersion, nextBotAction } from "./bot";
import type { GameSetup } from "./setup";
import { learnedAction } from "./rl/policy";
import model from "./rl/model-v1.json";

import { neuralAction, type Network } from "./rl/v2/network";
import modelV2 from "./rl/v2/model.json";

export type BotPolicy = "money-v1" | "rl-v1" | "rl-v2";
export function policyVersion(policy?: BotPolicy): number {
  return policy === "rl-v2" ? 3 : policy === "rl-v1" ? 2 : botPolicyVersion;
}
/** Versioned policy weights must never change after release: saved events revalidate decisions. */
export function policyAction(game: GameSetup, policy?: BotPolicy) {
  return policy === "rl-v2"
    ? neuralAction(game, modelV2 as Network)
    : policy === "rl-v1"
      ? learnedAction(game, model.weights)
      : nextBotAction(game);
}
