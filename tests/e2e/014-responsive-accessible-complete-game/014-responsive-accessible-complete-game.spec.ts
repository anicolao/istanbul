import { expect, test } from '@playwright/test';
import { readState, expectState } from '../helpers/game-journey';
import {
  openTable,
  move,
  end,
  travel,
  nextAda,
  supply,
  hand,
  capture,
  roomTile
} from '../helpers/table-journey';

test('The common table supports keyboard, touch and reduced motion', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 14, {});
  try {
    // The real game shell must not reserve space for its hidden header,
    // including after rotating a phone (the animation lab has no shell).
    await expect.poll(() => page.locator('main.tabletop-game').evaluate(el => {
      const style = getComputedStyle(el);
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    })).toEqual(['0px', '0px', '0px', '0px']);
    await expect(page.locator('.marquee-track .marching').first()).toHaveCSS('animation-name', 'none');
    const target = page.locator('[data-place-id="3"]');
    await page.locator('[data-place-id="7"]').focus();
    await page.locator('[data-place-id="7"]').press('ArrowRight');
    await expect(target).toBeFocused();
    await target.press('Enter');
    await expectState(page, {
      game: { players: [{ goods: { spice: 2 } }, {}] }
    });
    await expect(page.getByTestId('turn-announcement')).toContainText(
      'Your action.'
    );
    await capture(
      t,
      'Keyboard arrival fills the warehouse without a sidebar',
      async () => {
        await expect(roomTile(page)).toBeVisible();
        expect(
          await roomTile(page).evaluate((el) => el.getAnimations().length)
        ).toBe(0);
        await expect(page.getByRole('button', { name: /^Show Ada's player mat/ })).toBeVisible();
      }
    );
  } finally {
    await t.close();
  }
});
