import { expect, test } from '@playwright/test';

test('external lab controls preserve exact mobile viewports and responsive game layouts', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'One desktop host exercises every embedded device size.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dev/animations/mobile?scenario=action-3&players=4&surface=personal-screens');
  const game = page.frameLocator('iframe');
  await expect(game.locator('.mat')).toHaveCount(4);
  await expect(game.locator('.lab-tools')).toHaveCount(0);

  const sizes = [[393, 852], [320, 700], [852, 393], [820, 1180], [1180, 820]];
  for (const [index, [width, height]] of sizes.entries()) {
    await page.getByLabel('Preview size').selectOption(String(index));
    await expect.poll(() => game.locator('.stage').evaluate(stage => {
      const rect = stage.getBoundingClientRect();
      return [rect.x, rect.y, rect.width, rect.height, innerWidth, innerHeight];
    })).toEqual([0, 0, width, height, width, height]);
    await expect.poll(() => game.locator('.table').evaluate(table => {
      const board = table.querySelector('.board')!.getBoundingClientRect();
      const zoom = table.querySelector('.zoom-tile')!.getBoundingClientRect();
      const mats = Array.from(table.querySelectorAll('.mat'), mat => mat.getBoundingClientRect());
      const fits = (box: DOMRect) => box.left >= -1 && box.top >= -1 && box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1;
      const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
      const tabs = table.querySelector('.dock-pull')!.getBoundingClientRect();
      return [board, zoom, tabs].every(fits) && !overlaps(zoom, tabs);
    })).toBe(true);
    const rows = await game.locator('.mat').evaluateAll(mats => new Set(mats.map(mat => Math.round(mat.getBoundingClientRect().top))).size);
    expect(rows).toBe(1);
    await expect(game.getByRole('button', { name: 'Game log', exact: true })).toBeVisible();
    const log = await game.locator('.table-controls').evaluate(node => {
      const box = node.getBoundingClientRect();
      return [box.left, box.top, box.width];
    });
    expect(log).toEqual([4, 4, 44]);
  }

  await page.getByLabel('Scenario', { exact: true }).selectOption('action-9');
  await expect(page.getByLabel('Scenario', { exact: true })).toHaveValue('action-9');
  await expect.poll(() => game.locator('body').evaluate(() => new URL(location.href).searchParams.get('scenario'))).toBe('action-9');
  await page.getByRole('button', { name: 'Trigger', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Pause', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Resume', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Trigger', exact: true })).toBeVisible();
});
