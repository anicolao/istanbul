import { revealPlayerMats } from '../helpers/game-journey';
import { expect, test } from '@playwright/test';

test('Assistant Returns chooses an occupied location directly on the map', async ({ page }, info) => {
  await page.goto('/dev/animations/?scenario=bonus-return-assistant-1&players=2&surface=personal-screens');
  await expect(page.locator('.mat')).toHaveCount(2);
  await page.getByRole('button', { name: /^Animation lab/ }).click();
  await revealPlayerMats(page);
  await page.getByRole('button', { name: 'Your Bonus cards', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect Bonus card: An assistant returns', exact: true }).click();
  const map = page.getByRole('group', { name: 'Choose an assistant to return' });
  await expect(map).toBeVisible();
  await expect(page.locator('.hand-panel select')).toHaveCount(0);
  await expect(map.locator('button')).toHaveCount(16);
  await expect(map.locator('button:enabled')).toHaveCount(2);
  await expect(map.locator('[data-recall-place="1"]')).toBeDisabled();
  expect(await map.locator('button').evaluateAll((nodes) => nodes.map((node) => Number((node as HTMLElement).dataset.recallPlace)))).toEqual(
    await page.locator('.board [data-place-id]').evaluateAll((nodes) => nodes.map((node) => Number((node as HTMLElement).dataset.placeId)))
  );
  const bounds = await map.boundingBox();
  const panel = await page.locator('.hand-panel').boundingBox();
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(panel!.y + panel!.height);
  await page.screenshot({ path: info.outputPath('assistant-map.png') });
  await map.getByRole('button', { name: 'Return assistant from Fruit Warehouse (1 available)', exact: true }).click();
  await expect(page.locator('.hand-panel')).toHaveCount(0);
  await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
  await expect(page.locator('.board [data-place-id="4"] [data-piece-kind="assistant"]')).toHaveCount(0);
  await expect(page.locator('.board [data-place-id="2"] [data-piece-kind="assistant"]')).toHaveCount(1);
});
