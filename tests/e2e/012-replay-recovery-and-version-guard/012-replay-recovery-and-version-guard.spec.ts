import { expect, test, type BrowserContext } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('cached replay catches up exactly and incompatible history stops safely', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'CACHE' : 'REPLY';
  const seed = 'recovery-12';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, host merchant');
  const boraContext: BrowserContext = await browser.newContext({ baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number }, locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, guest merchant');
  ada.setMetadata('Recovering an immutable Istanbul table without guessing', 'Ada and Bora open a normal game, then Ada reloads from a deliberately retained six-event cache while a seventh canonical event already exists remotely. The visible recovery rail identifies the cached projection, its explicit catch-up action merges the live cursor without duplicates, a second reload proves byte-equivalent state, an uncertain committed write is confirmed under its original ID, a stale concurrent turn is contained, and an incompatible future envelope blocks play with direct update guidance. Every user action is followed by DOM and serialized-state checks plus an exact screenshot.');

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed, extraQuery: '&e2eRecovery=1' });
    await page.getByRole('button', { name: /^3 Spice Warehouse.*Reachable/ }).click();
    await ada.step('host-selects-spice-before-recovery', { description: 'Ada selects Spice Warehouse before a connection break', verifications: [
      { spec: 'The adjacent warehouse route is visibly selected', check: async () => expect(page.getByRole('button', { name: /^3 Spice Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Route inspection remains local at event five', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: 3, phase: 'movement' } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-moves-spice-before-recovery', { description: 'Ada commits movement to Spice Warehouse', verifications: [
      { spec: 'The warehouse action panel appears', check: async () => expect(page.locator('.inspector').getByRole('heading', { name: 'Spice Warehouse' })).toBeVisible() },
      { spec: 'Event six places Ada at Spice Warehouse', check: async () => expectState(page, { eventCount: 6, diagnosticCount: 0, game: { phase: 'action', players: [{ merchantPlace: 3 }, {}] } }) }
    ] });

    await page.locator('.inspector').getByRole('button', { name: 'Skip warehouse and end turn' }).click();
    await bora.step('guest-observes-live-seventh-event', { description: 'Bora observes Ada’s seventh event on the live stream', verifications: [
      { spec: 'The next clockwise turn is Bora’s', check: async () => expect(boraPage.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Remote history contains seven accepted events', check: async () => expectState(boraPage, { eventCount: 7, diagnosticCount: 0, game: { currentTurn: 'Bora', phase: 'movement' } }) }
    ] });

    await page.goto(`/?room=${roomCode}&e2eRecovery=1&e2eCacheCount=6`);
    await ada.step('host-restores-six-event-cache', { description: 'Ada reloads the last verified local projection', verifications: [
      { spec: 'The recovery rail reports six cached events and catch-up', check: async () => expect(page.getByLabel('History recovery status')).toContainText('Restored 6 cached events · catching up') },
      { spec: 'The cached action phase is playable without invented history', check: async () => expectState(page, { eventCount: 6, diagnosticCount: 0, recovery: { notice: 'Restored 6 cached events · catching up' }, game: { currentTurn: 'Ada', phase: 'action', players: [{ merchantPlace: 3 }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Catch up live history' }).click();
    await ada.step('host-catches-up-live-cursor', { description: 'Ada catches the cache up to canonical live history', verifications: [
      { spec: 'The rail confirms all seven events are verified', check: async () => expect(page.getByLabel('History recovery status')).toContainText('Live history synced · 7 events verified') },
      { spec: 'Cursor merge adds only the missing event', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, recovery: { notice: 'Live history synced · 7 events verified' }, game: { currentTurn: 'Bora', phase: 'movement' } }) }
    ] });
    const caughtUp = await readState(page);
    await page.goto(`/?room=${roomCode}&e2eRecovery=1&e2eCacheCount=7`);
    await ada.step('host-reloads-caught-up-projection', { description: 'Ada reloads the caught-up immutable projection', verifications: [
      { spec: 'Seven cached events are restored before another live cursor', check: async () => expect(page.getByLabel('History recovery status')).toContainText('Restored 7 cached events · catching up') },
      { spec: 'Public game projection is byte-equivalent after recovery', check: async () => { const reloaded = await readState(page); expect(reloaded.game).toEqual(caughtUp.game); expect(reloaded).toMatchObject({ eventCount: 7, diagnosticCount: 0 }); } }
    ] });
    await page.getByRole('button', { name: 'Catch up live history' }).click();
    await ada.step('host-confirms-idempotent-cursor', { description: 'Ada repeats live catch-up without duplicating an event', verifications: [
      { spec: 'The recovery rail remains at seven verified events', check: async () => expect(page.getByLabel('History recovery status')).toContainText('7 events verified') },
      { spec: 'Duplicate IDs remain one accepted event each', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, game: { currentTurn: 'Bora', phase: 'movement' } }) }
    ] });
    await page.getByRole('button', { name: 'Review same-ID retry' }).click();
    await ada.step('host-stages-same-id-retry', { description: 'Ada reviews an uncertain already-committed write', verifications: [
      { spec: 'The recovery rail offers the original sequence ID for retry', check: async () => expect(page.getByRole('button', { name: /Retry pending event/ })).toBeVisible() },
      { spec: 'Staging retry changes no accepted event or game state', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, recovery: { pendingRetryId: expect.any(String) }, game: { currentTurn: 'Bora', phase: 'movement' } }) }
    ] });
    await page.getByRole('button', { name: /Retry pending event/ }).click();
    await ada.step('host-confirms-same-id-retry', { description: 'Ada confirms the write under its original immutable ID', verifications: [
      { spec: 'The rail reports the original sequence was retried', check: async () => expect(page.getByLabel('History recovery status')).toContainText(/Retried \d{6} with its original event ID/) },
      { spec: 'Confirmation neither duplicates nor diagnoses the committed event', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, recovery: { pendingRetryId: null }, game: { currentTurn: 'Bora', phase: 'movement' } }) }
    ] });
    const beforeStale = (await readState(page)).game;
    await page.getByRole('button', { name: 'Review stale concurrent event' }).click();
    await ada.step('host-contains-stale-concurrent-event', { description: 'Ada receives a stale concurrent turn event', verifications: [
      { spec: 'The rail explains that the stale event was contained', check: async () => expect(page.getByLabel('History recovery status')).toContainText('Stale concurrent event contained') },
      { spec: 'The event is diagnosed, not accepted, and game state is unchanged', check: async () => { const state = await readState(page); expect(state).toMatchObject({ eventCount: 7, diagnosticCount: 1 }); expect(state.game).toEqual(beforeStale); } }
    ] });
    await page.getByRole('button', { name: 'Review incompatible history' }).click();
    await ada.step('host-reviews-incompatible-history', { description: 'Ada encounters history from a future schema', verifications: [
      { spec: 'A blocking update message replaces all game controls', check: async () => { await expect(page.getByRole('heading', { name: 'This table needs a newer Istanbul build.' })).toBeVisible(); await expect(page.getByTestId('bazaar-board')).toHaveCount(0); } },
      { spec: 'The future envelope is diagnosed and never accepted', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 2, recovery: { incompatible: true } }) }
    ] });
    ada.generateDocs();
  } finally { await boraContext.close(); }
});
