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

test('Undo restores automatic arrival as one action', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 19, {});
  try {
    const before = await readState(page);
    await move(page, 3);
    await roomTile(page)
      .getByRole('button', { name: /Undo move/ })
      .click();
    await expectState(page, { game: before.game });
    await move(page, 9);
    await roomTile(page)
      .getByRole('button', { name: 'Roll for 7 Lira' })
      .click();
    await capture(
      t,
      'Undo reverses arrival and goods but stops at a revealed roll',
      async () => {
        await expect(
          roomTile(page).getByRole('button', { name: /Undo/ })
        ).toBeDisabled();
        await expectState(page, {
          diagnosticCount: 0,
          undo: { blockedReason: expect.any(String) }
        });
      }
    );
  } finally {
    await t.close();
  }
});
