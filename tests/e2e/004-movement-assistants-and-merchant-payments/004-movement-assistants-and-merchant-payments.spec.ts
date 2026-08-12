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

test('merchants move with assistants, settle tolls, and advance safely', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'ROUTE' : 'MOVES';
  const seed = `move-${testInfo.project.name}-4`;
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Walking every first route through the bazaar',
    'Ada and Bora open a two-player Short Path table, then perform every visible choice in seven consecutive turns. The walkthrough shows orthogonal reachability, assistant drops and pick-up, a neutral-merchant toll and relocation, a player-to-player payment, an unaffordable early ending, the Fountain exception, observer updates, and reload-safe canonical state.'
  );

  try {
    await page.goto(`/?e2eRoom=${roomCode}&e2eSeed=${seed}`);
    await ada.step('host-opens-table-creator', { description: 'Ada opens the ordinary table creator', verifications: [
      { spec: 'Firebase is ready before any room action', check: async () => expect(page.getByRole('status')).toHaveText('Firebase emulator ready') },
      { spec: 'The landing projection has no room or game history', check: async () => expectState(page, { screen: 'landing', eventCount: 0, game: null }) }
    ] });

    await page.getByLabel('Your merchant name').fill('Ada');
    await ada.step('host-enters-name', { description: 'Ada enters her public merchant name', verifications: [
      { spec: 'The name field contains Ada exactly', check: async () => expect(page.getByLabel('Your merchant name')).toHaveValue('Ada') },
      { spec: 'No immutable event exists before confirmation', check: async () => expectState(page, { eventCount: 0 }) }
    ] });

    await page.getByLabel('Seats').selectOption('2');
    await ada.step('host-chooses-two-seats', { description: 'Ada chooses a two-player table', verifications: [
      { spec: 'The visible seat selector now reads 2 players', check: async () => expect(page.getByLabel('Seats')).toHaveValue('2') },
      { spec: 'Short Path remains the selected route', check: async () => expect(page.getByLabel('Layout')).toHaveValue('short-path') },
      { spec: 'Changing the draft form still writes no event', check: async () => expectState(page, { eventCount: 0 }) }
    ] });

    await page.getByRole('button', { name: /Create private room/ }).click();
    await ada.step('host-creates-room', { description: `Ada creates private room ${roomCode}`, verifications: [
      { spec: 'Ada occupies seat one of exactly two', check: async () => { await expect(page.getByText('Ada · you')).toBeVisible(); await expect(page.getByText('1/2')).toBeVisible(); } },
      { spec: 'One creation event projects the lobby', check: async () => expectState(page, { screen: 'lobby', roomCode, eventCount: 1, seatCount: 1, maxPlayers: 2 }) }
    ] });

    await boraPage.goto(`/?room=${roomCode}`);
    await bora.step('guest-opens-invitation', { description: 'Bora opens Ada’s invitation', verifications: [
      { spec: 'The invitation names Ada and the Short Path', check: async () => { await expect(boraPage.getByRole('heading', { name: 'Take a seat at Ada’s table.' })).toBeVisible(); await expect(boraPage.getByText('Short Path', { exact: true })).toBeVisible(); } },
      { spec: 'Bora observes one claimed seat and one event', check: async () => expectState(boraPage, { screen: 'join-room', eventCount: 1, seatCount: 1 }) }
    ] });

    await boraPage.getByLabel('Your merchant name').fill('Bora');
    await bora.step('guest-enters-name', { description: 'Bora enters his public merchant name', verifications: [
      { spec: 'The invitation form contains Bora exactly', check: async () => expect(boraPage.getByLabel('Your merchant name')).toHaveValue('Bora') },
      { spec: 'Join is enabled while the event stream stays unchanged', check: async () => { await expect(boraPage.getByRole('button', { name: /Join the room/ })).toBeEnabled(); await expectState(boraPage, { eventCount: 1 }); } }
    ] });

    await boraPage.getByRole('button', { name: /Join the room/ }).click();
    await bora.step('guest-joins', { description: 'Bora claims clockwise seat two', verifications: [
      { spec: 'Both merchants are visible in clockwise order', check: async () => { await expect(boraPage.getByText('Ada')).toBeVisible(); await expect(boraPage.getByText('Bora · you')).toBeVisible(); } },
      { spec: 'The join is the second clean event', check: async () => expectState(boraPage, { screen: 'lobby', eventCount: 2, seatCount: 2, ready: [false, false] }) }
    ] });

    await boraPage.getByRole('button', { name: /I am ready/ }).click();
    await bora.step('guest-readies', { description: 'Bora readies for the Short Path', verifications: [
      { spec: 'One of two merchants is visibly ready', check: async () => expect(boraPage.getByText('1/2')).toBeVisible() },
      { spec: 'The readiness event changes Bora only', check: async () => expectState(boraPage, { eventCount: 3, ready: [false, true] }) }
    ] });

    await page.getByRole('button', { name: /I am ready/ }).click();
    await ada.step('host-readies', { description: 'Ada readies and unlocks the start control', verifications: [
      { spec: 'Table ready and Open the bazaar are visible', check: async () => { await expect(page.getByText('Table ready')).toBeVisible(); await expect(page.getByRole('button', { name: /Open the bazaar/ })).toBeEnabled(); } },
      { spec: 'Four events leave the game unmaterialized', check: async () => expectState(page, { eventCount: 4, ready: [true, true], game: null }) }
    ] });

    await page.getByRole('button', { name: /Open the bazaar/ }).click();
    await ada.step('host-starts-seeded-game', { description: 'Ada opens the seeded bazaar as first player', verifications: [
      { spec: 'Ada is named as the current route planner', check: async () => expect(page.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Reachability is exposed on ten ordinary Place buttons', check: async () => expect(page.getByRole('button', { name: /Reachable this turn/ })).toHaveCount(10) },
      { spec: 'Both merchants start at Fountain with five conserved assistants each', check: async () => expectState(page, { eventCount: 5, game: { currentTurn: 'Ada', turnNumber: 1, phase: 'movement', players: [
        { name: 'Ada', merchantPlace: 7, assistantsCarried: 4, assistantsByPlace: {}, lira: 2 },
        { name: 'Bora', merchantPlace: 7, assistantsCarried: 4, assistantsByPlace: {}, lira: 3 }
      ] } }) }
    ] });

    await page.getByRole('button', { name: /^14 Small Mosque/ }).click();
    await ada.step('host-selects-neutral-route', { description: 'Ada selects Small Mosque two spaces away', verifications: [
      { spec: 'Small Mosque is selected and marked reachable', check: async () => expect(page.getByRole('button', { name: /^14 Small Mosque/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The planner offers an assistant drop', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Inspecting a route appends no event', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: 14, phase: 'movement' } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-moves-to-neutral', { description: 'Ada moves to Small Mosque and leaves an assistant', verifications: [
      { spec: 'The neutral encounter opens a mandatory 2-Lira toll', check: async () => { await expect(page.getByRole('heading', { name: 'Pay the merchant toll' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Pay 2 Lira and continue' })).toBeVisible(); } },
      { spec: 'Bora sees Ada waiting at the same payment boundary', check: async () => expect(boraPage.getByText('Waiting for Ada to confirm the toll.')).toBeVisible() },
      { spec: 'Movement drops one assistant before the pending payment', check: async () => expectState(page, { eventCount: 6, game: { phase: 'merchant-payment', pending: { total: 2, recipientUids: [], neutralMerchantIds: ['neutral-1'] }, players: [{ merchantPlace: 14, assistantsCarried: 3, assistantsByPlace: { 14: 1 }, lira: 2 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Pay 2 Lira and continue' }).click();
    await ada.step('host-pays-neutral', { description: 'Ada pays the neutral merchant and continues', verifications: [
      { spec: 'The Small Mosque action is now ready', check: async () => expect(page.getByRole('heading', { name: 'Small Mosque', exact: true })).toBeVisible() },
      { spec: 'The neutral merchant has deterministically left Place 14', check: async () => { const state = await readState(page); expect(state.game.pending).toBeNull(); await expect(page.getByRole('button', { name: /^14 Small Mosque/ })).not.toContainText('N'); } },
      { spec: 'Ada has paid down to zero Lira in action phase', check: async () => expectState(page, { eventCount: 7, game: { phase: 'action', players: [{ merchantPlace: 14, lira: 0 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Skip this Place action and end turn' }).click();
    await ada.step('host-ends-first-turn', { description: 'Ada skips the not-yet-open Mosque action and ends turn', verifications: [
      { spec: 'Bora becomes the visible route planner', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'The clockwise turn advances to turn two movement', check: async () => expectState(page, { eventCount: 8, game: { currentTurn: 'Bora', turnNumber: 2, phase: 'movement' } }) }
    ] });

    await boraPage.getByRole('button', { name: /^14 Small Mosque/ }).click();
    await bora.step('guest-selects-occupied-route', { description: 'Bora selects Ada’s occupied Small Mosque', verifications: [
      { spec: 'The selected tile names Ada as its merchant occupant', check: async () => expect(boraPage.getByRole('button', { name: /^14 Small Mosque.*Merchants: Ada/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Bora can move two spaces and leave an assistant', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Route inspection preserves turn two and eight events', check: async () => expectState(boraPage, { eventCount: 8, game: { currentTurn: 'Bora', selectedPlace: 14 } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-moves-to-host', { description: 'Bora arrives beside Ada and leaves an assistant', verifications: [
      { spec: 'A mandatory player-to-player toll is visible', check: async () => { await expect(boraPage.getByText('Pay Ada 2 Lira each.')).toBeVisible(); await expect(boraPage.getByRole('button', { name: 'Pay 2 Lira and continue' })).toBeVisible(); } },
      { spec: 'Ada’s observer sees both merchants on Place 14', check: async () => expect(page.getByRole('button', { name: /^14 Small Mosque.*Merchants: Ada, Bora/ })).toBeVisible() },
      { spec: 'Bora’s drop and exact recipient are pending canonically', check: async () => expectState(boraPage, { eventCount: 9, game: { phase: 'merchant-payment', pending: { total: 2 }, players: [{ name: 'Ada', lira: 0 }, { name: 'Bora', merchantPlace: 14, assistantsCarried: 3, lira: 3 }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Pay 2 Lira and continue' }).click();
    await bora.step('guest-pays-host', { description: 'Bora pays Ada the two-Lira encounter toll', verifications: [
      { spec: 'Bora reaches the Small Mosque action panel', check: async () => expect(boraPage.getByRole('heading', { name: 'Small Mosque', exact: true })).toBeVisible() },
      { spec: 'Public resources show Ada at 2 and Bora at 1 Lira', check: async () => expectState(boraPage, { eventCount: 10, game: { phase: 'action', players: [{ name: 'Ada', lira: 2 }, { name: 'Bora', lira: 1 }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Skip this Place action and end turn' }).click();
    await bora.step('guest-ends-second-turn', { description: 'Bora ends turn after the settled encounter', verifications: [
      { spec: 'Ada becomes current for turn three', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Both Place-14 assistants remain on the public board', check: async () => { await expect(boraPage.getByTitle("Ada's assistant")).toBeVisible(); await expect(boraPage.getByTitle("Bora's assistant")).toBeVisible(); } },
      { spec: 'Turn three begins with a clean movement phase', check: async () => expectState(boraPage, { eventCount: 11, game: { currentTurn: 'Ada', turnNumber: 3, phase: 'movement' } }) }
    ] });

    await page.getByRole('button', { name: /^2 Fabric Warehouse/ }).click();
    await ada.step('host-selects-fabric', { description: 'Ada selects adjacent Fabric Warehouse', verifications: [
      { spec: 'Fabric Warehouse is visibly selected and reachable', check: async () => expect(page.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The next drop is offered without a toll yet', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Selection remains local at eleven canonical events', check: async () => expectState(page, { eventCount: 11, game: { selectedPlace: 2 } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-drops-at-fabric', { description: 'Ada moves one space and drops at Fabric Warehouse', verifications: [
      { spec: 'Fabric Warehouse opens directly with no occupant toll', check: async () => expect(page.getByRole('heading', { name: 'Fabric Warehouse', exact: true })).toBeVisible() },
      { spec: 'Ada now carries two assistants and has one at Places 14 and 2', check: async () => expectState(page, { eventCount: 12, game: { phase: 'action', players: [{ merchantPlace: 2, assistantsCarried: 2, assistantsByPlace: { 2: 1, 14: 1 }, lira: 2 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Skip warehouse and end turn' }).click();
    await ada.step('host-ends-third-turn', { description: 'Ada ends the Fabric Warehouse turn', verifications: [
      { spec: 'Bora becomes current on turn four', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'The projection advances without changing public resources', check: async () => expectState(page, { eventCount: 13, game: { currentTurn: 'Bora', turnNumber: 4, phase: 'movement', players: [{ lira: 2 }, { lira: 1 }] } }) }
    ] });

    await boraPage.getByRole('button', { name: /^2 Fabric Warehouse/ }).click();
    await bora.step('guest-selects-unaffordable-encounter', { description: 'Bora selects Ada’s occupied Fabric Warehouse', verifications: [
      { spec: 'The route is legal and visibly occupied by Ada', check: async () => expect(boraPage.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable.*Merchants: Ada/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The movement control still truthfully offers the required assistant drop', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Bora still has only 1 Lira before committing', check: async () => expectState(boraPage, { eventCount: 13, game: { selectedPlace: 2, players: [{}, { lira: 1 }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-cannot-pay', { description: 'Bora arrives but cannot pay, ending the turn immediately', verifications: [
      { spec: 'The turn banner explains the exact unaffordable 2-Lira barrier', check: async () => expect(boraPage.getByText('Bora could not pay 2 Lira; that turn ended immediately.')).toBeVisible() },
      { spec: 'No payment or Place-action control can be used after the early ending', check: async () => { await expect(boraPage.getByRole('button', { name: /Pay 2 Lira/ })).toHaveCount(0); await expect(boraPage.getByRole('button', { name: /Skip warehouse/ })).toHaveCount(0); } },
      { spec: 'Bora still moves and drops, but no Lira transfers and turn five belongs to Ada', check: async () => expectState(boraPage, { eventCount: 14, game: { currentTurn: 'Ada', turnNumber: 5, phase: 'movement', pending: null, lastMovement: { playerUid: expect.any(String), to: 2, paymentTotal: 2, paymentBlocked: true }, players: [{ merchantPlace: 2, lira: 2 }, { merchantPlace: 2, assistantsCarried: 2, assistantsByPlace: { 2: 1, 14: 1 }, lira: 1 }] } }) }
    ] });

    await page.getByRole('button', { name: /^7 Fountain/ }).click();
    await ada.step('host-selects-fountain', { description: 'Ada selects adjacent Fountain from Fabric Warehouse', verifications: [
      { spec: 'Fountain is selected as a reachable one-space route', check: async () => expect(page.getByRole('button', { name: /^7 Fountain.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The CTA states the Fountain assistant exception explicitly', check: async () => expect(page.getByRole('button', { name: 'Move here without leaving an assistant' })).toBeVisible() },
      { spec: 'Ada still carries two assistants before moving', check: async () => expectState(page, { eventCount: 14, game: { selectedPlace: 7, players: [{ assistantsCarried: 2 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here without leaving an assistant' }).click();
    await ada.step('host-moves-to-fountain', { description: 'Ada moves to Fountain without changing assistants', verifications: [
      { spec: 'Fountain action opens without a drop or pick-up', check: async () => expect(page.getByRole('heading', { name: 'Fountain', exact: true })).toBeVisible() },
      { spec: 'Ada’s two carried and two placed assistants remain unchanged', check: async () => expectState(page, { eventCount: 15, game: { phase: 'action', players: [{ merchantPlace: 7, assistantsCarried: 2, assistantsByPlace: { 2: 1, 14: 1 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Skip Fountain and end turn' }).click();
    await ada.step('host-ends-fountain-turn', { description: 'Ada ends the Fountain turn', verifications: [
      { spec: 'Bora becomes current on turn six', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Turn six is a new movement boundary', check: async () => expectState(page, { eventCount: 16, game: { currentTurn: 'Bora', turnNumber: 6, phase: 'movement' } }) }
    ] });

    await boraPage.getByRole('button', { name: /^7 Fountain/ }).click();
    await bora.step('guest-selects-fountain', { description: 'Bora also selects the adjacent Fountain', verifications: [
      { spec: 'Fountain is reachable despite Bora having only two assistants carried', check: async () => expect(boraPage.getByRole('button', { name: /^7 Fountain.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The no-assistant movement control is available', check: async () => expect(boraPage.getByRole('button', { name: 'Move here without leaving an assistant' })).toBeVisible() },
      { spec: 'Selecting it changes no canonical state', check: async () => expectState(boraPage, { eventCount: 16, game: { selectedPlace: 7, players: [{}, { assistantsCarried: 2 }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here without leaving an assistant' }).click();
    await bora.step('guest-moves-to-fountain', { description: 'Bora moves to Fountain without leaving an assistant', verifications: [
      { spec: 'Both merchants are now visibly at Fountain', check: async () => expect(boraPage.getByRole('button', { name: /^7 Fountain.*Merchants: Ada, Bora/ })).toBeVisible() },
      { spec: 'Bora’s assistant counts are unchanged in action phase', check: async () => expectState(boraPage, { eventCount: 17, game: { phase: 'action', players: [{ merchantPlace: 7 }, { merchantPlace: 7, assistantsCarried: 2, assistantsByPlace: { 2: 1, 14: 1 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Skip Fountain and end turn' }).click();
    await bora.step('guest-ends-fountain-turn', { description: 'Bora ends the Fountain turn', verifications: [
      { spec: 'Ada starts turn seven at Fountain', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'The prior unaffordable notice no longer changes the active phase', check: async () => expectState(boraPage, { eventCount: 18, game: { currentTurn: 'Ada', turnNumber: 7, phase: 'movement' } }) }
    ] });

    await page.getByRole('button', { name: /^2 Fabric Warehouse/ }).click();
    await ada.step('host-selects-own-assistant', { description: 'Ada selects her own assistant at Fabric Warehouse', verifications: [
      { spec: 'The reachable tile visibly contains both placed assistants', check: async () => { await expect(page.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true'); await expect(page.getByTitle("Ada's assistant")).toHaveCount(2); } },
      { spec: 'The movement CTA switches from drop to pick-up', check: async () => expect(page.getByRole('button', { name: 'Move here and pick up assistant' })).toBeVisible() },
      { spec: 'No event is appended while Ada reviews the recovery', check: async () => expectState(page, { eventCount: 18, game: { selectedPlace: 2, players: [{ assistantsCarried: 2, assistantsByPlace: { 2: 1, 14: 1 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and pick up assistant' }).click();
    await ada.step('host-picks-up-assistant', { description: 'Ada returns to Fabric Warehouse and picks up her assistant', verifications: [
      { spec: 'Fabric Warehouse action opens after the pick-up', check: async () => expect(page.getByRole('heading', { name: 'Fabric Warehouse', exact: true })).toBeVisible() },
      { spec: 'Ada now carries three and only her Place-14 assistant remains', check: async () => expectState(page, { eventCount: 19, game: { currentTurn: 'Ada', turnNumber: 7, phase: 'action', pending: null, lastMovement: { from: 7, to: 2, distance: 1, assistantAction: 'pick-up', paymentBlocked: false }, players: [{ merchantPlace: 2, assistantsCarried: 3, assistantsByPlace: { 14: 1 }, lira: 2 }, { merchantPlace: 7, assistantsCarried: 2, assistantsByPlace: { 2: 1, 14: 1 }, lira: 1 }] } }) },
      { spec: 'Bora’s observer receives the same public final projection', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(guest.game.players).toEqual(host.game.players); expect(guest.eventCount).toBe(19); } }
    ] });

    await page.reload();
    await ada.step('host-reloads-pending-action', { description: 'Ada reloads while the Fabric Warehouse action is pending', verifications: [
      { spec: 'The exact Place-action panel returns after fresh replay', check: async () => { await expect(page.getByRole('heading', { name: 'Fabric Warehouse', exact: true })).toBeVisible(); await expect(page.getByRole('button', { name: 'Skip warehouse and end turn' })).toBeVisible(); } },
      { spec: 'No local route selection is falsely restored', check: async () => expectState(page, { screen: 'game', eventCount: 19, diagnosticCount: 0, game: { currentTurn: 'Ada', turnNumber: 7, phase: 'action', selectedPlace: null, pending: null, players: [{ merchantPlace: 2, assistantsCarried: 3, assistantsByPlace: { 14: 1 } }, {}] } }) },
      { spec: 'The immutable payment, early-end, Fountain, and pick-up history remains clean', check: async () => { const state = await readState(page); expect(state.game.lastMovement).toMatchObject({ from: 7, to: 2, assistantAction: 'pick-up' }); expect(state.diagnosticCount).toBe(0); } }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
