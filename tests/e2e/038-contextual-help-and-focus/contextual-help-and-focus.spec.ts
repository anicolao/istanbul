import { expect, test } from '@playwright/test';

async function lab(page: import('@playwright/test').Page, scenario: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/dev/animations/?scenario=${scenario}&surface=personal-screens&players=2&seat=6`);
  await page.getByRole('button', { name: /^Animation lab/ }).click();
}

test('help explains live goods without opening a mat or taking an action', async ({ page }, info) => {
  await lab(page, 'arrival-3');
  const summary = page.locator('.summary').first();
  const before = await summary.textContent();
  await page.getByRole('button', { name: 'Turn help on' }).click();
  await summary.locator('[data-summary-anchor="fabric"] img').click();
  const help = page.getByRole('region', { name: 'Component help' });
  await expect(help).toContainText('Ada has');
  await expect(help).toContainText('Fabric Warehouse (location 2)');
  await expect(help).toContainText('7 Lira');
  await expect(page.locator('.mat').first()).toBeHidden();
  await expect(summary).toHaveText(before!);
  await expect(page.locator('.zoom-tile')).toHaveCount(0);
  await expect(help).toHaveCSS('font-size', '16px');
  await expect.poll(() => help.evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.left >= 8 && r.right <= innerWidth - 8 && r.top >= 8 && r.bottom <= innerHeight - 8;
  })).toBe(true);
  await expect(page).toHaveScreenshot(`live-resource-help-${info.project.name}.png`);
  await page.keyboard.press('Escape');
  await expect(help).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Turn help on' })).toBeFocused();
});

test('nested pawn help preserves context and Escape leaves the room open', async ({ page }, info) => {
  await lab(page, 'action-15');
  const room = page.locator('.zoom-tile');
  await page.getByRole('button', { name: 'Turn help on' }).click();
  await room.locator('[data-piece-kind="merchant"] img').first().click();
  const help = page.getByRole('region', { name: 'Component help' });
  await expect(help).toContainText("Ada's merchant is at the Great Mosque (location 15)");
  await expect(help).toContainText('Carries 2 assistants');
  await expect(page).toHaveScreenshot(`pawn-help-${info.project.name}.png`);
  await page.keyboard.press('Escape');
  await expect(help).toHaveCount(0);
  await expect(room).toBeVisible();
});

test('keyboard inspection enters the room and returns to the same board tile', async ({ page }) => {
  await lab(page, 'action-3');
  await page.getByRole('button', { name: 'Back to table' }).click();
  const origin = page.locator('.board [data-place-id="3"]');
  await expect(origin).toBeFocused();
  await origin.press('Enter');
  const back = page.getByRole('button', { name: 'Back to table' });
  await expect(back).toBeFocused();
  await back.press('Escape');
  await expect(page.locator('.zoom-tile')).toHaveCount(0);
  await expect(origin).toBeFocused();
});
