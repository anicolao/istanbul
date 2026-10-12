import type { RoomProjection } from "$lib/game/protocol";
import type { GameSetup } from "$lib/game/setup";
export function tableSeat(
  game: GameSetup,
  room: RoomProjection,
  index: number,
) {
  const position =
    room.seats.find((s) => s.uid === game.players[index].uid)?.tablePosition ??
    index + 1;
  const row = position <= 3 ? [1, 2, 3] : [7, 6, 5];
  const occupied = game.players
    .map(
      (p, i) => room.seats.find((s) => s.uid === p.uid)?.tablePosition ?? i + 1,
    )
    .filter((p) => row.includes(p));
  const xs =
    occupied.length === 3
      ? [27, 50, 73]
      : occupied.length === 2
        ? [36, 64]
        : [50];
  const rank = row.filter((p) => occupied.includes(p)).indexOf(position);
  if (position === 4) return { x: 92, y: 50, angle: -90, width: 26 };
  if (position === 8) return { x: 8, y: 50, angle: 90, width: 26 };
  return {
    x: xs[rank] ?? 50,
    y: position <= 3 ? 8 : 92,
    angle: position <= 3 ? -180 : 0,
    width: occupied.length === 3 ? 22 : 26,
  };
}
