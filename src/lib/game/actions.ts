import type { Good } from './manifests';
import type { GameSetup, SetupPlayer } from './setup';

export type PlaceActionChoice =
  | { kind: 'wainwright-buy' }
  | { kind: 'warehouse-fill'; good: Exclude<Good, 'jewelry'> }
  | { kind: 'fountain-recall'; assistantPlaces: number[] };

export function warehouseGood(place: number): Exclude<Good, 'jewelry'> | null {
  if (place === 2) return 'fabric';
  if (place === 3) return 'spice';
  if (place === 4) return 'fruit';
  return null;
}

export function isPlaceActionChoice(value: unknown): value is PlaceActionChoice {
  if (!value || typeof value !== 'object' || !('kind' in value)) return false;
  const choice = value as Record<string, unknown>;
  if (choice.kind === 'wainwright-buy') return true;
  if (choice.kind === 'warehouse-fill') return ['fabric', 'spice', 'fruit'].includes(String(choice.good));
  return choice.kind === 'fountain-recall'
    && Array.isArray(choice.assistantPlaces)
    && choice.assistantPlaces.every((place) => typeof place === 'number' && Number.isInteger(place));
}

export function buyWheelbarrowExtension(game: GameSetup, player: SetupPlayer): string | null {
  if (player.lira < 7 || player.extensions >= 3 || game.supplies.wheelbarrowExtensions < 1) return null;
  player.lira -= 7;
  player.extensions += 1;
  player.capacity += 1;
  game.supplies.wheelbarrowExtensions -= 1;
  if (player.extensions === 3 && game.supplies.wainwrightRubies > 0) {
    player.rubies += 1;
    game.supplies.wainwrightRubies -= 1;
    return 'Completed the wheelbarrow and claimed its ruby.';
  }
  return `Bought wheelbarrow extension ${player.extensions} of 3.`;
}

export function recallAssistants(player: SetupPlayer, places: number[]): string | null {
  const remaining = { ...player.assistantsByPlace };
  for (const place of places) {
    if (!remaining[place]) return null;
    remaining[place] -= 1;
  }
  player.assistantsByPlace = Object.fromEntries(Object.entries(remaining).filter(([, count]) => count > 0));
  player.assistantsCarried += places.length;
  return `Recalled ${places.length} assistant${places.length === 1 ? '' : 's'}.`;
}
