import { readFileSync, writeFileSync } from "node:fs";
import { layouts, play, type Policy } from "./environment";
import { createRandom } from "../../src/lib/game/random";
import { featureNames } from "../../src/lib/game/rl/options";
const args = process.argv.slice(2);
const arg = (key: string, fallback: string) =>
  args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const load = (path: string): number[] => {
  const model = JSON.parse(readFileSync(path, 'utf8'));
  if (model.version !== 1 || JSON.stringify(model.features) !== JSON.stringify(featureNames) ||
      !Array.isArray(model.weights) || model.weights.length !== featureNames.length || !model.weights.every(Number.isFinite)) {
    throw new Error(`Unsupported policy model: ${path}`);
  }
  return model.weights;
};
const weights = load(arg("--model", "src/lib/game/rl/model-v1.json"));
const opponentPath = arg("--opponent", "money");
const opponent: Policy =
  opponentPath === "money" ? "money" : { weights: load(opponentPath) };
const count = Number(arg("--games", "800"));
const prefix = arg("--seed", "istanbul-rl-v1:release-test-2026-11-03");
const players = Number(arg("--players", "2"));
if (!Number.isInteger(players) || players < 2 || players > 5 || !Number.isInteger(count) || count < players * 4 || count % (players * 4)) throw new Error('Use 2–5 players and a game count divisible by players × 4 layouts.');
if (weights.length !== featureNames.length || !weights.every(Number.isFinite)) throw new Error('Invalid policy weights.');
const failures: unknown[] = [];
const rows: {
  layout: string;
  seat: number;
  score: number;
  turns: number;
  rubies: number;
  truncated: boolean;
}[] = [];
for (let i = 0; i < count; i++) {
  const seat = i % players;
  const layout = layouts[Math.floor(i / players) % 4];
  const policies: Policy[] = Array.from({ length: players }, () => opponent);
  policies[seat] = { weights, sample: args.includes("--sample") };
  const r = play(`${prefix}:${Math.floor(i / players)}`, policies, layout);
  if (r.truncated) failures.push({ learnerSeat: seat, ...r.failure });
  rows.push({
    layout,
    seat,
    score: r.scores[seat],
    turns: r.turns,
    rubies: r.rubies[seat],
    truncated: r.truncated,
  });
}
function summary(
  rows: {
    layout: string;
    seat: number;
    score: number;
    turns: number;
    rubies: number;
    truncated: boolean;
  }[],
) {
  const n = rows.length;
  const score = rows.reduce((a, r) => a + r.score, 0) / n;
  return {
    games: n,
    score,
    wins: rows.filter((r) => r.score === 1).length,
    ties: rows.filter((r) => r.score > 0 && r.score < 1).length,
    truncated: rows.filter((r) => r.truncated).length,
    meanTurns: rows.reduce((a, r) => a + r.turns, 0) / n,
  };
}
const random = createRandom(`${prefix}:bootstrap`);
const clusters = Array.from(
  { length: Math.ceil(rows.length / players) },
  (_, i) =>
    rows
      .slice(i * players, (i + 1) * players)
      .reduce((s, r) => s + r.score, 0) / players,
);
const bootstrap = Array.from(
  { length: 2000 },
  () =>
    clusters.reduce((s) => s + clusters[random.nextInt(clusters.length)], 0) /
    clusters.length,
).sort((a, b) => a - b);
const result = {
  selection: args.includes("--sample") ? "softmax" : "deployed-epsilon-greedy",
  failures,
  pairedBootstrap95: [bootstrap[50], bootstrap[1949]],
  seed: prefix,
  players,
  opponent: opponentPath,
  features: featureNames.length,
  ...summary(rows),
  byLayout: Object.fromEntries(
    layouts.map((l) => [l, summary(rows.filter((r) => r.layout === l))]),
  ),
  bySeat: Array.from({ length: players }, (_, s) =>
    summary(rows.filter((r) => r.seat === s)),
  ),
};
console.log(JSON.stringify(result, null, 2));
if (args.includes("--out"))
  writeFileSync(arg("--out", ""), JSON.stringify(result, null, 2) + "\n");
