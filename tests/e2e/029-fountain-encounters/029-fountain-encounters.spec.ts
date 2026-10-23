import { expect, test } from '@playwright/test';

test('fountain recall stays on the board, then zooms for visitors and reopens without ending the turn', async ({ page }) => {
  await page.goto('/dev/animations/?scenario=fountain-encounters&players=5&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(5);
  await expect(page.getByRole('button', { name: 'Recall all', exact: true })).toBeVisible();
  await expect(page.locator('.zoom-tile')).toHaveCount(0);
  await page.getByRole('button', { name: 'Trigger', exact: true }).click();
  const room = page.locator('.zoom-tile:not([inert])');
  await expect(room.getByRole('button', { name: 'Smuggler: take spice', exact: true })).toBeVisible();
  await expect(room.getByRole('button', { name: 'Draw a Bonus card from the Governor' })).toBeVisible();
  await room.getByRole('button', { name: 'Back to table' }).click();
  await expect(room).toHaveCount(0);
  await page.locator('.board [data-place-id="7"]').click();
  await room.getByRole('button', { name: 'Smuggler: take spice', exact: true }).click();
  await expect(room.getByRole('button', { name: 'Smuggler: pay 2 Lira', exact: true })).toBeVisible();
  await room.getByRole('button', { name: 'Smuggler: pay 2 Lira', exact: true }).click();
  await expect(room.getByRole('button', { name: 'Smuggler: take spice', exact: true })).toHaveCount(0);
  await room.getByRole('button', { name: 'Roll to move the Smuggler' }).click();
  await expect(room.getByRole('button', { name: 'Draw a Bonus card from the Governor' })).toBeVisible();
});
