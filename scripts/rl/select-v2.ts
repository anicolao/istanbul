import { readFileSync, writeFileSync } from "node:fs";
import { playV2, type Policy } from "./environment-v2";
import { layouts } from "./environment";
import type { Network } from "../../src/lib/game/rl/v2/network";
const args = process.argv.slice(2),
  arg = (k: string, d: string) =>
    args.includes(k) ? args[args.indexOf(k) + 1] : d;
const dir = arg("--dir", "/tmp/istanbul-rl-v2"),
  games = Number(arg("--games", "320")),
  seed = arg("--seed", "istanbul-rl-v2:selection");
if (!Number.isInteger(games) || games < 8 || games % 8)
  throw Error("Games must be a positive multiple of 8.");
const history = JSON.parse(readFileSync(`${dir}/history.json`, "utf8")) as {
  stage: string;
  episode: number;
  vsMoney: { score: number; failures: number };
  vsV1: { score: number; failures: number };
}[];
const candidates = history
  .filter((r) => r.stage === "self" && !r.vsMoney.failures && !r.vsV1.failures)
  .sort(
    (a, b) => b.vsMoney.score + b.vsV1.score - (a.vsMoney.score + a.vsV1.score),
  )
  .slice(0, 6);
let best = -Infinity,
  selected = "";
const results: unknown[] = [];
for (const candidate of candidates) {
  const name = `${candidate.stage}-${candidate.episode}`,
    model: Network = JSON.parse(readFileSync(`${dir}/${name}.json`, "utf8"));
  // Quantize before selection/evaluation, so release measurements use exact shipped weights.
  model.weights = model.weights.map((v) => Number(v.toFixed(7)));
  model.selection =
    arg("--selection", "greedy") === "sample" ? "sample" : "greedy";
  const scores: { opponent: string; winShare: number; truncated: number }[] =
    [];
  for (const opponent of ["money", "v1"] as const) {
    let wins = 0,
      truncated = 0;
    for (let i = 0; i < games; i++) {
      const policies: Policy[] = [opponent, opponent];
      policies[i % 2] = model;
      const r = playV2(
        `${seed}:${opponent}:${Math.floor(i / 2)}`,
        policies,
        layouts[Math.floor(i / 2) % 4],
      );
      wins += r.scores[i % 2];
      truncated += +r.truncated;
    }
    scores.push({ opponent, winShare: wins / games, truncated });
  }
  const entry = { name, scores };
  results.push(entry);
  console.log(JSON.stringify(entry));
  const score = scores.reduce((s, r) => s + r.winShare, 0);
  if (!scores.some((r) => r.truncated) && score > best) {
    best = score;
    selected = name;
    writeFileSync(`${dir}/selected.json`, JSON.stringify(model) + "\n");
  }
}
if (!selected) throw Error("No checkpoint completed every selection game.");
writeFileSync(
  `${dir}/selection.json`,
  JSON.stringify(
    {
      seed,
      gamesPerOpponent: games,
      criterion:
        "sum of money/v1 win shares; zero truncated games; seven-decimal weights; explicit deployment selection",
      selected,
      results,
    },
    null,
    2,
  ) + "\n",
);
console.log(`Selected ${selected}`);
