import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';
import { expectState, readState } from '../helpers/game-journey';

test('a solo host adds an easy bot and its turn survives reload', async ({
  page
}, testInfo) => {
  const steps = new TestStepHelper(page, testInfo);
  steps.setMetadata(
    'Play against an easy bot',
    'A solo host adds and removes a bot in the ordinary lobby, starts a game, and reloads during its opening turn. The bot resumes automatically and hands control back to the human. The companion test verifies a shared tabletop with a private phone and two host tabs.'
  );
  const roomCode = testInfo.project.name === 'phone' ? 'BOTPA' : 'BOTDA';
  await page.goto(`/?e2eRoom=${roomCode}&e2eSeed=bot-2`);
  await page.getByLabel('Your merchant name').fill('Ada');
  await page.getByRole('button', { name: /Create private room/ }).click();
  await page.getByRole('button', { name: 'Add bot', exact: true }).click();
  await expectState(page, {
    seatCount: 2,
    ready: [false, true],
    diagnosticCount: 0
  });
  await steps.step('bot-ready-in-lobby', {
    description: 'The bot joins ready to play',
    verifications: [
      {
        spec: 'The easy bot is named and can be removed before starting',
        check: async () => {
          await expect(
            page.getByText('Bot · easy', { exact: true })
          ).toBeVisible();
          await expect(
            page.getByRole('button', { name: 'Remove Bot 1' })
          ).toBeEnabled();
        }
      },
      {
        spec: 'The host is told to keep the page open for automatic bot turns',
        check: async () =>
          expect(
            page.getByText(
              'Bots play automatically while the room creator keeps this page open.'
            )
          ).toBeVisible()
      }
    ]
  });
  await page.getByRole('button', { name: 'Remove Bot 1' }).click();
  await expectState(page, { seatCount: 1 });
  await page.getByRole('button', { name: 'Add bot', exact: true }).click();
  await page.getByRole('button', { name: /I am ready/ }).click();
  await page.getByRole('button', { name: /Open the bazaar/ }).click();
  await expectState(page, { game: { currentTurn: 'Bot 1', turnNumber: 1 } });
  await page.reload();
  await expectState(page, {
    diagnosticCount: 0,
    game: { currentTurn: 'Ada', turnNumber: 2, phase: 'movement' }
  });
  const before = await readState(page);
  expect(before.game.players[1].merchantPlace).not.toBe(7);
  expect(
    before.gameLog.some(
      (entry: { ownerUid: string }) => entry.ownerUid === before.bots[0]
    )
  ).toBe(true);
  await page.reload();
  await steps.step('bot-finished-after-reload', {
    description: 'After reload, the bot finishes its turn and Ada can play',
    verifications: [
      {
        spec: 'The bot made a legal move and the same history survives another reload',
        check: async () =>
          expectState(page, {
            eventCount: before.eventCount,
            diagnosticCount: 0,
            game: { currentTurn: 'Ada', turnNumber: 2, phase: 'movement' }
          })
      },
      {
        spec: 'The human has the normal sixteen-room board',
        check: async () =>
          expect(
            page.getByTestId('bazaar-board').getByRole('button')
          ).toHaveCount(16)
      }
    ]
  });
  steps.generateDocs();
});

test('a shared tabletop plays a human and bot game with two host tabs', async ({
  page,
  browser,
  context
}, testInfo) => {
  await page.addInitScript(() => {
    const animate = Element.prototype.animate;
    const flights: string[] = [];
    Object.assign(window, { merchantFlights: flights });
    Element.prototype.animate = function (frames, options) {
      const pawn = this.querySelector('img')?.getAttribute('src');
      if (this.classList.contains('pawn-motion') && pawn?.includes('/merchant-') &&
          Array.isArray(frames) && frames.some((frame) => frame.transform)) flights.push(pawn);
      return animate.call(this, frames, options);
    };
  });
  const roomCode = testInfo.project.name === 'phone' ? 'BOTPB' : 'BOTDB';
  const phoneContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    viewport: { width: 393, height: 852 }
  });
  const phone = await phoneContext.newPage();
  const otherHost = await context.newPage();
  try {
    await page.goto(`/tabletop/?e2eRoom=${roomCode}&e2eSeed=bot-2`);
    await page
      .getByRole('button', { name: 'Add bot at position 6', exact: true })
      .click();
    await expect(
      page.getByRole('button', { name: 'Remove Bot 1' })
    ).toBeVisible();
    await phone.goto(`/?room=${roomCode}&seat=1`);
    await expect(
      phone.getByRole('heading', { name: 'Take a seat at the tabletop.' })
    ).toBeVisible();
    await phone.getByLabel('Your merchant name').fill('Ada');
    await phone.getByRole('button', { name: /Join the room/ }).click();
    await phone.getByRole('button', { name: /I am ready/ }).click();
    await expect(
      phone.getByRole('button', { name: /Add bot|Remove Bot/ })
    ).toHaveCount(0);
    await otherHost.goto(`/tabletop/?room=${roomCode}`);
    await page.getByRole('button', { name: 'Open the bazaar' }).click();
    await expectState(page, {
      diagnosticCount: 0,
      game: { currentTurn: 'Ada', turnNumber: 2, phase: 'movement' }
    });
    await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
    expect(await page.evaluate(() => (window as unknown as { merchantFlights: string[] }).merchantFlights)).toHaveLength(1);
    await page.locator('[data-place-id="4"]').click();
    await expectState(page, {
      game: { currentTurn: 'Ada', players: [{ goods: { fruit: 2 } }, {}] }
    });
    await page
      .locator('.zoom-tile:not([inert])')
      .getByRole('button', { name: 'End turn', exact: true })
      .click();
    await expectState(page, {
      diagnosticCount: 0,
      game: { currentTurn: 'Ada', turnNumber: 4, phase: 'movement' }
    });
    await expect(page.locator('[data-motion-active]')).toHaveAttribute('data-motion-active', 'false');
    // Two bot moves and the human's intervening move, each animated once.
    expect(await page.evaluate(() => (window as unknown as { merchantFlights: string[] }).merchantFlights)).toHaveLength(3);
    const state = await readState(page);
    await expectState(otherHost, {
      diagnosticCount: 0,
      eventCount: state.eventCount,
      game: { turnNumber: 4 }
    });
    await expectState(phone, {
      diagnosticCount: 0,
      eventCount: state.eventCount,
      game: { turnNumber: 4 }
    });
    expect(
      state.gameLog.filter(
        (entry: { ownerUid: string; label: string }) =>
          entry.ownerUid === state.bots[0] && entry.label === 'end turn'
      )
    ).toHaveLength(2);
  } finally {
    await phoneContext.close();
    await otherHost.close();
  }
});
