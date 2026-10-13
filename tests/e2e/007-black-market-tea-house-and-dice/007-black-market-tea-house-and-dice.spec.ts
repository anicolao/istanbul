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

test('Random outcomes still require a deliberate roll', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 7, {});
  try {
    await move(page, 9);
    const before = await readState(page);
    await roomTile(page)
      .getByRole('button', { name: '7', exact: true })
      .click();
    await expectState(page, { eventCount: before.eventCount });
    await roomTile(page)
      .getByRole('button', { name: 'Roll for 7 Lira' })
      .click();
    await expectState(page, {
      game: { lastRoll: { place: 9, declared: 7 } },
      undo: { blockedReason: expect.any(String) }
    });
    await end(page);
    await nextAda(t);
    await travel(t, 8);
    await roomTile(page)
      .getByRole('button', { name: 'Take spice and roll' })
      .click();
    await capture(
      t,
      'Tea House and Black Market rolls reveal results only after a tap',
      async () =>
        expectState(page, {
          diagnosticCount: 0,
          game: { lastRoll: { place: 8 } }
        })
    );
  } finally {
    await t.close();
  }
});
