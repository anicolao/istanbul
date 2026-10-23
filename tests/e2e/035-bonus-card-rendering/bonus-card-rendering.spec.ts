import { revealPlayerMats } from '../helpers/game-journey';
import { expect, test } from '@playwright/test';

test('card fronts and backs paint completely at room, discard, and hand sizes', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dev/animations/?scenario=action-6&players=4&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(4);
  await page.getByRole('button', { name: /^Animation lab/ }).click();
  const room = page.locator('.zoom-tile');
  const piles = room.locator('.piles');
  await expect(piles.getByRole('button', { name: 'Draw from face-up pile', exact: true })).toBeEnabled();
  await page.evaluate(() => document.fonts.ready);
  // Bounds alone miss WebKit's foreignObject painting bug: the reported
  // rectangles fit even when the artwork paints at its unscaled 200px size.
  await expect(piles).toHaveScreenshot(`caravansary-piles-${info.project.name}.png`);
  await piles.getByRole('button', { name: 'Draw from face-up pile', exact: true }).click();
  await expect(piles.getByRole('button', { name: 'Return selected card' })).toBeVisible();
  await expect(piles.getByRole('button', { name: 'Return selected card' })).toHaveScreenshot(`selected-card-${info.project.name}.png`);
  await piles.getByRole('button', { name: 'Draw from face-down pile', exact: true }).click();
  const discards = room.locator('.card-choices .cards');
  await expect(discards.getByRole('button').first()).toBeEnabled();
  await expect(discards).toHaveScreenshot(`discard-cards-${info.project.name}.png`);

  await page.goto('/dev/animations/?scenario=hand-review&players=2&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(2);
  await page.getByRole('button', { name: /^Animation lab/ }).click();
  await revealPlayerMats(page);
  await page.getByRole('button', { name: 'Your Bonus cards', exact: true }).click();
  const cards = page.locator('.hand-panel .hand-art');
  await expect(cards).toHaveCount(2);
  await expect(cards.first()).toHaveScreenshot(`hand-card-${info.project.name}.png`);
  await page.getByRole('button', { name: /Inspect Bonus card:/ }).first().click();
  const print = cards.first().locator('.printed-card');
  const printLayout = await print.evaluate(el => [el.clientWidth, el.clientHeight]);
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(page.locator('.large-card')).toBeVisible();
  await expect(page.locator('.large-card')).toHaveScreenshot(`inspected-card-${info.project.name}.png`);
  // Resizing scales a fixed print layout instead of reflowing the rules text.
  expect(await print.evaluate(el => [el.clientWidth, el.clientHeight])).toEqual(printLayout);
});
