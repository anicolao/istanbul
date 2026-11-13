import { places, type Good } from '$lib/game/manifests';
import type { SetupPlayer } from '$lib/game/setup';

const goodsSources: Record<Good, string> = {
  fabric: 'the Fabric Warehouse (location 2)',
  spice: 'the Spice Warehouse (location 3)',
  fruit: 'the Fruit Warehouse (location 4)',
  jewelry: 'the Black Market (location 8), where the dice determine how much jewelry you gain'
};

export function goodsHelp(player: SetupPlayer, good: Good): string {
  const title = good[0].toUpperCase() + good.slice(1);
  return `${title}. ${player.name} has ${player.goods[good]} of ${player.capacity} capacity. Gather ${good} at ${goodsSources[good]} or through other rewards. Each wheelbarrow extension at the Wainwright (location 1) costs 7 Lira and adds one capacity to every good, up to five.`;
}

export function pawnHelp(player: SetupPlayer, piece: 'merchant' | 'assistant' | 'family', placeId: number): string {
  const place = places.find(p => p.id === placeId)!;
  const position = `${player.name}'s ${piece === 'family' ? 'family member' : piece} is at the ${place.name} (location ${placeId}).`;
  if (piece === 'assistant') return `${position} When your merchant arrives, pick up your assistant if one is here; otherwise leave one from your stack to activate the location. At the Fountain, recall assistants instead of leaving one.`;
  if (piece === 'family') return `${position} Send your family member from the Police Station to perform a location action without moving your merchant or leaving an assistant. Another merchant can return this family member to the Police Station for a reward.`;
  return `${position} Carries ${player.assistantsCarried} assistants. Normally move one or two steps horizontally or vertically. Pick up your assistant at the destination, or leave one to activate it. Pay 2 Lira to each other merchant there, except at the Fountain.`;
}
