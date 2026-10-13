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

test('Mail, private draws, and markets share room controls', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 6, {});
  try {
    await supply(page);
    await travel(t, 5);
    expect((await readState(page)).game.lastAction.kind).toBe(
      'post-office-collect'
    );
    await end(page);
    await nextAda(t);
    await travel(t, 6);
    const count = (await readState(page)).game.localHand.length;
    await roomTile(page)
      .getByRole('button', { name: 'Draw two cards', exact: true })
      .click();
    await expect
      .poll(async () => (await readState(page)).game.localHand.length)
      .toBe(count + 2);
    const choices = roomTile(page).getByRole('navigation', { name: 'Cards to discard' });
    await choices.getByRole('button', { name: 'Next cards' }).click();
    await expect(choices).toContainText('2 /');
    await choices.getByRole('button', { name: 'Previous cards' }).click();
    await expect(choices).toContainText('1 /');
    await t.steps.step('choose-discard', {
      description: 'Choose the actual card to discard inside the Caravansary',
      verifications: [
        {
          spec: 'Drawn cards are visible in the room',
          check: async () =>
            expect(
              roomTile(page).getByRole('button', { name: /^Discard / })
            ).toHaveCount(Math.min(4, count + 2))
        }
      ]
    });
    await roomTile(page)
      .getByRole('button', { name: /^Discard / })
      .first()
      .click();
    await expect
      .poll(async () => (await readState(page)).game.localHand.length)
      .toBe(count + 1);
    await end(page);
    await nextAda(t);
    await travel(t, 11);
    const before = await readState(page);
    await roomTile(page)
      .getByRole('button', { name: /^Sell .* Lira/ })
      .click();
    await expect
      .poll(async () => (await readState(page)).game.players[0].lira)
      .toBeGreaterThan(before.game.players[0].lira);
    await capture(
      t,
      'Draw and discard actual cards inside the room, then sell prepared goods',
      async () =>
        expectState(page, {
          diagnosticCount: 0,
          game: { lastAction: { kind: 'market-sell' } }
        })
    );
  } finally {
    await t.close();
  }
});
