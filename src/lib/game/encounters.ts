import type { Good } from './manifests';
import { createRandom, rollDice, shuffle } from './random';
import type { GameSetup, SetupPlayer } from './setup';

export type EncounterChoice =
  | { kind: 'catch-family'; familyUid: string; reward: 'lira' | 'bonus' }
  | { kind: 'governor-visit'; accept: boolean }
  | { kind: 'governor-pay'; payment: 'lira' | 'card'; discardCardId?: string }
  | { kind: 'smuggler-trade'; accept: false }
  | { kind: 'smuggler-trade'; accept: true; good: Good; payment: 'lira' | 'good'; paymentGood?: Good };

const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];

export function isEncounterChoice(value: unknown): value is EncounterChoice {
  if (!value || typeof value !== 'object' || !('kind' in value)) return false;
  const choice = value as Record<string, unknown>;
  if (choice.kind === 'catch-family') {
    return typeof choice.familyUid === 'string' && (choice.reward === 'lira' || choice.reward === 'bonus');
  }
  if (choice.kind === 'governor-visit') return typeof choice.accept === 'boolean';
  if (choice.kind === 'governor-pay') {
    return choice.payment === 'lira' || (choice.payment === 'card' && typeof choice.discardCardId === 'string');
  }
  if (choice.kind !== 'smuggler-trade' || typeof choice.accept !== 'boolean') return false;
  if (!choice.accept) return true;
  return goods.includes(choice.good as Good)
    && (choice.payment === 'lira' || (choice.payment === 'good' && goods.includes(choice.paymentGood as Good)));
}

export function drawBonus(game: GameSetup, randomKey: string): string | null {
  if (game.bonusDrawPile.length === 0 && game.bonusDiscard.length > 0) {
    game.bonusDrawPile = shuffle(game.bonusDiscard, createRandom(`${game.seed}:bonus-recycle:${randomKey}`));
    game.bonusDiscard = [];
  }
  return game.bonusDrawPile.shift() ?? null;
}

export function catchFamily(game: GameSetup, player: SetupPlayer, familyUid: string, reward: 'lira' | 'bonus'): string | null {
  const family = game.players.find((candidate) => candidate.uid === familyUid);
  if (!family || family.uid === player.uid || family.familyPlace !== player.merchantPlace || family.familyPlace === 12) return null;
  if (reward === 'bonus') {
    const card = drawBonus(game, `family:${game.turnNumber}:${familyUid}`);
    if (!card) return null;
    player.bonusHand.push(card);
  } else {
    player.lira += 3;
  }
  family.familyPlace = 12;
  return `Caught ${family.name}'s family and gained ${reward === 'lira' ? '3 Lira' : '1 Bonus card'}.`;
}

export function relocateEncounter(game: GameSetup, token: 'governor' | 'smuggler'): [number, number] {
  const dice = rollDice(createRandom(`${game.seed}:encounter:${game.turnNumber}:${token}:${game.encounterLog.length}`));
  if (token === 'governor') game.governorPlace = dice[0] + dice[1];
  else game.smugglerPlace = dice[0] + dice[1];
  return dice;
}
