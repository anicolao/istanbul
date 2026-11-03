import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import {
  initialize,
  forward,
  backward,
  type Network,
} from "../../src/lib/game/rl/v2/network";
import { observation } from "../../src/lib/game/rl/v2/observation";
import { actionFeatures } from "../../src/lib/game/rl/v2/features";
import { legalActions } from "../../src/lib/game/rl/v2/actions";
import { createRandom } from "../../src/lib/game/random";
import { playV2, setup, type Policy, type Sample } from "./environment-v2";
import { layouts } from "./environment";
const args = process.argv.slice(2),
  arg = (k: string, d: string) =>
    args.includes(k) ? args[args.indexOf(k) + 1] : d;
const seed = arg("--seed", "istanbul-rl-v2"),
  out = arg("--out", "/tmp/istanbul-rl-v2");
mkdirSync(out, { recursive: true });
const warm = Number(arg("--warm", "512")),
  money = Number(arg("--money", "2048")),
  self = Number(arg("--self", "4096"));
if (
  [warm, money, self].some((n) => !Number.isInteger(n) || n < 0 || n % 8) ||
  warm + money + self === 0
)
  throw new Error(
    "Episode counts must be nonnegative multiples of 8, with at least one training stage.",
  );
const game = setup(seed).game!;
const model: Network = args.includes("--resume")
  ? JSON.parse(readFileSync(arg("--resume", ""), "utf8"))
  : initialize(
      observation(game).length,
      actionFeatures(game, legalActions(game)[0]).length,
      24,
      seed,
    );
let gradient = new Float64Array(model.weights.length),
  m = new Float64Array(model.weights.length),
  v = new Float64Array(model.weights.length),
  step = 0;
const random = createRandom(seed),
  history: unknown[] = [],
  pool: Network[] = [],
  baselines: Record<string, number> = {};
let best = -Infinity,
  bestWeights = [...model.weights];
const save = (name: string) =>
  writeFileSync(`${out}/${name}.json`, JSON.stringify(model) + "\n");
function update(samples: Sample[], imitation: boolean) {
  gradient.fill(0);
  let count = 0;
  for (const s of samples) {
    const baseline = baselines[s.phase] ?? 0;
    const advantage = imitation
      ? 1
      : Math.max(-5, Math.min(5, (s.value - baseline) / 3));
    if (!imitation) baselines[s.phase] = 0.99 * baseline + 0.01 * s.value;
    backward(
      model,
      forward(model, s.state, s.options),
      s.selected,
      advantage,
      gradient,
    );
    count++;
  }
  if (!count) return;
  step++;
  let norm = 0;
  for (let i = 0; i < gradient.length; i++) {
    gradient[i] /= count;
    norm += gradient[i] ** 2;
  }
  const scale = Math.min(1, 1 / Math.sqrt(norm)),
    lr = imitation ? 0.008 : 0.003;
  for (let i = 0; i < gradient.length; i++) {
    const g = gradient[i] * scale;
    m[i] = 0.9 * m[i] + 0.1 * g;
    v[i] = 0.999 * v[i] + 0.001 * g * g;
    model.weights[i] +=
      (lr * (m[i] / (1 - 0.9 ** step))) /
      (Math.sqrt(v[i] / (1 - 0.999 ** step)) + 1e-8);
  }
}
function evaluate(opponent: Policy, prefix: string, count = 48) {
  let score = 0,
    failures = 0;
  for (let i = 0; i < count; i++) {
    const policies: Policy[] = [opponent, opponent];
    policies[i % 2] = model;
    const r = playV2(
      `${seed}:validation:${prefix}:${Math.floor(i / 2)}`,
      policies,
      layouts[Math.floor(i / 2) % 4],
    );
    score += r.scores[i % 2];
    failures += +r.truncated;
  }
  return { score: score / count, failures };
}
for (const [stage, total] of [
  ["imitation", warm],
  ["money", money],
  ["self", self],
] as const) {
  let batch: Sample[] = [],
    wins = 0,
    failures = 0;
  for (let episode = 0; episode < total; episode++) {
    const seat = episode % 2,
      opponent: Policy =
        stage === "imitation" || stage === "money"
          ? "money"
          : episode % 5 === 0
            ? "money"
            : episode % 5 === 1
              ? "v1"
              : pool.length
                ? pool[random.nextInt(pool.length)]
                : "v1";
    const policies: Policy[] = [opponent, opponent];
    policies[seat] = model;
    const r = playV2(
      `${seed}:${stage}:${episode}`,
      policies,
      layouts[Math.floor(episode / 2) % 4],
      seat,
      stage === "imitation",
    );
    batch.push(...r.samples);
    wins += r.scores[seat];
    failures += +r.truncated;
    if ((episode + 1) % 8 === 0) {
      update(batch, stage === "imitation");
      batch = [];
    }
    if ((episode + 1) % 128 === 0) {
      console.log(
        JSON.stringify({
          stage,
          episode: episode + 1,
          winShare: wins / 128,
          failures,
        }),
      );
      wins = 0;
      failures = 0;
    }
    if ((episode + 1) % 512 === 0 || episode === total - 1) {
      if (batch.length) {
        update(batch, stage === "imitation");
        batch = [];
      }
      const vsMoney = evaluate("money", "money"),
        vsV1 = evaluate("v1", "v1");
      const entry = { stage, episode: episode + 1, vsMoney, vsV1 };
      history.push(entry);
      console.log(JSON.stringify(entry));
      save(`${stage}-${episode + 1}`);
      if (
        stage !== "imitation" &&
        vsMoney.failures === 0 &&
        vsV1.failures === 0 &&
        vsMoney.score + vsV1.score > best
      ) {
        best = vsMoney.score + vsV1.score;
        bestWeights = [...model.weights];
        save("best");
      }
      pool.push(structuredClone(model));
      if (pool.length > 8) pool.shift();
      writeFileSync(
        `${out}/history.json`,
        JSON.stringify(history, null, 2) + "\n",
      );
    }
  }
  save(stage);
}
save("last");
if (best > -Infinity) model.weights = bestWeights;
save("final");
writeFileSync(
  `${out}/run.json`,
  JSON.stringify(
    {
      seed,
      warm,
      money,
      self,
      selection:
        "sum of win shares vs money and v1, zero validation truncations",
      best,
      inputs: model.inputs,
      actions: model.actions,
      hidden: model.hidden,
      parameters: model.weights.length,
    },
    null,
    2,
  ) + "\n",
);
