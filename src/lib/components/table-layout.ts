import type { RoomProjection } from '$lib/game/protocol';
import type { GameSetup } from '$lib/game/setup';

export const matAspect = 0.325;
const boardAspect = 16 / 9;
type Rect = { x: number; y: number; width: number; height: number };
export type TableSeat = { x: number; y: number; angle: number; width: number; order?: number };
export type SharedTableLayout = { board: Rect; playArea: Rect; seats: TableSeat[] };

export function occupiedPositions(game: GameSetup, room: RoomProjection) {
  return game.players.map((player, index) =>
    room.seats.find(seat => seat.uid === player.uid)?.tablePosition ?? index + 1
  );
}
export function tableAngle(position: number) {
  return position <= 3 ? -180 : position === 4 ? -90 : position === 8 ? 90 : 0;
}

/** Fit a rectangular board and equally sized mats, reserving only occupied edges. */
export function sharedTableLayout(positions: number[], width: number, height: number): SharedTableLayout {
  width = Math.max(1, width);
  height = Math.max(1, height);
  const gap = Math.min(8, width * 0.006, height * 0.006);
  const top = [1, 2, 3].filter(p => positions.includes(p));
  const bottom = [7, 6, 5].filter(p => positions.includes(p));
  const left = Number(positions.includes(8));
  const right = Number(positions.includes(4));
  const rows = Number(top.length > 0) + Number(bottom.length > 0);
  const columns = left + right;
  const rowCount = Math.max(top.length, bottom.length);
  const innerWidth = width - 2 * gap;
  const innerHeight = height - 2 * gap;
  // Preserve the established mat-to-board balance, including three seats on
  // an edge. Then spend any surplus room on larger mats without shrinking the board.
  const matScale = Math.min(0.4, 0.96 / Math.max(1, rowCount));
  const fits = (board: number, mat: number) =>
    Math.max(board, rowCount * mat + Math.max(0, rowCount - 1) * gap) + columns * (mat * matAspect + gap) <= innerWidth &&
    Math.max(board / boardAspect, columns ? mat : 0) + rows * (mat * matAspect + gap) <= innerHeight;
  function largest(upper: number, allowed: (value: number) => boolean) {
    let lower = 0;
    for (let i = 0; i < 48; i++) {
      const middle = (lower + upper) / 2;
      if (allowed(middle)) lower = middle;
      else upper = middle;
    }
    return lower;
  }
  const boardWidth = largest(Math.min(innerWidth, innerHeight * boardAspect), b => fits(b, b * matScale));
  const maxMatWidth = largest(Math.max(innerWidth, innerHeight), m => fits(boardWidth, m));
  function assemble(matWidth: number): SharedTableLayout {
    const depth = matWidth * matAspect;
    const playArea = {
      x: gap + left * (depth + gap),
      y: gap + Number(top.length > 0) * (depth + gap),
      width: innerWidth - columns * (depth + gap),
      height: innerHeight - rows * (depth + gap)
    };
    const board = {
      x: playArea.x + (playArea.width - boardWidth) / 2,
      y: playArea.y + (playArea.height - boardWidth / boardAspect) / 2,
      width: boardWidth,
      height: boardWidth / boardAspect
    };
    const seats = positions.map(position => {
      const row = position <= 3 ? top : bottom;
      const x = position === 8 ? gap + depth / 2 : position === 4 ? width - gap - depth / 2
        : playArea.x + playArea.width * (row.indexOf(position) + 0.5) / row.length;
      const y = position === 4 || position === 8 ? playArea.y + playArea.height / 2
        : position <= 3 ? gap + depth / 2 : height - gap - depth / 2;
      return { x: 100 * x / width, y: 100 * y / height, angle: tableAngle(position), width: 100 * matWidth / width };
    });
    return { board, playArea, seats };
  }
  const full = assemble(maxMatWidth);
  if (placeControls(full, width, height)) return full;
  // In a width-limited window, spend slightly less surplus on the mats when
  // necessary to leave room for the two controls. The board stays at full size.
  return assemble(largest(maxMatWidth, m => Boolean(placeControls(assemble(m), width, height))));
}

export function tableSeat(game: GameSetup, room: RoomProjection, index: number, viewerUid: string, layout: SharedTableLayout): TableSeat {
  if (room.mode !== 'personal-screens') return layout.seats[index];
  const local = Math.max(0, game.players.findIndex(p => p.uid === viewerUid));
  const relative = (index - local + game.players.length) % game.players.length;
  const count = game.players.length;
  return { x: (100 * (relative + 0.5)) / count, y: 100, angle: 0, width: 90 / count, order: relative };
}

/** Use spare corners for controls rather than reserving a permanent strip. */
function placeControls(layout: SharedTableLayout, width: number, height: number): { log: Rect; undo: Rect } | undefined {
  const gap = Math.min(8, width * 0.006, height * 0.006);
  const pieces = [layout.board, ...layout.seats.map(seat => {
    const w = seat.width * width / 100;
    const sideways = Math.abs(seat.angle) === 90;
    const mw = sideways ? w * matAspect : w, mh = sideways ? w : w * matAspect;
    return { x: seat.x * width / 100 - mw / 2, y: seat.y * height / 100 - mh / 2, width: mw, height: mh };
  })];
  const placed: Rect[] = [];
  for (let i = 0; i < 2; i++) {
    const xs = [width - 44 - gap, gap, ...pieces.flatMap(p => [p.x - 44 - gap, p.x + p.width + gap])];
    const ys = [height - 44 - gap, gap, ...pieces.flatMap(p => [p.y - 44 - gap, p.y + p.height + gap])];
    const spot = ys.flatMap(y => xs.map(x => ({ x, y, width: 44, height: 44 }))).find(c =>
      c.x >= 0 && c.y >= 0 && c.x + 44 <= width && c.y + 44 <= height &&
      pieces.every(p => c.x + 44 <= p.x || c.x >= p.x + p.width || c.y + 44 <= p.y || c.y >= p.y + p.height)
    );
    if (!spot) return;
    placed.push(spot);
    pieces.push(spot);
  }
  return { log: placed[0], undo: placed[1] };
}
export function tableControls(layout: SharedTableLayout, width: number, height: number) {
  // The first render has no measured viewport yet.
  return placeControls(layout, width, height) ?? {
    log: { x: 0, y: 0, width: 44, height: 44 },
    undo: { x: 48, y: 0, width: 44, height: 44 }
  };
}
