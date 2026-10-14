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

test('Ruby purchases and Bonus cards use direct components', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 10, {});
  try {
    await supply(page);
    await hand(page, /Inspect Bonus card: A profitable bargain/);
    await page.getByRole('button', { name: 'Play to gain 5 Lira' }).click();
    await expectState(page, { game: { players: [{ lira: 40 }, {}] } });
    await travel(t, 16);
    await expectState(page, { game: { players: [{ rubies: 1 }, {}] } });
    await end(page);
    await nextAda(t);
    await travel(t, 13);
    await roomTile(page)
      .getByRole('button', { name: 'Deliver goods for one ruby', exact: true })
      .click();
    await capture(
      t,
      'Ruby routes and private Bonus cards work on the common table',
      async () =>
        expectState(page, {
          diagnosticCount: 0,
          game: { players: [{ rubies: 2 }, {}] }
        })
    );
  } finally {
    await t.close();
  }
});
