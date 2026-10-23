import {
  marketRevenueFor,
  warehouseGood,
  type PlaceActionChoice
} from './actions';
import { demandTiles, type Good } from './manifests';
import {
  gridDistance,
  legalDestinations,
  requiredAssistantAction
} from './movement';
import type { GameSetup } from './setup';

// Keep this policy stable for saved games; future strategies need a new version.
export const botPolicyVersion = 1;

export interface BotAction {
  type: string;
  payload: Record<string, unknown>;
}
function ordered(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(ordered);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, ordered(child)])
    );
  return value;
}

export function matchesBotAction(
  decision: BotAction,
  type: string,
  payload: Record<string, unknown>
): boolean {
  return (
    decision.type === type &&
    JSON.stringify(ordered(decision.payload)) ===
      JSON.stringify(ordered(payload))
  );
}

const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];

// A replay-stable precondition: two host tabs cannot apply the same decision twice.
export function botStateKey(game: GameSetup): string {
  let hash = 2166136261;
  for (const char of JSON.stringify(game))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `${game.epoch}:${game.turnNumber}:${game.turnSeat}:${game.phase}:${hash >>> 0}`;
}

function toll(game: GameSetup, destination: number): number {
  if (destination === 7) return 0;
  const player = game.players[game.turnSeat];
  return (
    2 *
    (game.players.filter(
      (p) => p.uid !== player.uid && p.merchantPlace === destination
    ).length +
      game.neutralMerchants.filter((p) => p.place === destination).length)
  );
}

function marketSlots(game: GameSetup, place: number): number[] {
  const stock = { ...game.players[game.turnSeat].goods };
  const demand = demandTiles.find(
    (t) => t.id === (place === 10 ? game.largeDemand : game.smallDemand)[0]
  );
  return (
    demand?.goods.flatMap((good, index) =>
      stock[good]-- > 0 ? [index] : []
    ) ?? []
  );
}

function placeValue(game: GameSetup, place: number): number {
  const player = game.players[game.turnSeat];
  const money = player.lira - toll(game, place);
  if (money < 0) return -20;
  if (place === 7) return player.assistantsCarried <= 1 ? 50 : 0;
  if (place === 16 && money >= game.rubyTracks.gemstonePrice) return 45;
  if (place === 9) return 7;
  if (place === 5) return 5;
  if (place === 10 || place === 11)
    return marketRevenueFor(place, marketSlots(game, place).length);
  if (place === 12 && player.familyPlace === 12)
    return money >= game.rubyTracks.gemstonePrice ? 40 : 7;
  const good = warehouseGood(place);
  if (good) return (player.capacity - player.goods[good]) * 1.6;
  if (place === 8) return 2;
  return 0;
}

/** Deliberately modest opponent. Reads public resources, never deck order or opponents' hands. */
export function nextBotAction(game: GameSetup): BotAction | null {
  const player = game.players[game.turnSeat];
  const action = (
    type: string,
    payload: Record<string, unknown> = {}
  ): BotAction => ({ type, payload });
  const placeAction = (choice: PlaceActionChoice) =>
    action('place/action-taken', { choice });
  const end = () => action('turn/ended', { directAction: true });
  if (game.phase === 'game-over') return null;
  if (game.phase === 'movement') {
    const destinations = legalDestinations(game, player);
    const score = (destination: number) => {
      const immediate = placeValue(game, destination);
      const future = Math.max(
        ...game.board.map(
          (target) =>
            placeValue(game, target) /
            (1 + Math.ceil(gridDistance(game.board, destination, target) / 2))
        )
      );
      return (
        immediate +
        future -
        toll(game, destination) * 2 +
        (requiredAssistantAction(player, destination) === 'pick-up' ? 2 : 0)
      );
    };
    const destination = destinations.sort(
      (a, b) => score(b) - score(a) || a - b
    )[0];
    return destination === undefined
      ? null
      : action('turn/moved', {
          destination,
          assistantAction: requiredAssistantAction(player, destination)
        });
  }
  const pending = game.pending;
  if (pending?.kind === 'merchant-payment')
    return action('turn/merchant-paid', {
      recipientUids: pending.recipientUids,
      neutralMerchantIds: pending.neutralMerchantIds
    });
  if (pending?.kind === 'warehouse-extra')
    return action('mosque/ability-used', {
      choice: { kind: 'warehouse-extra', good: null }
    });
  if (pending?.kind === 'dice-adjust')
    return action('mosque/ability-used', {
      choice: { kind: 'dice-adjust', adjustment: 'none' }
    });
  if (pending?.kind === 'caravansary-discard')
    return placeAction({
      kind: 'caravansary-discard',
      discardCardId: player.bonusHand[0]
    });
  if (pending?.kind === 'encounters') {
    if (pending.relocation) return action('encounter/resolved', { choice: { kind: `${pending.relocation}-roll` } });
    if (pending.governor === 'payment')
      return action('encounter/resolved', {
        choice: {
          kind: 'governor-pay',
          payment: 'card',
          discardCardId: player.bonusHand[0]
        }
      });
    if (pending.familyUids.length)
      return action('encounter/resolved', {
        choice: {
          kind: 'catch-family',
          familyUid: pending.familyUids[0],
          reward: 'lira'
        }
      });
    return end();
  }
  if (game.phase === 'turn-end' || game.phase === 'final-bonus') return end();
  const place =
    pending?.kind === 'family-action'
      ? pending.destination
      : player.merchantPlace;
  const good = warehouseGood(place);
  if (good) return placeAction({ kind: 'warehouse-fill', good });
  if (place === 7)
    return placeAction({
      kind: 'fountain-recall',
      assistantPlaces: Object.keys(player.assistantsByPlace).map(Number)
    });
  if (place === 5) return placeAction({ kind: 'post-office-collect' });
  if (place === 9) return placeAction({ kind: 'tea-house-wager', wager: 7 });
  if (place === 16 && player.lira >= game.rubyTracks.gemstonePrice)
    return placeAction({ kind: 'gemstone-buy' });
  if (
    place === 12 &&
    player.familyPlace === 12 &&
    game.phase !== 'family-action'
  )
    return placeAction({
      kind: 'police-send',
      destination: player.lira >= game.rubyTracks.gemstonePrice ? 16 : 9
    });
  if (place === 8) {
    const good = goods
      .slice(0, 3)
      .sort((a, b) => player.goods[a] - player.goods[b])[0] as Exclude<
      Good,
      'jewelry'
    >;
    return placeAction({ kind: 'black-market-roll', good });
  }
  if (place === 10 || place === 11) {
    const slotIndexes = marketSlots(game, place);
    if (slotIndexes.length)
      return placeAction({ kind: 'market-sell', slotIndexes });
  }
  return end();
}
