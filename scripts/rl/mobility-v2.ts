import { readFileSync, writeFileSync } from "node:fs";
import { setup } from "./environment-v2";
import { layouts } from "./environment";
import {
  forward,
  backward,
  encode,
  type Network,
} from "../../src/lib/game/rl/v2/network";
import { createRandom } from "../../src/lib/game/random";
import { decisionOptions } from "../../src/lib/game/rl/options";
import { chooseOption } from "../../src/lib/game/rl/policy";
import { mobilityFeatures } from "../../src/lib/game/rl/v2/mobility";
import teacher from "../../src/lib/game/rl/model-v1.json";
const args = process.argv.slice(2),
  arg = (k: string, d: string) =>
    args.includes(k) ? args[args.indexOf(k) + 1] : d;
const old: Network = JSON.parse(
  readFileSync(
    arg("--model", "/tmp/istanbul-rl-v2-run1/self-5632.json"),
    "utf8",
  ),
);
const model: Network = {
  ...old,
  actions: old.actions + 2,
  mobility: true,
  selection: "greedy",
  weights: [],
};
const { inputs: S, actions: A, hidden: H } = old,
  newA = model.actions;
const oldAO = H * S,
  oldBO = oldAO + H * A,
  oldVO = oldBO + H,
  oldLO = oldVO + H;
const ao = H * S,
  bo = ao + H * newA,
  vo = bo + H,
  lo = vo + H;
model.weights = Array(lo + newA).fill(0);
for (let i = 0; i < H * S; i++) model.weights[i] = old.weights[i];
for (let h = 0; h < H; h++) {
  for (let i = 0; i < A; i++)
    model.weights[ao + h * newA + i] = old.weights[oldAO + h * A + i];
  model.weights[bo + h] = old.weights[oldBO + h];
  model.weights[vo + h] = old.weights[oldVO + h];
}
for (let i = 0; i < A; i++) model.weights[lo + i] = old.weights[oldLO + i];
const rng = createRandom("istanbul-rl-v2:mobility-curriculum"),
  gradient = new Float64Array(model.weights.length);
let examples = 0,
  wrong = 0;
for (let i = 0; i < 16000; i++) {
  const g = setup(`istanbul-rl-v2:mobility:${i}`, 2, layouts[i % 4]).game!,
    p = g.players[g.turnSeat];
  p.merchantPlace = g.board[rng.nextInt(16)];
  p.assistantsCarried = i % 3 === 0 ? 0 : 1;
  p.assistantsByPlace = {};
  const locations = g.board.filter((d) => d !== 7);
  for (let n = 0; n < 4 - p.assistantsCarried; n++) {
    const place = locations[rng.nextInt(locations.length)];
    p.assistantsByPlace[place] = (p.assistantsByPlace[place] ?? 0) + 1;
  }
  p.lira = rng.nextInt(26);
  for (const good of ["fabric", "spice", "fruit", "jewelry"] as const)
    p.goods[good] = rng.nextInt(3);
  p.bonusHand = i % 2 === 0 ? [] : ["bonus-long-move-1"];
  g.activeBonusEffects = i % 2 === 0 ? ["long-move"] : [];
  const safe = decisionOptions(g).filter(
    (o) => !mobilityFeatures(g, o.action).some(Boolean),
  );
  if (!safe.length) continue;
  const target = safe[chooseOption(safe, teacher.weights)].action;
  const encoded = encode(g, model),
    selected = encoded.actions.findIndex(
      (a) =>
        a.type === target.type &&
        a.payload.destination === target.payload.destination,
    );
  if (selected < 0) continue;
  const frame = forward(model, encoded.state, encoded.options);
  if (
    frame.probabilities.indexOf(Math.max(...frame.probabilities)) !== selected
  )
    wrong++;
  gradient.fill(0);
  backward(model, frame, selected, 1, gradient);
  // Fit only the two newly introduced mobility inputs. Preserve the learned base
  // policy; subsequent RL fine-tuning updates every parameter normally.
  for (const index of [lo + A, lo + A + 1])
    model.weights[index] += 0.15 * gradient[index];
  examples++;
}
const out = arg("--out", "/tmp/rl-v2-mobility.json");
writeFileSync(out, JSON.stringify(model) + "\n");
console.log(
  JSON.stringify({
    examples,
    weights: model.weights.slice(-2),
    seed: "istanbul-rl-v2:mobility-curriculum",
    base: arg("--model", "/tmp/istanbul-rl-v2-run1/self-5632.json"),
    out,
  }),
);
