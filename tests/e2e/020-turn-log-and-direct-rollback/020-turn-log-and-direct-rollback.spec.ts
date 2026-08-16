import { expect, test } from '@playwright/test';
import { marketRevenueFor } from '../../../src/lib/game/actions';
import { bonusCards, demandTiles } from '../../../src/lib/game/manifests';
import { defaultMarketSelection } from '../../../src/lib/game/market-selection';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('turn review and the game log roll back an authored suffix in one step', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'LOGPH' : 'LOGDS';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Reviewing and rewinding a complete turn',
    'Ada reviews every action before passing, uses Undo Turn to erase a three-action reversible suffix with one immutable event, replays the line, opens the full game log, and rolls back directly to movement. She then rolls dice at Tea House and sees every action at or below that information barrier greyed out. Ending the turn creates one new reversible action above the barrier, which the game log restores directly without crossing the dice result. Every input is followed by a screenshot and exact state, log, authorization, resource, assistant, demand, and observer checks.'
  );

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed: 'economy-safe-6' });

    await page.getByRole('button', { name: 'Review ruby routes with supplied resources' }).click();
    await ada.step('host-supplies-rollback-review', { description: 'Ada receives reviewed goods and real Bonus cards', verifications: [
      { spec: 'The reviewed setup is outside the player-action log', check: async () => expectState(page, { eventCount: 6, gameLog: [], game: { phase: 'movement', players: [{ lira: 35, goods: { fabric: 3, spice: 3, fruit: 3, jewelry: 3 } }, {}] } }) },
      { spec: 'The global game log is available beside Undo', check: async () => expect(page.getByRole('button', { name: 'Game log' })).toBeVisible() }
    ] });

    const reviewed = await readState(page);
    const profitableId = reviewed.game.localHand.find((id: string) => bonusCards.find((card) => card.id === id)?.effect === 'gain-lira') as string;
    await page.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ }).first().click();
    await ada.step('host-inspects-first-turn-bonus', { description: 'Ada inspects a profitable bargain for the first turn line', verifications: [
      { spec: 'The selected card is the real five-Lira card', check: async () => expectState(page, { eventCount: 6, game: { selectedBonus: profitableId, localHand: expect.arrayContaining([profitableId]) } }) }
    ] });

    await page.getByRole('button', { name: 'Play to gain 5 Lira' }).click();
    await ada.step('host-plays-first-turn-bonus', { description: 'Ada plays the Bonus card before moving', verifications: [
      { spec: 'The first turn action is logged and pays five Lira', check: async () => expectState(page, { eventCount: 7, gameLog: [{ label: 'Bonus card play', active: true, rollbackCount: 1 }], game: { players: [{ lira: 40 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: /^11 Small Market.*Reachable/ }).click();
    await ada.step('host-selects-first-small-market', { description: 'Ada selects Small Market for the reviewed line', verifications: [
      { spec: 'Route inspection remains local', check: async () => expectState(page, { eventCount: 7, game: { selectedPlace: 11, phase: 'movement' } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    const beforeFirstSale = await readState(page);
    const firstDemand = demandTiles.find(({ id }) => id === beforeFirstSale.game.smallDemand[0])!;
    const firstSaleSlots = defaultMarketSelection(firstDemand.goods, beforeFirstSale.game.players[0].goods);
    const firstSaleRevenue = marketRevenueFor(11, firstSaleSlots.length);
    await ada.step('host-moves-first-small-market', { description: 'Ada moves and leaves an assistant at Small Market', verifications: [
      { spec: 'The game log can now roll back two actions from the Bonus play', check: async () => expectState(page, { eventCount: 8, gameLog: [{ label: 'Bonus card play', rollbackCount: 2 }, { label: 'move to Place 11', rollbackCount: 1 }], game: { phase: 'action', players: [{ merchantPlace: 11, assistantsCarried: 3, assistantsByPlace: { 11: 1 } }, {}] } }) },
      { spec: 'Every matching demand slot is preselected at the maximum payout', check: async () => { await expect(page.getByLabel('Small Market demand').getByRole('checkbox', { checked: true })).toHaveCount(firstSaleSlots.length); await expect(page.getByText(`${firstSaleSlots.length} selected · ${firstSaleRevenue} Lira`)).toBeVisible(); } }
    ] });

    await page.getByRole('button', { name: `Sell selected goods for ${firstSaleRevenue} Lira` }).click();
    await ada.step('host-reviews-completed-turn', { description: 'Ada completes the market sale and reviews the turn before passing', verifications: [
      { spec: 'The turn review lists Bonus play, movement, and sale in order', check: async () => { const log = page.getByRole('list', { name: "Ada's turn actions" }); await expect(log.getByRole('listitem')).toHaveCount(3); await expect(log).toContainText('Bonus card play'); await expect(log).toContainText('move to Place 11'); await expect(log).toContainText('market sell'); } },
      { spec: 'Undo Turn reaches the beginning of all three reversible actions', check: async () => expect(page.getByRole('button', { name: 'Undo turn back before Bonus card play' })).toContainText('3 actions') },
      { spec: 'Canonical state contains three active actions and the rotated demand', check: async () => expectState(page, { eventCount: 9, gameLog: [{ rollbackCount: 3 }, { rollbackCount: 2 }, { rollbackCount: 1 }], game: { phase: 'turn-end', smallDemand: [...beforeFirstSale.game.smallDemand.slice(1), beforeFirstSale.game.smallDemand[0]], players: [{ lira: 40 + firstSaleRevenue }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Undo turn back before Bonus card play' }).click();
    await ada.step('host-undoes-entire-turn', { description: 'Ada uses one Undo Turn event to restore the reviewed starting position', verifications: [
      { spec: 'The Bonus card, Lira, merchant, assistant, goods, and demand all return exactly', check: async () => expectState(page, { eventCount: 10, diagnosticCount: 0, undo: null, undoLog: [{ label: 'Bonus card play', actionCount: 3 }], gameLog: [{ active: false }, { active: false }, { active: false }], game: { phase: 'movement', smallDemand: beforeFirstSale.game.smallDemand, localHand: expect.arrayContaining([profitableId]), players: [{ lira: 35, merchantPlace: 7, assistantsCarried: 4, assistantsByPlace: {}, goods: reviewed.game.players[0].goods }, {}] } }) },
      { spec: 'Bora independently converges from the same single rollback event', check: async () => expectState(boraPage, { eventCount: 10, game: { phase: 'movement', players: [{ lira: 35, merchantPlace: 7, assistantsCarried: 4 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ }).first().click();
    await ada.step('host-reselects-turn-bonus', { description: 'Ada selects the restored Bonus card for a second line', verifications: [
      { spec: 'Selection changes no immutable state', check: async () => expectState(page, { eventCount: 10, game: { selectedBonus: profitableId } }) }
    ] });
    await page.getByRole('button', { name: 'Play to gain 5 Lira' }).click();
    await ada.step('host-replays-turn-bonus', { description: 'Ada replays the profitable bargain', verifications: [
      { spec: 'A new active Bonus action follows the three inactive originals', check: async () => expectState(page, { eventCount: 11, gameLog: [{ active: false }, { active: false }, { active: false }, { label: 'Bonus card play', active: true }], game: { players: [{ lira: 40 }, {}] } }) }
    ] });
    await page.getByRole('button', { name: /^11 Small Market.*Reachable/ }).click();
    await ada.step('host-reselects-small-market', { description: 'Ada selects Small Market again', verifications: [
      { spec: 'The replacement route is reachable without a new event', check: async () => expectState(page, { eventCount: 11, game: { selectedPlace: 11 } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    const beforeSecondSale = await readState(page);
    const secondDemand = demandTiles.find(({ id }) => id === beforeSecondSale.game.smallDemand[0])!;
    const secondSaleSlots = defaultMarketSelection(secondDemand.goods, beforeSecondSale.game.players[0].goods);
    const secondSaleRevenue = marketRevenueFor(11, secondSaleSlots.length);
    await ada.step('host-replays-small-market-move', { description: 'Ada repeats the movement to Small Market', verifications: [
      { spec: 'The replacement movement is the fifth logged action', check: async () => expectState(page, { eventCount: 12, gameLog: [{}, {}, {}, {}, { label: 'move to Place 11', active: true }], game: { phase: 'action', players: [{ merchantPlace: 11 }, {}] } }) },
      { spec: 'The replayed market again prepares every matching good', check: async () => expect(page.getByLabel('Small Market demand').getByRole('checkbox', { checked: true })).toHaveCount(secondSaleSlots.length) }
    ] });
    await page.getByRole('button', { name: `Sell selected goods for ${secondSaleRevenue} Lira` }).click();
    await ada.step('host-completes-second-market-sale', { description: 'Ada completes the replayed market turn', verifications: [
      { spec: 'The replacement sale reaches turn review at event thirteen', check: async () => expectState(page, { eventCount: 13, game: { phase: 'turn-end', players: [{ lira: 40 + secondSaleRevenue }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Game log' }).click();
    await ada.step('host-opens-direct-rollback-log', { description: 'Ada opens the full immutable game log beside Undo', verifications: [
      { spec: 'The dialog offers direct one-, two-, and three-action rollback points', check: async () => { const dialog = page.getByRole('dialog', { name: 'Game log' }); await expect(dialog.getByRole('button', { name: 'Roll back before market sell' })).toContainText('Rollback 1'); await expect(dialog.getByRole('button', { name: 'Roll back before move to Place 11' })).toContainText('Rollback 2'); await expect(dialog.getByRole('button', { name: 'Roll back before Bonus card play' })).toContainText('Rollback 3'); } },
      { spec: 'Previously undone actions remain visible as grey immutable history', check: async () => expect(page.getByRole('dialog', { name: 'Game log' }).getByText('Already undone').first()).toBeVisible() }
    ] });

    await page.getByRole('dialog', { name: 'Game log' }).getByRole('button', { name: 'Roll back before move to Place 11' }).click();
    await ada.step('host-rolls-back-directly-to-movement', { description: 'Ada restores the state before movement with one direct rollback event', verifications: [
      { spec: 'Movement and sale are inactive while the Bonus play remains active', check: async () => expectState(page, { eventCount: 14, diagnosticCount: 0, undoLog: [{ actionCount: 3 }, { label: 'move to Place 11', actionCount: 2 }], gameLog: [{}, {}, {}, { label: 'Bonus card play', active: true }, { label: 'move to Place 11', active: false }, { label: 'market sell', active: false }], game: { phase: 'movement', smallDemand: beforeSecondSale.game.smallDemand, players: [{ lira: 40, merchantPlace: 7, assistantsCarried: 4, assistantsByPlace: {} }, {}] } }) },
      { spec: 'The dialog closes after the atomic rollback', check: async () => expect(page.getByRole('dialog', { name: 'Game log' })).toHaveCount(0) }
    ] });

    await page.getByRole('button', { name: /^9 Tea House.*Reachable/ }).click();
    await ada.step('host-selects-tea-after-direct-rollback', { description: 'Ada chooses Tea House as the replacement route', verifications: [
      { spec: 'Tea House is selected with no event', check: async () => expectState(page, { eventCount: 14, game: { selectedPlace: 9, phase: 'movement' } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-moves-tea-after-direct-rollback', { description: 'Ada moves to Tea House after the direct rollback', verifications: [
      { spec: 'The move is reversible before dice are shown', check: async () => expectState(page, { eventCount: 15, undo: { label: 'move to Place 9', blockedReason: null }, game: { phase: 'action', players: [{ merchantPlace: 9 }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Wager 7 and roll both dice' }).click();
    await ada.step('host-sees-grey-barrier-turn-log', { description: 'Ada rolls dice and reviews the visibly blocked turn history', verifications: [
      { spec: 'Every active turn row is grey because rollback would cross the dice result', check: async () => { const rows = page.getByRole('list', { name: "Ada's turn actions" }).getByRole('listitem'); await expect(rows).toHaveCount(3); await expect(rows.nth(0)).toHaveClass(/blocked/); await expect(rows.nth(1)).toHaveClass(/blocked/); await expect(rows.nth(2)).toHaveClass(/blocked/); await expect(rows.nth(2)).toContainText('Barrier · dice were rolled'); } },
      { spec: 'Undo Turn is disabled at the information boundary', check: async () => expect(page.getByRole('button', { name: 'Undo Turn unavailable' })).toBeDisabled() },
      { spec: 'The canonical log exposes the same barrier reasons', check: async () => expectState(page, { eventCount: 16, undo: { blockedReason: 'dice were rolled' }, game: { phase: 'turn-end', lastRoll: { place: 9, dice: expect.any(Array) } } }) }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-passes-above-dice-barrier', { description: 'Ada passes, creating one reversible action above the dice barrier', verifications: [
      { spec: 'Bora begins turn two while Ada owns the latest end-turn action', check: async () => expectState(page, { eventCount: 17, undo: { label: 'end turn', blockedReason: null }, game: { turnNumber: 2, currentTurn: 'Bora', phase: 'movement' } }) },
      { spec: 'Bora sees the same clockwise handoff', check: async () => expectState(boraPage, { eventCount: 17, game: { turnNumber: 2, currentTurn: 'Bora' } }) }
    ] });

    await page.getByRole('button', { name: 'Game log' }).click();
    await ada.step('host-opens-log-above-barrier', { description: 'Ada opens the log after passing the dice barrier', verifications: [
      { spec: 'End turn is selectable but the roll and all earlier actions are grey', check: async () => { const dialog = page.getByRole('dialog', { name: 'Game log' }); await expect(dialog.getByRole('button', { name: 'Roll back before end turn' })).toContainText('Rollback 1'); await expect(dialog.getByText('dice were rolled', { exact: true })).toBeVisible(); await expect(dialog.getByText('Cannot cross: dice were rolled').first()).toBeVisible(); } }
    ] });

    await page.getByRole('dialog', { name: 'Game log' }).getByRole('button', { name: 'Roll back before end turn' }).click();
    await ada.step('host-restores-end-turn-only', { description: 'Ada rolls back only the action above the barrier', verifications: [
      { spec: 'Ada returns to turn review without changing the dice, payout, or lower history', check: async () => expectState(page, { eventCount: 18, diagnosticCount: 0, undo: { label: 'tea house wager', blockedReason: 'dice were rolled' }, undoLog: [{ actionCount: 3 }, { actionCount: 2 }, { label: 'end turn', actionCount: 1 }], game: { turnNumber: 1, currentTurn: 'Ada', phase: 'turn-end', lastRoll: { place: 9, dice: expect.any(Array) } } }) },
      { spec: 'Undo Turn remains visibly blocked exactly at the retained dice barrier', check: async () => expect(page.getByRole('button', { name: 'Undo Turn unavailable' })).toBeDisabled() }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
