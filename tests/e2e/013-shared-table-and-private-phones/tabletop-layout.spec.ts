import { expect, test } from '@playwright/test';

test('all sixteen room actions fit the real tabletop at each physical edge', async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const seat of [1, 4, 6, 8]) {
    for (let place = 1; place <= 16; place++) {
      await page.goto(`/mockups/tabletop/?place=${place}&seat=${seat}`);
      await expect(page.locator('.zoom-tile:not([inert])')).toBeVisible();
      await expect(page.locator('.zoom-tile:not([inert])')).toHaveAttribute('style', new RegExp(`--facing: ?${seat === 1 ? -180 : seat === 4 ? -90 : seat === 8 ? 90 : 0}deg`));
      await expect(page.locator('.mat')).toHaveCount(5);
      await expect(page.getByRole('dialog')).toHaveCount(0);
      const problems = await page.evaluate(() => {
        const failures: string[] = [];
        for (const selector of ['.board', '.zoom-tile', '.choices', '.room-flow .content']) {
          for (const element of document.querySelectorAll<HTMLElement>(selector)) {
            const box = element.getBoundingClientRect();
            if (box.left < -1 || box.top < -1 || box.right > innerWidth + 1 || box.bottom > innerHeight + 1) failures.push(`${selector} outside viewport`);
            if (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1) failures.push(`${selector} overflows`);
          }
        }
        return failures;
      });
      expect(problems, `Place ${place}, seat ${seat}, ${testInfo.project.name}`).toEqual([]);
    }
  }
  if (testInfo.project.name === 'desktop') {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/mockups/tabletop/?place=12&seat=6');
    await expect(page.locator('.mat')).toHaveCount(5);
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => Array.from(document.querySelectorAll('.mat')).flatMap(mat => {
      const bounds = mat.getBoundingClientRect();
      return Array.from(mat.querySelectorAll('.cargo, .coins, .cards, .rubies')).filter(child => {
        const box = child.getBoundingClientRect();
        return box.left < bounds.left - 1 || box.right > bounds.right + 1 || box.top < bounds.top - 1 || box.bottom > bounds.bottom + 1;
      }).map(child => `${mat.getAttribute('aria-label')}: ${child.className || child.tagName}`);
    }));
    expect(overflow, 'Every mat and card count fits at 1080p, including side seats').toEqual([]);
  }
});
