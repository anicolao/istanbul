import { expect, test } from '@playwright/test';
async function expectHandToFit(page: import('@playwright/test').Page) {
  expect(await page.locator('.hand-panel').evaluate((panel) => {
    const bounds = panel.getBoundingClientRect();
    return Array.from(panel.querySelectorAll('.hand-art, .primary, select')).every((node) => {
      const box = node.getBoundingClientRect();
      return box.left >= bounds.left && box.right <= bounds.right &&
        box.top >= bounds.top && box.bottom <= bounds.bottom;
    });
  })).toBe(true);
}

test('a small hand opens as readable cards with controls on the same view', async ({ page }, info) => {
  await page.goto('/dev/animations/?scenario=hand-review&players=2&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(2);
  await page.getByRole('button', { name: /^Animation lab/ }).click();
  await page.getByRole('button', { name: 'Your Bonus cards', exact: true }).click();
  const panel = page.locator('.hand-panel');
  await expect(panel.locator('.full-hand')).toBeVisible();
  const cards = panel.locator('.hand-art');
  await expect(cards).toHaveCount(2);
  for (const card of await cards.all()) {
    expect((await card.boundingBox())!.width).toBeGreaterThanOrEqual(160);
  }
  await panel.getByRole('button', { name: /Inspect Bonus card:/ }).first().click();
  await expect(panel.locator('.large-card')).toHaveCount(0);
  await expect(panel.locator('.private-decision .primary')).toBeVisible();
  await expectHandToFit(page);
  await page.screenshot({ path: info.outputPath('readable-hand.png') });
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(panel.locator('.full-hand')).toHaveCount(0);
  await expect(panel.locator('.large-card')).toBeVisible();
  await expectHandToFit(page);
  await page.setViewportSize({ width: 1280, height: 1000 });
  await expect(panel.locator('.full-hand')).toHaveCount(1);
  await expect(panel.locator('.large-card')).toHaveCount(0);
  await expect(panel.locator('.private-hand [aria-pressed="true"]')).toBeVisible();
});

test('a crowded hand uses the inspector only when readable cards cannot fit', async ({ page }, info) => {
  await page.goto('/dev/animations/?scenario=action-9&players=2&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(2);
  await page.getByRole('button', { name: /^Animation lab/ }).click();
  await page.getByRole('button', { name: 'Your Bonus cards', exact: true }).click();
  const panel = page.locator('.hand-panel');
  const full = info.project.name === 'desktop';
  await expect(panel.locator('.full-hand')).toHaveCount(full ? 1 : 0);
  await panel.getByRole('button', { name: /Inspect Bonus card:/ }).first().click();
  await expect(panel.locator('.large-card')).toHaveCount(full ? 0 : 1);
  await expectHandToFit(page);
});

test('Tea House outcome is not replayed after visitor interactions', async ({ page }) => {
  await page.goto('/dev/animations/?scenario=tea-house-encounters&players=2&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(2);
  await page.getByRole('button', { name: 'Trigger', exact: true }).click();
  await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
  const tile = page.locator('.zoom-tile:not([inert])');
  await tile.getByRole('button', { name: /Draw.*card/i }).click();
  await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
  await tile.getByRole('button', { name: 'Pay 2 & roll', exact: true }).click();
  await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
  await tile.getByRole('button', { name: 'Smuggler: take spice', exact: true }).click();
  await tile.getByRole('button', { name: 'Smuggler: pay 2 Lira', exact: true }).click();
  await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
  await expect(tile.locator('.content')).toContainText('Smuggler');
  await expect(tile.locator('.content')).not.toContainText('Wagered');
  await expect(tile.locator('.dice')).toHaveCount(0);
});
