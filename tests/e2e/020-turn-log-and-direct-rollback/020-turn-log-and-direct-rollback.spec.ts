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

test('Game log rolls back reversible turn actions', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 20, {});
  try {
    const before = await readState(page);
    await move(page, 3);
    await page.getByRole('button', { name: 'Game log', exact: true }).click();
    await page
      .getByRole('button', { name: 'Undo to here', exact: true })
      .click();
    await capture(
      t,
      'Roll back a direct arrival from its game-log entry',
      async () =>
        expectState(page, { game: before.game, undoLog: [{ actionCount: 1 }] })
    );
  } finally {
    await t.close();
  }
});
