import { expect, test } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('Tea House wagers and Black Market goods use seeded replayable dice', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'DICES' : 'WAGER';
  const seed = 'dice-safe-0';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Wagering at Tea House and rolling for Black Market jewelry',
    'Ada and Bora narrate every input from room creation through deterministic dice at both chance Places. Ada changes and commits a Tea House wager, both clients verify its exact dice and Lira result after reload, Bora deliberately skips an intermediate card stop, Ada crosses Small Market without stock, and Bora chooses spice before the Black Market roll awards the exact jewelry tier.'
  );

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed });

    await page.getByRole('button', { name: /^9 Tea House.*Reachable/ }).click();
    await ada.step('host-selects-tea-house', { description: 'Ada selects Tea House two spaces away', verifications: [
      { spec: 'Tea House is selected as a legal route', check: async () => expect(page.getByRole('button', { name: /^9 Tea House.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada is offered an assistant drop', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'No dice are consumed during route inspection', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: 9, lastRoll: null } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-tea-house', { description: 'Ada arrives at Tea House before declaring', verifications: [
      { spec: 'The default wager is a visible 7 Lira', check: async () => expect(page.getByLabel('Tea House wager')).toHaveValue('7') },
      { spec: 'The wager button truthfully names 7', check: async () => expect(page.getByRole('button', { name: 'Wager 7 and roll both dice' })).toBeEnabled() },
      { spec: 'Movement alone adds no Lira or roll', check: async () => expectState(page, { eventCount: 6, game: { phase: 'action', lastRoll: null, players: [{ merchantPlace: 9, lira: 2 }, {}] } }) }
    ] });

    await page.getByLabel('Tea House wager').selectOption('10');
    await ada.step('host-declares-ten', { description: 'Ada raises the Tea House declaration to 10', verifications: [
      { spec: 'The ordinary select visibly reads 10 Lira', check: async () => expect(page.getByLabel('Tea House wager')).toHaveValue('10') },
      { spec: 'The commitment control updates to Wager 10', check: async () => expect(page.getByRole('button', { name: 'Wager 10 and roll both dice' })).toBeEnabled() },
      { spec: 'The local declaration has not appended event seven', check: async () => expectState(page, { eventCount: 6, game: { phase: 'action', players: [{ lira: 2 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Wager 10 and roll both dice' }).click();
    await ada.step('host-rolls-tea-house', { description: 'Ada commits the wager and rolls both seeded dice', verifications: [
      { spec: 'Two production dice display the canonical result', check: async () => { await expectState(page, { eventCount: 7, game: { lastRoll: { place: 9 } } }); const state = await readState(page); await expect(page.getByLabel(`Dice result ${state.game.lastRoll.dice[0]} and ${state.game.lastRoll.dice[1]}`)).toBeVisible(); } },
      { spec: 'The reward is 10 on success or exactly 2 on failure', check: async () => { const state = await readState(page); const sum = state.game.lastRoll.dice[0] + state.game.lastRoll.dice[1]; expect(state.game.lastRoll).toMatchObject({ place: 9, declared: 10, reward: sum >= 10 ? 10 : 2 }); expect(state.game.players[0].lira).toBe(2 + (sum >= 10 ? 10 : 2)); } },
      { spec: 'The action closes after one deterministic roll', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, game: { phase: 'turn-end', lastAction: { kind: 'tea-house-wager', place: 9 } } }) }
    ] });

    const teaState = await readState(page);
    await page.reload();
    await ada.step('host-reloads-tea-result', { description: 'Ada reloads the completed Tea House result', verifications: [
      { spec: 'The exact two dice return after replay', check: async () => expect(page.getByLabel(`Dice result ${teaState.game.lastRoll.dice[0]} and ${teaState.game.lastRoll.dice[1]}`)).toBeVisible() },
      { spec: 'The declared wager and reward are unchanged', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, game: { phase: 'turn-end', lastRoll: teaState.game.lastRoll, players: [{ lira: teaState.game.players[0].lira }, {}] } }) },
      { spec: 'Roll cannot be repeated after hydration', check: async () => expect(page.getByRole('button', { name: /Wager .* roll/ })).toHaveCount(0) }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-tea-turn', { description: 'Ada passes the resolved Tea House turn', verifications: [
      { spec: 'Bora becomes the turn-two merchant', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'The immutable Tea result remains in history', check: async () => expectState(page, { eventCount: 8, game: { currentTurn: 'Bora', phase: 'movement', lastRoll: teaState.game.lastRoll } }) }
    ] });

    await boraPage.getByRole('button', { name: /^6 Caravansary.*Reachable/ }).click();
    await bora.step('guest-selects-caravan-waypoint', { description: 'Bora selects Caravansary as a Black Market waypoint', verifications: [
      { spec: 'Caravansary is a legal two-space route', check: async () => expect(boraPage.getByRole('button', { name: /^6 Caravansary.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Bora must leave an assistant', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'The Tea result is not consumed by a new route', check: async () => expectState(boraPage, { eventCount: 8, game: { lastRoll: teaState.game.lastRoll } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-arrives-caravan-waypoint', { description: 'Bora arrives at Caravansary without drawing', verifications: [
      { spec: 'The full Caravansary card controls are visible', check: async () => expect(boraPage.getByRole('button', { name: 'Skip Caravansary and end turn' })).toBeEnabled() },
      { spec: 'Card counts remain untouched by movement', check: async () => expectState(boraPage, { eventCount: 9, game: { phase: 'action', bonusDrawCount: 24, bonusDiscard: [], players: [{}, { merchantPlace: 6 }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Skip Caravansary and end turn' }).click();
    await bora.step('guest-skips-caravan', { description: 'Bora skips the optional Caravansary trade', verifications: [
      { spec: 'Ada starts turn three immediately', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'No Bonus card moved while advancing', check: async () => expectState(boraPage, { eventCount: 10, game: { currentTurn: 'Ada', phase: 'movement', bonusDrawCount: 24, bonusDiscard: [] } }) }
    ] });

    await page.getByRole('button', { name: /^11 Small Market.*Reachable/ }).click();
    await ada.step('host-selects-market-waypoint', { description: 'Ada selects adjacent Small Market as a crossing', verifications: [
      { spec: 'Small Market is selected beside Tea House', check: async () => expect(page.getByRole('button', { name: /^11 Small Market.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada can leave her second assistant', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Ada has no goods available to sell', check: async () => expectState(page, { eventCount: 10, game: { players: [{ goods: { fabric: 0, spice: 0, fruit: 0, jewelry: 0 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-empty-market', { description: 'Ada arrives at Small Market with an empty wheelbarrow', verifications: [
      { spec: 'Every Demand choice is visible but unaffordable', check: async () => expect(page.getByLabel('Small Market demand').getByRole('checkbox')).toHaveCount(5) },
      { spec: 'The zero-good sale is disabled', check: async () => expect(page.getByRole('button', { name: 'Sell selected goods for 0 Lira' })).toBeDisabled() },
      { spec: 'Demand has not rotated', check: async () => expectState(page, { eventCount: 11, game: { phase: 'action', players: [{ merchantPlace: 11 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Skip market and end turn' }).click();
    await ada.step('host-skips-empty-market', { description: 'Ada skips the unaffordable sale', verifications: [
      { spec: 'Bora starts turn four at the Black Market waypoint', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Skipping neither rotates Demand nor adds a roll', check: async () => expectState(page, { eventCount: 12, game: { currentTurn: 'Bora', phase: 'movement', lastRoll: teaState.game.lastRoll } }) }
    ] });

    await boraPage.getByRole('button', { name: /^8 Black Market.*Reachable/ }).click();
    await bora.step('guest-selects-black-market', { description: 'Bora selects adjacent Black Market', verifications: [
      { spec: 'Black Market is a one-space legal route', check: async () => expect(boraPage.getByRole('button', { name: /^8 Black Market.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Bora must leave a second assistant', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Bora begins with no goods', check: async () => expectState(boraPage, { eventCount: 12, game: { players: [{}, { goods: { fabric: 0, spice: 0, fruit: 0, jewelry: 0 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-arrives-black-market', { description: 'Bora arrives before choosing a basic good', verifications: [
      { spec: 'Fabric is the transparent default choice', check: async () => expect(boraPage.getByRole('radio', { name: 'Fabric' })).toBeChecked() },
      { spec: 'The roll control names fabric', check: async () => expect(boraPage.getByRole('button', { name: 'Take fabric and roll both dice' })).toBeEnabled() },
      { spec: 'No good or new roll is granted by arrival', check: async () => expectState(boraPage, { eventCount: 13, game: { phase: 'action', players: [{}, { merchantPlace: 8, goods: { spice: 0, jewelry: 0 } }] } }) }
    ] });

    await boraPage.getByRole('radio', { name: 'Spice' }).check();
    await bora.step('guest-chooses-spice', { description: 'Bora chooses spice as the guaranteed good', verifications: [
      { spec: 'Spice is visibly selected', check: async () => expect(boraPage.getByRole('radio', { name: 'Spice' })).toBeChecked() },
      { spec: 'The commitment control now names spice', check: async () => expect(boraPage.getByRole('button', { name: 'Take spice and roll both dice' })).toBeEnabled() },
      { spec: 'The local choice changes no canonical goods', check: async () => expectState(boraPage, { eventCount: 13, game: { players: [{}, { goods: { spice: 0, jewelry: 0 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Take spice and roll both dice' }).click();
    await bora.step('guest-rolls-black-market', { description: 'Bora takes spice and rolls for jewelry', verifications: [
      { spec: 'The two seeded dice are displayed as production pieces', check: async () => { await expectState(boraPage, { eventCount: 14, game: { lastRoll: { place: 8 } } }); const state = await readState(boraPage); await expect(boraPage.getByLabel(`Dice result ${state.game.lastRoll.dice[0]} and ${state.game.lastRoll.dice[1]}`)).toBeVisible(); } },
      { spec: 'The jewelry reward matches the official 7/9/11 thresholds', check: async () => { const state = await readState(boraPage); const sum = state.game.lastRoll.dice[0] + state.game.lastRoll.dice[1]; const jewelry = sum >= 11 ? 3 : sum >= 9 ? 2 : sum >= 7 ? 1 : 0; expect(state.game.lastRoll).toMatchObject({ place: 8, reward: jewelry }); expect(state.game.players[1].goods).toMatchObject({ spice: 1, jewelry }); } },
      { spec: 'One event records both the choice and derived roll', check: async () => expectState(boraPage, { eventCount: 14, diagnosticCount: 0, game: { phase: 'turn-end', lastAction: { kind: 'black-market-roll', place: 8 } } }) }
    ] });

    const blackState = await readState(boraPage);
    await boraPage.reload();
    await bora.step('guest-reloads-black-result', { description: 'Bora reloads the completed Black Market result', verifications: [
      { spec: 'The exact dice pair returns after replay', check: async () => expect(boraPage.getByLabel(`Dice result ${blackState.game.lastRoll.dice[0]} and ${blackState.game.lastRoll.dice[1]}`)).toBeVisible() },
      { spec: 'Spice, jewelry, and reward are unchanged', check: async () => expectState(boraPage, { eventCount: 14, diagnosticCount: 0, game: { phase: 'turn-end', lastRoll: blackState.game.lastRoll, players: [{}, { goods: blackState.game.players[1].goods }] } }) },
      { spec: 'The observer projects the same public dice outcome', check: async () => expectState(page, { eventCount: 14, game: { lastRoll: blackState.game.lastRoll, players: [{}, { goods: blackState.game.players[1].goods }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await bora.step('guest-ends-black-market-turn', { description: 'Bora passes the replayed Black Market turn', verifications: [
      { spec: 'Ada begins turn five', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Fifteen events close with deterministic public dice', check: async () => expectState(boraPage, { eventCount: 15, diagnosticCount: 0, game: { currentTurn: 'Ada', turnNumber: 5, phase: 'movement', lastRoll: blackState.game.lastRoll } }) },
      { spec: 'Both clients agree on every public player resource', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(guest.game.players).toEqual(host.game.players); } }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
