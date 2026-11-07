import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('ruby dice tumble in 3D and settle into the recorded result', async ({ page }, info) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  // Freeze the actual timelines at creation, before slow software rendering
  // can consume the roll. Seeking must not race a one-second animation ending.
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      if (this.closest('.dice-motion')) animation.pause();
      return animation;
    };
  });
  await page.goto('/dev/animations/?scenario=action-9&players=4&surface=shared-table&seat=6');
  await expect(page.locator('.zoom-tile')).toBeVisible();
  await page.waitForFunction(() => document.querySelector('.zoom-tile')?.getAnimations().every(a => a.playState !== 'running'));
  await page.getByRole('button', { name: 'Trigger', exact: true }).click({ timeout: 30_000 });
  const canvas = page.locator('.dice-motion canvas');
  await expect(canvas).toBeVisible();
  await page.waitForFunction(() => Boolean(document.querySelector('[data-dice-clock]')?.getAnimations().length));
  const samples: Buffer[] = [];
  for (const progress of [.15, .55, .999]) {
    await page.locator('[data-dice-clock]').evaluate((el, progress) => {
      const animation = el.getAnimations()[0];
      animation.currentTime = Number(animation.effect!.getTiming().duration) * progress;
    }, progress);
    await expect.poll(async () => Number(await canvas.getAttribute('data-progress'))).toBeCloseTo(progress, 2);
    const data = await canvas.evaluate(el => (el as HTMLCanvasElement).toDataURL('image/png'));
    const frame = Buffer.from(data.split(',')[1], 'base64');
    samples.push(frame);
    await writeFile(info.outputPath(`ruby-dice-${progress}.png`), frame);
  }
  expect(samples[0].equals(samples[1])).toBe(false);
  expect(samples[1].equals(samples[2])).toBe(false);
  expect(samples.every(sample => sample.length > 1500)).toBe(true);
  const result = await canvas.getAttribute('data-dice-values');
  await page.locator('.dice-motion').evaluate(el => el.getAnimations({ subtree: true }).forEach(a => {
    a.finish();
  }));
  await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
  await expect(page.locator('.zoom-tile canvas')).toHaveAttribute('data-dice-values', result!);
  expect(errors).toEqual([]);
});
