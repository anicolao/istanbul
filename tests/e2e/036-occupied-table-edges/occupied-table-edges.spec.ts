import { expect, test } from '@playwright/test';

for (const [width, height] of [[1280, 1000], [1920, 1080], [852, 393], [393, 852]]) {
  test(`occupied edges fit the board, mats and expanded room at ${width}×${height}`, async ({ page }, info) => {
    test.skip(!['desktop', 'webkit-desktop'].includes(info.project.name), 'Exercise each viewport once per engine.');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const arrangements = [[1, 2, 3], [5, 6], [1, 4], [4, 8], [1, 6], [1, 3, 4, 6, 8]];
    await page.setViewportSize({ width, height });
    for (const seats of arrangements) {
      await page.goto(`/dev/animations/?scenario=arrival-3&surface=shared-table&players=${seats.length}&seats=${seats.join(',')}`);
      await expect.poll(() => page.locator('.mat').evaluateAll(mats => mats.map(m => Number(m.getAttribute('data-position'))))).toEqual(seats);
      await page.getByRole('button', { name: /^Animation lab/ }).click();
      const fits = () => page.locator('.tabletop-surface').evaluate(surface => {
        const bounds = surface.getBoundingClientRect();
        const table = surface.querySelector('.table')!.getBoundingClientRect();
        const board = surface.querySelector('.board')!.getBoundingClientRect();
        const mats = [...surface.querySelectorAll('.mat')].map(m => m.getBoundingClientRect());
        const zoom = surface.querySelector('.zoom-tile:not([inert])')?.getBoundingClientRect();
        const controls = [...surface.querySelectorAll('.table-controls button')].map(c => c.getBoundingClientRect());
        const inside = (r: DOMRect) => r.left >= bounds.left - 1 && r.top >= bounds.top - 1 && r.right <= bounds.right + 1 && r.bottom <= bounds.bottom + 1;
        const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        return Math.abs(table.width - bounds.width) < 1 && Math.abs(table.height - bounds.height) < 1
          && Math.abs(board.width / board.height - 16 / 9) < 0.01
          && [board, ...controls, ...mats, ...(zoom ? [zoom] : [])].every(inside)
          && controls.every(c => !overlaps(board, c) && mats.every(m => !overlaps(m, c)))
          && mats.every((m, i) => !overlaps(board, m) && (!zoom || !overlaps(zoom, m)) && mats.slice(i + 1).every(other => !overlaps(m, other)));
      });
      await expect.poll(fits).toBe(true);
      if (width === 1280 && ['1,2,3', '1,4'].includes(seats.join(','))) {
        const controls = page.locator('.lab-tools');
        await controls.evaluate(el => (el as HTMLElement).style.visibility = 'hidden');
        await expect(page.locator('.tabletop-surface')).toHaveScreenshot(`edges-${seats.join('-')}-${info.project.name}.png`);
        await controls.evaluate(el => (el as HTMLElement).style.removeProperty('visibility'));
      }
      await page.getByRole('button', { name: 'Trigger', exact: true }).click();
      await expect(page.locator('.zoom-tile:not([inert])')).toBeVisible();
      await expect.poll(fits).toBe(true);
      await page.setViewportSize({ width: height, height: width });
      await expect.poll(fits).toBe(true);
      await page.setViewportSize({ width, height });
      await expect.poll(fits).toBe(true);
    }
  });
}


test('a side-facing room stays inside the table throughout its rotation', async ({ page }, info) => {
  test.skip(!['desktop', 'webkit-desktop'].includes(info.project.name), 'One animation check per engine.');
  await page.setViewportSize({ width: 393, height: 852 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/dev/animations/?scenario=arrival-3&surface=shared-table&players=2&seats=4,8');
  await expect(page.locator('.mat')).toHaveCount(2);
  await page.getByRole('button', { name: 'Trigger', exact: true }).click();
  const zoom = page.locator('.zoom-tile:not([inert])');
  await expect(zoom).toBeVisible();
  const frames = await zoom.evaluate(node => {
    const animation = node.getAnimations().find(a => a.effect?.getTiming().duration === 1000)!;
    if (!animation) throw new Error('Missing room rotation animation');
    animation.pause();
    const bounds = node.closest('.tabletop-surface')!.getBoundingClientRect();
    return Array.from({ length: 21 }, (_, i) => {
      animation.currentTime = i * 50;
      const r = node.getBoundingClientRect();
      return r.left >= bounds.left - 1 && r.top >= bounds.top - 1 && r.right <= bounds.right + 1 && r.bottom <= bounds.bottom + 1;
    });
  });
  expect(frames).toEqual(Array(21).fill(true));
});
