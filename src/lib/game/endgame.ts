import type { GameSetup, SetupPlayer } from './setup';

export function playerStanding(player: SetupPlayer) {
  return {
    uid: player.uid,
    name: player.name,
    rubies: player.rubies,
    lira: player.lira,
    goods: Object.values(player.goods).reduce((sum, count) => sum + count, 0),
    bonusCards: player.bonusHand.length
  };
}

export function comparePlayers(left: SetupPlayer, right: SetupPlayer) {
  const a = playerStanding(left);
  const b = playerStanding(right);
  return b.rubies - a.rubies || b.lira - a.lira || b.goods - a.goods || b.bonusCards - a.bonusCards;
}

export function rankPlayers(players: SetupPlayer[]): GameSetup['end']['rankings'] {
  const ordered = [...players].sort(comparePlayers);
  let rank = 1;
  return ordered.map((player, index) => {
    if (index > 0 && comparePlayers(ordered[index - 1], player) !== 0) rank = index + 1;
    return { ...playerStanding(player), rank };
  });
}

export function markEndTrigger(game: GameSetup) {
  if (game.end.triggeredByUid || game.phase === 'final-bonus' || game.phase === 'game-over') return;
  const trigger = game.players.find((player) => player.rubies >= game.end.target);
  if (!trigger) return;
  game.end.triggeredByUid = trigger.uid;
  game.end.triggeredTurn = game.turnNumber;
}

export function finishFinalBonusSeat(game: GameSetup): boolean {
  if (game.phase !== 'final-bonus' || game.end.finalBonusSeatsCompleted.includes(game.turnSeat)) return false;
  game.end.finalBonusSeatsCompleted.push(game.turnSeat);
  if (game.end.finalBonusSeatsCompleted.length === game.players.length) {
    game.end.rankings = rankPlayers(game.players);
    game.end.winnerUids = game.end.rankings.filter(({ rank }) => rank === 1).map(({ uid }) => uid);
    game.phase = 'game-over';
    return true;
  }
  game.turnSeat = (game.turnSeat + 1) % game.players.length;
  return true;
}
