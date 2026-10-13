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

test('Mosque powers appear on the same player mats', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 9, {});
  try {
    await supply(page);
    await move(page, 14);
    await roomTile(page)
      .getByRole('button', { name: /Hold 2; pay 1 fabric/ })
      .click();
    await expectState(page, {
      game: { players: [{ mosqueTileIds: ['mosque-fabric-2'] }, {}] }
    });
    await end(page);
    await nextAda(t);
    await travel(t, 9);
    await roomTile(page)
      .getByRole('button', { name: 'Roll for 7 Lira' })
      .click();
    await roomTile(page)
      .getByRole('button', { name: 'Turn die 1 to 4' })
      .click();
    await capture(
      t,
      'An acquired Mosque tile offers its dice control in the room',
      async () => {
        await expect(
          page.getByLabel('Ada Mosque tiles').getByRole('button')
        ).toHaveCount(1);
        await expectState(page, { diagnosticCount: 0 });
      }
    );
  } finally {
    await t.close();
  }
});
