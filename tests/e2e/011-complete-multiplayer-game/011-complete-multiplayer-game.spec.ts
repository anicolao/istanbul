import { expect, test } from '@playwright/test';
import { readState, expectState } from '../helpers/game-journey';
import {
  openTable,
  move,
  end,
  hand,
  roomTile,
  capture
} from '../helpers/table-journey';
test('five merchants complete ordinary turns, final cards, ranking and rematch on the common table', async ({
  page,
  browser
}, info) => {
  test.setTimeout(300_000);
  const t = await openTable(page, browser, info, 11, {
    count: 5,
    seed: 'complete-10956'
  });
  try {
    for (let cycle = 1; cycle <= 14; cycle++) {
      await expectState(page, {
        game: { currentTurn: 'Ada', phase: 'movement' }
      });
      await move(page, cycle % 2 ? 9 : 16);
      if (cycle % 2) {
        const wager = (
          { 1: 7, 3: 12, 5: 11, 7: 12, 9: 10, 11: 9, 13: 12 } as Record<
            number,
            number
          >
        )[cycle];
        await roomTile(page)
          .getByRole('button', { name: String(wager), exact: true })
          .click();
        await roomTile(page)
          .getByRole('button', { name: `Roll for ${wager} Lira` })
          .click();
      }
      await end(page);
      for (let i = 1; i < 5; i++) {
        const actor = t.pages[i];
        await expectState(actor, { game: { currentTurn: t.names[i] } });
        const current = (await readState(actor)).game.players[i].merchantPlace;
        await move(actor, current === 7 ? [0, 2, 3, 4, 6][i] : 7);
        await end(actor);
      }
    }
    await expectState(page, {
      game: {
        phase: 'game-over',
        currentTurn: 'Ada',
        players: [{ rubies: 5 }, {}, {}, {}, {}],
        end: { ordinaryTurnCounts: [14, 14, 14, 14, 14] }
      }
    });
    for (const name of t.names) await expect(page.locator('.roster')).toContainText(name);
    await capture(
      t,
      'Five players finish a full game on the common table',
      async () => {
        await expectState(page, {
          diagnosticCount: 0,
          game: { phase: 'game-over' }
        });
        await expect(
          page.getByRole('heading', { name: 'Ada wins!' })
        ).toBeVisible();
      }
    );
    const completed = (await readState(page)).game;
    await page.reload();
    await expectState(page, { game: completed });
    await t.pages[3].getByRole('button', { name: 'Leave game', exact: true }).click();
    await expectState(t.pages[3], { screen: 'landing' });
    const rematcher = t.pages[4];
    await rematcher.getByLabel('Rematch map').selectOption('random');
    await expect(rematcher.locator('.roster')).not.toContainText('Derya');
    await expect(rematcher.locator('.roster')).toContainText('Bora');
    await rematcher.getByRole('button', { name: 'Play again', exact: true }).click();
    await expectState(page, {
      layout: 'random',
      game: {
        epoch: 2,
        turnNumber: 1,
        phase: 'movement',
        players: [
          { rubies: 0 },
          { rubies: 0 },
          { rubies: 0 },
          { rubies: 0 }
        ]
      }
    });
  } finally {
    await t.close();
  }
});
