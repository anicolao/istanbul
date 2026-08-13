import { expect, test } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('Yellow Mosque visibly recalls one assistant before movement and only once per turn', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'YELPH' : 'YELDS';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Invoking Yellow Mosque before movement',
    'Ada and Bora open an ordinary two-player bazaar. The reviewed position gives Ada the enabled Yellow Mosque tile and leaves one of her assistants at Small Mosque. Ada invokes the graphical power before moving, pays exactly two Lira, sees the assistant return to her merchant stack, reloads the immutable result, then completes a normal Warehouse turn. Every input and consequence is shown below.'
  );

  try {
    await openTwoPlayerGame({
      hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed: 'yellow-0',
      extraQuery: '&e2eReview=yellow-recall'
    });

    await page.getByRole('button', { name: 'Review Yellow Mosque recall' }).click();
    await ada.step('host-opens-yellow-recall', { description: 'Ada reviews an enabled Yellow Mosque recall', verifications: [
      { spec: 'A large square Yellow power and explicit invoke heading replace the phone route copy', check: async () => { const panel = page.getByLabel('Yellow Mosque recall'); await expect(panel.getByLabel('Enabled Yellow Mosque power')).toBeVisible(); await expect(panel.getByText('Invoke Yellow Mosque', { exact: true })).toBeVisible(); } },
      { spec: 'The button names the exact assistant location and two-Lira price', check: async () => expect(page.getByRole('button', { name: 'Recall from Small Mosque · 2 Lira' })).toBeEnabled() },
      { spec: 'The reviewed state conserves four assistants and exposes Yellow in Ada’s tray', check: async () => expectState(page, { eventCount: 6, diagnosticCount: 0, game: { phase: 'movement', abilitiesUsedThisTurn: [], players: [{ lira: 6, assistantsCarried: 3, assistantsByPlace: { 14: 1 }, mosqueTileIds: ['mosque-fruit-2'] }, {}] } }) },
      { spec: 'Small Mosque visibly holds Ada’s remote assistant', check: async () => expect(page.getByLabel("Ada's assistant")).toBeVisible() }
    ] });

    await page.getByRole('button', { name: 'Recall from Small Mosque · 2 Lira' }).click();
    await ada.step('host-invokes-yellow-recall', { description: 'Ada pays two Lira and recalls the Small Mosque assistant', verifications: [
      { spec: 'The recalled assistant returns to Ada’s merchant stack', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, game: { phase: 'movement', abilitiesUsedThisTurn: ['fruit'], players: [{ lira: 4, assistantsCarried: 4, assistantsByPlace: {}, mosqueTileIds: ['mosque-fruit-2'] }, {}] } }) },
      { spec: 'The immutable action summary names its origin', check: async () => expectState(page, { game: { lastAction: { summary: 'Paid 2 Lira to recall 1 assistant from Place 14.' } } }) },
      { spec: 'The once-per-turn invoke panel closes immediately', check: async () => expect(page.getByLabel('Yellow Mosque recall')).toHaveCount(0) },
      { spec: 'Small Mosque no longer displays Ada’s assistant', check: async () => expect(page.getByLabel("Ada's assistant")).toHaveCount(0) }
    ] });

    const recalled = await readState(page);
    await page.reload();
    await ada.step('host-reloads-yellow-recall', { description: 'Ada reloads the completed Yellow recall', verifications: [
      { spec: 'The exact Lira, assistant, and used-power state replays', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, game: { abilitiesUsedThisTurn: ['fruit'], players: recalled.game.players } }) },
      { spec: 'Yellow remains graphically enabled in Ada’s player mat', check: async () => { const tile = page.getByLabel('Ada Mosque tiles').locator('[data-power-color="fruit"]'); await expect(tile).toHaveAttribute('data-enabled', 'true'); await expect(tile.getByLabel(/Yellow Mosque power/)).toBeVisible(); } },
      { spec: 'Reload cannot offer a second recall in the same turn', check: async () => expect(page.getByLabel('Yellow Mosque recall')).toHaveCount(0) }
    ] });

    await page.getByRole('button', { name: /^4 Fruit Warehouse.*Reachable/ }).click();
    await ada.step('host-selects-fruit-after-recall', { description: 'Ada selects Fruit Warehouse after recalling the assistant', verifications: [
      { spec: 'Fruit Warehouse is still a normal legal route', check: async () => expect(page.getByRole('button', { name: /^4 Fruit Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The returned assistant makes the drop operation available', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() },
      { spec: 'Route inspection adds no event or second ability use', check: async () => expectState(page, { eventCount: 7, game: { selectedPlace: 4, abilitiesUsedThisTurn: ['fruit'], players: [{ assistantsCarried: 4 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-moves-after-yellow-recall', { description: 'Ada moves normally and leaves an assistant at Fruit Warehouse', verifications: [
      { spec: 'The Warehouse action opens after the ordinary assistant drop', check: async () => expect(page.getByRole('button', { name: 'Fill fruit to 2' })).toBeEnabled() },
      { spec: 'Assistant conservation and the used Yellow marker remain exact', check: async () => expectState(page, { eventCount: 8, diagnosticCount: 0, game: { phase: 'action', abilitiesUsedThisTurn: ['fruit'], players: [{ merchantPlace: 4, assistantsCarried: 3, assistantsByPlace: { 4: 1 }, lira: 4 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Fill fruit to 2' }).click();
    await ada.step('host-fills-fruit-after-recall', { description: 'Ada fills fruit after using Yellow', verifications: [
      { spec: 'The Warehouse resolves without reopening Yellow', check: async () => expect(page.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled() },
      { spec: 'Fruit fills and the recall remains spent for this turn', check: async () => expectState(page, { eventCount: 9, game: { phase: 'turn-end', abilitiesUsedThisTurn: ['fruit'], players: [{ goods: { fruit: 2 }, lira: 4 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-yellow-turn', { description: 'Ada passes after the Yellow-assisted turn', verifications: [
      { spec: 'Bora receives the next movement turn', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'The once-per-turn marker resets while the recalled assistant stays conserved', check: async () => expectState(page, { eventCount: 10, diagnosticCount: 0, game: { currentTurn: 'Bora', turnNumber: 2, phase: 'movement', abilitiesUsedThisTurn: [], players: [{ assistantsCarried: 3, assistantsByPlace: { 4: 1 }, lira: 4, mosqueTileIds: ['mosque-fruit-2'] }, {}] } }) },
      { spec: 'Bora observes the same public assistant and power state', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(guest.game.players).toEqual(host.game.players); } }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
