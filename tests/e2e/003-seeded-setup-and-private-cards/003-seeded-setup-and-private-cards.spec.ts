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

test('Seeded setup keeps hands private', async ({ page, browser }, info) => {
  const t = await openTable(page, browser, info, 3, {});
  try {
    const state = await readState(page);
    expect(state.game.board).toHaveLength(16);
    expect(state.game.localHand).toHaveLength(1);
    await expectState(t.pages[1], {
      game: { board: state.game.board, players: state.game.players }
    });
    await page
      .getByRole('button', { name: 'Your Bonus cards', exact: true })
      .click();
    await capture(t, 'Private cards belong to their owner', async () => {
      await expect(
        page
          .getByRole('navigation', { name: 'Private Bonus hand' })
          .getByRole('button')
      ).toHaveCount(1);
      await expect(
        t.pages[1].getByRole('navigation', { name: 'Private Bonus hand' })
      ).toHaveCount(0);
    });
    await page.reload();
    await expectState(page, { game: state.game });
  } finally {
    await t.close();
  }
});
