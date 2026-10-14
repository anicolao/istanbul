import { expect, test } from '@playwright/test';

test('police destinations fit inside the room across screen shapes and orientations', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Runs its own viewport matrix');
  test.setTimeout(180_000);
  for (const [width, height] of [[393, 852], [852, 393], [820, 1180], [1280, 1000], [1920, 1080], [2560, 1080]]) {
    await page.setViewportSize({ width, height });
    for (const [surface, seat] of [['personal-screens', 6], ['shared-table', 6], ['shared-table', 4]] as const) {
      await page.goto(`/dev/animations/?scenario=arrival-12&players=5&surface=${surface}&seat=${seat}`);
      await expect(page.locator('.mat')).toHaveCount(5);
      await page.getByRole('button', { name: 'Trigger', exact: true }).click();
      const destinations = page.locator('.zoom-tile .destinations');
      await expect(destinations.getByRole('button')).toHaveCount(16);
      await expect(destinations.getByRole('button').first()).toBeEnabled();
      // Allow the room's one-second rotation/zoom to finish before measuring.
      await page.waitForTimeout(1100);
      const geometry = await destinations.evaluate((grid) => {
        const content = grid.closest('.content')!;
        const room = grid.closest('.zoom-tile')!;
        const rect = (el: Element) => {
          const { left, top, right, bottom } = el.getBoundingClientRect();
          return { left, top, right, bottom };
        };
        return {
          content: rect(content), room: rect(room), grid: rect(grid),
          buttons: [...grid.querySelectorAll('button')].map(rect),
          width: grid.clientWidth, height: grid.clientHeight,
          scrollHeight: content.scrollHeight, clientHeight: content.clientHeight
        };
      });
      expect(geometry.width / geometry.height).toBeCloseTo(16 / 9, 1);
      expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.clientHeight + 1);
      for (const bounds of [geometry.content, geometry.room]) {
        for (const button of geometry.buttons) {
          expect(button.left).toBeGreaterThanOrEqual(bounds.left - 1);
          expect(button.top).toBeGreaterThanOrEqual(bounds.top - 1);
          expect(button.right).toBeLessThanOrEqual(bounds.right + 1);
          expect(button.bottom).toBeLessThanOrEqual(bounds.bottom + 1);
        }
      }
      await page.screenshot({ path: info.outputPath(`police-${width}-${height}-${surface}-${seat}.png`) });
      await expect(destinations.getByRole('button', { name: 'Send family to Police Station', exact: true })).toBeDisabled();
      await destinations.getByRole('button', { name: 'Send family to Gemstone Dealer', exact: true }).click();
      await expect(destinations).toHaveCount(0);
    }
  }
});
