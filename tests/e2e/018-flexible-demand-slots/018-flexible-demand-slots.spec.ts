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

test('Flexible market payment changes the goods on the demand', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 18, {
    review: 'flexible-market'
  });
  try {
    await page
      .getByRole('button', { name: 'Review Flexible Demand market sale' })
      .click();
    await move(page, 11);
    await hand(page, /Inspect Bonus card: Flexible demand/);
    await page
      .getByRole('button', { name: 'Enable flexible Small Market demand' })
      .click();
    await roomTile(page)
      .getByRole('button', { name: 'Change payment for demand slot 1' })
      .click();
    await capture(t, 'Change market payment on the actual demand', async () => {
      await expect(
        roomTile(page).getByRole('button', {
          name: 'Change payment for demand slot 1'
        })
      ).toBeVisible();
      await expectState(page, {
        diagnosticCount: 0,
        game: { activeBonusEffects: ['wild-small-market'] }
      });
    });
  } finally {
    await t.close();
  }
});
