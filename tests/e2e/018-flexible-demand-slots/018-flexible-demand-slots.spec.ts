import { expect, test } from '@playwright/test';
import { demandTiles } from '../../../src/lib/game/manifests';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('Flexible Demand substitutes payment directly on selected market slots', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'FLXPH' : 'FLXDS';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Substituting goods directly on a Flexible Demand card',
    'Ada and Bora open a normal two-player bazaar. A visible emulator review control gives Ada four matching goods, one substitute, and the real Flexible Demand card. Ada walks to Small Market, sees every matching slot already selected and the useful card prominently offered, plays it in place, fills the one missing demand with her substitute, and commits a complete twenty-Lira sale. Every input is followed by a screenshot and programmatic checks of the controls, immutable event history, goods payment, demand rotation, and consumed Bonus effect.'
  );

  try {
    await openTwoPlayerGame({
      hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed: 'economy-safe-6',
      extraQuery: '&e2eReview=flexible-market'
    });

    await page.getByRole('button', { name: 'Review Flexible Demand market sale' }).click();
    await ada.step('host-supplies-flexible-market-review', { description: 'Ada opens the reviewed Flexible Demand position', verifications: [
      { spec: 'Ada has four exact matches, one substitute, and the real Flexible Demand card', check: async () => expectState(page, { eventCount: 6, diagnosticCount: 0, game: { phase: 'movement', smallDemand: ['demand-small-1', expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String)], players: [{ capacity: 3, goods: { fabric: 2, spice: 0, fruit: 2, jewelry: 1 } }, {}], localHand: expect.arrayContaining(['bonus-wild-small-market-1']) } }) },
      { spec: 'Bora sees only Ada’s private hand count', check: async () => expect(boraPage.getByText(/Bonus hand · \d+ hidden cards/)).toBeVisible() }
    ] });

    await page.getByRole('button', { name: /^11 Small Market.*Reachable/ }).click();
    await ada.step('host-selects-small-market', { description: 'Ada selects the adjacent Small Market', verifications: [
      { spec: 'Small Market is selected as a legal one-space route', check: async () => expect(page.getByRole('button', { name: /^11 Small Market.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The assistant operation is explicit', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-small-market', { description: 'Ada arrives at the five-slot demand card', verifications: [
      { spec: 'All five ordinary demand slots are selectable before the card is played', check: async () => expect(page.getByLabel('Small Market demand').getByRole('checkbox')).toHaveCount(5) },
      { spec: 'The four demand goods Ada owns are selected by default', check: async () => { await expect(page.getByRole('checkbox', { name: 'Sell demand slot 1: jewelry' })).toBeChecked(); await expect(page.getByRole('checkbox', { name: 'Sell demand slot 2: fabric' })).toBeChecked(); await expect(page.getByRole('checkbox', { name: 'Sell demand slot 3: spice' })).not.toBeChecked(); await expect(page.getByRole('checkbox', { name: 'Sell demand slot 4: fruit' })).toBeChecked(); await expect(page.getByRole('checkbox', { name: 'Sell demand slot 5: fruit' })).toBeChecked(); } },
      { spec: 'The pending default sale is worth fourteen Lira', check: async () => expect(page.getByText('4 selected · 14 Lira')).toBeVisible() },
      { spec: 'Flexible Demand is pictured prominently beside a direct play button', check: async () => { await expect(page.getByLabel('Flexible Demand can fill a missing market good')).toBeVisible(); await expect(page.getByTestId('market-flexible-demand-card')).toContainText('any mixture of goods'); await expect(page.getByRole('button', { name: 'Play Flexible demand' })).toBeEnabled(); } },
      { spec: 'No substitution dropdown exists before Flexible Demand is active', check: async () => expect(page.getByLabel(/Payment for demand slot/)).toHaveCount(0) },
      { spec: 'Movement opens the action without rotating demand', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, game: { phase: 'action', players: [{ merchantPlace: 11 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: 'Play Flexible demand' }).click();
    const beforeSale = await readState(page);
    const demandId = beforeSale.game.smallDemand[0] as string;
    const demand = demandTiles.find(({ id }) => id === demandId)!;
    await ada.step('host-enables-slot-substitutions', { description: 'Ada plays the prominent card to enable substitutions', verifications: [
      { spec: 'Each printed market good is now paired with its own payment dropdown', check: async () => expect(page.getByLabel(/Payment for demand slot/)).toHaveCount(5) },
      { spec: 'Every dropdown defaults to the good printed in that slot', check: async () => { for (const [index, good] of demand.goods.entries()) await expect(page.getByLabel(`Payment for demand slot ${index + 1}`)).toHaveValue(good); } },
      { spec: 'The four affordable printed slots remain selected', check: async () => expect(page.getByLabel('Small Market demand').getByRole('checkbox', { checked: true })).toHaveCount(4) },
      { spec: 'The Bonus event activates Flexible Demand without selling anything', check: async () => expectState(page, { eventCount: 8, diagnosticCount: 0, game: { phase: 'action', activeBonusEffects: ['wild-small-market'], smallDemand: [demandId, ...beforeSale.game.smallDemand.slice(1)] } }) }
    ] });

    await page.getByLabel('Payment for demand slot 3').selectOption('fabric');
    await ada.step('host-substitutes-missing-spice', { description: 'Ada substitutes her extra fabric for the missing spice', verifications: [
      { spec: 'The missing spice slot now names fabric as payment', check: async () => expect(page.getByLabel('Payment for demand slot 3')).toHaveValue('fabric') },
      { spec: 'Changing a local payment choice writes no canonical event', check: async () => expectState(page, { eventCount: 8 }) }
    ] });

    await page.getByLabel('Sell demand slot 3: spice').check();
    await ada.step('host-adds-substituted-slot', { description: 'Ada adds the substituted fifth slot to the sale', verifications: [
      { spec: 'All five demand slots are visibly selected', check: async () => expect(page.getByLabel('Small Market demand').getByRole('checkbox', { checked: true })).toHaveCount(5) },
      { spec: 'The complete Small Market sale is worth twenty Lira', check: async () => expect(page.getByText('5 selected · 20 Lira')).toBeVisible() },
      { spec: 'The flexible sale is legal with exactly Ada’s five goods', check: async () => expect(page.getByRole('button', { name: 'Sell flexible goods for 20 Lira' })).toBeEnabled() }
    ] });

    await page.getByRole('button', { name: 'Sell flexible goods for 20 Lira' }).click();
    await ada.step('host-sells-substituted-goods', { description: 'Ada pays every good for the complete twenty-Lira sale', verifications: [
      { spec: 'Exactly two fabric, two fruit, and one jewelry are paid', check: async () => expectState(page, { eventCount: 9, diagnosticCount: 0, game: { phase: 'turn-end', activeBonusEffects: [], smallDemand: [...beforeSale.game.smallDemand.slice(1), demandId], players: [{ lira: 22, goods: { fabric: 0, spice: 0, fruit: 0, jewelry: 0 } }, {}] } }) },
      { spec: 'The completion record identifies a five-good flexible sale', check: async () => expect(page.getByText('Used flexible demand to sell 5 goods for 20 Lira.', { exact: true })).toBeVisible() },
      { spec: 'The five-slot editor closes after the consumed effect rotates demand', check: async () => expect(page.getByLabel(/Payment for demand slot/)).toHaveCount(0) }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
