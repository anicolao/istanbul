import { expect, test } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('the zero-distance Bonus move performs the normal assistant pickup or drop', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'ZERPH' : 'ZERDS';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Using the zero-distance Bonus move',
    'Ada and Bora open an ordinary two-player bazaar and review both sides of Work where you stand. Ada starts at Fruit Warehouse with an assistant already there, so the card clearly offers to pick it up before opening the Place action. After Ada completes that turn, Bora starts at Fabric Warehouse without a remote assistant, so the same graphical card clearly offers to leave one. The walkthrough proves the exact assistant inventories, zero-distance movement records, private card disposal, immutable replay, fitted UI, and screenshots after every input.'
  );

  try {
    await openTwoPlayerGame({
      hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed: 'zero-move-4',
      extraQuery: '&e2eReview=zero-move'
    });

    await page.getByRole('button', { name: 'Review zero-distance Bonus move' }).click();
    await ada.step('host-opens-zero-move-position', { description: 'Ada opens the reviewed zero-distance position', verifications: [
      { spec: 'Ada is at Fruit Warehouse with exactly one assistant waiting there', check: async () => expectState(page, { eventCount: 6, diagnosticCount: 0, game: { phase: 'movement', players: [{ merchantPlace: 4, assistantsCarried: 3, assistantsByPlace: { 4: 1 } }, { merchantPlace: 2, assistantsCarried: 4, assistantsByPlace: {} }] } }) },
      { spec: 'Both private hands contain a Work where you stand card without exposing the other title', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(host.game.localHand).toContain('bonus-stay-1'); expect(guest.game.localHand).toContain('bonus-stay-2'); await expect(page.getByText('Bonus hand · 2 hidden cards')).toBeVisible(); } },
      { spec: 'Fruit Warehouse graphically holds Ada’s assistant beneath her merchant', check: async () => expect(page.getByLabel("Ada's assistant")).toBeVisible() }
    ] });

    await page.getByRole('button', { name: /Inspect Bonus card: Work where you stand/ }).click();
    await ada.step('host-inspects-zero-move-pickup', { description: 'Ada inspects the graphical zero-distance card', verifications: [
      { spec: 'The card explains both normal assistant outcomes', check: async () => expect(page.getByTestId('illustrated-bonus-card')).toContainText(/pick up your assistant if present; otherwise leave one/) },
      { spec: 'The current board state produces an explicit pickup action', check: async () => expect(page.getByRole('button', { name: 'Stay and pick up assistant' })).toBeEnabled() },
      { spec: 'Inspecting a private card does not change canonical state', check: async () => expectState(page, { eventCount: 6, game: { selectedBonus: 'bonus-stay-1', phase: 'movement' } }) }
    ] });

    await page.getByRole('button', { name: 'Stay and pick up assistant' }).click();
    await ada.step('host-stays-and-picks-up', { description: 'Ada stays and picks up the assistant at Fruit Warehouse', verifications: [
      { spec: 'The normal Fruit Warehouse action opens at zero distance', check: async () => expect(page.getByRole('button', { name: 'Fill fruit to 2' })).toBeEnabled() },
      { spec: 'The movement record is distance zero with a real pickup operation', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, game: { phase: 'action', lastMovement: { from: 4, to: 4, distance: 0, assistantAction: 'pick-up' }, players: [{ merchantPlace: 4, assistantsCarried: 4, assistantsByPlace: {} }, {}], localHand: ['bonus-wild-small-market-1'] } }) },
      { spec: 'The spent card log and board both show the pickup consequence', check: async () => { await expect(page.getByText(/Stayed at Place 4 and picked up 1 assistant/)).toBeVisible(); await expect(page.getByLabel("Ada's assistant")).toHaveCount(0); } }
    ] });

    await page.getByRole('button', { name: 'Fill fruit to 2' }).click();
    await ada.step('host-fills-fruit-after-zero-move', { description: 'Ada fills fruit after the zero-distance pickup', verifications: [
      { spec: 'Fruit reaches capacity and the turn is ready to pass', check: async () => expectState(page, { eventCount: 8, game: { phase: 'turn-end', players: [{ goods: { fruit: 2 }, assistantsCarried: 4, assistantsByPlace: {} }, {}] } }) },
      { spec: 'The ordinary end-turn control remains available', check: async () => expect(page.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-passes-to-second-zero-move', { description: 'Ada passes the next zero-distance card to Bora’s turn', verifications: [
      { spec: 'Bora begins movement at Fabric Warehouse with all four assistants carried', check: async () => expectState(page, { eventCount: 9, diagnosticCount: 0, game: { currentTurn: 'Bora', turnNumber: 2, phase: 'movement', players: [{ assistantsCarried: 4, assistantsByPlace: {} }, { merchantPlace: 2, assistantsCarried: 4, assistantsByPlace: {} }] } }) },
      { spec: 'Ada sees the waiting state instead of Bora’s private decision', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() }
    ] });

    await boraPage.getByRole('button', { name: /Inspect Bonus card: Work where you stand/ }).click();
    await bora.step('guest-inspects-zero-move-drop', { description: 'Bora inspects the same card with no assistant at Fabric Warehouse', verifications: [
      { spec: 'The current board state produces an explicit leave action', check: async () => expect(boraPage.getByRole('button', { name: 'Stay and leave assistant' })).toBeEnabled() },
      { spec: 'Bora’s four carried assistants and empty Fabric space are unchanged while inspecting', check: async () => expectState(boraPage, { eventCount: 9, game: { selectedBonus: 'bonus-stay-2', phase: 'movement', players: [{}, { merchantPlace: 2, assistantsCarried: 4, assistantsByPlace: {} }] } }) },
      { spec: 'Bora sees the full graphical Bonus card while Ada’s remaining card stays private', check: async () => { await expect(boraPage.getByTestId('illustrated-bonus-card')).toBeVisible(); const guest = await readState(boraPage); const host = await readState(page); expect(guest.game.opponentHandCounts).toEqual([1]); expect(host.game.localHand).toEqual(['bonus-wild-small-market-1']); } }
    ] });

    await boraPage.getByRole('button', { name: 'Stay and leave assistant' }).click();
    await bora.step('guest-stays-and-leaves-assistant', { description: 'Bora stays and leaves an assistant at Fabric Warehouse', verifications: [
      { spec: 'The normal Fabric Warehouse action opens at zero distance', check: async () => expect(boraPage.getByRole('button', { name: 'Fill fabric to 2' })).toBeEnabled() },
      { spec: 'The movement record is distance zero with a real drop operation', check: async () => expectState(boraPage, { eventCount: 10, diagnosticCount: 0, game: { phase: 'action', lastMovement: { from: 2, to: 2, distance: 0, assistantAction: 'drop' }, players: [{}, { merchantPlace: 2, assistantsCarried: 3, assistantsByPlace: { 2: 1 } }] } }) },
      { spec: 'The spent card log names the drop and the graphical assistant is rendered at Fabric', check: async () => { await expect(boraPage.getByText(/Stayed at Place 2 and left 1 assistant/)).toBeVisible(); await expect(boraPage.getByLabel("Bora's assistant")).toBeAttached(); } }
    ] });

    const completed = await readState(boraPage);
    await boraPage.reload();
    await bora.step('guest-reloads-zero-move-drop', { description: 'Bora reloads the completed zero-distance drop', verifications: [
      { spec: 'The exact assistant inventories, discarded card, and action phase replay', check: async () => expectState(boraPage, { eventCount: 10, diagnosticCount: 0, game: { phase: 'action', lastMovement: completed.game.lastMovement, players: completed.game.players, localHand: completed.game.localHand } }) },
      { spec: 'Fabric Warehouse still renders Bora’s graphical assistant', check: async () => expect(boraPage.getByLabel("Bora's assistant")).toBeAttached() },
      { spec: 'Reload offers the Place action—not a duplicate Bonus play', check: async () => { await expect(boraPage.getByRole('button', { name: 'Fill fabric to 2' })).toBeEnabled(); await expect(boraPage.getByRole('button', { name: /Inspect Bonus card: Work where you stand/ })).toHaveCount(0); } }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
