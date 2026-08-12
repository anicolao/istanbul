import { mosqueTiles, type Good } from './manifests';
import type { GameSetup, SetupPlayer } from './setup';

export type MosqueAbilityChoice =
  | { kind: 'warehouse-extra'; good: Good | null }
  | { kind: 'dice-adjust'; adjustment: 'none' | 'first-to-four' | 'second-to-four' | 'reroll' }
  | { kind: 'yellow-recall'; place: number };

export function isMosqueAbilityChoice(value: unknown): value is MosqueAbilityChoice {
  if (!value || typeof value !== 'object' || !('kind' in value)) return false;
  const choice = value as Record<string, unknown>;
  if (choice.kind === 'warehouse-extra') return choice.good === null || ['fabric', 'spice', 'fruit', 'jewelry'].includes(String(choice.good));
  if (choice.kind === 'dice-adjust') return ['none', 'first-to-four', 'second-to-four', 'reroll'].includes(String(choice.adjustment));
  return choice.kind === 'yellow-recall' && typeof choice.place === 'number' && Number.isInteger(choice.place);
}

export function ownsMosqueAbility(player: SetupPlayer, color: Good): boolean {
  return player.mosqueTileIds.some((id) => mosqueTiles.find((tile) => tile.id === id)?.color === color);
}

export function adjustMosqueDice(
  original: [number, number],
  adjustment: Extract<MosqueAbilityChoice, { kind: 'dice-adjust' }>['adjustment'],
  rerolled: [number, number]
): [number, number] {
  if (adjustment === 'first-to-four') return [4, original[1]];
  if (adjustment === 'second-to-four') return [original[0], 4];
  if (adjustment === 'reroll') return [...rerolled];
  return [...original];
}

export function takeMosqueTile(game: GameSetup, player: SetupPlayer, tileId: string, place: number): string | null {
  const tile = mosqueTiles.find((candidate) => candidate.id === tileId);
  const stack = tile ? game.mosqueStacks[tile.color] : null;
  const allowed = place === 14 ? ['fabric', 'spice'] : place === 15 ? ['fruit', 'jewelry'] : [];
  if (!tile || !stack || stack[0] !== tileId || !allowed.includes(tile.color) || ownsMosqueAbility(player, tile.color) || player.goods[tile.color] < tile.required) return null;
  player.goods[tile.color] -= 1;
  stack.shift();
  player.mosqueTileIds.push(tile.id);
  if (tile.color === 'jewelry' && player.assistantsInSupply > 0) {
    player.assistantsInSupply -= 1;
    player.assistantsCarried += 1;
  }
  const pair = place === 14 ? ['fabric', 'spice'] as Good[] : ['fruit', 'jewelry'] as Good[];
  const completedPair = pair.every((color) => ownsMosqueAbility(player, color));
  const supplyKey = place === 14 ? 'smallMosqueRubies' : 'greatMosqueRubies';
  if (completedPair && game.supplies[supplyKey] > 0) {
    game.supplies[supplyKey] -= 1;
    player.rubies += 1;
    return `Paid 1 ${tile.color}, gained its Mosque tile, and completed the pair for 1 ruby.`;
  }
  return `Paid 1 ${tile.color} and gained the ${tile.color} Mosque tile.`;
}

export function buyWarehouseExtra(player: SetupPlayer, good: Good): boolean {
  if (player.lira < 2 || player.goods[good] >= player.capacity) return false;
  player.lira -= 2;
  player.goods[good] += 1;
  return true;
}

export function recallWithYellow(player: SetupPlayer, place: number): boolean {
  if (player.lira < 2 || (player.assistantsByPlace[place] ?? 0) < 1) return false;
  player.lira -= 2;
  player.assistantsCarried += 1;
  const remaining = player.assistantsByPlace[place] - 1;
  if (remaining === 0) delete player.assistantsByPlace[place];
  else player.assistantsByPlace[place] = remaining;
  return true;
}
