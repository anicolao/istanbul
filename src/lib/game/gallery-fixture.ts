import { bonusCards } from './manifests';
import type { RoomProjection } from './protocol';
import { createSetup } from './setup';

const room: RoomProjection = {
  roomCode: 'ARTVW',
  hostUid: 'gallery-ruby',
  status: 'playing',
  maxPlayers: 5,
  layout: 'number-order',
  mode: 'shared-table',
  seats: [
    { uid: 'gallery-ruby', name: 'Ada', ready: true },
    { uid: 'gallery-saffron', name: 'Bora', ready: true },
    { uid: 'gallery-teal', name: 'Cem', ready: true },
    { uid: 'gallery-indigo', name: 'Derya', ready: true },
    { uid: 'gallery-plum', name: 'Eren', ready: true }
  ]
};

/** A deterministic, deliberately busy projection used to review the real game components. */
export function createGalleryGame() {
  const game = createSetup(room, 'production-component-gallery');
  game.startingSeat = 0;
  game.turnSeat = 0;
  game.postOfficeLower = [true, false, true, false];
  game.largeDemand = ['demand-large-4', ...game.largeDemand.filter((id) => id !== 'demand-large-4')];
  game.smallDemand = ['demand-small-2', ...game.smallDemand.filter((id) => id !== 'demand-small-2')];
  game.bonusDiscard = [game.bonusDrawPile.shift()!];
  game.rubyTracks.sultanIndex = 3;
  game.rubyTracks.gemstonePrice = 18;
  game.governorPlace = 8;
  game.smugglerPlace = 11;

  const cardIds = bonusCards.map(({ id }) => id);
  for (const [index, player] of game.players.entries()) {
    player.merchantPlace = [1, 5, 8, 11, 14][index];
    player.assistantsCarried = Math.max(1, 4 - index);
    player.assistantsByPlace = index === 0 ? { 2: 1, 7: 2 } : index === 1 ? { 5: 1 } : index === 2 ? { 10: 1 } : index === 3 ? { 13: 1 } : { 15: 1 };
    player.familyPlace = [12, 6, 12, 9, 16][index];
    player.goods = {
      fabric: (index + 1) % 5,
      spice: (index + 2) % 5,
      fruit: (index + 3) % 5,
      jewelry: index % 4
    };
    player.capacity = Math.min(5, 2 + index);
    player.extensions = Math.min(3, index);
    player.lira = [7, 12, 18, 24, 31][index];
    player.rubies = index + 1;
    player.mosqueTileIds = [
      [],
      ['mosque-fabric-2'],
      ['mosque-spice-2', 'mosque-fruit-2'],
      ['mosque-fabric-2', 'mosque-spice-2', 'mosque-jewelry-2'],
      ['mosque-fabric-2', 'mosque-spice-2', 'mosque-fruit-2', 'mosque-jewelry-2']
    ][index];
    player.bonusHand = cardIds.slice(index, index + Math.min(4, index + 1));
  }

  return game;
}
