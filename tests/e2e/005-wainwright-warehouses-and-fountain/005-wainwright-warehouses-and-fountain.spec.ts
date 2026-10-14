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

test('Upgrades and warehouse fills happen on arrival', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 5, {});
  try {
    await supply(page);
    await move(page, 1);
    await expectState(page, {
      game: { players: [{ capacity: 4, extensions: 2, lira: 28 }, {}] }
    });
    await end(page);
    await nextAda(t);
    await travel(t, 2);
    await expectState(page, {
      game: { players: [{ goods: { fabric: 4 } }, {}] }
    });
    await end(page);
    await nextAda(t);
    await travel(t, 7);
    await page
      .getByRole('button', { name: 'Recall all', exact: true })
      .click();
    await expect(roomTile(page)).toHaveCount(0);
    await expect(page.locator('[data-place-id="7"] [data-piece-kind="assistant"]')).toHaveCount(0);
    await expect(page.locator('[data-place-id="7"] [aria-label="4 assistants carried"]')).toBeVisible();
    await expect(page.locator('[data-place-id="7"]')).toContainText('End turn');
    await capture(
      t,
      'A larger wheelbarrow fills directly and assistants return at the Fountain',
      async () =>
        expectState(page, {
          diagnosticCount: 0,
          game: {
            players: [{ assistantsCarried: 4, assistantsByPlace: {} }, {}]
          }
        })
    );
  } finally {
    await t.close();
  }
});
