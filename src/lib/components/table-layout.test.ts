import { describe, expect, it } from 'vitest';
import { matAspect, sharedTableLayout, tableControls } from './table-layout';

const sizes = [[1280, 1000], [1920, 1080], [3840, 2160], [852, 393], [393, 852]];
const arrangements = Array.from({ length: 256 }, (_, mask) =>
  Array.from({ length: 8 }, (_, i) => i + 1).filter(p => mask & (1 << (p - 1)))
).filter(seats => seats.length >= 2 && seats.length <= 5);
type Rect = { x: number; y: number; width: number; height: number };
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.width - 0.01 && a.x + a.width > b.x + 0.01 && a.y < b.y + b.height - 0.01 && a.y + a.height > b.y + 0.01;

describe.each(sizes)('tabletop at %i × %i', (width, height) => {
  it('fits every legal seating arrangement without overlap or distortion', () => {
    for (const positions of arrangements) {
      const layout = sharedTableLayout(positions, width, height);
      const { board, playArea, seats } = layout;
      expect(board.width / board.height).toBeCloseTo(16 / 9);
      const mats = seats.map(seat => {
        const w = seat.width * width / 100;
        const side = Math.abs(seat.angle) === 90;
        const mw = side ? w * matAspect : w, mh = side ? w : w * matAspect;
        return { x: seat.x * width / 100 - mw / 2, y: seat.y * height / 100 - mh / 2, width: mw, height: mh };
      });
      const controls = tableControls(layout, width, height);
      const boxes = [board, ...mats, controls.undo, controls.log];
      for (const [index, rect] of boxes.entries()) {
        expect(rect.width).toBeGreaterThan(0);
        expect(rect.x).toBeGreaterThanOrEqual(0);
        expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(width + 0.01);
        expect(rect.y + rect.height).toBeLessThanOrEqual(height + 0.01);
        for (const other of boxes.slice(index + 1)) expect(overlap(rect, other)).toBe(false);
      }
      for (const mat of mats) expect(overlap(playArea, mat)).toBe(false);
      expect(new Set(seats.map(s => s.width)).size).toBe(1);
      // At least one dimension is fully used by the board or its bordering mats.
      expect(Math.min(playArea.width - board.width, playArea.height - board.height)).toBeLessThan(0.01);
    }
  });
});

it('reclaims empty edges and keeps physical clockwise seating order', () => {
  const one = sharedTableLayout([1, 2, 3], 1920, 1080);
  const adjacent = sharedTableLayout([1, 4], 1920, 1080);
  const opposite = sharedTableLayout([1, 6], 1920, 1080);
  for (const layout of [one, adjacent, opposite]) expect(layout.board.width).toBeGreaterThan(1920 * 0.66);
  expect(one.board.width).toBeGreaterThan(opposite.board.width);
  expect(one.seats.map(s => s.x)).toEqual([...one.seats.map(s => s.x)].sort((a, b) => a - b));
  const bottom = sharedTableLayout([5, 6, 7], 1920, 1080);
  expect(bottom.seats[0].x).toBeGreaterThan(bottom.seats[1].x);
  expect(bottom.seats[1].x).toBeGreaterThan(bottom.seats[2].x);
});
