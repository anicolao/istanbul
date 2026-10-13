import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';
import { readState, expectState } from '../helpers/game-journey';

test('personal games use direct table actions, private cards, and a one-second room zoom', async ({
  page,
  browser
}, info) => {
  const steps = new TestStepHelper(page, info);
  steps.setMetadata(
    'One table for every screen',
    'Personal play uses the same illustrated board, mats, room actions and undo as the shared tabletop. Room artwork grows from its board position over one second. Private Bonus cards stay on their owner’s screen.'
  );
  const room = info.project.name === 'phone' ? 'UNIFP' : 'UNIFD';
  const guestContext = await browser.newContext({
    baseURL: String(info.project.use.baseURL),
    viewport: info.project.use.viewport
  });
  const guest = await guestContext.newPage();
  try {
    await page.goto(`/?e2eRoom=${room}&e2eSeed=move-desktop-4`);
    await page.getByLabel('Your merchant name').fill('Ada');
    await page.getByRole('button', { name: /Create private room/ }).click();
    await expectState(page, { screen: 'lobby', roomCode: room });
    await guest.goto(`/?room=${room}`);
    await expectState(guest, { screen: 'join-room' });
    await guest.getByLabel('Your merchant name').fill('Bora');
    await guest.getByRole('button', { name: /Join the room/ }).click();
    await guest.getByRole('button', { name: /I am ready/ }).click();
    await page.getByRole('button', { name: /I am ready/ }).click();
    await page.getByRole('button', { name: /Open the bazaar/ }).click();
    await expectState(page, {
      game: { currentTurn: 'Ada', phase: 'movement' }
    });
    await steps.step('personal-table', {
      description: 'The regular game uses the same board and compact mats',
      verifications: [
        {
          spec: 'A single game surface replaces the old sidebar',
          check: async () => {
            await expect(
              page.locator('.tabletop-surface.personal')
            ).toBeVisible();
            await expect(page.locator('.inspector')).toHaveCount(0);
            await expect(
              page.locator('[data-pile-source=deck]')
            ).not.toHaveAttribute('data-inspect-pile-card');
            await expect(
              page.getByRole('button', {
                name: 'Your Bonus cards',
                exact: true
              })
            ).toBeVisible();
          }
        }
      ]
    });
    const before = await readState(page);
    await page.locator('[data-place-id="3"]').click();
    const durations = await page
      .locator('.zoom-tile:not([inert])')
      .evaluate((el) =>
        el.getAnimations().map((a) => a.effect?.getTiming().duration)
      );
    expect(durations).toContain(1000);
    const shape = await page.locator('.zoom-tile').evaluate((el) => {
      const source = document
        .querySelector('[data-place-id="3"]')!
        .getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        original: source.width / source.height,
        expanded: parseFloat(style.width) / parseFloat(style.height),
        transforms: el
          .getAnimations()
          .flatMap((a) =>
            (a.effect as KeyframeEffect)
              .getKeyframes()
              .map((frame) => String(frame.transform))
          )
      };
    });
    expect(shape.expanded).toBeCloseTo(shape.original, 2);
    expect(
      shape.transforms.every((transform) => !/scale\([^)]*,/.test(transform))
    ).toBe(true);
    expect(
      await page
        .locator('.tabletop-surface')
        .evaluate((el) => getComputedStyle(el).paddingBottom)
    ).toBe('0px');
    await expectState(page, {
      game: { players: [{ merchantPlace: 3, goods: { spice: 2 } }, {}] }
    });
    await steps.step('direct-warehouse', {
      description:
        'One tap moves and fills spice while the warehouse smoothly enlarges',
      verifications: [
        {
          spec: 'The ordinary fill needs no second tap',
          check: async () => {
            await expect(
              page.getByRole('button', { name: 'Fill spice to 2' })
            ).toHaveCount(0);
            await expect(
              page
                .locator('.zoom-tile:not([inert])')
                .getByRole('button', { name: 'End turn', exact: true })
            ).toBeVisible();
          }
        }
      ]
    });
    const undo = page
      .getByRole('navigation', { name: 'Game controls' })
      .getByRole('button', { name: /Undo move/ });
    const undoBounds = await undo.boundingBox();
    expect(undoBounds!.height).toBeGreaterThanOrEqual(44);
    expect(undoBounds!.width).toBeGreaterThanOrEqual(88);
    await undo.click();
    await expectState(page, { game: before.game });
    await page
      .getByRole('button', { name: 'Your Bonus cards', exact: true })
      .click();
    await expect(
      page.getByRole('navigation', { name: 'Private Bonus hand' })
    ).toBeVisible();
    await expect(
      guest.getByRole('navigation', { name: 'Private Bonus hand' })
    ).toHaveCount(0);
    await steps.step('private-hand', {
      description: 'Bonus cards open from the player mat',
      verifications: [
        {
          spec: 'Only the local player’s hand is shown',
          check: async () =>
            expect(
              page
                .getByRole('navigation', { name: 'Private Bonus hand' })
                .getByRole('button')
            ).toHaveCount(before.game.localHand.length)
        }
      ]
    });
    await page
      .locator('.hand-panel')
      .getByRole('button', { name: 'Back to table' })
      .click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('[data-place-id="3"]').click();
    await expectState(page, {
      game: { players: [{ goods: { spice: 2 } }, {}] }
    });
    await page
      .locator('.zoom-tile:not([inert])')
      .getByRole('button', { name: 'End turn', exact: true })
      .click();
    await expectState(guest, {
      game: { currentTurn: 'Bora', phase: 'movement' }
    });
    steps.generateDocs();
  } finally {
    await guestContext.close();
  }
});
