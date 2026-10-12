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
  const positions = game.players.map(
    (p, i) => room.seats.find((s) => s.uid === p.uid)?.tablePosition ?? i + 1,
  );
  const occupied = positions.filter((p) => row.includes(p));
  const width =
    positions.filter((p) => p <= 3).length === 3 ||
    positions.filter((p) => [5, 6, 7].includes(p)).length === 3
      ? 22
      : 26;
  const xs =
    occupied.length === 3
      ? [27, 50, 73]
      : occupied.length === 2
        ? [36, 64]
        : [50];
  const rank = row.filter((p) => occupied.includes(p)).indexOf(position);
  if (position === 4) return { x: 92, y: 50, angle: -90, width };
  if (position === 8) return { x: 8, y: 50, angle: 90, width };
  return {
    x: xs[rank] ?? 50,
    y: position <= 3 ? 8 : 92,
    angle: position <= 3 ? -180 : 0,
    width,
  };
}
