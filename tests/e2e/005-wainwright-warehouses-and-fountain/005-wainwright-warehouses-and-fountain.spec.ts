import { expect, test } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('wheelbarrow, warehouses, and Fountain resolve as replayable actions', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'CRATE' : 'GOODS';
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
    'Filling every warehouse and gathering an assistant at Fountain',
    'Ada and Bora narrate every action from an empty room through five complete turns. Ada first encounters the honest 7-Lira Wainwright barrier. Bora fills fabric and spice, Ada recalls her Wainwright assistant at Fountain and fills fruit, and both browsers verify the same capacity-bound goods and assistant conservation after replay.'
  );

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed });

    await page.getByRole('button', { name: /^1 Wainwright.*Reachable/ }).click();
    await ada.step('host-selects-wainwright', { description: 'Ada selects Wainwright two spaces away', verifications: [
      { spec: 'Wainwright is selected as a legal route', check: async () => expect(page.getByRole('button', { name: /^1 Wainwright.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada is offered the required assistant drop', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Inspection does not append event six', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: 1 } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-wainwright', { description: 'Ada arrives at Wainwright and leaves an assistant', verifications: [
      { spec: 'The production action panel explains all three extensions and Ada’s tray shows its empty sockets', check: async () => { await expect(page.getByRole('heading', { name: 'Wainwright', exact: true })).toBeVisible(); await expect(page.getByTestId(/^player-tray-/).first().getByLabel('0 of 3 wheelbarrow extensions')).toBeVisible(); } },
      { spec: 'The 7-Lira purchase is truthfully disabled while skip remains available', check: async () => { await expect(page.getByRole('button', { name: 'Buy extension for 7 Lira' })).toBeDisabled(); await expect(page.getByRole('button', { name: 'Skip Wainwright and end turn' })).toBeEnabled(); } },
      { spec: 'Ada has 2 Lira, carries three assistants, and has one at Wainwright', check: async () => expectState(page, { eventCount: 6, game: { phase: 'action', players: [{ merchantPlace: 1, lira: 2, capacity: 2, extensions: 0, assistantsCarried: 3, assistantsByPlace: { 1: 1 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Skip Wainwright and end turn' }).click();
    await ada.step('host-skips-unaffordable-upgrade', { description: 'Ada skips the unaffordable extension and ends turn', verifications: [
      { spec: 'Bora immediately becomes the turn-two route planner', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'No Lira, capacity, extension, or supply changed', check: async () => expectState(page, { eventCount: 7, game: { currentTurn: 'Bora', turnNumber: 2, phase: 'movement', players: [{ lira: 2, capacity: 2, extensions: 0 }, {}] } }) }
    ] });

    await boraPage.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ }).click();
    await bora.step('guest-selects-fabric', { description: 'Bora selects adjacent Fabric Warehouse', verifications: [
      { spec: 'Fabric Warehouse is selected and reachable', check: async () => expect(boraPage.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The drop movement is visible before commitment', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'The canonical stream remains at seven events', check: async () => expectState(boraPage, { eventCount: 7, game: { selectedPlace: 2 } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-arrives-fabric', { description: 'Bora arrives at Fabric Warehouse and leaves an assistant', verifications: [
      { spec: 'The action panel offers an exact fill from 0 to 2 fabric', check: async () => { await expect(boraPage.getByText('Fill fabric from 0 to wheelbarrow capacity 2.')).toBeVisible(); await expect(boraPage.getByRole('button', { name: 'Fill fabric to 2' })).toBeEnabled(); } },
      { spec: 'The empty two-crate track is accessible', check: async () => expect(boraPage.getByLabel('0 of 2 fabric')).toBeVisible() },
      { spec: 'Movement alone changes no goods', check: async () => expectState(boraPage, { eventCount: 8, game: { phase: 'action', players: [{}, { merchantPlace: 2, assistantsCarried: 3, goods: { fabric: 0 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Fill fabric to 2' }).click();
    await bora.step('guest-fills-fabric', { description: 'Bora fills fabric to wheelbarrow capacity', verifications: [
      { spec: 'The completed action panel replaces all action controls', check: async () => { await expect(boraPage.getByText('Filled fabric to capacity 2.', { exact: true })).toBeVisible(); await expect(boraPage.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled(); } },
      { spec: 'Both fabric goods are public in Bora’s resource rail', check: async () => expect(boraPage.getByLabel('Bora goods').getByTitle('Fabric')).toHaveText('2') },
      { spec: 'Event nine closes the action against accidental repeat', check: async () => expectState(boraPage, { eventCount: 9, game: { phase: 'turn-end', lastAction: { kind: 'warehouse-fill', place: 2 }, players: [{}, { goods: { fabric: 2 }, capacity: 2 }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await bora.step('guest-ends-fabric-turn', { description: 'Bora passes clockwise after filling fabric', verifications: [
      { spec: 'Ada becomes current for turn three', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Fabric remains 2 while movement reopens', check: async () => expectState(boraPage, { eventCount: 10, game: { currentTurn: 'Ada', turnNumber: 3, phase: 'movement', players: [{}, { goods: { fabric: 2 } }] } }) }
    ] });

    await page.getByRole('button', { name: /^7 Fountain.*Reachable/ }).click();
    await ada.step('host-selects-fountain', { description: 'Ada selects Fountain from Wainwright', verifications: [
      { spec: 'Fountain is a reachable two-space route', check: async () => expect(page.getByRole('button', { name: /^7 Fountain.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The CTA names the no-drop Fountain exception', check: async () => expect(page.getByRole('button', { name: 'Move here without leaving an assistant' })).toBeVisible() },
      { spec: 'Ada’s Wainwright assistant is still placed before moving', check: async () => expectState(page, { eventCount: 10, game: { selectedPlace: 7, players: [{ assistantsByPlace: { 1: 1 }, assistantsCarried: 3 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here without leaving an assistant' }).click();
    await ada.step('host-arrives-fountain', { description: 'Ada arrives at Fountain without leaving an assistant', verifications: [
      { spec: 'Wainwright appears as one available recall choice', check: async () => expect(page.getByRole('checkbox', { name: 'Wainwright · 1' })).toBeVisible() },
      { spec: 'The action initially offers to recall zero assistants', check: async () => expect(page.getByRole('button', { name: 'Recall 0 assistants', exact: true })).toBeVisible() },
      { spec: 'Fountain movement preserves all assistant counts', check: async () => expectState(page, { eventCount: 11, game: { phase: 'action', players: [{ merchantPlace: 7, assistantsByPlace: { 1: 1 }, assistantsCarried: 3 }, {}] } }) }
    ] });

    await page.getByRole('checkbox', { name: 'Wainwright · 1' }).check();
    await ada.step('host-chooses-assistant', { description: 'Ada chooses the Wainwright assistant to recall', verifications: [
      { spec: 'The ordinary checkbox is visibly checked', check: async () => expect(page.getByRole('checkbox', { name: 'Wainwright · 1' })).toBeChecked() },
      { spec: 'The CTA updates to exactly one assistant', check: async () => expect(page.getByRole('button', { name: 'Recall 1 assistant', exact: true })).toBeEnabled() },
      { spec: 'The local choice has not yet changed canonical assistants', check: async () => expectState(page, { eventCount: 11, game: { players: [{ assistantsByPlace: { 1: 1 }, assistantsCarried: 3 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Recall 1 assistant', exact: true }).click();
    await ada.step('host-recalls-assistant', { description: 'Ada recalls the selected assistant to her merchant stack', verifications: [
      { spec: 'The completion panel reports one recalled assistant', check: async () => expect(page.getByText('Recalled 1 assistant.', { exact: true })).toBeVisible() },
      { spec: 'The Wainwright assistant marker disappears for both observers', check: async () => { await expect(page.getByTitle("Ada's assistant")).toHaveCount(0); await expect(boraPage.getByTitle("Ada's assistant")).toHaveCount(0); } },
      { spec: 'Four carried plus one supply assistant conserve Ada’s five', check: async () => expectState(page, { eventCount: 12, game: { phase: 'turn-end', lastAction: { kind: 'fountain-recall', place: 7 }, players: [{ assistantsCarried: 4, assistantsByPlace: {} }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-fountain-turn', { description: 'Ada passes clockwise after the recall', verifications: [
      { spec: 'Bora becomes current for turn four', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'The recalled assistant remains carried in movement', check: async () => expectState(page, { eventCount: 13, game: { currentTurn: 'Bora', turnNumber: 4, phase: 'movement', players: [{ assistantsCarried: 4 }, {}] } }) }
    ] });

    await boraPage.getByRole('button', { name: /^3 Spice Warehouse.*Reachable/ }).click();
    await bora.step('guest-selects-spice', { description: 'Bora selects Spice Warehouse two spaces away', verifications: [
      { spec: 'Spice Warehouse is selected and reachable', check: async () => expect(boraPage.getByRole('button', { name: /^3 Spice Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'A second assistant drop is required', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Bora still has fabric 2 and spice 0 before moving', check: async () => expectState(boraPage, { eventCount: 13, game: { players: [{}, { goods: { fabric: 2, spice: 0 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-arrives-spice', { description: 'Bora arrives at Spice Warehouse and leaves an assistant', verifications: [
      { spec: 'The panel offers a fill from 0 to 2 spice', check: async () => expect(boraPage.getByRole('button', { name: 'Fill spice to 2' })).toBeEnabled() },
      { spec: 'Bora now carries two assistants with one at each warehouse', check: async () => expectState(boraPage, { eventCount: 14, game: { phase: 'action', players: [{}, { merchantPlace: 3, assistantsCarried: 2, assistantsByPlace: { 2: 1, 3: 1 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Fill spice to 2' }).click();
    await bora.step('guest-fills-spice', { description: 'Bora fills spice to wheelbarrow capacity', verifications: [
      { spec: 'The completion message names capacity 2', check: async () => expect(boraPage.getByText('Filled spice to capacity 2.', { exact: true })).toBeVisible() },
      { spec: 'Bora publicly holds fabric 2 and spice 2', check: async () => expectState(boraPage, { eventCount: 15, game: { phase: 'turn-end', players: [{}, { goods: { fabric: 2, spice: 2 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await bora.step('guest-ends-spice-turn', { description: 'Bora passes clockwise after filling spice', verifications: [
      { spec: 'Ada becomes current for turn five', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Both filled goods survive turn advancement', check: async () => expectState(boraPage, { eventCount: 16, game: { currentTurn: 'Ada', turnNumber: 5, phase: 'movement', players: [{}, { goods: { fabric: 2, spice: 2 } }] } }) }
    ] });

    await page.getByRole('button', { name: /^4 Fruit Warehouse.*Reachable/ }).click();
    await ada.step('host-selects-fruit', { description: 'Ada selects Fruit Warehouse two spaces away', verifications: [
      { spec: 'Fruit Warehouse is selected and reachable', check: async () => expect(page.getByRole('button', { name: /^4 Fruit Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada can leave one of her four carried assistants', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Fruit is zero before the action', check: async () => expectState(page, { eventCount: 16, game: { players: [{ assistantsCarried: 4, goods: { fruit: 0 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-fruit', { description: 'Ada arrives at Fruit Warehouse and leaves an assistant', verifications: [
      { spec: 'The panel offers an exact fill to capacity 2', check: async () => expect(page.getByRole('button', { name: 'Fill fruit to 2' })).toBeEnabled() },
      { spec: 'Ada carries three assistants and has one at Fruit', check: async () => expectState(page, { eventCount: 17, game: { phase: 'action', players: [{ merchantPlace: 4, assistantsCarried: 3, assistantsByPlace: { 4: 1 }, goods: { fruit: 0 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Fill fruit to 2' }).click();
    await ada.step('host-fills-fruit', { description: 'Ada fills fruit to wheelbarrow capacity', verifications: [
      { spec: 'The completion panel reports fruit at capacity 2', check: async () => expect(page.getByText('Filled fruit to capacity 2.', { exact: true })).toBeVisible() },
      { spec: 'Ada publicly holds exactly two fruit', check: async () => expect(page.getByLabel('Ada goods').getByTitle('Fruit')).toHaveText('2') },
      { spec: 'The eighteenth event records the typed warehouse action once', check: async () => expectState(page, { eventCount: 18, game: { phase: 'turn-end', lastAction: { kind: 'warehouse-fill', place: 4, summary: 'Filled fruit to capacity 2.' }, players: [{ goods: { fruit: 2 } }, {}] } }) }
    ] });

    await page.reload();
    await ada.step('host-reloads-completed-fruit', { description: 'Ada reloads before ending the completed Fruit turn', verifications: [
      { spec: 'The completed action panel returns instead of a repeatable fill', check: async () => { await expect(page.getByRole('heading', { name: 'Ada completed Fruit Warehouse.' })).toBeVisible(); await expect(page.getByRole('button', { name: 'Fill fruit to 2' })).toHaveCount(0); } },
      { spec: 'End turn is the only canonical continuation', check: async () => expect(page.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled() },
      { spec: 'Fresh replay restores every good and assistant without diagnostics', check: async () => { const state = await readState(page); expect(state).toMatchObject({ eventCount: 18, diagnosticCount: 0, game: { turnNumber: 5, phase: 'turn-end', players: [{ goods: { fruit: 2 }, assistantsCarried: 3, assistantsByPlace: { 4: 1 } }, { goods: { fabric: 2, spice: 2 }, assistantsCarried: 2, assistantsByPlace: { 2: 1, 3: 1 } }] } }); } }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-fruit-turn', { description: 'Ada passes the completed Fruit turn clockwise', verifications: [
      { spec: 'Bora begins turn six in movement', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'All three warehouse fills remain public to both browsers', check: async () => { const hostState = await readState(page); const guestState = await readState(boraPage); expect(guestState.game.players).toEqual(hostState.game.players); expect(hostState).toMatchObject({ eventCount: 19, diagnosticCount: 0, game: { currentTurn: 'Bora', turnNumber: 6, phase: 'movement', players: [{ goods: { fruit: 2 } }, { goods: { fabric: 2, spice: 2 } }] } }); } }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
