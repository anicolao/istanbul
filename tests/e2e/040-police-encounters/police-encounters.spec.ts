import { expect, test } from '@playwright/test';

for (const surface of ['personal-screens', 'shared-table']) {
  test(`Police Station visitors remain available after dispatching family (${surface})`, async ({ page }) => {
    await page.goto(`/dev/animations/?scenario=police-encounters&players=4&surface=${surface}&seat=6`);
    await expect(page.locator('.zoom-tile:not([inert])').getByRole('button', { name: 'Send family to Spice Warehouse' })).toBeVisible();
    await page.getByRole('button', { name: /Animation lab/ }).click();
    await page.locator('.zoom-tile:not([inert])').getByRole('button', { name: 'Send family to Spice Warehouse' }).click();
    const room = page.locator('.zoom-tile:not([inert])');
    const governor = room.getByRole('button', { name: 'Draw a Bonus card from the Governor' });
    await expect(governor).toBeVisible();
    await expect(room.getByRole('button', { name: 'Smuggler: take spice', exact: true })).toBeVisible();
    await governor.click();
    await room.getByRole('button', { name: 'Governor: pay 2 Lira', exact: true }).click();
    await expect(room.getByRole('button', { name: 'Roll to move the Governor' })).toBeVisible();
  });
}
