import { expect, test } from '@playwright/test';

test('web trays stay below a proportionally fitted board across window shapes', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Runs its own viewport matrix');
  for (const [width, height] of [[393, 852], [852, 393], [1280, 1000], [1920, 1080], [2560, 1080]]) {
    await page.setViewportSize({ width, height });
    for (const players of [2, 5]) {
      await page.goto(`/dev/animations/?scenario=arrival-3&players=${players}&surface=personal-screens&seat=6`);
      await expect(page.locator('.personal .mat')).toHaveCount(players);
      const geometry = await page.locator('.personal').evaluate((surface) => {
        const rect = (el: Element) => {
          const { x, y, width, height, right, bottom } = el.getBoundingClientRect();
          return { x, y, width, height, right, bottom };
        };
        return {
          surface: rect(surface),
          board: rect(surface.querySelector('.board')!),
          mats: [...surface.querySelectorAll('.mat')].map(rect),
          controls: rect(surface.querySelector('.table-controls')!)
        };
      });
      expect(geometry.surface.width).toBe(width);
      expect(geometry.surface.height).toBe(height);
      expect(geometry.board.width / geometry.board.height).toBeCloseTo(16 / 9, 2);
      expect(Math.min(geometry.board.x, geometry.board.y)).toBeLessThanOrEqual(9);
      expect(geometry.board.bottom).toBeLessThan(Math.min(...geometry.mats.map((m) => m.y)));
      expect(geometry.controls.right).toBeGreaterThan(width - 10);
      expect(geometry.controls.bottom).toBeGreaterThan(height - 10);
      await expect(page.getByRole('navigation', { name: 'Game controls' }).getByRole('button')).toHaveCount(1);
      for (const mat of geometry.mats) {
        expect(mat.right <= geometry.controls.x || mat.bottom <= geometry.controls.y).toBe(true);
        expect(mat.x).toBeGreaterThanOrEqual(7);
        expect(mat.right).toBeLessThanOrEqual(width - 7);
        expect(mat.bottom).toBeLessThanOrEqual(height - 7);
        expect(mat.width / mat.height).toBeCloseTo(1 / 0.325, 2);
      }
      await page.getByRole('button', { name: 'Trigger', exact: true }).click();
      await expect(page.locator('.zoom-tile')).toBeVisible();
      const overlaps = await page.locator('.personal').evaluate(async (surface) => {
        let overlap = false;
        const until = performance.now() + 1200;
        while (performance.now() < until) {
          const room = surface.querySelector('.zoom-tile')?.getBoundingClientRect();
          const trayTop = Math.min(...[...surface.querySelectorAll('.mat')].map((mat) => mat.getBoundingClientRect().top));
          if (room && room.bottom > trayTop - 3) overlap = true;
          await new Promise(requestAnimationFrame);
        }
        return overlap;
      });
      expect(overlaps).toBe(false);
      await page.screenshot({ path: info.outputPath(`zoom-${width}-${height}-${players}.png`) });
      for (let i = 0; i < geometry.mats.length; i++) {
        for (const other of geometry.mats.slice(i + 1)) {
          const mat = geometry.mats[i];
          expect(mat.right <= other.x || other.right <= mat.x || mat.bottom <= other.y || other.bottom <= mat.y).toBe(true);
        }
      }
    }
  }
});
