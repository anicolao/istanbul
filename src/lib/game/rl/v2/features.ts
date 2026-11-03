import type { BotAction } from "../../bot";
import type { GameSetup } from "../../setup";
import { bonusEffect } from "../../bonus";
import { demandTiles, mosqueTiles, type Good } from "../../manifests";
import { marketRevenueFor, postOfficeRows } from "../../actions";
import { currentSultanCost } from "../../ruby-routes";
import {
  requiredAssistantAction,
  merchantToll,
  gridDistance,
} from "../../movement";
import { decisionOptions } from "../options";
import { goods } from "./actions";
import { effects, kinds } from "./observation";

export function actionFeatures(
  game: GameSetup,
  action: BotAction,
  legacy = decisionOptions(game),
): number[] {
  const p = game.players[game.turnSeat],
    c = (action.payload.choice ?? {}) as Record<string, any>;
  const kind = String(c.kind ?? action.type),
    effect = bonusEffect(
      String(action.payload.cardId ?? c.discardCardId ?? ""),
    );
  const destination = Number(
    action.payload.destination ??
      c.destination ??
      c.place ??
      (kind === "stay" ? p.merchantPlace : 0),
  );
  const existing = legacy.find(
    (o) =>
      o.destination === destination &&
      (action.type === "turn/moved" || kind === "police-send"),
  );
  const x = existing ? [...existing.features] : Array<number>(42).fill(0);
  // Legacy scores initialize movement only; every legal action is still offered.
  const one = (v: unknown, choices: readonly unknown[]) =>
    x.push(...choices.map((a) => +(a === v)));
  one(kind, kinds);
  one(action.type, [
    "turn/moved",
    "turn/merchant-paid",
    "turn/ended",
    "place/action-taken",
    "bonus/played",
    "mosque/ability-used",
    "encounter/resolved",
  ]);
  one(
    destination,
    Array.from({ length: 16 }, (_, i) => i + 1),
  );
  one(effect, effects);
  one(c.good, goods);
  one(c.paymentGood, goods);
  one(c.payment, ["lira", "good", "card"]);
  one(c.reward, ["lira", "bonus"]);
  one(c.adjustment, ["none", "first-to-four", "second-to-four", "reroll"]);
  one(c.accept, [true, false]);
  one(c.good, [null]);
  for (let i = 0; i < 2; i++) one(c.drawSources?.[i], ["deck", "discard"]);
  for (let i = 0; i < 5; i++) x.push(+(c.slotIndexes?.includes(i) ?? false));
  for (let i = 1; i <= 16; i++)
    x.push((c.assistantPlaces ?? []).filter((l: number) => l === i).length / 5);
  for (const good of goods)
    x.push((c.wildGoods ?? []).filter((g: Good) => g === good).length / 5);
  one(mosqueTiles.find((t) => t.id === c.tileId)?.color, goods);
  x.push((c.wager ?? 0) / 12);
  const target = game.players.findIndex((other) => other.uid === c.familyUid);
  one(
    target < 0
      ? -1
      : (target - game.turnSeat + game.players.length) % game.players.length,
    [-1, 0, 1, 2, 3, 4],
  );
  const delta = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
  let money = 0,
    ruby = 0,
    assistants = 0,
    capacity = 0,
    power = 0,
    cards = 0;
  const gain = (good: Good, amount: number) =>
    (delta[good] += Math.min(amount, p.capacity - p.goods[good]));
  if (action.type === "bonus/played") cards--;
  if (kind === "gain-lira") money += 5;
  if (kind === "gain-good") gain(c.good, 1);
  if (kind === "return-assistant" || kind === "yellow-recall") assistants++;
  if (kind === "yellow-recall") money -= 2;
  if (kind === "return-family" || kind === "catch-family") {
    if (c.reward === "lira") money += 3;
    else cards++;
  }
  if (kind === "warehouse-fill") gain(c.good, p.capacity);
  if (kind === "warehouse-extra" && c.good !== null) {
    gain(c.good, 1);
    money -= 2;
  }
  if (kind === "fountain-recall") assistants += c.assistantPlaces.length;
  if (kind === "wainwright-buy") {
    money -= 7;
    capacity++;
    if (p.extensions === 2 && game.supplies.wainwrightRubies) ruby++;
  }
  if (
    kind === "gemstone-buy" ||
    (kind === "repeat-action" && effect === "repeat-gemstone")
  ) {
    money -= game.rubyTracks.gemstonePrice;
    ruby++;
  }
  if (
    kind === "sultan-buy" ||
    (kind === "repeat-action" && effect === "repeat-sultan")
  ) {
    ruby++;
    for (const good of currentSultanCost(game))
      if (good !== "any") delta[good]--;
    for (const good of c.wildGoods ?? []) delta[good as Good]--;
  }
  if (
    kind === "post-office-collect" ||
    (kind === "repeat-action" && effect === "repeat-post")
  )
    for (let i = 0; i < 4; i++) {
      const r = postOfficeRows[i][+game.postOfficeLower[i]];
      money += r.lira ?? 0;
      if (r.good) gain(r.good, 1);
    }
  if (kind === "mosque-take") {
    const tile = mosqueTiles.find((t) => t.id === c.tileId)!;
    delta[tile.color]--;
    power++;
    if (tile.color === "jewelry" && p.assistantsInSupply) assistants++;
    const pair =
      tile.color === "fabric"
        ? "spice"
        : tile.color === "spice"
          ? "fabric"
          : tile.color === "fruit"
            ? "jewelry"
            : "fruit";
    if (
      p.mosqueTileIds.some(
        (id) => mosqueTiles.find((t) => t.id === id)?.color === pair,
      ) &&
      game.supplies[
        tile.color === "fabric" || tile.color === "spice"
          ? "smallMosqueRubies"
          : "greatMosqueRubies"
      ]
    )
      ruby++;
  }
  if (kind === "market-sell") {
    const at =
      game.pending?.kind === "family-action"
        ? game.pending.destination
        : p.merchantPlace;
    const demand = demandTiles.find(
      (d) => d.id === (at === 10 ? game.largeDemand[0] : game.smallDemand[0]),
    )!;
    for (const good of c.wildGoods ??
      c.slotIndexes.map((i: number) => demand.goods[i]))
      delta[good as Good]--;
    money += marketRevenueFor(at, c.slotIndexes.length);
  }
  if (kind === "caravansary-draw") cards += 2;
  if (
    kind === "caravansary-discard" ||
    (kind === "governor-pay" && c.payment === "card")
  )
    cards--;
  if (kind === "governor-visit" && c.accept) cards++;
  if (kind === "governor-pay" && c.payment === "lira") money -= 2;
  if (kind === "smuggler-trade" && c.accept) {
    gain(c.good, 1);
    if (c.payment === "lira") money -= 2;
    else delta[c.paymentGood as Good]--;
  }
  if (
    kind === "turn/merchant-paid" &&
    game.pending?.kind === "merchant-payment"
  )
    money -= game.pending.total;
  if (
    kind === "tea-house-wager" ||
    kind === "black-market-roll" ||
    kind === "dice-adjust"
  ) {
    const pending = game.pending?.kind === "dice-adjust" ? game.pending : null;
    const at = pending?.actionPlace ?? (kind === "tea-house-wager" ? 9 : 8),
      wager = pending?.wager ?? c.wager,
      good = pending?.good ?? c.good;
    const dice: number[][] = [];
    if (kind === "dice-adjust" && c.adjustment !== "reroll")
      dice.push(
        c.adjustment === "first-to-four"
          ? [4, pending!.originalDice[1]]
          : c.adjustment === "second-to-four"
            ? [pending!.originalDice[0], 4]
            : pending!.originalDice,
      );
    else
      for (let a = 1; a <= 6; a++)
        for (let b = 1; b <= 6; b++) dice.push([a, b]);
    if (at === 8) gain(good, 1);
    for (const [a, b] of dice)
      if (at === 9) money += (a + b >= wager ? wager : 2) / dice.length;
      else
        delta.jewelry +=
          Math.min(
            p.capacity - p.goods.jewelry,
            a + b >= 11 ? 3 : a + b >= 9 ? 2 : a + b >= 7 ? 1 : 0,
          ) / dice.length;
  }
  x.push(
    money / 10,
    ...goods.map((g) => delta[g] / 5),
    ruby,
    assistants / 5,
    capacity / 3,
    power,
    cards / 3,
  );
  // Public action consequences and opportunity costs, including blocked movement.
  x.push(
    destination ? merchantToll(game, p, destination) / 10 : 0,
    destination
      ? gridDistance(game.board, p.merchantPlace, destination) / 6
      : 0,
  );
  one(destination ? requiredAssistantAction(p, destination) : null, [
    "drop",
    "pick-up",
    "fountain",
  ]);
  x.push(destination && p.lira < merchantToll(game, p, destination) ? 1 : 0);
  x.push(
    (p.lira + money) / 30,
    ...goods.map((g) => (p.goods[g] + delta[g]) / 5),
  );
  return x;
}
