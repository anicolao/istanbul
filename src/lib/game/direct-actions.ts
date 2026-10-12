import { warehouseGood, type PlaceActionChoice } from "./actions";
import { currentSultanCost } from "./ruby-routes";
import type { GameSetup } from "./setup";

/** Only deterministic actions with no resource-selection decision. */
export function arrivalAction(game: GameSetup): PlaceActionChoice | null {
  if (game.phase !== "action" && game.phase !== "family-action") return null;
  const player = game.players[game.turnSeat];
  const place =
    game.pending?.kind === "family-action"
      ? game.pending.destination
      : player.merchantPlace;
  const good = warehouseGood(place);
  if (good) return { kind: "warehouse-fill", good };
  if (place === 5) return { kind: "post-office-collect" };
  if (
    place === 1 &&
    player.lira >= 7 &&
    player.extensions < 3 &&
    game.supplies.wheelbarrowExtensions > 0
  )
    return { kind: "wainwright-buy" };
  if (
    place === 16 &&
    player.lira >= game.rubyTracks.gemstonePrice &&
    game.rubyTracks.gemstoneRubies > 0
  )
    return { kind: "gemstone-buy" };
  if (place === 13 && game.rubyTracks.sultanRubies > 0) {
    const cost = currentSultanCost(game);
    if (
      !cost.includes("any") &&
      cost.every(
        (g) =>
          g !== "any" && player.goods[g] >= cost.filter((c) => c === g).length,
      )
    )
      return { kind: "sultan-buy", wildGoods: [] };
  }
  return null;
}
