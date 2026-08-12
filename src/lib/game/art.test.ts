import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { bonusCardArt, componentArt, locationArt, pieceArt, playerColorNames, playerMatArt } from './art';

function flattenAssets(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (!value || typeof value !== 'object') return [];
  return Object.values(value).flatMap(flattenAssets);
}

describe('production art manifest', () => {
  const assets = flattenAssets({ locationArt, pieceArt, bonusCardArt, playerMatArt, componentArt });

  it('maps every Place, player colour, card effect, and physical component', () => {
    expect(Object.keys(locationArt)).toHaveLength(16);
    expect(Object.keys(pieceArt.merchant)).toEqual(playerColorNames);
    expect(Object.keys(pieceArt.assistant)).toEqual(playerColorNames);
    expect(Object.keys(pieceArt.family)).toEqual(playerColorNames);
    expect(Object.keys(playerMatArt)).toEqual(playerColorNames);
    expect(Object.keys(bonusCardArt)).toHaveLength(12);
    expect(new Set(assets).size).toBe(assets.length);
  });

  it.each(assets)('ships %s in the static production bundle', (asset) => {
    expect(existsSync(resolve(process.cwd(), 'static', asset))).toBe(true);
  });
});
