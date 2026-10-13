import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';
import { expectState, readState } from '../helpers/game-journey';

test('an unaffordable merchant waits for acknowledgement before the bot can act', async ({ page, browser }, testInfo) => {
  const steps = new TestStepHelper(page, testInfo);
  steps.setMetadata('Choose before losing a turn', 'An unaffordable neutral merchant opens a warning on the room itself. Backing out leaves all game state unchanged; only the explicit lost-turn button commits the move and lets the bot play.');
  const roomCode = testInfo.project.name === 'phone' ? 'TOLLP' : 'TOLLD';
  const phoneContext = await browser.newContext({ baseURL: String(testInfo.project.use.baseURL) });
  const phone = await phoneContext.newPage();
  try {
    await page.goto(`/tabletop/?e2eRoom=${roomCode}&e2eSeed=5931f6f0-9b64-4e00-923a-f8ef49d673cc`);
    await phone.goto(`/?room=${roomCode}&seat=4`);
    await phone.getByLabel('Your merchant name').fill('Alex');
    await phone.getByRole('button', { name: /Join the room/ }).click();
    await phone.getByRole('button', { name: /I am ready/ }).click();
    await page.getByRole('button', { name: 'Add bot at position 8', exact: true }).click();
    await page.getByRole('button', { name: 'Open the bazaar' }).click();
    await expectState(page, { game: { currentTurn: 'Alex', turnNumber: 2, phase: 'movement' } });
    await page.locator('[data-place-id="2"]').click();
    const tile = page.locator('.zoom-tile:not([inert])');
    await tile.getByRole('button', { name: 'End turn', exact: true }).click();
    await expectState(page, { game: { currentTurn: 'Alex', turnNumber: 4, phase: 'movement' } });
    await page.locator('[data-place-id="14"]').click();
    await tile.getByRole('button', { name: /Pay 2 & roll/ }).click();
    await tile.getByRole('button', { name: /fabric/i }).click();
    await tile.getByRole('button', { name: 'End turn', exact: true }).click();
    await expectState(page, { game: { currentTurn: 'Alex', turnNumber: 6, phase: 'movement' } });
    const before = await readState(page);
    await page.locator('[data-place-id="9"]').click();
    await steps.step('unaffordable-merchant', { description: 'The Tea House shows the neutral merchant and explains the lost turn before moving', verifications: [
      { spec: 'The player must explicitly acknowledge losing the turn', check: async () => expect(tile.getByRole('button', { name: 'Move here & lose this turn' })).toBeVisible() },
      { spec: 'No move or bot action has entered history', check: async () => expectState(page, { eventCount: before.eventCount, game: before.game }) }
    ] });
    await tile.getByRole('button', { name: 'Choose another room' }).click();
    await expectState(page, { eventCount: before.eventCount, game: before.game });
    await page.reload();
    await expectState(page, { eventCount: before.eventCount, game: before.game });
    await page.locator('[data-place-id="9"]').click();
    await tile.getByRole('button', { name: 'Move here & lose this turn' }).click();
    await expectState(page, { diagnosticCount: 0, game: { currentTurn: 'Alex', turnNumber: 8, phase: 'movement', players: [{ merchantPlace: 9, lira: 1 }, {}] } });
    steps.generateDocs();
  } finally { await phoneContext.close(); }
});
