import { bonusCards, type Good } from './manifests';
import type { GameSetup, SetupPlayer } from './setup';

export type BonusChoice =
  | { kind: 'gain-good'; good: Good }
  | { kind: 'gain-lira' }
  | { kind: 'repeat-action'; wildGoods?: Good[] }
  | { kind: 'return-family'; reward: 'lira' | 'bonus' }
  | { kind: 'stay' }
  | { kind: 'long-move' }
  | { kind: 'wild-small-market' }
  | { kind: 'return-assistant'; place: number };

export function isBonusChoice(value: unknown): value is BonusChoice {
  if (!value || typeof value !== 'object' || !('kind' in value)) return false;
  const choice = value as Record<string, unknown>;
  if (choice.kind === 'gain-good') return ['fabric', 'spice', 'fruit', 'jewelry'].includes(String(choice.good));
  if (choice.kind === 'gain-lira' || choice.kind === 'stay' || choice.kind === 'long-move' || choice.kind === 'wild-small-market') return true;
  if (choice.kind === 'repeat-action') return choice.wildGoods === undefined || (Array.isArray(choice.wildGoods) && choice.wildGoods.every((good) => ['fabric', 'spice', 'fruit', 'jewelry'].includes(good)));
  if (choice.kind === 'return-family') return choice.reward === 'lira' || choice.reward === 'bonus';
  return choice.kind === 'return-assistant' && typeof choice.place === 'number' && Number.isInteger(choice.place);
}

export function bonusEffect(cardId: string) {
  return bonusCards.find(({ id }) => id === cardId)?.effect ?? null;
}

export function discardPlayedBonus(game: GameSetup, player: SetupPlayer, cardId: string): boolean {
  const index = player.bonusHand.indexOf(cardId);
  if (index < 0) return false;
  game.bonusDiscard.push(player.bonusHand.splice(index, 1)[0]);
  return true;
}

export function activateBonus(game: GameSetup, effect: 'long-move' | 'wild-small-market') {
  if (!game.activeBonusEffects.includes(effect)) game.activeBonusEffects.push(effect);
}
