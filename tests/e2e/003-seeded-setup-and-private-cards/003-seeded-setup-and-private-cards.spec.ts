import { expect, test, type Page } from '@playwright/test';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

async function readState(page: Page) {
  const output = page.getByTestId('projection-state');
  await expect(output).toBeAttached();
  return JSON.parse(await output.textContent() ?? '{}') as Record<string, any>;
}

async function expectState(page: Page, expected: Record<string, unknown>) {
  await expect.poll(() => readState(page)).toMatchObject(expected);
}

test('a ready room becomes an exact seeded board with private hands', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'SPICE' : 'FRUIT';
  const seed = `setup-${testInfo.project.name}-2026`;
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the host');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Opening a seeded bazaar and protecting private cards',
    'Ada and Bora prepare an ordinary two-player room entirely through visible controls. Starting the game deterministically lays out all sixteen illustrated Places, resources, encounter tokens, neutral merchants, and private Bonus hands. They then inspect, zoom, fit, compare, and reload that projection.'
  );

  try {
    await page.goto(`/?e2eRoom=${roomCode}&e2eSeed=${seed}`);
    await ada.step('host-opens-creator', {
      description: 'Ada opens a new seeded-room creator',
      verifications: [
        { spec: 'The production room form is ready through Firebase', check: async () => expect(page.getByRole('status')).toHaveText('Firebase emulator ready') },
        { spec: 'Short Path is visible and attendance is not requested', check: async () => { await expect(page.getByLabel('Layout')).toHaveValue('short-path'); await expect(page.getByLabel('Seats')).toHaveCount(0); } },
        { spec: 'The projection is an empty landing state', check: async () => expectState(page, { screen: 'landing', eventCount: 0, game: null }) }
      ]
    });

    await page.getByLabel('Your merchant name').fill('Ada');
    await ada.step('host-types-name', {
      description: 'Ada enters the name that will appear on the board',
      verifications: [
        { spec: 'Ada is visible in the editable field', check: async () => expect(page.getByLabel('Your merchant name')).toHaveValue('Ada') },
        { spec: 'Room creation is enabled', check: async () => expect(page.getByRole('button', { name: /Create private room/ })).toBeEnabled() },
        { spec: 'Typing still leaves immutable history empty', check: async () => expectState(page, { eventCount: 0, game: null }) }
      ]
    });

    await page.getByRole('button', { name: /Create private room/ }).click();
    await ada.step('host-creates-room', {
      description: `Ada creates room ${roomCode} before choosing its final route`,
      verifications: [
        { spec: 'Ada owns clockwise seat one', check: async () => expect(page.getByText('Ada · you')).toBeVisible() },
        { spec: 'The room remains open and exposes Short Path', check: async () => { await expect(page.getByText('Room is open')).toBeVisible(); await expect(page.getByLabel('Reviewed layout')).toHaveValue('short-path'); } },
        { spec: 'Exactly one creation event exists', check: async () => expectState(page, { screen: 'lobby', roomCode, eventCount: 1, seatCount: 1, layout: 'short-path', game: null }) }
      ]
    });

    await page.getByLabel('Reviewed layout').selectOption('long-path');
    await ada.step('host-chooses-long-path', {
      description: 'Ada chooses the reviewed Long Path board',
      verifications: [
        { spec: 'The control and route explanation show Long Path', check: async () => { await expect(page.getByLabel('Reviewed layout')).toHaveValue('long-path'); await expect(page.getByText(/Ruby routes sit farther apart/)).toBeVisible(); } },
        { spec: 'No readiness remains after configuration', check: async () => expect(page.getByText('0/1')).toBeVisible() },
        { spec: 'A second event stores intent without persisting a board snapshot', check: async () => expectState(page, { eventCount: 2, layout: 'long-path', game: null }) }
      ]
    });

    await boraPage.goto(`/?room=${roomCode}`);
    await bora.step('guest-follows-invite', {
      description: 'Bora follows the invitation and reviews the chosen table',
      verifications: [
        { spec: 'Ada’s invitation and Long Path are visible', check: async () => { await expect(boraPage.getByRole('heading', { name: 'Take a seat at Ada’s table.' })).toBeVisible(); await expect(boraPage.getByText('Long Path', { exact: true })).toBeVisible(); } },
        { spec: 'Only Ada is present and the room is still open', check: async () => expect(boraPage.getByText('1 merchant here · 4 open')).toBeVisible() },
        { spec: 'Bora replays two public events but has no private game state', check: async () => expectState(boraPage, { screen: 'join-room', eventCount: 2, localSeat: null, game: null }) }
      ]
    });

    await boraPage.getByLabel('Your merchant name').fill('Bora');
    await bora.step('guest-types-name', {
      description: 'Bora enters his public merchant name',
      verifications: [
        { spec: 'Bora’s exact name remains in the invite form', check: async () => expect(boraPage.getByLabel('Your merchant name')).toHaveValue('Bora') },
        { spec: 'The ordinary Join the room control is enabled', check: async () => expect(boraPage.getByRole('button', { name: /Join the room/ })).toBeEnabled() },
        { spec: 'No event is appended until Bora confirms', check: async () => expectState(boraPage, { eventCount: 2, seatCount: 1, game: null }) }
      ]
    });

    await boraPage.getByRole('button', { name: /Join the room/ }).click();
    await bora.step('guest-joins-seat-two', {
      description: 'Bora claims clockwise seat two',
      verifications: [
        { spec: 'Both named merchants are visible in order', check: async () => { await expect(boraPage.getByText('Ada')).toBeVisible(); await expect(boraPage.getByText('Bora · you')).toBeVisible(); } },
        { spec: 'Bora sees Long Path as read-only room configuration', check: async () => expect(boraPage.getByText('Long Path', { exact: true })).toBeVisible() },
        { spec: 'The join is the third clean event', check: async () => expectState(boraPage, { screen: 'lobby', eventCount: 3, seatCount: 2, layout: 'long-path', ready: [false, false], game: null }) }
      ]
    });

    await boraPage.getByRole('button', { name: /I am ready/ }).click();
    await bora.step('guest-readies', {
      description: 'Bora readies for the committed layout',
      verifications: [
        { spec: 'Bora can visibly choose Keep planning again', check: async () => expect(boraPage.getByRole('button', { name: /Keep planning/ })).toBeVisible() },
        { spec: 'One of two merchants is ready', check: async () => expect(boraPage.getByText('1/2')).toBeVisible() },
        { spec: 'The fourth event records Bora’s readiness only', check: async () => expectState(boraPage, { eventCount: 4, ready: [false, true], game: null }) }
      ]
    });

    await page.getByRole('button', { name: /I am ready/ }).click();
    await ada.step('host-readies', {
      description: 'Ada readies last and receives the real start control',
      verifications: [
        { spec: 'The lobby reports Table ready', check: async () => expect(page.getByText('Table ready')).toBeVisible() },
        { spec: 'Open the bazaar is enabled only for the host', check: async () => expect(page.getByRole('button', { name: /Open the bazaar/ })).toBeEnabled() },
        { spec: 'Five events leave both seats ready and no game materialized yet', check: async () => expectState(page, { eventCount: 5, ready: [true, true], game: null }) }
      ]
    });

    await page.getByRole('button', { name: /Open the bazaar/ }).click();
    await ada.step('host-opens-bazaar', {
      description: 'Ada commits the setup seed and opens all sixteen Places',
      verifications: [
        { spec: 'The illustrated board contains exactly sixteen accessible Place buttons', check: async () => expect(page.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16) },
        { spec: 'On desktop, Ada’s private hand occupies its own dock and does not cover her player tray', check: async () => {
          if (testInfo.project.name !== 'desktop') return;
          const hand = page.locator('[data-component="PrivateBonusHand"]');
          const tray = page.getByRole('article', { name: 'Ada resources' }).locator('[data-component="PlayerTray"]');
          await expect(hand).toBeVisible();
          await expect(tray.locator('[aria-label="Private Bonus hand"]')).toHaveCount(0);
          const handBox = await hand.boundingBox();
          const trayBox = await tray.boundingBox();
          expect(handBox).not.toBeNull();
          expect(trayBox).not.toBeNull();
          expect(
            handBox!.x < trayBox!.x + trayBox!.width
            && handBox!.x + handBox!.width > trayBox!.x
            && handBox!.y < trayBox!.y + trayBox!.height
            && handBox!.y + handBox!.height > trayBox!.y
          ).toBe(false);
        } },
        { spec: 'Long Path begins 16, 2, 8, 11 and both merchants occupy Fountain 7', check: async () => { const labels = await page.getByTestId('bazaar-board').getByRole('button').allTextContents(); expect(labels.slice(0, 4).join(' ')).toContain('16'); expect(labels.slice(0, 4).join(' ')).toContain('Gem Dealer'); await expect(page.getByRole('button', { name: /7 Fountain.*Merchants: Ada, Bora/ })).toBeVisible(); } },
        { spec: 'The sixth event derives a deterministic movement-phase setup with private hand masking', check: async () => expectState(page, { screen: 'game', eventCount: 6, diagnosticCount: 0, game: { seed, board: [16, 2, 8, 11, 15, 7, 6, 4, 3, 5, 12, 1, 10, 9, 14, 13], turnNumber: 1, phase: 'movement', opponentHandCounts: [1], selectedPlace: null, boardScale: 1 } }) }
      ]
    });

    await bora.step('guest-observes-seeded-board', {
      description: 'Bora sees the same public board with his own private hand',
      verifications: [
        { spec: 'Bora independently renders all sixteen Places', check: async () => expect(boraPage.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16) },
        { spec: 'Ada’s Bonus hand is represented only by a hidden-card count', check: async () => expect(boraPage.getByText('Bonus hand · 1 hidden card')).toBeVisible() },
        { spec: 'Bora’s canonical public setup matches while his local hand differs by ownership', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(guest.game.board).toEqual(host.game.board); expect(guest.game.currentTurn).toBe(host.game.currentTurn); expect(guest.game.opponentHandCounts).toEqual([1]); expect(guest.game.localHand).toHaveLength(1); } }
      ]
    });

    await page.getByRole('button', { name: /7 Fountain/ }).click();
    await ada.step('host-inspects-fountain', {
      description: 'Ada inspects Fountain 7 before planning movement',
      verifications: [
        { spec: 'The Fountain tile is selected and its full action is visible', check: async () => { await expect(page.getByRole('button', { name: /7 Fountain/ })).toHaveAttribute('aria-pressed', 'true'); await expect(page.getByRole('heading', { name: 'Fountain' })).toBeVisible(); await expect(page.getByText('Return any number of assistants to the merchant.')).toBeVisible(); } },
        { spec: 'The inspector DOM reports row two, column two and both merchants', check: async () => { await expect(page.locator('.inspector dl')).toContainText('Row 2, column 2'); await expect(page.locator('.inspector dl')).toContainText('Ada, Bora'); } },
        { spec: 'Inspection changes local view state without appending an event', check: async () => expectState(page, { eventCount: 6, game: { selectedPlace: 7, selectedBonus: null, boardScale: 1 } }) }
      ]
    });

    await expect(page.getByRole('button', { name: 'Zoom board in' })).toBeDisabled();
    await ada.step('host-zooms-board', {
      description: 'Ada confirms the courtyard board already fits completely',
      verifications: [
        { spec: 'The complete board remains presented without a clipping zoom', check: async () => expect(page.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16) },
        { spec: 'Fountain remains the selected accessible tile', check: async () => expect(page.getByRole('button', { name: /7 Fountain/ })).toHaveAttribute('aria-pressed', 'true') },
        { spec: 'The board stays at its fitted scale of one', check: async () => expectState(page, { eventCount: 6, game: { selectedPlace: 7, boardScale: 1 } }) }
      ]
    });

    await page.getByRole('button', { name: 'Fit board' }).click();
    await ada.step('host-fits-board', {
      description: 'Ada fits the complete 4×4 bazaar back into view',
      verifications: [
        { spec: 'All sixteen Places are available after fitting', check: async () => expect(page.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16) },
        { spec: 'The Long Path caption retains the committed seed', check: async () => expect(page.getByText(`long path · setup seed ${seed}`)).toBeVisible() },
        { spec: 'Fit returns local scale to exactly one without a network event', check: async () => expectState(page, { eventCount: 6, game: { boardScale: 1, selectedPlace: 7 } }) }
      ]
    });

    const boraCardButton = boraPage.getByRole('button', { name: /Inspect Bonus card:/ });
    const boraCardLabel = await boraCardButton.getAttribute('aria-label');
    await boraCardButton.click();
    await bora.step('guest-inspects-private-card', {
      description: 'Bora opens his dealt Bonus card in the private inspector',
      verifications: [
        { spec: 'The selected card title and complete rules text are visible to Bora', check: async () => { const title = (boraCardLabel ?? '').replace('Inspect Bonus card: ', ''); await expect(boraCardButton).toHaveAttribute('aria-pressed', 'true'); await expect(boraPage.getByText('Private Bonus card', { exact: true })).toBeVisible(); await expect(boraPage.getByRole('heading', { name: title })).toBeVisible(); await expect(boraPage.getByText(title, { exact: true })).toHaveCount(3); } },
        { spec: 'Ada remains represented as one hidden opponent card', check: async () => expect(boraPage.getByText('Bonus hand · 1 hidden card')).toBeVisible() },
        { spec: 'Selecting the private card changes no canonical event or public setup', check: async () => { const state = await readState(boraPage); expect(state.eventCount).toBe(6); expect(state.game.selectedBonus).toBe(state.game.localHand[0]); expect(state.game.opponentHandCounts).toEqual([1]); } }
      ]
    });

    await ada.step('host-cannot-see-guest-card', {
      description: 'Ada’s observer view continues to mask Bora’s private card',
      verifications: [
        { spec: 'No private-card inspector opens in Ada’s browser', check: async () => expect(page.getByText('Private Bonus card', { exact: true })).toHaveCount(0) },
        { spec: 'Bora remains exactly one hidden card in Ada’s DOM', check: async () => expect(page.getByText('Bonus hand · 1 hidden card')).toBeVisible() },
        { spec: 'Ada’s serialized selector contains only her card ID and Bora’s count', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(JSON.stringify(host.game)).not.toContain(guest.game.localHand[0]); expect(host.game.opponentHandCounts).toEqual([1]); } }
      ]
    });

    await boraPage.reload();
    await bora.step('guest-reloads-setup', {
      description: 'Bora reloads and reconstructs the same setup and private ownership',
      verifications: [
        { spec: 'The board returns with all sixteen Place controls', check: async () => expect(boraPage.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16) },
        { spec: 'Bora’s own Bonus card returns while Ada’s stays hidden', check: async () => { await expect(boraPage.getByRole('button', { name: boraCardLabel ?? '' })).toBeVisible(); await expect(boraPage.getByText('Bonus hand · 1 hidden card')).toBeVisible(); } },
        { spec: 'Fresh replay restores the exact seed, board, turn, event count, and local hand', check: async () => { const state = await readState(boraPage); expect(state).toMatchObject({ screen: 'game', roomCode, eventCount: 6, diagnosticCount: 0, game: { seed, board: [16, 2, 8, 11, 15, 7, 6, 4, 3, 5, 12, 1, 10, 9, 14, 13], turnNumber: 1, phase: 'movement', selectedPlace: null, selectedBonus: null, boardScale: 1 } }); expect(state.game.localHand).toHaveLength(1); } }
      ]
    });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
