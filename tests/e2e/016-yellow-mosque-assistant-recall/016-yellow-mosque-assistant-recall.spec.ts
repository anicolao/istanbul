import { expect, test } from '@playwright/test';
import { readState, expectState, revealPlayerMats } from '../helpers/game-journey';
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

test('Yellow Mosque recalls assistants directly from the board', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 16, {
    review: 'yellow-recall'
  });
  try {
    await page
      .getByRole('button', { name: 'Review Yellow Mosque recall' })
      .click();
    await revealPlayerMats(page);
    await page.getByLabel('Ada Mosque tiles').locator('button:not(.unowned)').click();
    await page.locator('[data-place-id="14"]').click();
    await capture(
      t,
      'Tap the Mosque power, then its assistant’s room',
      async () =>
        expectState(page, {
          diagnosticCount: 0,
          game: {
            players: [
              { assistantsCarried: 4, assistantsByPlace: {}, lira: 4 },
              {}
            ]
          }
        })
    );
  } finally {
    await t.close();
  }
});
