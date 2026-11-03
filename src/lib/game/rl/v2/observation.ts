import type { GameSetup } from "../../setup";
import { bonusCards, demandTiles, mosqueTiles } from "../../manifests";
import { goods } from "./actions";

export const effects = [...new Set(bonusCards.map((c) => c.effect))];
export const phases = [
  "movement",
  "merchant-payment",
  "action",
  "family-action",
  "mosque-ability",
  "encounters",
  "turn-end",
  "final-bonus",
  "game-over",
];
export const kinds = [
  "turn/moved",
  "turn/merchant-paid",
  "turn/ended",
  "wainwright-buy",
  "warehouse-fill",
  "fountain-recall",
  "post-office-collect",
  "caravansary-draw",
  "caravansary-discard",
  "market-sell",
  "black-market-roll",
  "tea-house-wager",
  "police-send",
  "mosque-take",
  "sultan-buy",
  "gemstone-buy",
  "warehouse-extra",
  "dice-adjust",
  "yellow-recall",
  "governor-roll",
  "smuggler-roll",
  "catch-family",
  "governor-visit",
  "governor-pay",
  "smuggler-trade",
  "gain-good",
  "gain-lira",
  "repeat-action",
  "return-family",
  "stay",
  "long-move",
  "wild-small-market",
  "return-assistant",
];
/** Explicit information boundary. Only current public state and the acting player's
 * private hand enter the network. No seed, draw identities/order/count contexts,
 * opponents' hands, or face-down demand faces. Seats are relative to the actor. */
export function observation(game: GameSetup): number[] {
  const x: number[] = [];
  const one = (value: unknown, choices: readonly unknown[]) =>
    x.push(...choices.map((c) => +(c === value)));
  const number = (value: number | null | undefined, scale = 1) =>
    x.push((value ?? 0) / scale);
  const location = (value: number | null | undefined) =>
    one(
      value,
      Array.from({ length: 16 }, (_, i) => i + 1),
    );
  const seat = (uid?: string | null) =>
    uid
      ? (game.players.findIndex((p) => p.uid === uid) -
          game.turnSeat +
          game.players.length) %
        game.players.length
      : -1;
  const card = (id?: string) =>
    one(bonusCards.find((c) => c.id === id)?.effect, effects);
  one(game.phase, phases);
  number(game.players.length, 5);
  number(game.turnNumber, 100);
  number(
    (game.startingSeat - game.turnSeat + game.players.length) %
      game.players.length,
    4,
  );
  for (const place of game.board) location(place);
  location(game.governorPlace);
  location(game.smugglerPlace);
  for (let place = 1; place <= 16; place++)
    number(game.neutralMerchants.filter((m) => m.place === place).length, 3);
  x.push(...game.postOfficeLower.map(Number));
  for (const stack of [game.largeDemand, game.smallDemand]) {
    one(
      stack[0],
      demandTiles.map((d) => d.id),
    );
    number(stack.length, 6);
  }
  for (const good of goods)
    for (const tile of mosqueTiles.filter((t) => t.color === good))
      number(game.mosqueStacks[good].includes(tile.id) ? 1 : 0);
  for (const value of Object.values(game.rubyTracks)) number(value, 25);
  for (const key of [
    "wheelbarrowExtensions",
    "wainwrightRubies",
    "smallMosqueRubies",
    "greatMosqueRubies",
  ] as const)
    number(game.supplies[key], 15);
  number(game.bonusDrawPile.length, 26);
  number(game.bonusDiscard.length, 26);
  // Full visible discard order; copies of the same printed effect are equivalent.
  for (let i = 0; i < bonusCards.length; i++)
    card(game.bonusDiscard[game.bonusDiscard.length - 1 - i]);
  for (let relative = 0; relative < 5; relative++) {
    const p =
      relative < game.players.length
        ? game.players[(game.turnSeat + relative) % game.players.length]
        : undefined;
    number(p ? 1 : 0);
    location(p?.merchantPlace);
    location(p?.familyPlace);
    for (let place = 1; place <= 16; place++)
      number(p?.assistantsByPlace[place], 5);
    for (const key of [
      "assistantsCarried",
      "assistantsInSupply",
      "capacity",
      "extensions",
      "rubies",
    ] as const)
      number(p?.[key], 6);
    number(p?.lira, 30);
    for (const good of goods) number(p?.goods[good], 5);
    for (const tile of mosqueTiles)
      number(p?.mosqueTileIds.includes(tile.id) ? 1 : 0);
    number(p?.bonusHand.length, 10);
    number(
      p
        ? game.end.ordinaryTurnCounts[
            (game.turnSeat + relative) % game.players.length
          ]
        : 0,
      30,
    );
    number(
      p &&
        game.end.finalBonusSeatsCompleted.includes(
          (game.turnSeat + relative) % game.players.length,
        )
        ? 1
        : 0,
    );
  }
  const own = game.players[game.turnSeat];
  for (const effect of effects)
    number(
      own.bonusHand.filter(
        (id) => bonusCards.find((c) => c.id === id)?.effect === effect,
      ).length,
      4,
    );
  for (const good of goods)
    number(game.abilitiesUsedThisTurn.includes(good) ? 1 : 0);
  number(game.activeBonusEffects.includes("long-move") ? 1 : 0);
  number(game.activeBonusEffects.includes("wild-small-market") ? 1 : 0);
  number(game.end.target, 6);
  one(seat(game.end.triggeredByUid), [-1, 0, 1, 2, 3, 4]);
  number(game.end.triggeredTurn, 100);
  one(
    (game.end.finalTurnSeat - game.turnSeat + game.players.length) %
      game.players.length,
    [0, 1, 2, 3, 4],
  );
  const pending = game.pending;
  one(pending?.kind, [
    "caravansary-discard",
    "merchant-payment",
    "family-action",
    "encounters",
    "warehouse-extra",
    "dice-adjust",
  ]);
  number(pending && "familyAction" in pending && pending.familyAction ? 1 : 0);
  location(
    pending?.kind === "family-action"
      ? pending.destination
      : pending && "actionPlace" in pending
        ? pending.actionPlace
        : 0,
  );
  for (let i = 0; i < 5; i++) {
    const uid = game.players[(game.turnSeat + i) % game.players.length]?.uid;
    number(
      i < game.players.length &&
        pending?.kind === "encounters" &&
        pending.familyUids.includes(uid)
        ? 1
        : 0,
    );
    number(
      i < game.players.length &&
        pending?.kind === "merchant-payment" &&
        pending.recipientUids.includes(uid)
        ? 1
        : 0,
    );
  }
  number(pending?.kind === "merchant-payment" ? pending.total : 0, 10);
  number(
    pending?.kind === "merchant-payment"
      ? pending.neutralMerchantIds.length
      : 0,
    3,
  );
  one(pending?.kind === "encounters" ? pending.governor : null, [
    "available",
    "payment",
  ]);
  one(pending?.kind === "encounters" ? pending.relocation : null, [
    "governor",
    "smuggler",
  ]);
  number(pending?.kind === "encounters" && pending.smuggler ? 1 : 0);
  for (let i = 0; i < 2; i++)
    one(
      pending?.kind === "dice-adjust" ? pending.originalDice[i] : null,
      [1, 2, 3, 4, 5, 6],
    );
  number(pending?.kind === "dice-adjust" ? pending.wager : 0, 12);
  one(pending?.kind === "dice-adjust" ? pending.good : null, goods);
  const move = game.lastMovement;
  one(seat(move?.playerUid), [-1, 0, 1, 2, 3, 4]);
  location(move?.from);
  location(move?.to);
  number(move?.distance, 4);
  number(move?.paymentTotal, 10);
  number(move?.paymentBlocked ? 1 : 0);
  one(move?.assistantAction, ["drop", "pick-up", "fountain"]);
  one(seat(game.lastAction?.playerUid), [-1, 0, 1, 2, 3, 4]);
  location(game.lastAction?.place);
  one(game.lastAction?.kind, kinds);
  one(seat(game.lastRoll?.playerUid), [-1, 0, 1, 2, 3, 4]);
  location(game.lastRoll?.place);
  for (let i = 0; i < 2; i++) one(game.lastRoll?.dice[i], [1, 2, 3, 4, 5, 6]);
  number(game.lastRoll?.declared, 12);
  number(game.lastRoll?.reward, 12);
  // Public turn history: typed counts and latest relocation, not implementation prose.
  for (const kind of kinds)
    number(game.encounterLog.filter((e) => e.kind === kind).length, 5);
  const encounter = game.encounterLog.at(-1);
  location(encounter?.destination);
  for (let i = 0; i < 2; i++) one(encounter?.dice?.[i], [1, 2, 3, 4, 5, 6]);
  for (const effect of effects)
    number(
      game.bonusLog.filter(
        (e) => bonusCards.find((c) => c.id === e.cardId)?.effect === effect,
      ).length,
      4,
    );
  return x;
}
