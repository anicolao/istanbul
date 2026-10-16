import { expect, test } from '@playwright/test';

for (const surface of ['personal-screens', 'shared-table']) {
  test(`${surface}: ending an unchosen mosque action requires acknowledgement`, async ({ page }, info) => {
    await page.goto(`/dev/animations/?scenario=action-14&players=5&surface=${surface}`);
    await expect(page.locator('.mat')).toHaveCount(5);
    await page.getByRole('button', { name: /^Animation lab/ }).click();
    const room = page.locator('.zoom-tile:not([inert])');
    const matEnd = page.locator('.mat.active').getByRole('button', { name: 'End turn', exact: true });
    await matEnd.click();
    await expect(room.getByRole('alert')).toContainText("You didn't choose to gain a mosque power. End your turn anyway?");
    await matEnd.click();
    await expect(room.getByRole('alert')).toBeVisible();
    await page.waitForTimeout(1100);
    await page.screenshot({ path: info.outputPath(`mosque-warning-${surface}.png`) });
    await room.getByRole('button', { name: 'Back to table' }).click();
    await expect(room).toHaveCount(0);
    await page.locator('.board [data-place-id="14"]').click();
    await expect(room.getByRole('alert')).toHaveCount(0);
    await room.getByRole('button', { name: 'End turn', exact: true }).click();
    await room.getByRole('button', { name: 'Continue choosing' }).click();
    await room.locator('[data-mosque-power="fabric"]').click();
    await expect(room.getByRole('alert')).toHaveCount(0);
    await room.getByRole('button', { name: 'End turn', exact: true }).click();
    await expect(page.getByText(/Turn 2\. Bora\./)).toBeAttached();
  });
}

test('a player can explicitly skip the Sultan instead of buying a ruby', async ({ page }) => {
  await page.goto('/dev/animations/?scenario=action-13&players=5&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(5);
    await page.getByRole('button', { name: /^Animation lab/ }).click();
  const room = page.locator('.zoom-tile:not([inert])');
  await room.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(room.getByRole('alert')).toContainText("You didn't choose to gain a ruby");
  await room.getByRole('button', { name: 'End turn anyway' }).click();
  await expect(page.getByText(/Turn 2\. Bora\./)).toBeAttached();
});

for (const [place, effect] of [[5, 'post'], [13, 'sultan'], [16, 'gemstone']] as const) {
  test(`repeat card reminder at ${place}`, async ({ page }) => {
    await page.goto(`/dev/animations/?scenario=bonus-repeat-${effect}-1&players=5&surface=personal-screens`);
    await expect(page.locator('.mat')).toHaveCount(5);
    await page.getByRole('button', { name: /^Animation lab/ }).click();
    const room = page.locator('.zoom-tile:not([inert])');
    await room.getByRole('button', { name: 'End turn', exact: true }).click();
    await expect(room.getByRole('alert')).toContainText('with a Bonus card');
    const card = room.locator('.repeat-card');
    await expect(card.locator('[data-component="BonusCard"]')).toBeVisible();
    await card.click();
    await expect(page.locator('.hand-panel')).toBeVisible();
    await expect(page.locator('.hand-panel .large-card')).toBeVisible();
  });
}


test('ending optional gemstone encounters still offers the repeat card', async ({ page }) => {
  await page.goto('/dev/animations/?scenario=action-16&players=5&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(5);
  await page.getByRole('button', { name: 'Trigger', exact: true }).click();
  const room = page.locator('.zoom-tile:not([inert])');
  await expect(room.getByRole('button', { name: 'Smuggler: take spice', exact: true })).toBeVisible();
  await room.getByRole('button', { name: 'End turn', exact: true }).click();
  await expect(room.getByRole('alert')).toContainText('gain another ruby with a Bonus card');
  await room.getByRole('button', { name: 'End turn anyway' }).click();
  await expect(page.getByText(/Turn 2\. Bora\./)).toBeAttached();
});
