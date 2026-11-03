import type { GameSetup, SetupPlayer } from "../../setup";
import type { BotAction } from "../../bot";
import { legalDestinations, requiredAssistantAction } from "../../movement";
import { bonusEffect } from "../../bonus";
import { ownsMosqueAbility } from "../../mosques";

/** Advisory public-state features, not an action mask. Include known card/power
 * rescue options; unknown future draws are deliberately not inspected. */
function stranded(
  game: GameSetup,
  p: SetupPlayer,
  destination: number,
): boolean {
  if (destination === 7) return false;
  const next = {
    ...p,
    merchantPlace: destination,
    assistantsByPlace: { ...p.assistantsByPlace },
  };
  const assistant = requiredAssistantAction(p, destination);
  if (assistant === "drop") {
    next.assistantsCarried--;
    next.assistantsByPlace[destination] =
      (next.assistantsByPlace[destination] ?? 0) + 1;
  }
  if (assistant === "pick-up") {
    next.assistantsCarried++;
    next.assistantsByPlace[destination]--;
  }
  const ordinary = { ...game, activeBonusEffects: [] };
  if (legalDestinations(ordinary, next).length) return false;
  if (
    next.bonusHand.some((id) =>
      ["return-assistant", "stay"].includes(bonusEffect(id) ?? ""),
    )
  )
    return false;
  if (ownsMosqueAbility(next, "fruit") && next.lira >= 2) return false;
  if (
    next.bonusHand.some((id) => bonusEffect(id) === "long-move") &&
    legalDestinations({ ...game, activeBonusEffects: ["long-move"] }, next)
      .length
  )
    return false;
  return true;
}
export function mobilityFeatures(game: GameSetup, action: BotAction): number[] {
  const p = game.players[game.turnSeat],
    choice = action.payload.choice as { kind?: string } | undefined;
  const badMove =
    action.type === "turn/moved" &&
    stranded(game, p, Number(action.payload.destination));
  let badCard = false;
  if (choice?.kind === "long-move") {
    const after = {
      ...game,
      activeBonusEffects: ["long-move"] as GameSetup["activeBonusEffects"],
    };
    const afterPlayer = {
      ...p,
      bonusHand: p.bonusHand.filter((id) => id !== action.payload.cardId),
    };
    const destinations = legalDestinations(after, afterPlayer);
    badCard = !destinations.some((d) => !stranded(after, afterPlayer, d));
  }
  return [+badMove, +badCard];
}
