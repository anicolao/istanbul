import { postOfficeRows } from './actions';
import { bonusCards, demandTiles, mosqueTiles, type Good } from './manifests';
import { currentSultanCost } from './ruby-routes';
import type { GameSetup } from './setup';

const goodNames: Record<Good | 'any', string> = {
  fabric: 'fabric',
  spice: 'spice',
  fruit: 'fruit',
  jewelry: 'jewelry',
  any: 'any good'
};

function resourceName(resource: { lira?: number; good?: Good }) {
  return resource.lira ? `${resource.lira} Lira` : `1 ${goodNames[resource.good!]}`;
}

function demandSummary(game: GameSetup, placeId: 10 | 11) {
  const stack = placeId === 10 ? game.largeDemand : game.smallDemand;
  const demand = demandTiles.find(({ id }) => id === stack[0]);
  return demand?.goods.map((good) => goodNames[good]).join(', ') ?? 'demand stack empty';
}

function mosqueSummary(game: GameSetup, placeId: 14 | 15) {
  const colors: Good[] = placeId === 14 ? ['fabric', 'spice'] : ['fruit', 'jewelry'];
  const offers = colors.map((color) => {
    const tile = mosqueTiles.find(({ id }) => id === game.mosqueStacks[color][0]);
    return tile ? `${tile.required} ${goodNames[color]} required, pay 1` : `${goodNames[color]} stack empty`;
  });
  return offers.join('; ');
}

export function locationStateSummary(game: GameSetup, placeId: number): string {
  const active = game.players[game.turnSeat];
  if (placeId === 1) return `Extensions cost 7 Lira; ${game.supplies.wheelbarrowExtensions} extensions and ${game.supplies.wainwrightRubies} ruby rewards remain`;
  if (placeId === 2) return 'Fill fabric to current wheelbarrow capacity';
  if (placeId === 3) return 'Fill spice to current wheelbarrow capacity';
  if (placeId === 4) return 'Fill fruit to current wheelbarrow capacity';
  if (placeId === 5) return `Exposed mail: ${postOfficeRows.map((rows, index) => resourceName(rows[game.postOfficeLower[index] ? 1 : 0])).join(', ')}`;
  if (placeId === 6) {
    const top = bonusCards.find(({ id }) => id === game.bonusDiscard.at(-1));
    return `${game.bonusDrawPile.length} Bonus cards in draw pile; ${game.bonusDiscard.length} in discard${top ? `, topped by ${top.title}` : ''}`;
  }
  if (placeId === 7) {
    const separated = Object.values(active.assistantsByPlace).reduce((total, count) => total + count, 0);
    return `${active.name} can recall ${separated} assistant${separated === 1 ? '' : 's'} from the bazaar`;
  }
  if (placeId === 8) {
    const roll = game.lastRoll?.place === 8 ? `; last roll ${game.lastRoll.dice.join(' + ')}, ${game.lastRoll.reward} jewelry gained` : '';
    return `Take 1 basic good; jewelry at dice totals 7, 9, and 11${roll}`;
  }
  if (placeId === 9) {
    const roll = game.lastRoll?.place === 9 ? `; last wager ${game.lastRoll.declared}, roll ${game.lastRoll.dice.join(' + ')}, ${game.lastRoll.reward} Lira gained` : '';
    return `Wager 3 to 12 Lira and roll two dice${roll}`;
  }
  if (placeId === 10) return `Current Large Market demand: ${demandSummary(game, 10)}`;
  if (placeId === 11) return `Current Small Market demand: ${demandSummary(game, 11)}`;
  if (placeId === 12) {
    const ready = game.players.filter(({ familyPlace }) => familyPlace === 12);
    const roster = ready.length ? ready.map(({ name }) => name).join(', ') : 'none';
    return `${ready.length} family member${ready.length === 1 ? '' : 's'} at Police Station: ${roster}; ${active.familyPlace === 12
      ? `${active.name}'s family is ready for dispatch`
      : `${active.name}'s family is at Place ${active.familyPlace}`}`;
  }
  if (placeId === 13) return `Next ruby costs ${currentSultanCost(game).map((good) => goodNames[good]).join(', ')}`;
  if (placeId === 14) return mosqueSummary(game, 14);
  if (placeId === 15) return mosqueSummary(game, 15);
  if (placeId === 16) return `Next ruby costs ${game.rubyTracks.gemstonePrice} Lira`;
  return 'No location state';
}
