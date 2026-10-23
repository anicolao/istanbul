import { revealPlayerMats } from '../helpers/game-journey';
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
  const room = `UNI${String.fromCharCode(70 + info.repeatEachIndex)}${info.project.name === 'phone' ? 'P' : 'D'}`;
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
              page.locator('[data-card-pile=deck]')
            ).not.toHaveAttribute('data-inspect-pile-card');
            await expect(
              page.getByRole('button', {
                name: /^Show Ada’s player mat|^Show Ada's player mat/
              })
            ).toBeVisible();
          }
        }
      ]
    });
    const before = await readState(page);
    // Svelte first creates a zero-duration delay animation, then starts the
    // transition on a later frame. Capture creation so slow runners cannot
    // observe only that placeholder or miss the completed transition.
    const roomAnimations = await page.evaluateHandle(() => {
      const captured: {
        duration: EffectTiming['duration'];
        transforms: string[];
      }[] = [];
      const animate = Element.prototype.animate;
      Element.prototype.animate = function (...args) {
        const animation = animate.apply(this, args);
        if (this.matches('.zoom-tile')) {
          const effect = animation.effect as KeyframeEffect;
          captured.push({
            duration: effect.getTiming().duration,
            transforms: effect
              .getKeyframes()
              .map((frame) => String(frame.transform))
          });
        }
        return animation;
      };
      return captured;
    });
    await page.locator('[data-place-id="3"]').click();
    await expect
      .poll(() =>
        roomAnimations.evaluate((animations) =>
          animations.map((animation) => animation.duration)
        )
      )
      .toContain(1000);
    const transforms = await roomAnimations.evaluate((animations) =>
      animations
        .filter((animation) => animation.duration === 1000)
        .flatMap((animation) => animation.transforms)
    );
    expect(transforms.length).toBeGreaterThan(1);
    expect(
      transforms.every((transform) => !/scale\([^)]*,/.test(transform))
    ).toBe(true);
    await roomAnimations.dispose();
    const shape = await page.locator('.zoom-tile').evaluate((el) => {
      const source = getComputedStyle(document.querySelector('[data-place-id="3"]')!);
      const style = getComputedStyle(el);
      return {
        original: parseFloat(source.width) / parseFloat(source.height),
        expanded: parseFloat(style.width) / parseFloat(style.height)
      };
    });
    expect(shape.expanded).toBeCloseTo(shape.original, 2);
    expect(
      await page
        .locator('.tabletop-surface')
        .evaluate((el) => getComputedStyle(el).paddingBottom)
    ).toBe('0px');
    await expectState(page, {
      game: { players: [{ merchantPlace: 3, goods: { spice: 2 } }, {}] }
    });
    await expect(page.locator('.flying-good')).toHaveCount(0);
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
      .locator('.zoom-tile:not([inert])')
      .getByRole('button', { name: /Undo move/ });
    const undoBounds = await undo.boundingBox();
    expect(undoBounds!.height).toBeGreaterThanOrEqual(44);
    expect(undoBounds!.width).toBeGreaterThanOrEqual(info.project.name === 'phone' ? 44 : 88);
    await undo.click();
    await expectState(page, { game: before.game });
    await revealPlayerMats(page);
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
