import type { Good } from './manifests';

export type GoodsInventory = Readonly<Record<Good, number>>;

/** Select every demand slot the merchant can satisfy, in printed order. */
export function defaultMarketSelection(demand: readonly Good[], inventory: GoodsInventory): number[] {
  const remaining = { ...inventory };
  const selected: number[] = [];

  for (const [index, good] of demand.entries()) {
    if (remaining[good] < 1) continue;
    remaining[good] -= 1;
    selected.push(index);
  }

  return selected;
}
