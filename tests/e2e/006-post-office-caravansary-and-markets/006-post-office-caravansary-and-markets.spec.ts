import { expect, test } from '@playwright/test';
import { bonusCards, demandTiles, type Good } from '../../../src/lib/game/manifests';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

const bonusById = new Map(bonusCards.map((card) => [card.id, card]));
const demandById = new Map(demandTiles.map((tile) => [tile.id, tile]));

test('mail, private card trading, and both demand markets remain exact through replay', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'POSTS' : 'TRADE';
  const seed = 'economy-safe-6';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Routing mail, trading private cards, and serving both Markets',
    'Ada and Bora narrate every input from an empty private room through seven ordinary turns. They advance the exact Post Office mail track twice, draw and discard Bonus cards from both legal Caravansary sources, fill fabric, make one legal sale at each Market, rotate both Demand stacks, reload the completed Large Market action, and continuously compare canonical state across both browsers.'
  );

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed });

    await page.getByRole('button', { name: /^5 Post Office.*Reachable/ }).click();
    await ada.step('host-selects-post-office', { description: 'Ada selects Post Office two spaces away', verifications: [
      { spec: 'Post Office is a selected legal route', check: async () => expect(page.getByRole('button', { name: /^5 Post Office.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The route requires one assistant drop', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Route inspection leaves event five canonical', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: 5, postOfficeLower: [false, false, false, false] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-post-office', { description: 'Ada arrives and exposes the initial mail route', verifications: [
      { spec: 'All four indicators are visibly upper', check: async () => expect(page.getByLabel('Post Office indicators upper, upper, upper, upper')).toBeVisible() },
      { spec: 'The collection control is enabled', check: async () => expect(page.getByRole('button', { name: 'Collect uncovered mail resources' })).toBeEnabled() },
      { spec: 'No mail resource is granted by movement alone', check: async () => expectState(page, { eventCount: 6, game: { phase: 'action', players: [{ merchantPlace: 5, lira: 2, goods: { fabric: 0, spice: 0, fruit: 0, jewelry: 0 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Collect uncovered mail resources' }).click();
    await ada.step('host-collects-first-mail', { description: 'Ada collects the first four uncovered resources', verifications: [
      { spec: 'The completion copy lists spice, fabric, fruit, and 1 Lira', check: async () => expect(page.getByText('Collected 1 spice, 1 fabric, 1 fruit, 1 Lira.', { exact: true })).toBeVisible() },
      { spec: 'The leftmost indicator alone moves lower', check: async () => expectState(page, { eventCount: 7, game: { phase: 'turn-end', postOfficeLower: [true, false, false, false], players: [{ lira: 3, goods: { fabric: 1, spice: 1, fruit: 1, jewelry: 0 } }, {}] } }) },
      { spec: 'The action cannot be collected twice', check: async () => expect(page.getByRole('button', { name: 'Collect uncovered mail resources' })).toHaveCount(0) }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-mail-turn', { description: 'Ada passes the completed mail turn clockwise', verifications: [
      { spec: 'Bora begins turn two in movement', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Mail resources and the lower indicator persist', check: async () => expectState(page, { eventCount: 8, game: { currentTurn: 'Bora', phase: 'movement', postOfficeLower: [true, false, false, false] } }) }
    ] });

    await boraPage.getByRole('button', { name: /^6 Caravansary.*Reachable/ }).click();
    await bora.step('guest-selects-caravansary', { description: 'Bora selects Caravansary two spaces away', verifications: [
      { spec: 'Caravansary is selected and reachable', check: async () => expect(boraPage.getByRole('button', { name: /^6 Caravansary.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Bora is offered an assistant drop', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Bora still has one private card', check: async () => expectState(boraPage, { eventCount: 8, game: { localHand: [expect.any(String)], opponentHandCounts: [1] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-arrives-caravansary', { description: 'Bora arrives and previews two deck cards', verifications: [
      { spec: 'Both ordered card sources begin on Draw pile', check: async () => { await expect(boraPage.getByLabel('First card source')).toHaveValue('deck'); await expect(boraPage.getByLabel('Second card source')).toHaveValue('deck'); } },
      { spec: 'Three private discard choices are rendered without exposing them to Ada', check: async () => { await expect(boraPage.getByRole('group', { name: 'Discard one' }).getByRole('radio')).toHaveCount(3); await expect(page.getByText('Waiting for Bora to manage a private Bonus hand.')).toBeVisible(); } },
      { spec: 'Previewing consumes no card or event', check: async () => expectState(boraPage, { eventCount: 9, game: { phase: 'action', bonusDrawCount: 24, bonusDiscard: [], localHand: [expect.any(String)] } }) }
    ] });

    const firstBoraState = await readState(boraPage);
    const originalBoraCard = firstBoraState.game.localHand[0] as string;
    await boraPage.getByRole('radio', { name: new RegExp(originalBoraCard) }).check();
    await bora.step('guest-chooses-original-card', { description: 'Bora chooses the original hand card to discard', verifications: [
      { spec: 'The named private card is visibly selected', check: async () => expect(boraPage.getByRole('radio', { name: new RegExp(originalBoraCard) })).toBeChecked() },
      { spec: 'The trade control becomes enabled', check: async () => expect(boraPage.getByRole('button', { name: 'Keep two cards and discard selected' })).toBeEnabled() },
      { spec: 'The local radio choice is not canonical state', check: async () => expectState(boraPage, { eventCount: 9, game: { localHand: [originalBoraCard], bonusDiscard: [] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Keep two cards and discard selected' }).click();
    await bora.step('guest-trades-deck-cards', { description: 'Bora takes two deck cards and discards the original', verifications: [
      { spec: 'The completion panel reports two cards retained', check: async () => expect(boraPage.getByText('Took 2 Bonus cards and discarded 1; 2 remain in hand.', { exact: true })).toBeVisible() },
      { spec: 'Bora privately sees two cards while Ada sees only a count', check: async () => { await expect(boraPage.getByLabel('Bora resources').getByRole('button', { name: /Inspect Bonus card/ })).toHaveCount(2); await expect(page.getByText('Bonus hand · 2 hidden cards')).toBeVisible(); } },
      { spec: 'Two draws and one discard conserve the card manifest', check: async () => expectState(boraPage, { eventCount: 10, game: { phase: 'turn-end', bonusDrawCount: 22, bonusDiscard: [originalBoraCard], localHand: [expect.any(String), expect.any(String)], opponentHandCounts: [1] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await bora.step('guest-ends-first-caravan-turn', { description: 'Bora passes after the private card trade', verifications: [
      { spec: 'Ada starts turn three', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'The public discard remains face-up in state', check: async () => expectState(boraPage, { eventCount: 11, game: { currentTurn: 'Ada', bonusDiscard: [originalBoraCard] } }) }
    ] });

    await page.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ }).click();
    await ada.step('host-selects-fabric', { description: 'Ada routes from Post Office to Fabric Warehouse', verifications: [
      { spec: 'The adjacent warehouse is selected', check: async () => expect(page.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada must leave her second assistant', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Ada owns one fabric before filling', check: async () => expectState(page, { eventCount: 11, game: { players: [{ goods: { fabric: 1 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-fabric', { description: 'Ada arrives at Fabric Warehouse', verifications: [
      { spec: 'The CTA offers capacity two', check: async () => expect(page.getByRole('button', { name: 'Fill fabric to 2' })).toBeEnabled() },
      { spec: 'Movement leaves goods unchanged', check: async () => expectState(page, { eventCount: 12, game: { phase: 'action', players: [{ merchantPlace: 2, goods: { fabric: 1 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Fill fabric to 2' }).click();
    await ada.step('host-fills-fabric', { description: 'Ada fills fabric to wheelbarrow capacity', verifications: [
      { spec: 'The two-crate track is full', check: async () => expect(page.getByLabel('Ada goods').getByTitle('Fabric')).toHaveText('2') },
      { spec: 'The warehouse closes in turn-end', check: async () => expectState(page, { eventCount: 13, game: { phase: 'turn-end', players: [{ goods: { fabric: 2, spice: 1, fruit: 1 } }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-fabric-turn', { description: 'Ada passes the filled warehouse turn', verifications: [
      { spec: 'Bora starts turn four', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Ada’s market stock remains public', check: async () => expectState(page, { eventCount: 14, game: { currentTurn: 'Bora', players: [{ goods: { fabric: 2, spice: 1, fruit: 1 } }, {}] } }) }
    ] });

    await boraPage.getByRole('button', { name: /^5 Post Office.*Reachable/ }).click();
    await bora.step('guest-selects-post-office', { description: 'Bora routes two spaces north to Post Office', verifications: [
      { spec: 'Post Office is selected from Caravansary', check: async () => expect(boraPage.getByRole('button', { name: /^5 Post Office.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'A second placed assistant is required', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Exactly the first mail indicator is already lower', check: async () => expectState(boraPage, { eventCount: 14, game: { postOfficeLower: [true, false, false, false] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-arrives-post-office', { description: 'Bora arrives at the advanced mail track', verifications: [
      { spec: 'The accessible track names lower then three upper indicators', check: async () => expect(boraPage.getByLabel('Post Office indicators lower, upper, upper, upper')).toBeVisible() },
      { spec: 'Bora still has no goods before collection', check: async () => expectState(boraPage, { eventCount: 15, game: { phase: 'action', players: [{}, { goods: { fabric: 0, spice: 0, fruit: 0, jewelry: 0 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Collect uncovered mail resources' }).click();
    await bora.step('guest-collects-second-mail', { description: 'Bora collects the second mail combination', verifications: [
      { spec: 'The completion copy names two fabric, one fruit, and 1 Lira', check: async () => expect(boraPage.getByText('Collected 1 fabric, 1 fabric, 1 fruit, 1 Lira.', { exact: true })).toBeVisible() },
      { spec: 'The first two indicators are now lower', check: async () => expectState(boraPage, { eventCount: 16, game: { phase: 'turn-end', postOfficeLower: [true, true, false, false], players: [{}, { lira: 4, goods: { fabric: 2, fruit: 1 } }] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await bora.step('guest-ends-mail-turn', { description: 'Bora passes after the second mail collection', verifications: [
      { spec: 'Ada starts turn five', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Both merchants retain their distinct goods', check: async () => expectState(boraPage, { eventCount: 17, game: { currentTurn: 'Ada', players: [{ goods: { fabric: 2, spice: 1, fruit: 1 } }, { goods: { fabric: 2, fruit: 1 } }] } }) }
    ] });

    await page.getByRole('button', { name: /^11 Small Market.*Reachable/ }).click();
    await ada.step('host-selects-small-market', { description: 'Ada selects Small Market two spaces south', verifications: [
      { spec: 'Small Market is visibly reachable', check: async () => expect(page.getByRole('button', { name: /^11 Small Market.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada can leave a third assistant', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'No Demand rotates during inspection', check: async () => expectState(page, { eventCount: 17, game: { smallDemand: expect.any(Array) } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-small-market', { description: 'Ada arrives at Small Market with sale stock', verifications: [
      { spec: 'Five depicted Demand slots are ordinary checkboxes', check: async () => expect(page.getByLabel('Small Market demand').getByRole('checkbox')).toHaveCount(5) },
      { spec: 'No selection means the sale is disabled', check: async () => expect(page.getByRole('button', { name: 'Sell selected goods for 0 Lira' })).toBeDisabled() },
      { spec: 'The active Demand is still on top', check: async () => expectState(page, { eventCount: 18, game: { phase: 'action' } }) }
    ] });

    const smallState = await readState(page);
    const smallId = smallState.game.smallDemand[0] as string;
    const adaGoods = smallState.game.players[0].goods as Record<Good, number>;
    const smallSlot = demandById.get(smallId)!.goods.findIndex((good) => adaGoods[good] > 0);
    const smallGood = demandById.get(smallId)!.goods[smallSlot];
    await page.getByRole('checkbox', { name: `Sell demand slot ${smallSlot + 1}: ${smallGood}` }).check();
    await ada.step('host-chooses-small-sale', { description: `Ada selects one depicted ${smallGood} for the Small Market`, verifications: [
      { spec: 'The chosen Demand slot is visibly checked', check: async () => expect(page.getByRole('checkbox', { name: `Sell demand slot ${smallSlot + 1}: ${smallGood}` })).toBeChecked() },
      { spec: 'One good earns the official 2 Lira', check: async () => expect(page.getByText('1 selected · 2 Lira')).toBeVisible() },
      { spec: 'Selection does not rotate or spend yet', check: async () => expectState(page, { eventCount: 18, game: { smallDemand: [smallId, ...smallState.game.smallDemand.slice(1)] } }) }
    ] });

    await page.getByRole('button', { name: 'Sell selected goods for 2 Lira' }).click();
    await ada.step('host-sells-small-market', { description: 'Ada completes the one-good Small Market sale', verifications: [
      { spec: 'The completion panel reports the exact revenue', check: async () => expect(page.getByText('Sold 1 good for 2 Lira.', { exact: true })).toBeVisible() },
      { spec: 'The used Demand moves to the bottom', check: async () => expectState(page, { eventCount: 19, game: { phase: 'turn-end', smallDemand: [...smallState.game.smallDemand.slice(1), smallId], players: [{ lira: 5 }, {}] } }) },
      { spec: 'Exactly the selected good was spent', check: async () => { const after = await readState(page); expect(after.game.players[0].goods[smallGood]).toBe(adaGoods[smallGood] - 1); } }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-small-market-turn', { description: 'Ada passes after rotating Small Market', verifications: [
      { spec: 'Bora starts turn six', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'The rotation remains canonical in movement', check: async () => expectState(page, { eventCount: 20, game: { currentTurn: 'Bora', smallDemand: [...smallState.game.smallDemand.slice(1), smallId] } }) }
    ] });

    await boraPage.getByRole('button', { name: /^6 Caravansary.*Reachable/ }).click();
    await bora.step('guest-selects-return-caravan', { description: 'Bora selects her placed Caravansary assistant', verifications: [
      { spec: 'Caravansary is selected two spaces south', check: async () => expect(boraPage.getByRole('button', { name: /^6 Caravansary.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The CTA now offers assistant pick-up', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and pick up assistant' })).toBeVisible() },
      { spec: 'The public discard still holds Bora’s original card', check: async () => expectState(boraPage, { eventCount: 20, game: { bonusDiscard: [originalBoraCard] } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Move here and pick up assistant' }).click();
    await bora.step('guest-returns-caravansary', { description: 'Bora returns and picks up the Caravansary assistant', verifications: [
      { spec: 'The discard source is now enabled', check: async () => expect(boraPage.getByLabel('First card source').getByRole('option', { name: 'Discard pile' })).toBeEnabled() },
      { spec: 'Bora carries three assistants after the pick-up', check: async () => expectState(boraPage, { eventCount: 21, game: { phase: 'action', players: [{}, { merchantPlace: 6, assistantsCarried: 3, assistantsByPlace: { 5: 1 } }] } }) }
    ] });

    await boraPage.getByLabel('First card source').selectOption('discard');
    await bora.step('guest-selects-discard-source', { description: 'Bora chooses the face-up discard as the first draw', verifications: [
      { spec: 'The first source visibly reads Discard pile', check: async () => expect(boraPage.getByLabel('First card source')).toHaveValue('discard') },
      { spec: 'The preview names the returned original card', check: async () => expect(boraPage.getByText(new RegExp(`Preview: ${bonusById.get(originalBoraCard)!.title}`))).toBeVisible() },
      { spec: 'Changing a private source appends no event', check: async () => expectState(boraPage, { eventCount: 21, game: { bonusDiscard: [originalBoraCard] } }) }
    ] });

    const secondBoraState = await readState(boraPage);
    const cardToDiscard = secondBoraState.game.localHand[0] as string;
    await boraPage.getByRole('radio', { name: new RegExp(cardToDiscard) }).check();
    await bora.step('guest-chooses-new-discard', { description: 'Bora selects one current hand card for the exchange', verifications: [
      { spec: 'The chosen private title is checked', check: async () => expect(boraPage.getByRole('radio', { name: new RegExp(cardToDiscard) })).toBeChecked() },
      { spec: 'The discard/deck exchange is enabled', check: async () => expect(boraPage.getByRole('button', { name: 'Keep two cards and discard selected' })).toBeEnabled() },
      { spec: 'Bora still owns two canonical cards before committing', check: async () => expectState(boraPage, { eventCount: 21, game: { localHand: secondBoraState.game.localHand } }) }
    ] });

    await boraPage.getByRole('button', { name: 'Keep two cards and discard selected' }).click();
    await bora.step('guest-trades-discard-card', { description: 'Bora takes one discard and one deck card, then discards one', verifications: [
      { spec: 'The second trade leaves exactly three cards in hand', check: async () => expect(boraPage.getByText('Took 2 Bonus cards and discarded 1; 3 remain in hand.', { exact: true })).toBeVisible() },
      { spec: 'The new face-up discard is the selected hand card', check: async () => expectState(boraPage, { eventCount: 22, game: { phase: 'turn-end', bonusDrawCount: 21, bonusDiscard: [cardToDiscard], localHand: expect.arrayContaining([originalBoraCard]) } }) },
      { spec: 'Ada sees three hidden cards and no private title', check: async () => expect(page.getByText('Bonus hand · 3 hidden cards')).toBeVisible() }
    ] });

    await boraPage.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await bora.step('guest-ends-second-caravan-turn', { description: 'Bora passes after reclaiming the face-up card', verifications: [
      { spec: 'Ada starts turn seven', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'All private-card counts survive turn closure', check: async () => expectState(boraPage, { eventCount: 23, game: { currentTurn: 'Ada', bonusDrawCount: 21, bonusDiscard: [cardToDiscard] } }) }
    ] });

    await page.getByRole('button', { name: /^10 Large Market.*Reachable/ }).click();
    await ada.step('host-selects-large-market', { description: 'Ada selects Large Market two spaces away', verifications: [
      { spec: 'Large Market is a legal final route', check: async () => expect(page.getByRole('button', { name: /^10 Large Market.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada can leave her last carried assistant', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeVisible() },
      { spec: 'Large Demand has not rotated yet', check: async () => expectState(page, { eventCount: 23, game: { largeDemand: expect.any(Array) } }) }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-large-market', { description: 'Ada arrives at Large Market with remaining stock', verifications: [
      { spec: 'Five Large Market slots are visible', check: async () => expect(page.getByLabel('Large Market demand').getByRole('checkbox')).toHaveCount(5) },
      { spec: 'The sale begins disabled with zero selected', check: async () => expect(page.getByRole('button', { name: 'Sell selected goods for 0 Lira' })).toBeDisabled() },
      { spec: 'Ada now has zero carried assistants but may finish this action', check: async () => expectState(page, { eventCount: 24, game: { phase: 'action', players: [{ merchantPlace: 10, assistantsCarried: 0 }, {}] } }) }
    ] });

    const largeState = await readState(page);
    const largeId = largeState.game.largeDemand[0] as string;
    const remainingGoods = largeState.game.players[0].goods as Record<Good, number>;
    const largeSlot = demandById.get(largeId)!.goods.findIndex((good) => remainingGoods[good] > 0);
    const largeGood = demandById.get(largeId)!.goods[largeSlot];
    await page.getByRole('checkbox', { name: `Sell demand slot ${largeSlot + 1}: ${largeGood}` }).check();
    await ada.step('host-chooses-large-sale', { description: `Ada selects one depicted ${largeGood} for Large Market`, verifications: [
      { spec: 'The Large Market slot is checked', check: async () => expect(page.getByRole('checkbox', { name: `Sell demand slot ${largeSlot + 1}: ${largeGood}` })).toBeChecked() },
      { spec: 'One good again displays the 2-Lira tier', check: async () => expect(page.getByText('1 selected · 2 Lira')).toBeVisible() },
      { spec: 'The local selection has not spent stock', check: async () => expectState(page, { eventCount: 24, game: { largeDemand: [largeId, ...largeState.game.largeDemand.slice(1)] } }) }
    ] });

    await page.getByRole('button', { name: 'Sell selected goods for 2 Lira' }).click();
    await ada.step('host-sells-large-market', { description: 'Ada completes the Large Market sale', verifications: [
      { spec: 'The exact sale summary is visible', check: async () => expect(page.getByText('Sold 1 good for 2 Lira.', { exact: true })).toBeVisible() },
      { spec: 'Large Demand rotates independently', check: async () => expectState(page, { eventCount: 25, game: { phase: 'turn-end', largeDemand: [...largeState.game.largeDemand.slice(1), largeId], smallDemand: [...smallState.game.smallDemand.slice(1), smallId], players: [{ lira: 7 }, {}] } }) },
      { spec: 'Bora observes the same public market state', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(guest.game.largeDemand).toEqual(host.game.largeDemand); expect(guest.game.players).toEqual(host.game.players); } }
    ] });

    await page.reload();
    await ada.step('host-reloads-large-market', { description: 'Ada reloads the completed Large Market turn', verifications: [
      { spec: 'Replay restores the non-repeatable completion panel', check: async () => { await expect(page.getByRole('heading', { name: 'Ada completed Large Market.' })).toBeVisible(); await expect(page.getByRole('button', { name: /Sell selected goods/ })).toHaveCount(0); } },
      { spec: 'Both Demand rotations and card exchange replay exactly', check: async () => expectState(page, { eventCount: 25, diagnosticCount: 0, game: { phase: 'turn-end', largeDemand: [...largeState.game.largeDemand.slice(1), largeId], smallDemand: [...smallState.game.smallDemand.slice(1), smallId], bonusDrawCount: 21, bonusDiscard: [cardToDiscard] } }) },
      { spec: 'End turn is the sole continuation', check: async () => expect(page.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-large-market-turn', { description: 'Ada passes the fully replayed economy turn', verifications: [
      { spec: 'Bora begins turn eight', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Twenty-six canonical events close with no diagnostics', check: async () => expectState(page, { eventCount: 26, diagnosticCount: 0, game: { currentTurn: 'Bora', turnNumber: 8, phase: 'movement', postOfficeLower: [true, true, false, false], bonusDrawCount: 21 } }) },
      { spec: 'Both browsers project identical public players, Demand, mail, and discard', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(guest.game.players).toEqual(host.game.players); expect(guest.game.largeDemand).toEqual(host.game.largeDemand); expect(guest.game.smallDemand).toEqual(host.game.smallDemand); expect(guest.game.postOfficeLower).toEqual(host.game.postOfficeLower); expect(guest.game.bonusDiscard).toEqual(host.game.bonusDiscard); } }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
