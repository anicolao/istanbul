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

test('Zero-distance Bonus moves pick up and fill directly', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 17, { review: 'zero-move' });
  try {
    await page
      .getByRole('button', { name: 'Review zero-distance Bonus move' })
      .click();
    await hand(page, /Inspect Bonus card: Work where you stand/);
    await page
      .getByRole('button', { name: 'Stay and pick up assistant' })
      .click();
    await capture(
      t,
      'Staying performs the normal assistant action and warehouse fill',
      async () =>
        expectState(page, {
          diagnosticCount: 0,
          game: {
            players: [
              {
                merchantPlace: 4,
                assistantsCarried: 4,
                assistantsByPlace: {},
                goods: { fruit: 2 }
              },
              {}
            ]
          }
        })
    );
  } finally {
    await t.close();
  }
});
