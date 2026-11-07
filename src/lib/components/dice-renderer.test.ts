import { expect, it } from 'vitest';
import { Vector3 } from 'three';
import { diceOrientation } from './dice-renderer';

it.each([
  [1, [0,1,0]], [2, [1,0,0]], [3, [0,0,1]],
  [4, [0,0,-1]], [5, [-1,0,0]], [6, [0,-1,0]]
] as const)('settles with the %s face on top for either die', (value, normal) => {
  for (const index of [0,1]) {
    const up = new Vector3(...normal).applyQuaternion(diceOrientation(value,index));
    expect(up.x).toBeCloseTo(0); expect(up.y).toBeCloseTo(1); expect(up.z).toBeCloseTo(0);
  }
});
