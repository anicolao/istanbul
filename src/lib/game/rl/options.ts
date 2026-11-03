import {
  marketRevenueFor,
  postOfficeRows,
  warehouseGood,
  type PlaceActionChoice,
} from "../actions";
import { bonusEffect, canUseImmediateBonus } from "../bonus";
import { demandTiles, mosqueTiles, type Good } from "../manifests";
import {
  gridDistance,
  legalDestinations,
  merchantToll,
  requiredAssistantAction,
} from "../movement";
import { ownsMosqueAbility } from "../mosques";
import { currentSultanCost } from "../ruby-routes";
import { nextBotAction, type BotAction } from "../bot";
import type { GameSetup, SetupPlayer } from "../setup";

const goods: Good[] = ["fabric", "spice", "fruit", "jewelry"];
export const featureNames = [
  ...Array.from({ length: 16 }, (_, i) => `place-${i + 1}`),
  "ruby-gain",
  "money-change",
  "fabric-change",
  "spice-change",
  "fruit-change",
  "jewelry-change",
  "assistant-change",
  "capacity-change",
  "power-gain",
  "card-gain",
  "family-ready",
  "toll",
  "gem-readiness",
  "sultan-readiness",
  "small-pair",
  "great-pair",
  "assistants-after",
  "gem-access",
  "sultan-access",
  "fountain-access",
  "police-access",
  "money-access",
  "end-ruby",
  "opponent-close-ruby",
  "blocked",
  "dispatch",
] as const;
export interface Option {
  action: BotAction;
  features: number[];
  destination: number;
}

export function sultanPayment(
  game: GameSetup,
  player: SetupPlayer,
): Good[] | null {
  const stock = { ...player.goods };
  const cost = currentSultanCost(game);
  for (const good of cost) if (good !== "any" && --stock[good] < 0) return null;
  const wild: Good[] = [];
  for (const _ of cost.filter((g) => g === "any")) {
    const good = [...goods].sort((a, b) => stock[b] - stock[a])[0];
    if (stock[good] <= 0) return null;
    stock[good]--;
    wild.push(good);
  }
  return wild;
}
function slots(game: GameSetup, player: SetupPlayer, place: number): number[] {
  const stock = { ...player.goods };
  const demand = demandTiles.find(
    (t) => t.id === (place === 10 ? game.largeDemand[0] : game.smallDemand[0]),
  );
  return demand?.goods.flatMap((g, i) => (stock[g]-- > 0 ? [i] : [])) ?? [];
}
function mosqueChoice(
  game: GameSetup,
  player: SetupPlayer,
  place: number,
): string | undefined {
  return goods
    .filter((g) =>
      (place === 14 ? ["fabric", "spice"] : ["fruit", "jewelry"]).includes(g),
    )
    .map((g) => mosqueTiles.find((t) => t.id === game.mosqueStacks[g][0]))
    .find(
      (t) =>
        t &&
        !ownsMosqueAbility(player, t.color) &&
        player.goods[t.color] >= t.required,
    )?.id;
}
/** Fixed low-level controller. Learning selects the place; this executes its ordinary action. */
export function placeChoice(
  game: GameSetup,
  player: SetupPlayer,
  place: number,
): PlaceActionChoice | null {
  const good = warehouseGood(place);
  if (good) return { kind: "warehouse-fill", good };
  if (place === 7)
    return {
      kind: "fountain-recall",
      assistantPlaces: Object.keys(player.assistantsByPlace).map(Number),
    };
  if (place === 5) return { kind: "post-office-collect" };
  if (place === 9) return { kind: "tea-house-wager", wager: 7 };
  if (place === 16 && player.lira >= game.rubyTracks.gemstonePrice)
    return { kind: "gemstone-buy" };
  if (place === 13) {
    const wildGoods = sultanPayment(game, player);
    if (wildGoods) return { kind: "sultan-buy", wildGoods };
  }
  if (
    place === 1 &&
    player.lira >= 7 &&
    player.extensions < 3 &&
    game.supplies.wheelbarrowExtensions > 0
  )
    return { kind: "wainwright-buy" };
  if (place === 14 || place === 15) {
    const tileId = mosqueChoice(game, player, place);
    if (tileId) return { kind: "mosque-take", tileId };
  }
  if (place === 8)
    return {
      kind: "black-market-roll",
      good: [...goods]
        .slice(0, 3)
        .sort((a, b) => player.goods[a] - player.goods[b])[0] as Exclude<
        Good,
        "jewelry"
      >,
    };
  if (place === 10 || place === 11) {
    const slotIndexes = slots(game, player, place);
    if (slotIndexes.length) return { kind: "market-sell", slotIndexes };
  }
  // Only pile sizes are observed, never face-down card identities or order.
  if (place === 6 && game.bonusDrawPile.length + game.bonusDiscard.length >= 2)
    return { kind: "caravansary-draw", drawSources: ["deck", "deck"] };
  return null;
}
function forecast(
  game: GameSetup,
  player: SetupPlayer,
  place: number,
): { player: SetupPlayer; cards: number; blocked: boolean } {
  const p = {
    ...player,
    goods: { ...player.goods },
    mosqueTileIds: [...player.mosqueTileIds],
  };
  const choice = placeChoice(game, p, place);
  let cards = 0;
  if (choice?.kind === "warehouse-fill") p.goods[choice.good] = p.capacity;
  if (choice?.kind === "post-office-collect")
    for (const [i, rows] of postOfficeRows.entries()) {
      const r = rows[game.postOfficeLower[i] ? 1 : 0];
      p.lira += r.lira ?? 0;
      if (r.good) p.goods[r.good] = Math.min(p.capacity, p.goods[r.good] + 1);
    }
  if (choice?.kind === "tea-house-wager") p.lira += (21 * 7 + 15 * 2) / 36;
  if (choice?.kind === "black-market-roll") {
    p.goods[choice.good] = Math.min(p.capacity, p.goods[choice.good] + 1);
    p.goods.jewelry = Math.min(
      p.capacity,
      p.goods.jewelry + (11 + 2 * 7 + 3 * 3) / 36,
    );
  }
  if (choice?.kind === "gemstone-buy") {
    p.lira -= game.rubyTracks.gemstonePrice;
    p.rubies++;
  }
  if (choice?.kind === "sultan-buy") {
    for (const g of currentSultanCost(game)) if (g !== "any") p.goods[g]--;
    for (const g of choice.wildGoods) p.goods[g]--;
    p.rubies++;
  }
  if (choice?.kind === "wainwright-buy") {
    p.lira -= 7;
    p.capacity++;
    p.extensions++;
    if (p.extensions === 3 && game.supplies.wainwrightRubies > 0) p.rubies++;
  }
  if (choice?.kind === "mosque-take") {
    const tile = mosqueTiles.find((t) => t.id === choice.tileId)!;
    p.goods[tile.color]--;
    p.mosqueTileIds.push(tile.id);
    const pair: Good[] =
      place === 14 ? ["fabric", "spice"] : ["fruit", "jewelry"];
    if (
      pair.every((g) => ownsMosqueAbility(p, g)) &&
      game.supplies[place === 14 ? "smallMosqueRubies" : "greatMosqueRubies"] >
        0
    )
      p.rubies++;
  }
  if (choice?.kind === "market-sell") {
    const demand = demandTiles.find(
      (t) =>
        t.id === (place === 10 ? game.largeDemand[0] : game.smallDemand[0]),
    )!;
    for (const i of choice.slotIndexes) p.goods[demand.goods[i]]--;
    p.lira += marketRevenueFor(place, choice.slotIndexes.length);
  }
  if (choice?.kind === "fountain-recall")
    p.assistantsCarried += Object.values(p.assistantsByPlace).reduce(
      (a, b) => a + b,
      0,
    );
  if (choice?.kind === "caravansary-draw") cards = 1;
  return {
    player: p,
    cards,
    blocked: choice === null && !(place === 12 && p.familyPlace === 12),
  };
}
function sultanReadiness(game: GameSetup, p: SetupPlayer) {
  const need = { fabric: 0, spice: 0, fruit: 0, jewelry: 0 };
  let any = 0;
  for (const g of currentSultanCost(game))
    if (g === "any") any++;
    else need[g]++;
  const missing = goods.reduce(
    (n, g) => n + Math.max(0, need[g] - p.goods[g]),
    0,
  );
  const excess = goods.reduce(
    (n, g) => n + Math.max(0, p.goods[g] - need[g]),
    0,
  );
  return (
    1 - (missing + Math.max(0, any - excess)) / currentSultanCost(game).length
  );
}
export function decisionOptions(game: GameSetup): Option[] {
  const p = game.players[game.turnSeat];
  const dispatch =
    game.phase === "action" && p.merchantPlace === 12 && p.familyPlace === 12;
  if (game.phase !== "movement" && !dispatch) return [];
  const destinations = dispatch
    ? game.board.filter((n) => n !== 12)
    : legalDestinations(game, p).filter((place) => {
        if (place === 7) return true;
        const assistant = requiredAssistantAction(p, place);
        const next = {
          ...p,
          merchantPlace: place,
          assistantsCarried:
            p.assistantsCarried + (assistant === "pick-up" ? 1 : -1),
          assistantsByPlace: { ...p.assistantsByPlace },
        };
        next.assistantsByPlace[place] =
          (next.assistantsByPlace[place] ?? 0) +
          (assistant === "pick-up" ? -1 : 1);
        // Avoid an assistant dead end under the current engine's movement rules.
        return legalDestinations(game, next).length > 0;
      });
  return destinations.map((place) => {
    const toll = dispatch ? 0 : merchantToll(game, p, place);
    const assistant = dispatch ? null : requiredAssistantAction(p, place);
    const before = {
      ...p,
      lira: p.lira - toll,
      assistantsCarried:
        p.assistantsCarried +
        (assistant === "pick-up" ? 1 : assistant === "drop" ? -1 : 0),
    };
    const result =
      before.lira < 0
        ? { player: p, cards: 0, blocked: true }
        : forecast(game, before, place);
    const q = result.player;
    const access = (target: number) =>
      1 /
      (1 +
        Math.ceil(
          gridDistance(game.board, dispatch ? p.merchantPlace : place, target) /
            2,
        ));
    const closeOpponent = game.players.some(
      (o) => o.uid !== p.uid && o.rubies >= game.end.target - 1,
    );
    const ruby = q.rubies - p.rubies;
    const features = [
      ...Array.from({ length: 16 }, (_, i) => +(place === i + 1)),
      ruby,
      (q.lira - p.lira) / 20,
      ...goods.map((g) => (q.goods[g] - p.goods[g]) / 5),
      (q.assistantsCarried - p.assistantsCarried) / 5,
      (q.capacity - p.capacity) / 3,
      q.mosqueTileIds.length - p.mosqueTileIds.length,
      result.cards,
      +(q.familyPlace === 12),
      toll / 6,
      Math.min(1.5, q.lira / game.rubyTracks.gemstonePrice),
      sultanReadiness(game, q),
      ["fabric", "spice"].filter((g) => ownsMosqueAbility(q, g as Good))
        .length / 2,
      ["fruit", "jewelry"].filter((g) => ownsMosqueAbility(q, g as Good))
        .length / 2,
      q.assistantsCarried / 5,
      access(16) * Math.min(1, q.lira / game.rubyTracks.gemstonePrice),
      access(13) * sultanReadiness(game, q),
      access(7) * (1 - q.assistantsCarried / 5),
      access(12) * +(q.familyPlace === 12),
      Math.max(access(9), access(5)) *
        (1 - Math.min(1, q.lira / game.rubyTracks.gemstonePrice)),
      ruby * +(p.rubies === game.end.target - 1),
      ruby * +closeOpponent,
      +result.blocked,
      +dispatch,
    ];
    return {
      destination: place,
      features,
      action: dispatch
        ? {
            type: "place/action-taken",
            payload: { choice: { kind: "police-send", destination: place } },
          }
        : {
            type: "turn/moved",
            payload: { destination: place, assistantAction: assistant },
          },
    };
  });
}
/** Own hand only. Public state/own cards are the entire policy observation. */
export function tacticalAction(game: GameSetup): BotAction | null {
  if (game.phase === "game-over") return null;
  const p = game.players[game.turnSeat];
  for (const cardId of p.bonusHand) {
    const effect = bonusEffect(cardId);
    let choice: Record<string, unknown> | null = null;
    if (effect === "gain-lira" && canUseImmediateBonus(game, effect))
      choice = { kind: effect };
    if (effect === "gain-good" && canUseImmediateBonus(game, effect)) {
      const good = [...goods].sort((a, b) => p.goods[a] - p.goods[b])[0];
      if (p.goods[good] < p.capacity) choice = { kind: effect, good };
    }
    if (
      effect === "return-family" &&
      canUseImmediateBonus(game, effect) &&
      p.familyPlace !== 12
    )
      choice = { kind: effect, reward: "lira" };
    if (effect === "return-assistant" && game.phase === "movement") {
      const place = Object.keys(p.assistantsByPlace)
        .map(Number)
        .sort(
          (a, b) =>
            gridDistance(game.board, p.merchantPlace, b) -
            gridDistance(game.board, p.merchantPlace, a),
        )[0];
      if (place !== undefined) choice = { kind: effect, place };
    }
    if (game.phase === "turn-end" && game.lastAction?.playerUid === p.uid) {
      if (effect === "repeat-post" && game.lastAction.place === 5)
        choice = { kind: "repeat-action" };
      if (
        effect === "repeat-gemstone" &&
        game.lastAction.place === 16 &&
        p.lira >= game.rubyTracks.gemstonePrice
      )
        choice = { kind: "repeat-action" };
      if (effect === "repeat-sultan" && game.lastAction.place === 13) {
        const wildGoods = sultanPayment(game, p);
        if (wildGoods) choice = { kind: "repeat-action", wildGoods };
      }
    }
    if (choice) return { type: "bonus/played", payload: { cardId, choice } };
  }
  if (game.phase === "movement") return null;
  if (
    (game.phase === "action" || game.phase === "family-action") &&
    game.pending?.kind !== "caravansary-discard"
  ) {
    const place =
      game.pending?.kind === "family-action"
        ? game.pending.destination
        : p.merchantPlace;
    if (place === 12 && game.phase === "action" && p.familyPlace === 12)
      return null;
    const choice = placeChoice(game, p, place);
    if (choice) return { type: "place/action-taken", payload: { choice } };
  }
  return nextBotAction(game);
}
