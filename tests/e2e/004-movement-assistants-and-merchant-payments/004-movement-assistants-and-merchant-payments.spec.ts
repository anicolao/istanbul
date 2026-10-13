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

test('Merchant tolls and assistants remain explicit', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 4, {});
  try {
    await move(page, 14);
    await expectState(page, {
      game: {
        players: [{ merchantPlace: 14, lira: 0, assistantsCarried: 3 }, {}]
      }
    });
    await end(page);
    await expectState(t.pages[1], { game: { currentTurn: 'Bora' } });
    await move(t.pages[1], 14);
    await expectState(t.pages[1], {
      game: { players: [{ lira: 2 }, { lira: 1, merchantPlace: 14 }] }
    });
    await end(t.pages[1]);
    await expectState(page, { game: { currentTurn: 'Ada' } });
    await move(page, 2);
    await end(page);
    await expectState(t.pages[1], { game: { currentTurn: 'Bora' } });
    const before = await readState(t.pages[1]);
    await t.pages[1].locator('[data-place-id="2"]').click();
    await expect(
      t.pages[1].getByRole('button', { name: 'Move here & lose this turn' })
    ).toBeVisible();
    await expectState(t.pages[1], {
      eventCount: before.eventCount,
      game: before.game
    });
    await t.pages[1]
      .getByRole('button', { name: 'Move here & lose this turn' })
      .click();
    await expectState(page, { game: { currentTurn: 'Ada' } });
    await capture(t, 'Unpayable tolls require acknowledgement', async () =>
      expectState(page, {
        diagnosticCount: 0,
        game: { players: [{}, { merchantPlace: 2, lira: 1 }] }
      })
    );
  } finally {
    await t.close();
  }
});
