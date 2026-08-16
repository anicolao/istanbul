import { expect, test } from '@playwright/test';
import { marketRevenueFor } from '../../../src/lib/game/actions';
import { demandTiles, type Good } from '../../../src/lib/game/manifests';
import { defaultMarketSelection } from '../../../src/lib/game/market-selection';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('players undo reversible actions until newly revealed information locks history', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'UNDOP' : 'UNDOD';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Undoing a turn without unseeing hidden information',
    'Ada and Bora open a normal two-player bazaar. Ada plays and undoes a Bonus card, deliberately replays it, moves to Small Market, accepts the maximum matching sale prepared for her, and walks backward through the sale, movement, and card play one immutable undo event at a time. She then replays a different route to Tea House; rolling dice visibly locks undo at the information boundary. Every input is followed by a screenshot and programmatic checks of the controls, canonical log, replayed state, opponent convergence, private hand, goods, demand, assistants, and dice.'
  );

  try {
    await openTwoPlayerGame({
      hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed: 'economy-safe-6'
    });

    await page.getByRole('button', { name: 'Review ruby routes with supplied resources' }).click();
    await ada.step('host-opens-undo-review-position', { description: 'Ada receives the reviewed goods and real Bonus cards', verifications: [
      { spec: 'The supplied position has three of each good and a profitable bargain', check: async () => expectState(page, { eventCount: 6, diagnosticCount: 0, undo: null, game: { phase: 'movement', players: [{ lira: 35, goods: { fabric: 3, spice: 3, fruit: 3, jewelry: 3 } }, {}], localHand: expect.arrayContaining(['bonus-gain-lira-2']) } }) },
      { spec: 'Review setup itself does not masquerade as an undoable player action', check: async () => expect(page.getByRole('button', { name: 'Nothing to undo' })).toBeDisabled() }
    ] });

    const beforeCard = await readState(page);
    await page.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ }).first().click();
    const selectedCard = (await readState(page)).game.selectedBonus as string;
    await ada.step('host-inspects-reversible-bonus', { description: 'Ada inspects a profitable bargain before playing it', verifications: [
      { spec: 'The private illustrated card promises five Lira', check: async () => expect(page.getByTestId('illustrated-bonus-card')).toContainText('Gain 5 Lira') },
      { spec: 'Private inspection changes no event or public resource', check: async () => expectState(page, { eventCount: 6, game: { selectedBonus: selectedCard, players: [{ lira: 35 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Play to gain 5 Lira' }).click();
    await ada.step('host-plays-reversible-bonus', { description: 'Ada plays the Bonus card for five Lira', verifications: [
      { spec: 'The card moves from hand to discard and raises Ada to forty Lira', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, undo: { label: 'Bonus card play', blockedReason: null }, game: { phase: 'movement', players: [{ lira: 40 }, {}], bonusDiscard: expect.arrayContaining([selectedCard]) } }) },
      { spec: 'The author receives an enabled semantic undo control', check: async () => expect(page.getByRole('button', { name: 'Undo Bonus card play' })).toBeEnabled() },
      { spec: 'Bora converges on the public money but still sees only a hidden hand count', check: async () => { await expectState(boraPage, { eventCount: 7, game: { players: [{ lira: 40 }, {}] } }); await expect(boraPage.getByText(/Bonus hand · \d+ hidden cards/)).toBeVisible(); } }
    ] });

    await page.getByRole('button', { name: 'Undo Bonus card play' }).click();
    await ada.step('host-undoes-bonus', { description: 'Ada writes an undo event for the Bonus play', verifications: [
      { spec: 'Replay restores the exact private hand, money, and discard from before the play', check: async () => expect.poll(async () => { const restored = await readState(page); return { hand: restored.game.localHand, lira: restored.game.players[0].lira, discard: restored.game.bonusDiscard }; }).toEqual({ hand: beforeCard.game.localHand, lira: 35, discard: beforeCard.game.bonusDiscard }) },
      { spec: 'Immutable history grows to eight and names the reversed event', check: async () => expectState(page, { eventCount: 8, diagnosticCount: 0, undo: null, undoLog: [{ label: 'Bonus card play' }] }) },
      { spec: 'The visible log explains that state was restored before the play', check: async () => expect(page.getByText('Undo event recorded · restored before Bonus card play.')).toBeVisible() },
      { spec: 'Bora independently replays the same rollback', check: async () => expectState(boraPage, { eventCount: 8, game: { players: [{ lira: 35 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ }).first().click();
    await ada.step('host-reselects-restored-bonus', { description: 'Ada selects the restored card to replay her choice', verifications: [
      { spec: 'The same card identity is privately selected again', check: async () => expectState(page, { eventCount: 8, game: { selectedBonus: selectedCard, localHand: expect.arrayContaining([selectedCard]) } }) },
      { spec: 'Selection remains local while the undo record remains immutable', check: async () => expectState(boraPage, { eventCount: 8, undoLog: [{ label: 'Bonus card play' }] }) }
    ] });

    await page.getByRole('button', { name: 'Play to gain 5 Lira' }).click();
    await ada.step('host-replays-bonus', { description: 'Ada deliberately replays the same Bonus effect', verifications: [
      { spec: 'The replacement play is a new ninth event and restores forty Lira', check: async () => expectState(page, { eventCount: 9, diagnosticCount: 0, undo: { label: 'Bonus card play', blockedReason: null }, game: { phase: 'movement', players: [{ lira: 40 }, {}] } }) },
      { spec: 'The new play can itself be undone without resurrecting the old event', check: async () => expect(page.getByRole('button', { name: 'Undo Bonus card play' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: /^11 Small Market.*Reachable/ }).click();
    await ada.step('host-selects-small-market-for-replay', { description: 'Ada plans a new route to Small Market', verifications: [
      { spec: 'Small Market is selected as reachable', check: async () => expect(page.getByRole('button', { name: /^11 Small Market.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Route inspection is local and adds no event', check: async () => expectState(page, { eventCount: 9, game: { selectedPlace: 11, phase: 'movement' } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    const beforeSale = await readState(page);
    const demand = demandTiles.find(({ id }) => id === beforeSale.game.smallDemand[0])!;
    const beforeSaleGoods = beforeSale.game.players[0].goods as Record<Good, number>;
    const saleSlots = defaultMarketSelection(demand.goods, beforeSaleGoods);
    const saleRevenue = marketRevenueFor(11, saleSlots.length);
    const afterSaleGoods = { ...beforeSaleGoods };
    for (const slot of saleSlots) afterSaleGoods[demand.goods[slot]] -= 1;
    await ada.step('host-moves-to-small-market', { description: 'Ada moves to Small Market and leaves an assistant', verifications: [
      { spec: 'Movement is event ten and becomes the next undo target', check: async () => expectState(page, { eventCount: 10, diagnosticCount: 0, undo: { label: 'move to Place 11', blockedReason: null }, game: { phase: 'action', players: [{ merchantPlace: 11, assistantsCarried: 3, assistantsByPlace: { 11: 1 } }, {}] } }) },
      { spec: 'The full five-slot demand is shown for a real sale', check: async () => expect(page.getByLabel('Small Market demand').getByRole('checkbox')).toHaveCount(5) },
      { spec: 'Every matching good is already selected at the maximum payout', check: async () => { await expect(page.getByLabel('Small Market demand').getByRole('checkbox', { checked: true })).toHaveCount(saleSlots.length); await expect(page.getByText(`${saleSlots.length} selected · ${saleRevenue} Lira`)).toBeVisible(); } }
    ] });

    await page.getByRole('button', { name: `Sell selected goods for ${saleRevenue} Lira` }).click();
    await ada.step('host-sells-market-good', { description: `Ada accepts the prepared ${saleSlots.length}-good sale`, verifications: [
      { spec: 'The sale spends every matching good, pays the maximum Lira, and rotates demand', check: async () => expectState(page, { eventCount: 11, diagnosticCount: 0, undo: { label: 'market sell', blockedReason: null }, game: { phase: 'turn-end', smallDemand: [...beforeSale.game.smallDemand.slice(1), beforeSale.game.smallDemand[0]], players: [{ lira: 40 + saleRevenue, goods: afterSaleGoods }, {}] } }) },
      { spec: 'Trading goods remains explicitly undoable', check: async () => expect(page.getByRole('button', { name: 'Undo market sell' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'Undo market sell' }).click();
    await ada.step('host-undoes-market-sale', { description: 'Ada reverses the market trade', verifications: [
      { spec: 'Goods, Lira, demand order, and action phase return exactly', check: async () => expectState(page, { eventCount: 12, diagnosticCount: 0, undo: { label: 'move to Place 11' }, undoLog: [{ label: 'Bonus card play' }, { label: 'market sell' }], game: { phase: 'action', smallDemand: beforeSale.game.smallDemand, players: [{ lira: 40, goods: beforeSale.game.players[0].goods }, {}] } }) },
      { spec: 'The next undo now walks backward to movement', check: async () => expect(page.getByRole('button', { name: 'Undo move to Place 11' })).toBeEnabled() },
      { spec: 'Bora converges without a compensating money or goods mutation', check: async () => expectState(boraPage, { eventCount: 12, game: { phase: 'action', players: [{ lira: 40, goods: beforeSale.game.players[0].goods }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Undo move to Place 11' }).click();
    await ada.step('host-undoes-market-movement', { description: 'Ada reverses movement and recovers her assistant', verifications: [
      { spec: 'The merchant, assistant stack, and movement phase match the pre-route state', check: async () => expectState(page, { eventCount: 13, diagnosticCount: 0, undo: { label: 'Bonus card play' }, game: { phase: 'movement', players: [{ merchantPlace: 7, assistantsCarried: 4, assistantsByPlace: {} }, {}] } }) },
      { spec: 'The earlier replacement Bonus play is now the latest active event', check: async () => expect(page.getByRole('button', { name: 'Undo Bonus card play' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'Undo Bonus card play' }).click();
    await ada.step('host-undoes-replayed-bonus', { description: 'Ada completes the rollback to her original reviewed turn', verifications: [
      { spec: 'The private card and thirty-five Lira are restored after three consecutive undos', check: async () => expectState(page, { eventCount: 14, diagnosticCount: 0, undo: null, undoLog: [{ label: 'Bonus card play' }, { label: 'market sell' }, { label: 'move to Place 11' }, { label: 'Bonus card play' }], game: { phase: 'movement', localHand: expect.arrayContaining([selectedCard]), players: [{ lira: 35 }, {}] } }) },
      { spec: 'No active player action remains above the reviewed fixture boundary', check: async () => expect(page.getByRole('button', { name: 'Nothing to undo' })).toBeDisabled() }
    ] });

    await page.getByRole('button', { name: /^9 Tea House.*Reachable/ }).click();
    await ada.step('host-selects-tea-house', { description: 'Ada now chooses a different route to Tea House', verifications: [
      { spec: 'Tea House is a legal two-space destination', check: async () => expect(page.getByRole('button', { name: /^9 Tea House.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The planner offers the normal assistant drop', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-tea-house', { description: 'Ada arrives at Tea House before any dice are exposed', verifications: [
      { spec: 'The reversible move is event fifteen', check: async () => expectState(page, { eventCount: 15, diagnosticCount: 0, undo: { label: 'move to Place 9', blockedReason: null }, game: { phase: 'action', players: [{ merchantPlace: 9 }, {}] } }) },
      { spec: 'Undo remains enabled until the roll occurs', check: async () => expect(page.getByRole('button', { name: 'Undo move to Place 9' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'Wager 7 and roll both dice' }).click();
    await ada.step('host-rolls-and-locks-undo', { description: 'Ada rolls at Tea House and reaches the information boundary', verifications: [
      { spec: 'The deterministic dice and payout are committed as event sixteen', check: async () => expectState(page, { eventCount: 16, diagnosticCount: 0, undo: { label: 'tea house wager', blockedReason: 'dice were rolled' }, game: { lastRoll: { place: 9, dice: expect.any(Array), reward: expect.any(Number) } } }) },
      { spec: 'Undo is visibly locked because the dice result cannot be unseen', check: async () => expect(page.getByRole('button', { name: 'Undo locked · dice were rolled' })).toBeDisabled() },
      { spec: 'Bora sees the same dice boundary and no undo event was invented', check: async () => expectState(boraPage, { eventCount: 16, diagnosticCount: 0, undo: { blockedReason: 'dice were rolled' }, game: { lastRoll: { place: 9, dice: expect.any(Array) } } }) }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
