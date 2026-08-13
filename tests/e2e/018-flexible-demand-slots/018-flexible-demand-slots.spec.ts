import { expect, test } from '@playwright/test';
import { demandTiles, type Good } from '../../../src/lib/game/manifests';
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
    'Ada and Bora open a normal two-player bazaar. A visible emulator review control gives Ada the real Flexible Demand card and enough public stock to demonstrate it. Ada walks to Small Market, plays the private card, selects three printed demand slots, changes each slot’s payment dropdown, and commits one nine-Lira sale. Every input is followed by a screenshot and programmatic checks of the controls, immutable event history, goods payment, demand rotation, and consumed Bonus effect.'
  );

  try {
    await openTwoPlayerGame({
      hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed: 'economy-safe-6',
      extraQuery: '&e2eReview=flexible-market'
    });

    await page.getByRole('button', { name: 'Review Flexible Demand market sale' }).click();
    await ada.step('host-supplies-flexible-market-review', { description: 'Ada opens the reviewed Flexible Demand position', verifications: [
      { spec: 'Ada has three of every good and the real Flexible Demand card', check: async () => expectState(page, { eventCount: 6, diagnosticCount: 0, game: { phase: 'movement', players: [{ capacity: 3, goods: { fabric: 3, spice: 3, fruit: 3, jewelry: 3 } }, {}], localHand: expect.arrayContaining(['bonus-wild-small-market-1']) } }) },
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
      { spec: 'No substitution dropdown exists before Flexible Demand is active', check: async () => expect(page.getByLabel(/Payment for demand slot/)).toHaveCount(0) },
      { spec: 'Movement opens the action without rotating demand', check: async () => expectState(page, { eventCount: 7, diagnosticCount: 0, game: { phase: 'action', players: [{ merchantPlace: 11 }, {}] } }) }
    ] });

    await page.getByRole('button', { name: /Inspect Bonus card: Flexible demand/ }).click();
    await ada.step('host-inspects-flexible-demand', { description: 'Ada inspects the private Flexible Demand card', verifications: [
      { spec: 'The illustrated card explains the any-mixture market effect', check: async () => expect(page.getByTestId('illustrated-bonus-card')).toContainText('any mixture of goods') },
      { spec: 'The card is playable at the current Small Market', check: async () => expect(page.getByRole('button', { name: 'Use flexible Small Market demand' })).toBeEnabled() },
      { spec: 'Private inspection appends no event', check: async () => expectState(page, { eventCount: 7, game: { selectedBonus: 'bonus-wild-small-market-1' } }) }
    ] });

    await page.getByRole('button', { name: 'Use flexible Small Market demand' }).click();
    const beforeSale = await readState(page);
    const demandId = beforeSale.game.smallDemand[0] as string;
    const demand = demandTiles.find(({ id }) => id === demandId)!;
    await ada.step('host-enables-slot-substitutions', { description: 'Ada enables substitutions on all five demand slots', verifications: [
      { spec: 'Each printed market good is now paired with its own payment dropdown', check: async () => expect(page.getByLabel(/Payment for demand slot/)).toHaveCount(5) },
      { spec: 'Every dropdown defaults to the good printed in that slot', check: async () => { for (const [index, good] of demand.goods.entries()) await expect(page.getByLabel(`Payment for demand slot ${index + 1}`)).toHaveValue(good); } },
      { spec: 'The Bonus event activates Flexible Demand without selling anything', check: async () => expectState(page, { eventCount: 8, diagnosticCount: 0, game: { phase: 'action', activeBonusEffects: ['wild-small-market'], smallDemand: [demandId, ...beforeSale.game.smallDemand.slice(1)] } }) }
    ] });

    const replacements: Good[] = ['jewelry', 'spice', 'fruit'];
    for (const [index, replacement] of replacements.entries()) {
      await page.getByLabel(`Sell demand slot ${index + 1}: ${demand.goods[index]}`).check();
      await ada.step(`host-selects-demand-slot-${index + 1}`, { description: `Ada selects demand slot ${index + 1}`, verifications: [
        { spec: `Demand slot ${index + 1} is visibly selected`, check: async () => expect(page.getByLabel(`Sell demand slot ${index + 1}: ${demand.goods[index]}`)).toBeChecked() },
        { spec: 'The pending sale value updates without an event', check: async () => { await expect(page.getByText(`${index + 1} selected · ${[2, 5, 9][index]} Lira`)).toBeVisible(); await expectState(page, { eventCount: 8 }); } }
      ] });
      await page.getByLabel(`Payment for demand slot ${index + 1}`).selectOption(replacement);
      await ada.step(`host-substitutes-demand-slot-${index + 1}`, { description: `Ada sets slot ${index + 1} payment to ${replacement}`, verifications: [
        { spec: `The slot dropdown visibly reads ${replacement}`, check: async () => expect(page.getByLabel(`Payment for demand slot ${index + 1}`)).toHaveValue(replacement) },
        { spec: 'Changing a local payment choice writes no canonical event', check: async () => expectState(page, { eventCount: 8 }) }
      ] });
    }

    await page.getByRole('button', { name: 'Sell flexible goods for 9 Lira' }).click();
    await ada.step('host-sells-substituted-goods', { description: 'Ada pays the three chosen substitutions for nine Lira', verifications: [
      { spec: 'Exactly jewelry, spice, and fruit are paid once', check: async () => expectState(page, { eventCount: 9, diagnosticCount: 0, game: { phase: 'turn-end', activeBonusEffects: [], smallDemand: [...beforeSale.game.smallDemand.slice(1), demandId], players: [{ lira: 11, goods: { fabric: 3, spice: 2, fruit: 2, jewelry: 2 } }, {}] } }) },
      { spec: 'The completion record identifies a three-good flexible sale', check: async () => expect(page.getByText('Used flexible demand to sell 3 goods for 9 Lira.', { exact: true })).toBeVisible() },
      { spec: 'The five-slot editor closes after the consumed effect rotates demand', check: async () => expect(page.getByLabel(/Payment for demand slot/)).toHaveCount(0) }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
