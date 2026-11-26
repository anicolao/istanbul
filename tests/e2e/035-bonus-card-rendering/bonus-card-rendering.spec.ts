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

test('every Bonus card keeps its enlarged rules inside the print area when scaled', async ({ page }) => {
  await page.goto('/dev/cards/');
  const copies = page.locator('[data-card-effect] .card-copy');
  await expect(copies).toHaveCount(10);
  await page.evaluate(() => document.fonts.ready);
  const measurements = () => copies.evaluateAll(nodes => nodes.map(node => {
    const rules = node.querySelector('p')!;
    return {
      size: parseFloat(getComputedStyle(node).fontSize),
      overflow: node.scrollHeight > node.clientHeight || node.scrollWidth > node.clientWidth,
      text: rules.textContent,
      linesHeight: rules.clientHeight
    };
  }));
  await expect.poll(async () => (await measurements()).every(copy => !copy.overflow && copy.size >= 18)).toBe(true);
  const fullSize = await measurements();
  await page.locator('[data-card-effect]').evaluateAll(cards => {
    for (const card of cards) (card as HTMLElement).style.width = '48px';
  });
  // The entire printed card shrinks; neither font selection nor line breaks change.
  await expect.poll(measurements).toEqual(fullSize);
  await page.setViewportSize({ width: 393, height: 852 });
  await expect.poll(measurements).toEqual(fullSize);
});
