import { expect, test } from '@playwright/test';

test('the expanding mat dock preserves board space and opens every player across window shapes', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Runs its own viewport matrix');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const [width, height] of [[393, 852], [852, 393], [1280, 1000], [1920, 1080], [2560, 1080]]) {
    await page.setViewportSize({ width, height });
    for (const players of [2, 5]) {
      await page.goto(`/dev/animations/?scenario=arrival-3&players=${players}&surface=personal-screens&seat=6`);
      await expect(page.locator('.personal .mat')).toHaveCount(players);
      const geometry = await page.locator('.personal').evaluate(surface => {
        const rect = (el: Element) => {
          const { x, y, width, height, right, bottom } = el.getBoundingClientRect();
          return { x, y, width, height, right, bottom };
        };
        return { surface: rect(surface), board: rect(surface.querySelector('.board')!),
          tabs: rect(surface.querySelector('.dock-pull')!), controls: rect(surface.querySelector('.table-controls')!) };
      });
      expect(geometry.surface.width).toBe(width);
      expect(geometry.board.width / geometry.board.height).toBeCloseTo(width <= height ? 9 / 16 : 16 / 9, 2);
      expect(Math.min(geometry.board.x - geometry.surface.x, geometry.board.y - geometry.surface.y, geometry.surface.right - geometry.board.right)).toBeLessThanOrEqual(9);
      expect(geometry.board.bottom).toBeLessThanOrEqual(geometry.tabs.y);
      expect(geometry.controls.x).toBe(4);
      expect(geometry.controls.y).toBe(geometry.surface.y + 4);
      await expect(page.locator('.mat').first()).toBeHidden();
      await expect(page.getByRole('navigation', { name: 'Game controls' }).getByRole('button')).toHaveCount(1);
      await page.getByRole('button', { name: /^Animation lab/ }).click();
      for (let i = 0; i < players; i++) {
        await page.locator('.dock-summaries .summary').nth(i).click();
        const mat = page.locator('.mat').nth(i);
        await expect(mat).toBeVisible();
        await expect.poll(() => mat.evaluate(el => {
          const r = el.getBoundingClientRect();
          return r.left >= 7 && r.right <= innerWidth - 7 && r.top >= 0 && r.bottom <= innerHeight;
        })).toBe(true);
        const box = (await mat.boundingBox())!;
        expect(box.width / box.height).toBeCloseTo(1 / 0.325, 2);
      }
      await page.mouse.move(0, 0);
      await page.keyboard.press('Escape');
      await expect(page.locator('.mat').first()).toBeHidden();
      await page.getByRole('button', { name: /^Animation lab/ }).click();
      await page.getByRole('button', { name: 'Trigger', exact: true }).click();
      await expect(page.locator('.zoom-tile')).toBeVisible();
      await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
      await expect.poll(() => page.locator('.personal').evaluate(surface => {
        const room = surface.querySelector('.zoom-tile')!.getBoundingClientRect();
        const tabs = surface.querySelector('.dock-pull')!.getBoundingClientRect();
        return room.left >= 0 && room.right <= innerWidth && room.top >= 0 && room.bottom <= tabs.top;
      })).toBe(true);
      await page.screenshot({ path: info.outputPath(`zoom-${width}-${height}-${players}.png`) });
    }
  }
});
