import { describe, expect, it } from 'vitest';
import { appTitle, shellFeatures } from './app-metadata';

describe('application shell metadata', () => {
  it('provides a stable document title', () => {
    expect(appTitle).toBe('Istanbul — Race through the bazaar');
  });

  it('introduces the complete route from movement to rubies', () => {
    expect(shellFeatures.map(({ title }) => title)).toEqual([
      'Move',
      'Gather',
      'Trade',
      'Race'
    ]);
  });
});
