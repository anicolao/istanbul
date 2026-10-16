import { bonusCards, demandTiles, mosqueTiles, type Good } from './manifests';
import { warehouseGood } from './actions';
import { ownsMosqueAbility } from './mosques';
import { currentSultanCost } from './ruby-routes';
import type { GameSetup } from './setup';

/** Remind humans about an available, unperformed destination action, not optional follow-ups. */
export function unfinishedDestination(game: GameSetup): string | null {
  if (game.phase !== 'action' && game.phase !== 'family-action') return null;
  if (game.pending?.kind === 'caravansary-discard') return null;
  const player = game.players[game.turnSeat];
  const place = game.pending?.kind === 'family-action' ? game.pending.destination : player.merchantPlace;
  const goods: Good[] = ['fabric', 'spice', 'fruit', 'jewelry'];
  const warehouse = warehouseGood(place);
  if (warehouse) return player.goods[warehouse] < player.capacity ? `fill your wheelbarrow with ${warehouse}` : null;
  switch (place) {
    case 1:
      return player.lira >= 7 && player.extensions < 3 && game.supplies.wheelbarrowExtensions > 0
        ? 'extend your wheelbarrow' : null;
    case 5: return 'collect the mail resources';
    case 6: return game.bonusDrawPile.length + game.bonusDiscard.length >= 2 ? 'draw Bonus cards' : null;
    case 7: return Object.values(player.assistantsByPlace).some(count => count > 0) ? 'recall your assistants' : null;
    case 8: return 'roll for goods';
    case 9: return 'roll for Lira';
    case 10:
    case 11: {
      const demand = demandTiles.find(tile => tile.id === (place === 10 ? game.largeDemand : game.smallDemand)[0]);
      const flexible = place === 11 && game.activeBonusEffects.includes('wild-small-market');
      return (flexible ? goods : demand?.goods ?? []).some(good => player.goods[good] > 0) ? 'sell your goods' : null;
    }
    case 12: return player.familyPlace === 12 ? 'send your family member' : null;
    case 13: {
      const cost = currentSultanCost(game);
      const remaining = goods.map(good => player.goods[good] - cost.filter(item => item === good).length);
      return remaining.every(count => count >= 0) && remaining.reduce((a, b) => a + b, 0) >= cost.filter(item => item === 'any').length
        ? 'gain a ruby' : null;
    }
    case 14:
    case 15: {
      const colors: Good[] = place === 14 ? ['fabric', 'spice'] : ['fruit', 'jewelry'];
      return colors.some(good => {
        const tile = mosqueTiles.find(tile => tile.id === game.mosqueStacks[good][0]);
        return tile && !ownsMosqueAbility(player, good) && player.goods[good] >= tile.required;
      }) ? 'gain a mosque power' : null;
    }
    case 16: return player.lira >= game.rubyTracks.gemstonePrice ? 'gain a ruby' : null;
    default: return null;
  }
}

/** Only repeat cards playable now, at the new price after the original action. */
export function availableRepeatCard(game: GameSetup): string | null {
  const player = game.players[game.turnSeat];
  if (game.phase !== 'turn-end' || game.lastAction?.playerUid !== player.uid) return null;
  const place = game.lastAction.place;
  const effect = place === 5 ? 'repeat-post' : place === 13 ? 'repeat-sultan' : place === 16 ? 'repeat-gemstone' : null;
  if (!effect) return null;
  const card = player.bonusHand.find(id => bonusCards.find(card => card.id === id)?.effect === effect);
  if (!card) return null;
  const choiceState: GameSetup = { ...game, phase: 'family-action', pending: { kind: 'family-action', destination: place } };
  return unfinishedDestination(choiceState) ? card : null;
}
