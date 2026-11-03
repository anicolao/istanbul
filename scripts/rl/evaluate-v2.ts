import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { playV2, type Policy } from "./environment-v2";
import { layouts } from "./environment";
import type { Network } from "../../src/lib/game/rl/v2/network";
import { createRandom } from "../../src/lib/game/random";
const args = process.argv.slice(2),
  arg = (k: string, d: string) =>
    args.includes(k) ? args[args.indexOf(k) + 1] : d;
function load(path: string): Network {
  const m = JSON.parse(readFileSync(path, "utf8"));
  if (
    m.version !== 2 ||
    !m.weights?.every(Number.isFinite) ||
    m.weights.length !==
      m.hidden * (m.inputs + m.actions + 1) + m.hidden + m.actions
  )
    throw Error("Invalid network");
  return m;
}
const path = arg("--model", "src/lib/game/rl/v2/model.json"),
  model = load(path),
  opponentArg = arg("--opponent", "v1");
const opponent: Policy =
  opponentArg === "v1" || opponentArg === "money"
    ? opponentArg
    : load(opponentArg);
const games = Number(arg("--games", "800")),
  players = Number(arg("--players", "2")),
  seed = arg("--seed", "istanbul-rl-v2:release-mobility-2026-11-03");
if (
  !Number.isInteger(players) ||
  players < 2 ||
  players > 5 ||
  !Number.isInteger(games) ||
  games < players * 4 ||
  games % (players * 4)
)
  throw Error("Games must be a positive multiple of players × 4; players 2–5.");
const rows: {
    score: number;
    turns: number;
    truncated: boolean;
    failure: string | null;
    seat: number;
    layout: string;
  }[] = [],
  used: Record<string, number> = {};
for (let i = 0; i < games; i++) {
  const seat = i % players,
    layout = layouts[Math.floor(i / players) % 4],
    policies: Policy[] = Array.from({ length: players }, () => opponent);
  policies[seat] = model;
  const r = playV2(`${seed}:${Math.floor(i / players)}`, policies, layout);
  rows.push({
    score: r.scores[seat],
    turns: r.turns,
    truncated: r.truncated,
    failure: r.failure,
    seat,
    layout,
  });
  for (const [k, v] of Object.entries(r.usedBySeat[seat]))
    used[k] = (used[k] ?? 0) + v;
}
function summary(entries: typeof rows) {
  return {
    games: entries.length,
    winShare: entries.reduce((s, r) => s + r.score, 0) / entries.length,
    truncated: entries.filter((r) => r.truncated).length,
    meanTurns: entries.reduce((s, r) => s + r.turns, 0) / entries.length,
  };
}
const clusters = Array.from(
    { length: games / players },
    (_, i) =>
      rows
        .slice(i * players, (i + 1) * players)
        .reduce((s, r) => s + r.score, 0) / players,
  ),
  random = createRandom(`${seed}:bootstrap`);
const bootstrap = Array.from(
  { length: 2000 },
  () =>
    clusters.reduce((s) => s + clusters[random.nextInt(clusters.length)], 0) /
    clusters.length,
).sort((a, b) => a - b);
const report = {
  seed,
  players,
  opponent: opponentArg,
  modelSha256: createHash("sha256").update(readFileSync(path)).digest("hex"),
  ...summary(rows),
  pairedBootstrap95: [bootstrap[50], bootstrap[1949]],
  byLayout: Object.fromEntries(
    layouts.map((l) => [l, summary(rows.filter((r) => r.layout === l))]),
  ),
  bySeat: Array.from({ length: players }, (_, s) =>
    summary(rows.filter((r) => r.seat === s)),
  ),
  failures: rows.map((r, i) => ({ ...r, game: i })).filter((r) => r.truncated),
  actionCounts: used,
};
if (args.includes("--out"))
  writeFileSync(arg("--out", ""), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
