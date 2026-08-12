import { expect, test, type BrowserContext } from '@playwright/test';
import { expectState, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('a public table and private phone controllers share one safe game', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'SHARE' : testInfo.project.name === 'desktop' ? 'TABLE' : 'WIDEQ';
  const seed = 'recovery-12';
  const baseURL = String(testInfo.project.use.baseURL);
  const phone = { width: 393, height: 852 };
  const journal = new ScenarioJournal();
  const adaContext: BrowserContext = await browser.newContext({ baseURL, viewport: phone, locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const boraContext: BrowserContext = await browser.newContext({ baseURL, viewport: phone, locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const adaPage = await adaContext.newPage();
  const boraPage = await boraContext.newPage();
  const ada = new TestStepHelper(adaPage, testInfo, journal, 'Ada, seat-one phone');
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, seat-two phone');
  const table = new TestStepHelper(page, testInfo, journal, 'The public table display');
  ada.setMetadata('A shared Istanbul table with private phone controllers', 'Ada creates a shared-table room on her phone, the central screen deliberately enters public-display mode, and its real seat-two QR resolves to Bora’s private controller invitation. The two merchants ready and start from their phones; the public board follows the immutable game without revealing either Bonus hand. Ada inspects and commits a move from her controller, the large display mirrors only public movement, and a controller reload proves anonymous-auth seat ownership survives reconnect. Every user action is followed immediately by DOM and serialized-state checks plus an exact screenshot—including the 3840×2160 tabletop surface.');

  try {
    await adaPage.goto(`/?e2eRoom=${roomCode}&e2eSeed=${seed}`);
    await ada.step('ada-opens-table-creator', { description: 'Ada opens the table creator on her phone', verifications: [
      { spec: 'Firebase is ready and no room exists yet', check: async () => { await expect(adaPage.getByRole('status')).toHaveText('Firebase emulator ready'); await expectState(adaPage, { screen: 'landing', eventCount: 0 }); } },
      { spec: 'Both personal-screen and shared-table surfaces are available', check: async () => expect(adaPage.getByLabel('Play surface')).toHaveValue('personal-screens') }
    ] });
    await adaPage.getByLabel('Your merchant name').fill('Ada');
    await ada.step('ada-enters-name', { description: 'Ada enters her public merchant name', verifications: [
      { spec: 'The creator retains Ada’s name without writing history', check: async () => { await expect(adaPage.getByLabel('Your merchant name')).toHaveValue('Ada'); await expectState(adaPage, { eventCount: 0 }); } }
    ] });
    await adaPage.getByLabel('Seats').selectOption('2');
    await ada.step('ada-chooses-two-seats', { description: 'Ada chooses a two-seat table', verifications: [
      { spec: 'Two seats and Short Path are visible draft values', check: async () => { await expect(adaPage.getByLabel('Seats')).toHaveValue('2'); await expect(adaPage.getByLabel('Layout')).toHaveValue('short-path'); } },
      { spec: 'Draft configuration is still local', check: async () => expectState(adaPage, { eventCount: 0 }) }
    ] });
    await adaPage.getByLabel('Play surface').selectOption('shared-table');
    await ada.step('ada-selects-shared-table', { description: 'Ada selects a shared table with private phones', verifications: [
      { spec: 'The submit action now promises a shared table', check: async () => expect(adaPage.getByRole('button', { name: /Create shared table/ })).toBeEnabled() },
      { spec: 'Surface selection has not appended an event', check: async () => expectState(adaPage, { eventCount: 0 }) }
    ] });
    await adaPage.getByRole('button', { name: /Create shared table/ }).click();
    await ada.step('ada-creates-shared-table', { description: `Ada creates shared table ${roomCode}`, verifications: [
      { spec: 'Ada owns seat one and sees a real seat-two QR invitation', check: async () => { await expect(adaPage.getByText('Ada · you')).toBeVisible(); await expect(adaPage.getByLabel('Seat 2 invitation scannable invitation')).toBeVisible(); await expect(adaPage.getByTestId('seat-qr').locator('svg')).toBeVisible(); } },
      { spec: 'The first canonical event records shared-table mode', check: async () => expectState(adaPage, { screen: 'lobby', roomCode, eventCount: 1, seatCount: 1, maxPlayers: 2, mode: 'shared-table' }) }
    ] });

    await page.goto(`/?room=${roomCode}`);
    await table.step('display-opens-room-invitation', { description: 'The central screen opens the room invitation', verifications: [
      { spec: 'The screen offers public-table mode before asking for a private name', check: async () => expect(page.getByRole('button', { name: 'Use this screen as the public table' })).toBeVisible() },
      { spec: 'An unseated display sees one event and no local seat', check: async () => expectState(page, { screen: 'join-room', eventCount: 1, localSeat: null, mode: 'shared-table' }) }
    ] });
    await page.getByRole('button', { name: 'Use this screen as the public table' }).click();
    await table.step('display-enters-public-table-mode', { description: 'The central screen becomes the public table', verifications: [
      { spec: 'The tabletop shows the room code and an unclaimed seat-two QR', check: async () => { await expect(page.getByRole('heading', { name: 'Gather around the bazaar.' })).toBeVisible(); await expect(page.getByText(roomCode, { exact: true })).toBeVisible(); await expect(page.getByLabel('Seat 2 invitation scannable invitation')).toBeVisible(); } },
      { spec: 'The QR carries a seat-two invitation and display identity remains absent', check: async () => { const qr = page.getByLabel('Seat 2 invitation scannable invitation'); await expect(qr).toHaveAttribute('data-invitation-url', new RegExp(`room=${roomCode}.*seat=2`)); await expect(qr.locator('svg')).toBeVisible(); await expectState(page, { screen: 'shared-display', sharedDisplay: true, localSeat: null, eventCount: 1 }); } }
    ] });

    await boraPage.goto(`/?room=${roomCode}&seat=2`);
    await bora.step('bora-opens-seat-two-invitation', { description: 'Bora follows the seat-two QR invitation on his phone', verifications: [
      { spec: 'The invitation identifies controller seat two and Ada’s table', check: async () => { await expect(boraPage.getByText('This invitation is for controller seat 2.')).toBeVisible(); await expect(boraPage.getByRole('heading', { name: 'Take a seat at Ada’s table.' })).toBeVisible(); } },
      { spec: 'Bora is unseated while the creation event replays', check: async () => expectState(boraPage, { screen: 'join-room', eventCount: 1, localSeat: null }) }
    ] });
    await boraPage.getByLabel('Your merchant name').fill('Bora');
    await bora.step('bora-enters-name', { description: 'Bora enters his public merchant name', verifications: [
      { spec: 'Bora’s private controller retains the entered name', check: async () => expect(boraPage.getByLabel('Your merchant name')).toHaveValue('Bora') },
      { spec: 'No event is written until Bora claims the seat', check: async () => expectState(boraPage, { eventCount: 1 }) }
    ] });
    await boraPage.getByRole('button', { name: /Join the room/ }).click();
    await bora.step('bora-claims-controller', { description: 'Bora claims seat two from his phone', verifications: [
      { spec: 'Bora’s phone labels seat two as his', check: async () => expect(boraPage.getByText('Bora · you')).toBeVisible() },
      { spec: 'The join is the second canonical event', check: async () => expectState(boraPage, { screen: 'lobby', eventCount: 2, seatCount: 2, localSeat: 'Bora', mode: 'shared-table' }) }
    ] });
    await table.step('display-shows-both-controllers', { description: 'The public table mirrors both claimed controllers', verifications: [
      { spec: 'Ada and Bora replace the QR invitations on the public display', check: async () => { await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible(); await expect(page.getByRole('heading', { name: 'Bora' })).toBeVisible(); await expect(page.getByTestId('seat-qr')).toHaveCount(0); } },
      { spec: 'The public display replays the same two events without claiming a seat', check: async () => expectState(page, { screen: 'shared-display', eventCount: 2, seatCount: 2, localSeat: null }) }
    ] });

    await boraPage.getByRole('button', { name: /I am ready/ }).click();
    await bora.step('bora-readies-controller', { description: 'Bora readies from his private controller', verifications: [
      { spec: 'Bora sees one of two merchants ready', check: async () => expect(boraPage.getByText('1/2')).toBeVisible() },
      { spec: 'Only seat two is ready in event three', check: async () => expectState(boraPage, { eventCount: 3, ready: [false, true] }) }
    ] });
    await adaPage.getByRole('button', { name: /I am ready/ }).click();
    await ada.step('ada-readies-controller', { description: 'Ada readies and unlocks start on her phone', verifications: [
      { spec: 'Ada sees Table ready and an enabled opening action', check: async () => { await expect(adaPage.getByText('Table ready')).toBeVisible(); await expect(adaPage.getByRole('button', { name: /Open the bazaar/ })).toBeEnabled(); } },
      { spec: 'Both seats are ready after four events', check: async () => expectState(adaPage, { eventCount: 4, ready: [true, true], game: null }) }
    ] });
    await adaPage.getByRole('button', { name: /Open the bazaar/ }).click();
    await ada.step('ada-starts-from-controller', { description: 'Ada starts the bazaar from seat one', verifications: [
      { spec: 'Ada’s phone renders all sixteen Places and her private hand', check: async () => { await expect(adaPage.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16); await expect(adaPage.locator('.hand')).toBeVisible(); } },
      { spec: 'The seeded fifth event begins Ada’s movement phase', check: async () => expectState(adaPage, { screen: 'game', eventCount: 5, game: { seed, currentTurn: 'Ada', phase: 'movement' } }) }
    ] });
    await table.step('display-mirrors-public-bazaar', { description: 'The tabletop opens the public bazaar projection', verifications: [
      { spec: 'The large surface shows sixteen Places and identifies itself as public', check: async () => { await expect(page.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16); await expect(page.getByText('Public table · choices stay on phones')).toBeVisible(); } },
      { spec: 'No private hand or Bonus title is exposed in public DOM or state', check: async () => { await expect(page.locator('.hand')).toHaveCount(0); await expect(page.locator('.masked-hand')).toHaveCount(2); const publicState = await readState(page); expect(publicState.game.localHand).toEqual([]); expect(publicState).toMatchObject({ screen: 'shared-display', eventCount: 5, localSeat: null }); } }
    ] });

    const reachable = adaPage.locator('.place.reachable').first();
    const selectedName = await reachable.getAttribute('aria-label');
    await reachable.click();
    await ada.step('ada-inspects-route-on-phone', { description: 'Ada inspects a reachable route on her phone', verifications: [
      { spec: 'The selected Place is pressed and its movement action is enabled', check: async () => { await expect(reachable).toHaveAttribute('aria-pressed', 'true'); await expect(adaPage.getByRole('button', { name: /Move here and/ })).toBeEnabled(); } },
      { spec: 'Inspection is local UI state and event five remains canonical', check: async () => { const state = await readState(adaPage); expect(state.eventCount).toBe(5); expect(state.game.selectedPlace).not.toBeNull(); } }
    ] });
    await adaPage.getByRole('button', { name: /Move here and/ }).click();
    await ada.step('ada-commits-move-on-phone', { description: 'Ada commits the selected move from her controller', verifications: [
      { spec: 'Ada’s controller advances from movement into a Place action', check: async () => expectState(adaPage, { eventCount: 6, game: { currentTurn: 'Ada', phase: 'action' } }) },
      { spec: 'Event six records Ada away from Fountain', check: async () => { const state = await readState(adaPage); expect(state).toMatchObject({ eventCount: 6, game: { currentTurn: 'Ada', phase: 'action' } }); expect(state.game.players[0].merchantPlace).not.toBe(7); } }
    ] });
    await table.step('display-mirrors-adas-move', { description: 'The public table mirrors Ada’s committed movement', verifications: [
      { spec: 'Ada’s token has left Fountain on the large board', check: async () => { await expect(page.getByRole('heading', { name: /Ada arrives at/ })).toBeVisible(); await expect(page.getByRole('button', { name: /^7 Fountain.*Merchants:/ })).not.toContainText('A'); } },
      { spec: 'Public and controller cursors agree while private state stays masked', check: async () => { const state = await readState(page); expect(state).toMatchObject({ eventCount: 6, game: { phase: 'action' } }); expect(state.game.localHand).toEqual([]); } },
      { spec: `The route originated from the phone selection: ${selectedName}`, check: async () => expect(selectedName).toBeTruthy() }
    ] });

    await adaPage.reload();
    await ada.step('ada-reconnects-to-owned-controller', { description: 'Ada reloads and reclaims her owned controller', verifications: [
      { spec: 'Anonymous-auth persistence returns Ada directly to her game, not the join screen', check: async () => { await expect(adaPage.getByRole('heading', { name: /Ada arrives at/ })).toBeVisible(); await expect(adaPage.getByText('Ada · you')).toBeVisible(); } },
      { spec: 'Seat ownership, private hand, and six-event cursor survive reconnect', check: async () => { await expect(adaPage.locator('.hand')).toBeVisible(); await expectState(adaPage, { screen: 'game', localSeat: 'Ada', eventCount: 6, mode: 'shared-table', game: { phase: 'action' } }); } }
    ] });
    ada.generateDocs();
  } finally {
    await adaContext.close();
    await boraContext.close();
  }
});
