import type { GameSetup, SetupPlayer } from './setup';

export type AssistantAction = 'drop' | 'pick-up' | 'fountain' | 'stay';

export function gridDistance(board: number[], fromPlace: number, toPlace: number): number {
  const from = board.indexOf(fromPlace);
  const to = board.indexOf(toPlace);
  if (from < 0 || to < 0) return Number.POSITIVE_INFINITY;
  return Math.abs(Math.floor(from / 4) - Math.floor(to / 4)) + Math.abs(from % 4 - to % 4);
}

export function requiredAssistantAction(player: SetupPlayer, destination: number): AssistantAction | null {
  if (destination === 7) return 'fountain';
  if ((player.assistantsByPlace[destination] ?? 0) > 0) return 'pick-up';
  return player.assistantsCarried > 0 ? 'drop' : null;
}

export function legalDestinations(game: GameSetup, player: SetupPlayer): number[] {
  return game.board.filter((destination) => {
    const distance = gridDistance(game.board, player.merchantPlace, destination);
    const longMove = game.activeBonusEffects.includes('long-move');
    return distance >= (longMove ? 3 : 1) && distance <= (longMove ? 4 : 2) && requiredAssistantAction(player, destination) !== null;
  });
}
