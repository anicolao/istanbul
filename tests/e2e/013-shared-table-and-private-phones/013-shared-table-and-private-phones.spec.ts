import { expect, test, type BrowserContext } from '@playwright/test';
import { expectState, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('a dedicated tabletop controls public play while phones contain private Bonus cards', async ({ browser, page }, testInfo) => {
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
  table.setMetadata('Play Istanbul together on one tabletop with private Bonus phones', 'The dedicated /tabletop route creates and owns an empty shared-table room. Ada and Bora scan its QR codes, join and ready on phones, then gather around the tabletop for every public choice. The phones render only each player’s private Bonus-card hand: Ada privately inspects and plays a card, while the tabletop immediately reflects its public consequence and remains the sole surface for movement and Place actions. Every input is followed by exact screenshots, DOM checks, fitted-interface checks, and serialized replay-state assertions.');

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
      { spec: 'No private Bonus hand appears in public DOM or state', check: async () => { await expect(page.locator('.hand')).toHaveCount(0); await expect(page.getByRole('button', { name: /Inspect Bonus card:/ })).toHaveCount(0); await expect(page.locator('.compact-tray')).toHaveCount(2); expect((await readState(page)).game.localHand).toEqual([]); } }
    ] });
    await ada.step('ada-receives-private-turn', { description: 'Ada’s private phone receives the opening turn', verifications: [
      { spec: 'Ada sees only her private Bonus-card controller', check: async () => { await expect(adaPage.getByRole('heading', { name: 'Your Bonus cards' })).toBeVisible(); await expect(adaPage.getByRole('navigation', { name: 'Private Bonus hand' })).toBeVisible(); } },
      { spec: 'The phone contains no bazaar board, Place controls, public trays, or end-turn control', check: async () => { await expect(adaPage.getByTestId('bazaar-board')).toHaveCount(0); await expect(adaPage.getByRole('button', { name: /Move here/ })).toHaveCount(0); await expect(adaPage.getByLabel('Player resources')).toHaveCount(0); await expect(adaPage.getByRole('button', { name: /End turn/ })).toHaveCount(0); } },
      { spec: 'Ada’s controller agrees with the tabletop at event six', check: async () => expectState(adaPage, { screen: 'game', eventCount: 6, localSeat: 'Ada', game: { currentTurn: 'Ada', phase: 'movement' } }) }
    ] });

    await adaPage.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ }).click();
    await ada.step('ada-inspects-private-bonus', { description: 'Ada privately inspects her Bonus card', verifications: [
      { spec: 'Only Ada’s phone reveals the card title, artwork, rules, and enabled play control', check: async () => { await expect(adaPage.getByRole('heading', { name: 'A profitable bargain' })).toBeVisible(); await expect(adaPage.locator('.private-decision [data-component="BonusCard"]')).toContainText('Gain 5 Lira.'); await expect(adaPage.getByRole('button', { name: 'Play to gain 5 Lira' })).toBeEnabled(); } },
      { spec: 'The tabletop still contains no private title or card face', check: async () => { await expect(page.getByText('A profitable bargain')).toHaveCount(0); await expect(page.locator('.hand')).toHaveCount(0); } },
      { spec: 'Private inspection is local and appends no event', check: async () => expectState(adaPage, { eventCount: 6, game: { selectedBonus: 'bonus-gain-lira-4', phase: 'movement' } }) }
    ] });

    await adaPage.getByRole('button', { name: 'Play to gain 5 Lira' }).click();
    await ada.step('ada-plays-private-bonus', { description: 'Ada plays the private Bonus card from her phone', verifications: [
      { spec: 'The private hand is now empty and returns to its explanatory resting state', check: async () => { await expect(adaPage.getByText('No Bonus cards in hand.')).toBeVisible(); await expect(adaPage.getByRole('heading', { name: 'Select a Bonus card' })).toBeVisible(); } },
      { spec: 'Only the Bonus-card event is appended and Ada gains exactly 5 Lira', check: async () => expectState(adaPage, { eventCount: 7, diagnosticCount: 0, game: { phase: 'movement', players: [{ lira: 7 }, {}], localHand: [] } }) }
    ] });
    await table.step('tabletop-reflects-private-bonus', { description: 'The tabletop reflects the public consequence of Ada’s card', verifications: [
      { spec: 'Ada’s public player mat shows 7 Lira and zero Bonus cards while the spent card becomes the public discard', check: async () => { const adaTray = page.getByLabel('Ada resources'); await expect(adaTray.getByLabel('7 Lira', { exact: true })).toBeVisible(); await expect(adaTray.getByLabel('0 Bonus cards', { exact: true })).toBeVisible(); await expect(page.getByTestId('place-state-6')).toHaveAttribute('data-state-summary', /1 in discard, topped by A profitable bargain/); } },
      { spec: 'The public log describes the effect while movement still belongs to the tabletop', check: async () => { await expect(page.getByText('Played a Bonus card to gain 5 Lira.', { exact: true })).toBeVisible(); await expectState(page, { eventCount: 7, game: { phase: 'movement', players: [{ lira: 7 }, {}], localHand: [] } }); } }
    ] });

    await page.getByRole('button', { name: /^4 Fruit Warehouse.*Reachable/ }).click();
    await table.step('tabletop-inspects-public-route', { description: 'Ada selects Fruit Warehouse on the shared tabletop', verifications: [
      { spec: 'The tabletop presses the public Place and offers the normal assistant drop', check: async () => { await expect(page.getByRole('button', { name: /^4 Fruit Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true'); await expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled(); } },
      { spec: 'Route inspection stays local to the table and creates no event', check: async () => expectState(page, { eventCount: 7, game: { selectedPlace: 4, phase: 'movement' } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await table.step('tabletop-commits-public-move', { description: 'Ada commits movement on the shared tabletop', verifications: [
      { spec: 'The tabletop opens the public Fruit Warehouse action', check: async () => { await expect(page.getByRole('heading', { name: 'Ada arrives at Fruit Warehouse.' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Fill fruit to 2' })).toBeEnabled(); } },
      { spec: 'The tabletop-authored event records Ada’s assistant drop and no diagnostic', check: async () => expectState(page, { eventCount: 8, diagnosticCount: 0, game: { phase: 'action', lastMovement: { from: 7, to: 4, assistantAction: 'drop' }, players: [{ merchantPlace: 4, assistantsCarried: 3, assistantsByPlace: { 4: 1 }, lira: 7 }, {}] } }) }
    ] });
    await ada.step('ada-phone-awaits-public-action', { description: 'Ada’s phone remains private while the tabletop resolves Fruit Warehouse', verifications: [
      { spec: 'The phone reports the public phase but renders no Warehouse action', check: async () => { await expect(adaPage.getByText('action · make public choices on the tabletop')).toBeVisible(); await expect(adaPage.getByRole('button', { name: 'Fill fruit to 2' })).toHaveCount(0); await expect(adaPage.getByTestId('bazaar-board')).toHaveCount(0); } },
      { spec: 'Phone replay agrees with the tabletop at event eight', check: async () => expectState(adaPage, { eventCount: 8, diagnosticCount: 0, game: { currentTurn: 'Ada', phase: 'action', players: [{ merchantPlace: 4 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Fill fruit to 2' }).click();
    await table.step('tabletop-resolves-public-place', { description: 'Ada fills fruit from the shared tabletop', verifications: [
      { spec: 'The tabletop advances to the public end-turn decision', check: async () => expect(page.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled() },
      { spec: 'Fruit and the immutable public action are exact at event nine', check: async () => expectState(page, { eventCount: 9, diagnosticCount: 0, game: { phase: 'turn-end', players: [{ goods: { fruit: 2 }, lira: 7 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await table.step('tabletop-passes-public-turn', { description: 'Ada passes clockwise on the shared tabletop', verifications: [
      { spec: 'The narrow shared turn strip now gives Bora the tabletop', check: async () => { await expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible(); await expect(page.locator('.tabletop-strip')).toContainText('Istanbul tabletop'); } },
      { spec: 'Bora begins event ten with no diagnostic', check: async () => expectState(page, { eventCount: 10, diagnosticCount: 0, game: { currentTurn: 'Bora', turnNumber: 2, phase: 'movement' } }) }
    ] });

    await boraPage.getByRole('button', { name: /Inspect Bonus card: A swift passage/ }).click();
    await bora.step('bora-inspects-private-bonus', { description: 'Bora privately inspects his Bonus card before using the tabletop', verifications: [
      { spec: 'Bora alone sees A swift passage and can enable its private movement effect', check: async () => { await expect(boraPage.getByRole('heading', { name: 'A swift passage' })).toBeVisible(); await expect(boraPage.getByRole('button', { name: 'Enable a 3–4 Place move' })).toBeEnabled(); } },
      { spec: 'Bora’s phone still has no board or public movement destination controls', check: async () => { await expect(boraPage.getByTestId('bazaar-board')).toHaveCount(0); await expect(boraPage.getByRole('button', { name: /Move here/ })).toHaveCount(0); } },
      { spec: 'The tabletop does not reveal Bora’s title and private inspection adds no event', check: async () => { await expect(page.getByText('A swift passage')).toHaveCount(0); await expectState(boraPage, { eventCount: 10, game: { selectedBonus: 'bonus-long-move-1', currentTurn: 'Bora', phase: 'movement' } }); } }
    ] });

    await page.reload();
    await table.step('tabletop-reloads-owned-room', { description: 'The tabletop reloads its retained room', verifications: [
      { spec: 'Reload preserves the tabletop URL and public bazaar instead of creating another room', check: async () => { expect(new URL(page.url()).pathname).toContain('/tabletop'); expect(new URL(page.url()).searchParams.get('room')).toBe(roomCode); await expect(page.getByTestId('bazaar-board')).toBeVisible(); } },
      { spec: 'Table ownership and the ten-event cursor survive reload', check: async () => expectState(page, { screen: 'shared-display', roomCode, tabletopOwned: true, tabletopRoute: true, eventCount: 10, diagnosticCount: 0, localSeat: null, game: { currentTurn: 'Bora', phase: 'movement' } }) },
      { spec: 'Reload restores working public controls without exposing private card identities', check: async () => { await expect(page.locator('.place.reachable').first()).toBeEnabled(); await expect(page.locator('.hand')).toHaveCount(0); await expect(page.getByText('A swift passage')).toHaveCount(0); } }
    ] });
    table.generateDocs();
  } finally {
    await adaContext.close();
    await boraContext.close();
  }
});
