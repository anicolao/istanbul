import { expect, test, type BrowserContext } from '@playwright/test';
import { expectState, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('a dedicated tabletop creates the room and private phones join by QR', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'SHARE' : testInfo.project.name === 'desktop' ? 'TABLE' : 'WIDEQ';
  const seed = 'recovery-12';
  const baseURL = String(testInfo.project.use.baseURL);
  const phone = { width: 393, height: 852 };
  const journal = new ScenarioJournal();
  const adaContext: BrowserContext = await browser.newContext({ baseURL, viewport: phone, locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const boraContext: BrowserContext = await browser.newContext({ baseURL, viewport: phone, locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const adaPage = await adaContext.newPage();
  const boraPage = await boraContext.newPage();
  const table = new TestStepHelper(page, testInfo, journal, 'The dedicated tabletop');
  const ada = new TestStepHelper(adaPage, testInfo, journal, 'Ada’s private phone');
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora’s private phone');
  table.setMetadata('Walk up to an Istanbul tabletop and join by QR', 'The dedicated /tabletop route creates and owns an empty shared-table room. Ada and Bora walk up, scan its QR codes, join and ready on private phones, then the tabletop starts play. Unclaimed positions disappear when the bazaar replaces the lobby. Every action is followed by exact screenshots, DOM checks, and serialized replay-state assertions.');

  try {
    await page.goto(`/tabletop/?e2eRoom=${roomCode}&e2eSeed=${seed}`);
    await table.step('tabletop-opens-empty-room', { description: `The tabletop opens empty room ${roomCode}`, verifications: [
      { spec: 'The direct tabletop route creates five QR invitations without claiming a merchant seat', check: async () => { await expect(page.getByRole('heading', { name: 'Scan. Join. Ready.' })).toBeVisible(); await expect(page.getByText(roomCode, { exact: true })).toBeVisible(); await expect(page.getByTestId('seat-qr')).toHaveCount(5); } },
      { spec: 'The tabletop owns the sole creation event and stays outside the roster', check: async () => expectState(page, { screen: 'shared-display', roomCode, eventCount: 1, seatCount: 0, maxPlayers: 5, mode: 'shared-table', tabletopOwned: true, tabletopRoute: true, localSeat: null }) },
      { spec: 'The tabletop owns layout and start controls, with start disabled until two players join and ready', check: async () => { await expect(page.getByLabel('Table layout')).toHaveValue('short-path'); await expect(page.getByRole('button', { name: 'Open the bazaar' })).toBeDisabled(); } }
    ] });

    const invitation = await page.getByTestId('seat-qr').first().getAttribute('data-invitation-url');
    expect(invitation).toBeTruthy();
    expect(new URL(invitation!).pathname).not.toContain('/tabletop');
    await adaPage.goto(invitation!);
    await ada.step('ada-scans-tabletop-qr', { description: 'Ada scans a tabletop QR on her phone', verifications: [
      { spec: 'The QR opens only a private-controller join screen', check: async () => { await expect(adaPage.getByRole('heading', { name: 'Take a seat at the tabletop.' })).toBeVisible(); await expect(adaPage.getByRole('button', { name: /Use this screen as the public table/ })).toHaveCount(0); } },
      { spec: 'Ada is not seated while the empty tabletop room replays', check: async () => expectState(adaPage, { screen: 'join-room', eventCount: 1, seatCount: 0, localSeat: null, tabletopOwned: true }) }
    ] });
    await adaPage.getByLabel('Your merchant name').fill('Ada');
    await ada.step('ada-enters-name', { description: 'Ada enters her public merchant name', verifications: [
      { spec: 'The private phone retains Ada’s name without writing an event', check: async () => { await expect(adaPage.getByLabel('Your merchant name')).toHaveValue('Ada'); await expectState(adaPage, { eventCount: 1 }); } }
    ] });
    await adaPage.getByRole('button', { name: /Join the room/ }).click();
    await ada.step('ada-joins-from-phone', { description: 'Ada joins as the first merchant', verifications: [
      { spec: 'Ada’s phone identifies her without granting tabletop ownership', check: async () => { await expect(adaPage.getByText('Ada · you')).toBeVisible(); await expect(adaPage.getByText('Room creator')).toHaveCount(0); } },
      { spec: 'The join is event two and Ada is the only player', check: async () => expectState(adaPage, { screen: 'lobby', eventCount: 2, seatCount: 1, localSeat: 'Ada', ready: [false] }) }
    ] });
    await table.step('tabletop-shows-ada', { description: 'The tabletop replaces one QR with Ada', verifications: [
      { spec: 'Ada occupies one public position while four invitations remain', check: async () => { await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible(); await expect(page.getByTestId('seat-qr')).toHaveCount(4); } },
      { spec: 'The tabletop remains seatless at the same two-event cursor', check: async () => expectState(page, { eventCount: 2, seatCount: 1, localSeat: null }) }
    ] });

    const secondInvitation = await page.getByTestId('seat-qr').first().getAttribute('data-invitation-url');
    await boraPage.goto(secondInvitation!);
    await bora.step('bora-scans-tabletop-qr', { description: 'Bora scans an open tabletop QR', verifications: [
      { spec: 'Bora sees the same private-controller join screen', check: async () => expect(boraPage.getByRole('heading', { name: 'Take a seat at the tabletop.' })).toBeVisible() },
      { spec: 'Ada is present but Bora has not yet joined', check: async () => expectState(boraPage, { screen: 'join-room', eventCount: 2, seatCount: 1, localSeat: null }) }
    ] });
    await boraPage.getByLabel('Your merchant name').fill('Bora');
    await bora.step('bora-enters-name', { description: 'Bora enters his public merchant name', verifications: [
      { spec: 'Typing remains local until the join action', check: async () => { await expect(boraPage.getByLabel('Your merchant name')).toHaveValue('Bora'); await expectState(boraPage, { eventCount: 2 }); } }
    ] });
    await boraPage.getByRole('button', { name: /Join the room/ }).click();
    await bora.step('bora-joins-from-phone', { description: 'Bora joins as the second merchant', verifications: [
      { spec: 'Bora’s private phone shows both joined merchants', check: async () => { await expect(boraPage.getByText('Ada', { exact: true })).toBeVisible(); await expect(boraPage.getByText('Bora · you')).toBeVisible(); } },
      { spec: 'The second join is event three', check: async () => expectState(boraPage, { screen: 'lobby', eventCount: 3, seatCount: 2, ready: [false, false] }) }
    ] });
    await table.step('tabletop-shows-both-merchants', { description: 'The tabletop shows both joined merchants', verifications: [
      { spec: 'Ada and Bora occupy public positions while three QR invitations remain', check: async () => { await expect(page.getByRole('heading', { name: 'Ada' })).toBeVisible(); await expect(page.getByRole('heading', { name: 'Bora' })).toBeVisible(); await expect(page.getByTestId('seat-qr')).toHaveCount(3); } },
      { spec: 'Start remains disabled until both private phones are ready', check: async () => expect(page.getByRole('button', { name: 'Open the bazaar' })).toBeDisabled() }
    ] });

    await adaPage.getByRole('button', { name: /I am ready/ }).click();
    await ada.step('ada-readies-phone', { description: 'Ada readies on her private phone', verifications: [
      { spec: 'Ada sees one of two merchants ready', check: async () => expect(adaPage.getByText('1/2')).toBeVisible() },
      { spec: 'Only Ada is ready in event four', check: async () => expectState(adaPage, { eventCount: 4, ready: [true, false] }) }
    ] });
    await boraPage.getByRole('button', { name: /I am ready/ }).click();
    await bora.step('bora-readies-phone', { description: 'Bora readies on his private phone', verifications: [
      { spec: 'Both merchants are ready but no phone receives a start control', check: async () => { await expect(boraPage.getByText('Table ready')).toBeVisible(); await expect(boraPage.getByRole('button', { name: 'Open the bazaar' })).toHaveCount(0); } },
      { spec: 'Both readiness events are replayed without creating a game', check: async () => expectState(boraPage, { eventCount: 5, ready: [true, true], game: null }) }
    ] });
    await table.step('tabletop-unlocks-start', { description: 'The tabletop unlocks the start control', verifications: [
      { spec: 'The tabletop announces everyone present is ready', check: async () => expect(page.getByText('Everyone here is ready.')).toBeVisible() },
      { spec: 'Only the dedicated tabletop can now open the bazaar', check: async () => expect(page.getByRole('button', { name: 'Open the bazaar' })).toBeEnabled() },
      { spec: 'Three unclaimed QR positions remain visible until start', check: async () => expect(page.getByTestId('seat-qr')).toHaveCount(3) }
    ] });
    await page.getByRole('button', { name: 'Open the bazaar' }).click();
    await table.step('tabletop-starts-public-bazaar', { description: 'The tabletop starts play and becomes the public bazaar', verifications: [
      { spec: 'The public board replaces every joined and unclaimed lobby position', check: async () => { await expect(page.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16); await expect(page.getByTestId('seat-qr')).toHaveCount(0); await expect(page.getByText(/invitations open/)).toHaveCount(0); } },
      { spec: 'The sixth event starts Ada’s seeded movement turn', check: async () => expectState(page, { screen: 'shared-display', eventCount: 6, localSeat: null, game: { seed, currentTurn: 'Ada', phase: 'movement' } }) },
      { spec: 'No private Bonus hand appears in public DOM or state', check: async () => { await expect(page.locator('.hand')).toHaveCount(0); await expect(page.locator('.masked-hand')).toHaveCount(2); expect((await readState(page)).game.localHand).toEqual([]); } }
    ] });
    await ada.step('ada-receives-private-turn', { description: 'Ada’s private phone receives the opening turn', verifications: [
      { spec: 'Ada sees sixteen Places and her private hand', check: async () => { await expect(adaPage.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16); await expect(adaPage.locator('.hand')).toBeVisible(); } },
      { spec: 'Ada’s controller agrees with the tabletop at event six', check: async () => expectState(adaPage, { screen: 'game', eventCount: 6, localSeat: 'Ada', game: { currentTurn: 'Ada', phase: 'movement' } }) }
    ] });

    const reachable = adaPage.locator('.place.reachable').first();
    await reachable.click();
    await ada.step('ada-inspects-route', { description: 'Ada inspects a route on her private phone', verifications: [
      { spec: 'The selected Place is pressed and its move action is enabled', check: async () => { await expect(reachable).toHaveAttribute('aria-pressed', 'true'); await expect(adaPage.getByRole('button', { name: /Move here and/ })).toBeEnabled(); } },
      { spec: 'Inspection remains local at event six', check: async () => { const state = await readState(adaPage); expect(state.eventCount).toBe(6); expect(state.game.selectedPlace).not.toBeNull(); } }
    ] });
    await adaPage.getByRole('button', { name: /Move here and/ }).click();
    await ada.step('ada-commits-move', { description: 'Ada commits movement from her private phone', verifications: [
      { spec: 'Ada advances into a Place action', check: async () => expectState(adaPage, { eventCount: 7, game: { currentTurn: 'Ada', phase: 'action' } }) }
    ] });
    await table.step('tabletop-mirrors-move', { description: 'The tabletop mirrors Ada’s committed move', verifications: [
      { spec: 'The public table announces Ada’s arrival', check: async () => expect(page.getByRole('heading', { name: /Ada arrives at/ })).toBeVisible() },
      { spec: 'Public replay reaches event seven while hidden state remains masked', check: async () => { const state = await readState(page); expect(state).toMatchObject({ eventCount: 7, game: { phase: 'action', localHand: [] } }); } }
    ] });

    await page.reload();
    await table.step('tabletop-reloads-owned-room', { description: 'The tabletop reloads its retained room', verifications: [
      { spec: 'Reload preserves the tabletop URL and public bazaar instead of creating another room', check: async () => { expect(new URL(page.url()).pathname).toContain('/tabletop'); expect(new URL(page.url()).searchParams.get('room')).toBe(roomCode); await expect(page.getByTestId('bazaar-board')).toBeVisible(); } },
      { spec: 'Table ownership and the seven-event cursor survive reload', check: async () => expectState(page, { screen: 'shared-display', roomCode, tabletopOwned: true, tabletopRoute: true, eventCount: 7, localSeat: null }) }
    ] });
    table.generateDocs();
  } finally {
    await adaContext.close();
    await boraContext.close();
  }
});
