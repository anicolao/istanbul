import { mkdirSync, writeFileSync } from "node:fs";
import { featureNames } from "../../src/lib/game/rl/options";
import { createRandom } from "../../src/lib/game/random";
import { layouts, play, type Policy } from "./environment";

const args = process.argv.slice(2);
const arg = (key: string, fallback: string) =>
  args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const episodes = Number(arg("--episodes", "8192"));
const selfEpisodes = Number(arg("--self-play", "16384"));
const out = arg("--out", "/tmp/istanbul-rl-training");
const seed = arg("--seed", "istanbul-rl-v1");
if (!Number.isInteger(episodes) || episodes < 32 || episodes % 32 || !Number.isInteger(selfEpisodes) || selfEpisodes < 0 || selfEpisodes % 32) {
  throw new Error('Training counts must be multiples of 32; --episodes must be positive.');
}
mkdirSync(out, { recursive: true });
let weights = featureNames.map(() => 0 as number);
let m = weights.map(() => 0),
  v = weights.map(() => 0);
let update = 0;
let bestWeights = [...weights],
  bestScore = -Infinity;
let warmWeights: number[] = [];
const rng = createRandom(seed);
const history: unknown[] = [];
const pool: number[][] = [];
function save(name: string) {
  writeFileSync(
    `${out}/${name}.json`,
    JSON.stringify(
      {
        version: 1,
        features: featureNames,
        weights,
        seed,
        episodes,
        selfEpisodes,
      },
      null,
      2,
    ) + "\n",
  );
}
function evaluate(opponent: Policy, prefix: string, count = 80) {
  let score = 0,
    truncated = 0,
    learnerFailures = 0,
    turns = 0;
  for (let i = 0; i < count; i++) {
    const seat = i % 2;
    const policies: Policy[] = [opponent, opponent];
    policies[seat] = { weights };
    const r = play(
      `${seed}:validation:${prefix}:${Math.floor(i / 2)}`,
      policies,
      layouts[Math.floor(i / 2) % 4],
    );
    score += r.scores[seat];
    truncated += +r.truncated;
    learnerFailures += +(
      r.truncated &&
      (r.failure?.reason !== "no-action" || r.failure?.seat === seat)
    );
    turns += r.turns;
  }
  return {
    score: score / count,
    truncated,
    learnerFailures,
    turns: turns / count,
  };
}
function train(stage: "money" | "self", count: number) {
  let gradient = weights.map(() => 0),
    samples = 0,
    returns: number[] = [],
    batch: { gradient: number[]; return: number }[] = [];
  for (let episode = 0; episode < count; episode++) {
    const seat = episode % 2;
    const opponent: Policy =
      stage === "money" || episode % 5 === 0
        ? "money"
        : { weights: pool[rng.nextInt(pool.length)] };
    const policies: Policy[] = [opponent, opponent];
    policies[seat] = { weights, sample: true, record: true };
    const result = play(
      `${seed}:${stage}:${episode}`,
      policies,
      layouts[Math.floor(episode / 2) % 4],
    );
    batch.push(...result.traces[seat]);
    if ((episode + 1) % 32 === 0) {
      returns = batch.map((x) => x.return);
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const std =
        Math.sqrt(
          returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length,
        ) + 0.2;
      gradient = weights.map(() => 0);
      samples = batch.length;
      for (const x of batch)
        for (let j = 0; j < gradient.length; j++)
          gradient[j] +=
            (x.gradient[j] *
              Math.max(-4, Math.min(4, (x.return - mean) / std))) /
            samples;
      update++;
      for (let j = 0; j < weights.length; j++) {
        m[j] = 0.9 * m[j] + 0.1 * gradient[j];
        v[j] = 0.999 * v[j] + 0.001 * gradient[j] ** 2;
        weights[j] +=
          (0.025 * (m[j] / (1 - 0.9 ** update))) /
          (Math.sqrt(v[j] / (1 - 0.999 ** update)) + 1e-8);
        weights[j] *= 0.99999;
      }
      batch = [];
    }
    if ((episode + 1) % 512 === 0 || episode === count - 1) {
      const metrics = evaluate("money", "money", 160);
      const warm =
        stage === "self"
          ? evaluate({ weights: warmWeights }, "warm", 160)
          : null;
      const selection = warm
        ? 0.6 * metrics.score + 0.4 * warm.score
        : metrics.score;
      if (
        selection > bestScore &&
        metrics.learnerFailures === 0 &&
        (!warm || warm.learnerFailures === 0)
      ) {
        bestScore = selection;
        bestWeights = [...weights];
      }
      const row = {
        stage,
        episode: episode + 1,
        ...metrics,
        warmScore: warm?.score,
        warmFailures: warm?.learnerFailures,
        selection,
      };
      history.push(row);
      console.log(JSON.stringify(row));
      save(`${stage}-${episode + 1}`);
      writeFileSync(
        `${out}/history.json`,
        JSON.stringify(history, null, 2) + "\n",
      );
      if (stage === "self") {
        pool.push([...weights]);
        if (pool.length > 12) pool.shift();
      }
    }
  }
}
console.log(
  JSON.stringify({ stage: "untrained", ...evaluate("money", "money") }),
);
train("money", episodes);
weights = [...bestWeights];
save("warm-start");
warmWeights = [...weights];
pool.push([...weights]);
bestScore = 0.6 * evaluate("money", "money", 160).score + 0.4 * 0.5;
bestWeights = [...weights];
train("self", selfEpisodes);
weights = [...bestWeights];
save("final");
