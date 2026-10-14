import { expect, test } from '@playwright/test';
import { readState, expectState } from '../helpers/game-journey';
import {
  openTable,
  move,
  end,
  travel,
  nextAda,
  supply,
  hand,
  capture,
  roomTile
} from '../helpers/table-journey';

test('Gameplay uses the production components', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 15, {});
  try {
    await move(page, 3);
    await capture(
      t,
      'The board, mats and room all use the production art',
      async () => {
        await expect(page.locator('[data-component="PlayerMat"]')).toHaveCount(
          2
        );
        await expect(page.locator('[data-place-id]')).toHaveCount(16);
        await expect(roomTile(page).locator('.artwork')).toHaveAttribute('src', /spice/);
        await expect(roomTile(page).locator('.frame')).toHaveAttribute('src', /location-frame/);
      }
    );
  } finally {
    await t.close();
  }
});
