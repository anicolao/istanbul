import { describe, expect, it } from 'vitest';
import { defaultMarketSelection } from './market-selection';

describe('defaultMarketSelection', () => {
  it('selects every depicted good the merchant owns', () => {
    expect(defaultMarketSelection(
      ['jewelry', 'fabric', 'spice', 'fruit', 'fruit'],
      { fabric: 1, spice: 1, fruit: 2, jewelry: 1 }
    )).toEqual([0, 1, 2, 3, 4]);
  });

  it('does not select duplicate slots beyond the merchant inventory', () => {
    expect(defaultMarketSelection(
      ['jewelry', 'jewelry', 'jewelry', 'fabric', 'fruit'],
      { fabric: 1, spice: 3, fruit: 0, jewelry: 2 }
    )).toEqual([0, 1, 3]);
  });

  it('returns no default sale when none of the demand matches', () => {
    expect(defaultMarketSelection(
      ['jewelry', 'jewelry', 'fabric', 'fabric', 'fruit'],
      { fabric: 0, spice: 3, fruit: 0, jewelry: 0 }
    )).toEqual([]);
  });
});
