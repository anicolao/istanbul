import { expect, test } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('Police dispatch, family catches, Governor, and Smuggler survive immutable replay', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'FAMIL' : 'CATCH';
  const seed = 'encounter-735';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Dispatching family and resolving every bazaar encounter',
    'Ada sends her family member from Police Station to fill the Fabric Warehouse. Bora follows, performs the same warehouse action, meets the Smuggler, catches Ada’s family for a Bonus card, visits the Governor, makes the mandatory payment, checks both independently relocated tokens, reloads the finite turn-end state, and only then passes the turn.'
  );

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed });

    await page.getByRole('button', { name: /^12 Police Station.*Reachable/ }).click();
    await ada.step('host-selects-police', { description: 'Ada selects adjacent Police Station', verifications: [
      { spec: 'Police Station is selected as a one-space route', check: async () => expect(page.getByRole('button', { name: /^12 Police Station.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada is offered the ordinary assistant drop', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() },
      { spec: 'The route selection changes no family position', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: 12, players: [{ familyPlace: 12 }, { familyPlace: 12 }] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-police', { description: 'Ada arrives at Police Station', verifications: [
      { spec: 'The family destination control is visible', check: async () => expect(page.getByLabel('Family destination')).toHaveValue('1') },
      { spec: 'The default dispatch truthfully names Wainwright', check: async () => expect(page.getByRole('button', { name: 'Send family to Wainwright' })).toBeEnabled() },
      { spec: 'Movement enters action without moving the family', check: async () => expectState(page, { eventCount: 6, game: { phase: 'action', players: [{ merchantPlace: 12, familyPlace: 12, assistantsCarried: 3 }, {}] } }) }
    ] });

    await page.getByLabel('Family destination').selectOption('2');
    await ada.step('host-chooses-fabric-for-family', { description: 'Ada chooses Fabric Warehouse for her family member', verifications: [
      { spec: 'Fabric Warehouse is visibly selected', check: async () => expect(page.getByLabel('Family destination')).toHaveValue('2') },
      { spec: 'The dispatch button updates before commitment', check: async () => expect(page.getByRole('button', { name: 'Send family to Fabric Warehouse' })).toBeEnabled() },
      { spec: 'A local select does not append history', check: async () => expectState(page, { eventCount: 6, game: { phase: 'action', players: [{ familyPlace: 12 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Send family to Fabric Warehouse' }).click();
    await ada.step('host-dispatches-family', { description: 'Ada dispatches her family to Fabric Warehouse', verifications: [
      { spec: 'The remote Warehouse action opens in place of Police', check: async () => expect(page.getByRole('button', { name: 'Fill fabric to 2' })).toBeEnabled() },
      { spec: 'Ada’s family marker leaves Police for Place 2', check: async () => expectState(page, { eventCount: 7, game: { phase: 'family-action', pending: { kind: 'family-action', destination: 2 }, players: [{ merchantPlace: 12, familyPlace: 2 }, {}] } }) },
      { spec: 'No merchant toll or encounter interrupts family travel', check: async () => expect(page.getByText('sends family to Fabric Warehouse.')).toBeVisible() }
    ] });

    await page.getByRole('button', { name: 'Fill fabric to 2' }).click();
    await ada.step('host-family-fills-fabric', { description: 'Ada’s family fills her fabric wheelbarrow', verifications: [
      { spec: 'The family action reports exact capacity', check: async () => expect(page.getByText('Filled fabric to capacity 2.', { exact: true })).toBeVisible() },
      { spec: 'Ada gains fabric while her merchant stays at Police', check: async () => expectState(page, { eventCount: 8, game: { phase: 'turn-end', pending: null, lastAction: { kind: 'warehouse-fill', place: 2 }, players: [{ merchantPlace: 12, familyPlace: 2, goods: { fabric: 2 } }, {}] } }) },
      { spec: 'The only continuation is a deliberate turn end', check: async () => expect(page.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-family-turn', { description: 'Ada ends the completed family turn', verifications: [
      { spec: 'Bora becomes the turn-two merchant', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Ada’s family remains at Fabric Warehouse', check: async () => expectState(page, { eventCount: 9, game: { currentTurn: 'Bora', turnNumber: 2, phase: 'movement', players: [{ familyPlace: 2 }, { familyPlace: 12 }] } }) }
    ] });

    await boraPage.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ }).click();
    await bora.step('guest-selects-family-location', { description: 'Bora selects Fabric Warehouse where Ada’s family waits', verifications: [
      { spec: 'The occupied Warehouse is a legal route', check: async () => expect(boraPage.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Bora can leave an assistant there', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() },
      { spec: 'The Governor and Smuggler still share Place 2', check: async () => expectState(boraPage, { eventCount: 9, game: { governorPlace: 2, smugglerPlace: 2, players: [{ familyPlace: 2 }, {}] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-arrives-with-three-encounters', { description: 'Bora arrives among Ada’s family, Governor, and Smuggler', verifications: [
      { spec: 'Place action correctly precedes every other encounter', check: async () => expect(boraPage.getByRole('button', { name: 'Fill fabric to 2' })).toBeEnabled() },
      { spec: 'Arrival itself has not caught or moved any token', check: async () => expectState(boraPage, { eventCount: 10, game: { phase: 'action', players: [{ familyPlace: 2 }, { merchantPlace: 2, goods: { fabric: 0 } }], governorPlace: 2, smugglerPlace: 2 } }) },
      { spec: 'All family and special tokens remain visible on the board', check: async () => expect(boraPage.getByRole('button', { name: /^2 Fabric Warehouse/ })).toContainText('Fabric') }
    ] });

    await boraPage.getByRole('button', { name: 'Fill fabric to 2' }).click();
    await bora.step('guest-fills-before-encounters', { description: 'Bora fills fabric before choosing encounter order', verifications: [
      { spec: 'Three distinct encounter panels are offered', check: async () => { await expect(boraPage.getByLabel("Catch Ada's family")).toBeVisible(); await expect(boraPage.getByLabel('Governor encounter')).toBeVisible(); await expect(boraPage.getByLabel('Smuggler encounter')).toBeVisible(); } },
      { spec: 'Every mandatory and optional choice is persisted', check: async () => expectState(boraPage, { eventCount: 11, game: { phase: 'encounters', pending: { kind: 'encounters', familyUids: [expect.any(String)], governor: 'available', smuggler: true }, players: [{ familyPlace: 2 }, { goods: { fabric: 2 } }] } }) },
      { spec: 'The Place action is complete before encounter event twelve', check: async () => expectState(boraPage, { game: { lastAction: { kind: 'warehouse-fill', place: 2 }, encounterLog: [] } }) }
    ] });

    await boraPage.getByLabel('Smuggler good to gain').selectOption('jewelry');
    await bora.step('guest-chooses-smuggled-jewelry', { description: 'Bora chooses jewelry from the Smuggler', verifications: [
      { spec: 'Jewelry is the visible gain choice', check: async () => expect(boraPage.getByLabel('Smuggler good to gain')).toHaveValue('jewelry') },
      { spec: 'The goods-payment button names jewelry and fabric', check: async () => expect(boraPage.getByRole('button', { name: 'Take jewelry, pay fabric' })).toBeEnabled() },
      { spec: 'The uncommitted selection changes no goods', check: async () => expectState(boraPage, { eventCount: 11, game: { players: [{}, { goods: { fabric: 2, jewelry: 0 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Take jewelry, pay fabric' }).click();
    await bora.step('guest-trades-with-smuggler', { description: 'Bora takes jewelry and pays one fabric', verifications: [
      { spec: 'Smuggler controls disappear while other encounters remain', check: async () => { await expect(boraPage.getByLabel('Smuggler encounter')).toHaveCount(0); await expect(boraPage.getByLabel("Catch Ada's family")).toBeVisible(); await expect(boraPage.getByLabel('Governor encounter')).toBeVisible(); } },
      { spec: 'The trade and independent relocation are atomic', check: async () => { const state = await readState(boraPage); expect(state).toMatchObject({ eventCount: 12, diagnosticCount: 0, game: { phase: 'encounters', pending: { smuggler: false }, players: [{}, { goods: { fabric: 1, jewelry: 1 } }], encounterLog: [{ kind: 'smuggler-trade', dice: [expect.any(Number), expect.any(Number)], destination: expect.any(Number) }] } }); expect(state.game.smugglerPlace).toBe(state.game.encounterLog[0].destination); } },
      { spec: 'The Smuggler’s seeded result is public', check: async () => expectState(page, { eventCount: 12, game: { smugglerPlace: expect.any(Number), players: [{}, { goods: { fabric: 1, jewelry: 1 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Catch for 1 Bonus card' }).click();
    await bora.step('guest-catches-family-for-card', { description: 'Bora catches Ada’s family for a Bonus card', verifications: [
      { spec: 'The mandatory family panel is gone', check: async () => expect(boraPage.getByLabel("Catch Ada's family")).toHaveCount(0) },
      { spec: 'Ada’s family returns to Police and Bora’s hand grows', check: async () => expectState(boraPage, { eventCount: 13, game: { phase: 'encounters', pending: { familyUids: [] }, players: [{ familyPlace: 12 }, { familyPlace: 12 }], localHand: [expect.any(String), expect.any(String)], bonusDrawCount: 23 } }) },
      { spec: 'Governor remains independently optional', check: async () => expect(boraPage.getByRole('button', { name: 'Visit the Governor' })).toBeEnabled() }
    ] });

    await boraPage.getByRole('button', { name: 'Visit the Governor' }).click();
    await bora.step('guest-draws-from-governor', { description: 'Bora accepts the Governor’s Bonus card', verifications: [
      { spec: 'Payment replaces the optional visit immediately', check: async () => { await expect(boraPage.getByLabel('Pay the Governor')).toBeVisible(); await expect(boraPage.getByRole('button', { name: 'Pay Governor 2 Lira' })).toBeEnabled(); } },
      { spec: 'The drawn card is already available to discard', check: async () => expect(boraPage.getByLabel('Governor discard card').locator('option')).toHaveCount(4) },
      { spec: 'Reload-safe state requires payment before any other choice', check: async () => expectState(boraPage, { eventCount: 14, game: { phase: 'encounters', pending: { governor: 'payment' }, localHand: [expect.any(String), expect.any(String), expect.any(String)], encounterLog: [{}, {}, { kind: 'governor-visit' }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Pay Governor 2 Lira' }).click();
    await bora.step('guest-pays-and-relocates-governor', { description: 'Bora pays the Governor and rolls its relocation', verifications: [
      { spec: 'All encounters close into turn end', check: async () => expect(boraPage.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled() },
      { spec: 'Governor payment, dice, and destination are one event', check: async () => { const state = await readState(boraPage); const entry = state.game.encounterLog[3]; expect(state).toMatchObject({ eventCount: 15, diagnosticCount: 0, game: { phase: 'turn-end', pending: null, players: [{}, { lira: 1 }], encounterLog: [{ kind: 'smuggler-trade' }, { kind: 'catch-family' }, { kind: 'governor-visit' }, { kind: 'governor-pay', dice: [expect.any(Number), expect.any(Number)], destination: expect.any(Number) }] } }); expect(state.game.governorPlace).toBe(entry.destination); await expect(boraPage.getByLabel(`Encounter dice ${entry.dice[0]} and ${entry.dice[1]}`)).toBeVisible(); } },
      { spec: 'The two encounter tokens used independent public rolls', check: async () => { const state = await readState(boraPage); expect(state.game.encounterLog.filter((entry: any) => entry.dice)).toHaveLength(2); } }
    ] });

    const completed = await readState(boraPage);
    await boraPage.reload();
    await bora.step('guest-reloads-complete-encounters', { description: 'Bora reloads before ending the encounter turn', verifications: [
      { spec: 'The complete encounter ledger returns', check: async () => expect(boraPage.getByLabel('Resolved encounters').locator('article')).toHaveCount(4) },
      { spec: 'Both token positions, resources, and private hand replay exactly', check: async () => expectState(boraPage, { eventCount: 15, diagnosticCount: 0, game: { phase: 'turn-end', governorPlace: completed.game.governorPlace, smugglerPlace: completed.game.smugglerPlace, encounterLog: completed.game.encounterLog, localHand: completed.game.localHand, players: completed.game.players } }) },
      { spec: 'The turn cannot repeat any completed encounter', check: async () => { await expect(boraPage.getByRole('button', { name: 'Visit the Governor' })).toHaveCount(0); await expect(boraPage.getByLabel('Smuggler encounter')).toHaveCount(0); } }
    ] });

    await boraPage.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await bora.step('guest-ends-encounter-turn', { description: 'Bora ends the fully resolved encounter turn', verifications: [
      { spec: 'Ada begins turn three', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'The transient ledger clears without undoing consequences', check: async () => expectState(boraPage, { eventCount: 16, diagnosticCount: 0, game: { currentTurn: 'Ada', turnNumber: 3, phase: 'movement', pending: null, encounterLog: [], governorPlace: completed.game.governorPlace, smugglerPlace: completed.game.smugglerPlace, players: [{ familyPlace: 12 }, { lira: 1, goods: { fabric: 1, jewelry: 1 } }] } }) },
      { spec: 'The observing client agrees after clockwise handoff', check: async () => expectState(page, { eventCount: 16, game: { currentTurn: 'Ada', governorPlace: completed.game.governorPlace, smugglerPlace: completed.game.smugglerPlace } }) }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
