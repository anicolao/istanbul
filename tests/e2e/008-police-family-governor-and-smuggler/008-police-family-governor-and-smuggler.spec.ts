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

test('Family dispatch and NPC choices use game pieces', async ({
  page,
  browser
}, info) => {
  const t = await openTable(page, browser, info, 8, {});
  try {
    await supply(page);
    await move(page, 12);
    await roomTile(page)
      .getByRole('button', { name: 'Send family to Spice Warehouse' })
      .click();
    await expectState(page, {
      game: { players: [{ familyPlace: 3, goods: { spice: 3 } }, {}] }
    });
    await end(page);
    await nextAda(t);
    const governor = (await readState(page)).game.governorPlace;
    await travel(t, governor);
    await roomTile(page)
      .getByRole('button', { name: 'Roll for 7 Lira' })
      .click();
    await roomTile(page)
      .getByRole('button', { name: 'Draw a Bonus card from the Governor' })
      .click();
    await t.steps.step('governor-payment', {
      description: 'Pay the Governor with a card from the visible hand',
      verifications: [
        {
          spec: 'The cards themselves are the payment controls',
          check: async () =>
            expect(
              roomTile(page)
                .getByRole('button', { name: /^Discard / })
                .first()
                .locator('[data-component=BonusCard]')
            ).toBeVisible()
        }
      ]
    });
    await roomTile(page)
      .getByRole('button', { name: /^Discard / })
      .first()
      .click();
    await capture(
      t,
      'Family actions resolve in their destination and NPC offers use pieces and cards',
      async () =>
        expectState(page, {
          diagnosticCount: 0,
          game: { players: [{ familyPlace: 3 }, {}] }
        })
    );
  } finally {
    await t.close();
  }
});
