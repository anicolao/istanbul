import type { BotAction } from "../../bot";
import type { GameSetup } from "../../setup";
import {
  bonusEffect,
  canUseFlexibleDemand,
  canUseImmediateBonus,
} from "../../bonus";
import { demandTiles, mosqueTiles, type Good } from "../../manifests";
import { legalDestinations, requiredAssistantAction } from "../../movement";
import { ownsMosqueAbility } from "../../mosques";
import { currentSultanCost } from "../../ruby-routes";
import { warehouseGood } from "../../actions";

export const goods: Good[] = ["fabric", "spice", "fruit", "jewelry"];
/** Canonical multisets: order and identical-copy permutations are not different decisions. */
export function multisets<T>(
  items: T[],
  available: number[],
  min: number,
  max: number,
): T[][] {
  const out: T[][] = [];
  function visit(i: number, selected: T[]) {
    if (i === items.length) {
      if (selected.length >= min) out.push(selected);
      return;
    }
    for (let n = 0; n <= Math.min(available[i], max - selected.length); n++)
      visit(i + 1, [...selected, ...Array<T>(n).fill(items[i])]);
  }
  visit(0, []);
  return out;
}
export function sultanPayments(game: GameSetup): Good[][] {
  const stock = { ...game.players[game.turnSeat].goods };
  let wild = 0;
  for (const good of currentSultanCost(game)) {
    if (good === "any") wild++;
    else if (--stock[good] < 0) return [];
  }
  return multisets(
    goods,
    goods.map((g) => stock[g]),
    wild,
    wild,
  );
}
/** All distinct forward gameplay decisions. UI compound shortcuts are represented by
 * their component decisions, so a discard is selected only after observing the draw.
 * No strategic pruning: even skipping, partial sales/recalls and unaffordable moves remain. */
export function legalActions(game: GameSetup): BotAction[] {
  if (game.phase === "game-over") return [];
  const p = game.players[game.turnSeat],
    pending = game.pending;
  const out: BotAction[] = [];
  const add = (type: string, payload: Record<string, unknown> = {}) =>
    out.push({ type, payload });
  const place = (choice: Record<string, unknown>) =>
    add("place/action-taken", { choice });
  const ability = (choice: Record<string, unknown>) =>
    add("mosque/ability-used", { choice });
  const encounter = (choice: Record<string, unknown>) =>
    add("encounter/resolved", { choice, separateRelocation: true });
  const end = () => add("turn/ended", { directAction: true });
  const deckAvailable =
    game.bonusDrawPile.length + game.bonusDiscard.length > 0;
  if (pending?.kind === "caravansary-discard") {
    for (const discardCardId of p.bonusHand)
      place({ kind: "caravansary-discard", discardCardId });
    return out;
  }
  // Every card is an option alongside normal play, never automatically consumed.
  for (const cardId of p.bonusHand) {
    const effect = bonusEffect(cardId);
    const card = (choice: Record<string, unknown>) =>
      add("bonus/played", { cardId, choice });
    if (effect === "gain-lira" && canUseImmediateBonus(game, effect))
      card({ kind: effect });
    if (effect === "gain-good" && canUseImmediateBonus(game, effect))
      for (const good of goods)
        if (p.goods[good] < p.capacity) card({ kind: effect, good });
    if (
      effect === "return-family" &&
      canUseImmediateBonus(game, effect) &&
      p.familyPlace !== 12
    ) {
      card({ kind: effect, reward: "lira" });
      if (deckAvailable) card({ kind: effect, reward: "bonus" });
    }
    if (effect === "return-assistant" && game.phase === "movement")
      for (const [location, count] of Object.entries(p.assistantsByPlace))
        if (count > 0) card({ kind: effect, place: Number(location) });
    if (
      effect === "long-move" &&
      game.phase === "movement" &&
      !game.activeBonusEffects.includes(effect)
    )
      card({ kind: effect });
    if (
      effect === "stay" &&
      game.phase === "movement" &&
      p.merchantPlace !== 7 &&
      requiredAssistantAction(p, p.merchantPlace)
    )
      card({ kind: effect });
    if (effect === "wild-small-market" && canUseFlexibleDemand(game))
      card({ kind: effect });
    if (game.phase === "turn-end" && game.lastAction?.playerUid === p.uid) {
      if (effect === "repeat-post" && game.lastAction.place === 5)
        card({ kind: "repeat-action" });
      if (
        effect === "repeat-gemstone" &&
        game.lastAction.place === 16 &&
        p.lira >= game.rubyTracks.gemstonePrice
      )
        card({ kind: "repeat-action" });
      if (effect === "repeat-sultan" && game.lastAction.place === 13)
        for (const wildGoods of sultanPayments(game))
          card({ kind: "repeat-action", wildGoods });
    }
  }
  if (game.phase === "movement") {
    for (const destination of legalDestinations(game, p))
      add("turn/moved", {
        destination,
        assistantAction: requiredAssistantAction(p, destination),
      });
    if (
      ownsMosqueAbility(p, "fruit") &&
      !game.abilitiesUsedThisTurn.includes("fruit") &&
      p.lira >= 2
    )
      for (const [location, count] of Object.entries(p.assistantsByPlace))
        if (count > 0)
          ability({ kind: "yellow-recall", place: Number(location) });
  } else if (
    game.phase === "merchant-payment" &&
    pending?.kind === "merchant-payment" &&
    p.lira >= pending.total
  ) {
    add("turn/merchant-paid", {
      recipientUids: pending.recipientUids,
      neutralMerchantIds: pending.neutralMerchantIds,
    });
  } else if (game.phase === "mosque-ability") {
    if (pending?.kind === "warehouse-extra") {
      ability({ kind: "warehouse-extra", good: null });
      for (const good of goods)
        if (p.lira >= 2 && p.goods[good] < p.capacity)
          ability({ kind: "warehouse-extra", good });
    }
    if (pending?.kind === "dice-adjust")
      for (const adjustment of [
        "none",
        "first-to-four",
        "second-to-four",
        "reroll",
      ])
        ability({ kind: "dice-adjust", adjustment });
  } else if (game.phase === "encounters" && pending?.kind === "encounters") {
    if (pending.relocation) encounter({ kind: `${pending.relocation}-roll` });
    else if (pending.governor === "payment") {
      if (p.lira >= 2) encounter({ kind: "governor-pay", payment: "lira" });
      for (const discardCardId of p.bonusHand)
        encounter({ kind: "governor-pay", payment: "card", discardCardId });
    } else {
      for (const familyUid of pending.familyUids) {
        encounter({ kind: "catch-family", familyUid, reward: "lira" });
        if (deckAvailable)
          encounter({ kind: "catch-family", familyUid, reward: "bonus" });
      }
      if (pending.governor === "available") {
        encounter({ kind: "governor-visit", accept: false });
        if (deckAvailable) encounter({ kind: "governor-visit", accept: true });
      }
      if (pending.smuggler) {
        encounter({ kind: "smuggler-trade", accept: false });
        for (const good of goods)
          if (p.goods[good] < p.capacity) {
            if (p.lira >= 2)
              encounter({
                kind: "smuggler-trade",
                accept: true,
                good,
                payment: "lira",
              });
            for (const paymentGood of goods)
              if (p.goods[paymentGood] > 0 || paymentGood === good)
                encounter({
                  kind: "smuggler-trade",
                  accept: true,
                  good,
                  payment: "good",
                  paymentGood,
                });
          }
      }
      if (!pending.familyUids.length) end();
    }
  } else if (game.phase === "action" || game.phase === "family-action") {
    const at =
      pending?.kind === "family-action" ? pending.destination : p.merchantPlace;
    const good = warehouseGood(at);
    if (good) place({ kind: "warehouse-fill", good });
    if (
      at === 1 &&
      p.lira >= 7 &&
      p.extensions < 3 &&
      game.supplies.wheelbarrowExtensions > 0
    )
      place({ kind: "wainwright-buy" });
    if (at === 5) place({ kind: "post-office-collect" });
    if (at === 6)
      for (const first of ["deck", "discard"] as const)
        for (const second of ["deck", "discard"] as const) {
          let deck = game.bonusDrawPile.length,
            discard = game.bonusDiscard.length,
            valid = true;
          for (const source of [first, second]) {
            if (source === "deck") {
              if (!deck) {
                deck = discard;
                discard = 0;
              }
              if (!deck) valid = false;
              else deck--;
            } else if (!discard) valid = false;
            else discard--;
          }
          if (valid)
            place({ kind: "caravansary-draw", drawSources: [first, second] });
        }
    if (at === 7) {
      const locations = Object.keys(p.assistantsByPlace)
        .map(Number)
        .sort((a, b) => a - b);
      for (const assistantPlaces of multisets(
        locations,
        locations.map((l) => p.assistantsByPlace[l]),
        0,
        5,
      ))
        place({ kind: "fountain-recall", assistantPlaces });
    }
    if (at === 8)
      for (const good of goods.slice(0, 3))
        place({ kind: "black-market-roll", good });
    if (at === 9)
      for (let wager = 3; wager <= 12; wager++)
        place({ kind: "tea-house-wager", wager });
    if (at === 10 || at === 11) {
      const demand = demandTiles.find(
        (d) => d.id === (at === 10 ? game.largeDemand[0] : game.smallDemand[0]),
      )!;
      for (let bits = 1; bits < 32; bits++) {
        const slotIndexes = [0, 1, 2, 3, 4].filter((i) => bits & (1 << i));
        const stock = { ...p.goods };
        if (slotIndexes.every((i) => --stock[demand.goods[i]] >= 0))
          place({ kind: "market-sell", slotIndexes });
      }
      if (at === 11 && game.activeBonusEffects.includes("wild-small-market"))
        for (const wildGoods of multisets(
          goods,
          goods.map((g) => p.goods[g]),
          1,
          5,
        ))
          place({
            kind: "market-sell",
            slotIndexes: wildGoods.map((_, i) => i),
            wildGoods,
          });
    }
    if (at === 12 && game.phase !== "family-action" && p.familyPlace === 12)
      for (const destination of game.board)
        if (destination !== 12) place({ kind: "police-send", destination });
    if (at === 13)
      for (const wildGoods of sultanPayments(game))
        place({ kind: "sultan-buy", wildGoods });
    if (at === 14 || at === 15)
      for (const color of at === 14 ? goods.slice(0, 2) : goods.slice(2)) {
        const tileId = game.mosqueStacks[color][0],
          tile = mosqueTiles.find((t) => t.id === tileId);
        if (
          tile &&
          !ownsMosqueAbility(p, color) &&
          p.goods[color] >= tile.required
        )
          place({ kind: "mosque-take", tileId });
      }
    if (at === 16 && p.lira >= game.rubyTracks.gemstonePrice)
      place({ kind: "gemstone-buy" });
    end();
  } else if (game.phase === "turn-end" || game.phase === "final-bonus") end();
  return out;
}
