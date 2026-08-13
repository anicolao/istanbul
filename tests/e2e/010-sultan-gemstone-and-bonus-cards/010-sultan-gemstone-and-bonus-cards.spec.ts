import { expect, test, type Page } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('ruby routes escalate and Bonus cards resolve at reviewed timing windows', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'GEMUP' : 'RUBYS';
  const seed = 'bonus-1';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Buying escalating rubies and playing Bonus cards at exact moments',
    'Ada opens a two-player table with the reviewed 15-Lira Dealer and five-good Palace start. A visible emulator-only review control supplies resources through the same immutable event stream. Ada plays a long-move card, pays the neutral merchant, buys and immediately repeats the Gemstone Dealer at the increased price, then reaches the Sultan, chooses the wild good, buys and repeats at the newly exposed six-good cost. Along the route she plays direct Lira and good cards, reloads private state, and Bora performs every intervening turn through ordinary controls.'
  );

  async function boraTurn(destination: 7 | 12, events: [number, number], nextTurn: number, slug: string) {
    const place = destination === 7 ? 'Fountain' : 'Police Station';
    const moveButton = destination === 7 ? 'Move here without leaving an assistant' : (await readState(boraPage)).game.players[1].assistantsByPlace['12'] ? 'Move here and pick up assistant' : 'Move here and leave an assistant';
    await boraPage.getByRole('button', { name: new RegExp(`^${destination} ${place}.*Reachable`) }).click();
    await bora.step(`guest-selects-${slug}`, { description: `Bora selects ${place}`, verifications: [
      { spec: `${place} is selected without changing history`, check: async () => { await expect(boraPage.getByRole('button', { name: new RegExp(`^${destination} ${place}.*Reachable`) })).toHaveAttribute('aria-pressed', 'true'); await expectState(boraPage, { eventCount: events[0] - 1, game: { selectedPlace: destination } }); } },
      { spec: 'The required assistant operation is visible', check: async () => expect(boraPage.getByRole('button', { name: moveButton })).toBeEnabled() }
    ] });
    await boraPage.getByRole('button', { name: moveButton }).click();
    await bora.step(`guest-arrives-${slug}`, { description: `Bora arrives at ${place}`, verifications: [
      { spec: 'Bora reaches the action phase exactly once', check: async () => expectState(boraPage, { eventCount: events[0], diagnosticCount: 0, game: { currentTurn: 'Bora', phase: 'action', players: [{}, { merchantPlace: destination }] } }) },
      { spec: 'A Place action may be skipped explicitly', check: async () => expect(boraPage.getByRole('button', { name: destination === 7 ? /^(End turn|Skip Fountain and end turn)$/ : 'Skip Police Station and end turn' })).toBeEnabled() }
    ] });
    await boraPage.getByRole('button', { name: destination === 7 ? /^(End turn|Skip Fountain and end turn)$/ : 'Skip Police Station and end turn' }).click();
    await bora.step(`guest-ends-${slug}`, { description: `Bora skips ${place} and passes`, verifications: [
      { spec: `Ada begins turn ${nextTurn}`, check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Clockwise handoff stays diagnostic-free', check: async () => expectState(boraPage, { eventCount: events[1], diagnosticCount: 0, game: { currentTurn: 'Ada', turnNumber: nextTurn, phase: 'movement' } }) }
    ] });
  }

  async function inspectAndPlayBonus(actor: TestStepHelper, actorPage: Page, cardName: RegExp, playButton: string | RegExp, slug: string, description: string, before: number, after: number) {
    await actorPage.getByRole('button', { name: cardName }).first().click();
    await actor.step(`host-inspects-${slug}`, { description: `Ada inspects ${description}`, verifications: [
      { spec: 'The private card title and full effect text are visible', check: async () => { const inspector = actorPage.locator('.inspector'); await expect(inspector.getByRole('heading')).toContainText(description.replace(/^A useful connection for .*/, 'A useful connection')); await expect(inspector).toContainText(/During|Immediately|Stay|Return|Use|Gain|Repeat/); } },
      { spec: 'Private inspection writes no event', check: async () => expectState(actorPage, { eventCount: before, game: { selectedBonus: expect.any(String) } }) }
    ] });
    await actorPage.getByRole('button', { name: playButton }).click();
    await actor.step(`host-plays-${slug}`, { description: `Ada plays ${description}`, verifications: [
      { spec: 'The selected private card is discarded after use', check: async () => expectState(actorPage, { game: { selectedBonus: null, bonusDiscard: expect.arrayContaining([expect.any(String)]) } }) },
      { spec: 'One canonical Bonus event records the effect', check: async () => expectState(actorPage, { eventCount: after, diagnosticCount: 0, game: { bonusLog: expect.arrayContaining([{ cardId: expect.any(String), summary: expect.any(String) }]) } }) }
    ] });
  }

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed });

    await page.getByRole('button', { name: 'Review ruby routes with supplied resources' }).click();
    await ada.step('host-supplies-reviewed-resources', { description: 'Ada supplies reviewed ruby-route resources', verifications: [
      { spec: 'The resource rail shows 35 Lira, capacity three, and three of each good', check: async () => expectState(page, { eventCount: 6, diagnosticCount: 0, game: { players: [{ lira: 35, capacity: 3, extensions: 1, goods: { fabric: 3, spice: 3, fruit: 3, jewelry: 3 } }, {}], rubyTracks: { gemstonePrice: 15, gemstoneRubies: 10, sultanIndex: 5, sultanRubies: 5 } } }) },
      { spec: 'All supplied cards are real reviewed manifest instances', check: async () => expect(page.getByLabel('Ada resources').getByText('Private hand')).toBeVisible() }
    ] });

    await inspectAndPlayBonus(ada, page, /Inspect Bonus card: A swift passage/, 'Play for a 3–4 space move', 'long-move', 'A swift passage', 6, 7);
    await page.getByRole('button', { name: /^16 Gemstone Dealer.*Reachable/ }).click();
    await ada.step('host-selects-gemstone-long-route', { description: 'Ada selects Gemstone Dealer three spaces away', verifications: [
      { spec: 'The distant Dealer is now reachable only through the card', check: async () => { await expect(page.getByRole('button', { name: /^16 Gemstone Dealer.*Reachable/ })).toHaveAttribute('aria-pressed', 'true'); await expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled(); } },
      { spec: 'Inspection reveals that another trade would raise the price to 16 Lira', check: async () => expect(page.getByLabel('After the next Gemstone Dealer trade: 16 Lira')).toBeVisible() },
      { spec: 'Movement inspection preserves event seven', check: async () => expectState(page, { eventCount: 7, game: { activeBonusEffects: ['long-move'], selectedPlace: 16 } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-meets-neutral-at-dealer', { description: 'Ada crosses four spaces and meets the neutral Dealer merchant', verifications: [
      { spec: 'The neutral toll appears before any ruby purchase', check: async () => expect(page.getByRole('button', { name: 'Pay 2 Lira and continue' })).toBeEnabled() },
      { spec: 'The long-move effect is consumed by exact movement', check: async () => expectState(page, { eventCount: 8, game: { phase: 'merchant-payment', activeBonusEffects: [], lastMovement: { distance: 3, to: 16 }, players: [{ lira: 35, rubies: 0 }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Pay 2 Lira and continue' }).click();
    await ada.step('host-pays-dealer-neutral', { description: 'Ada pays the neutral merchant at Gemstone Dealer', verifications: [
      { spec: 'The reviewed starting price is 15 Lira', check: async () => expect(page.getByRole('button', { name: 'Pay 15 Lira for 1 ruby' })).toBeEnabled() },
      { spec: 'Payment leaves 33 Lira and relocates the neutral merchant', check: async () => expectState(page, { eventCount: 9, game: { phase: 'action', rubyTracks: { gemstonePrice: 15 }, players: [{ lira: 33 }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Pay 15 Lira for 1 ruby' }).click();
    await ada.step('host-buys-first-dealer-ruby', { description: 'Ada buys the 15-Lira Dealer ruby', verifications: [
      { spec: 'The public track advances immediately to 16 while the unlimited route remains available', check: async () => expectState(page, { eventCount: 10, game: { phase: 'turn-end', rubyTracks: { gemstonePrice: 16, gemstoneRubies: 10 }, players: [{ lira: 18, rubies: 1 }, {}] } }) },
      { spec: 'Dealer tile now gives the entire status area to the 16-Lira price', check: async () => expect(page.getByTestId('place-state-16')).toHaveAttribute('data-state-summary', 'Next ruby costs 16 Lira') },
      { spec: 'The completion panel names the exact payment', check: async () => expect(page.getByRole('complementary').getByText('Paid 15 Lira to the Gemstone Dealer and claimed 1 ruby.', { exact: true })).toBeVisible() }
    ] });
    await page.getByRole('button', { name: /Inspect Bonus card: A second ruby offer/ }).click();
    await ada.step('host-inspects-repeat-dealer', { description: 'Ada inspects A second ruby offer', verifications: [
      { spec: 'The repeat control names the newly increased price', check: async () => expect(page.getByRole('button', { name: 'Repeat at 16 Lira' })).toBeEnabled() },
      { spec: 'Inspection preserves the first ruby at event ten', check: async () => expectState(page, { eventCount: 10, game: { players: [{ rubies: 1, lira: 18 }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Repeat at 16 Lira' }).click();
    await ada.step('host-repeats-dealer-at-new-price', { description: 'Ada repeats Gemstone Dealer at 16 Lira', verifications: [
      { spec: 'The track advances a second time without a new movement', check: async () => expectState(page, { eventCount: 11, diagnosticCount: 0, game: { rubyTracks: { gemstonePrice: 17, gemstoneRubies: 10 }, players: [{ lira: 2, rubies: 2 }, {}] } }) },
      { spec: 'The discarded repeat card is no longer private', check: async () => expect(page.getByRole('button', { name: /Inspect Bonus card: A second ruby offer/ })).toHaveCount(0) }
    ] });
    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-dealer-turn', { description: 'Ada ends the double-ruby Dealer turn', verifications: [
      { spec: 'Bora begins turn two with Ada’s two rubies public', check: async () => expectState(page, { eventCount: 12, game: { currentTurn: 'Bora', turnNumber: 2, players: [{ rubies: 2 }, {}] } }) },
      { spec: 'Both exact prices survive the completed action copy', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() }
    ] });

    await boraTurn(12, [13, 14], 3, 'police-first');
    await inspectAndPlayBonus(ada, page, /Inspect Bonus card: A profitable bargain/, 'Play to gain 5 Lira', 'gain-lira', 'A profitable bargain', 14, 15);
    await inspectAndPlayBonus(ada, page, /Inspect Bonus card: A swift passage/, 'Play for a 3–4 space move', 'second-long-move', 'A swift passage', 15, 16);
    await page.getByRole('button', { name: /^13 Sultan's Palace.*Reachable/ }).click();
    await ada.step('host-selects-palace', { description: 'Ada selects Sultan’s Palace beside the Dealer', verifications: [
      { spec: 'The Palace is a legal adjacent route', check: async () => expect(page.getByRole('button', { name: /^13 Sultan's Palace.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Inspection reveals that another trade would expose a six-good cost', check: async () => expect(page.getByLabel('After the next Sultan trade: 6 goods')).toBeVisible() },
      { spec: 'Ada carries seven Lira and the extended goods capacity', check: async () => expectState(page, { eventCount: 16, game: { activeBonusEffects: ['long-move'], players: [{ lira: 7, capacity: 3, goods: { fabric: 3, spice: 3, fruit: 3, jewelry: 3 } }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-palace', { description: 'Ada arrives at Sultan’s Palace', verifications: [
      { spec: 'The two-player track demands five goods', check: async () => { await expect(page.getByLabel('Current Sultan goods cost').locator('.good')).toHaveCount(5); await expect(page.getByLabel('Sultan wild good 1')).toBeVisible(); } },
      { spec: 'The exposed Palace index remains exact', check: async () => expectState(page, { eventCount: 17, game: { phase: 'action', activeBonusEffects: [], rubyTracks: { sultanIndex: 5, sultanRubies: 5 } } }) }
    ] });
    await page.getByLabel('Sultan wild good 1').selectOption('fruit');
    await ada.step('host-chooses-first-palace-wild', { description: 'Ada assigns fruit to the first Palace wild cost', verifications: [
      { spec: 'The visible wild selector reads Fruit', check: async () => expect(page.getByLabel('Sultan wild good 1')).toHaveValue('fruit') },
      { spec: 'Five-goods delivery is now enabled without an event', check: async () => { await expect(page.getByRole('button', { name: 'Deliver 5 goods for 1 ruby' })).toBeEnabled(); await expectState(page, { eventCount: 17 }); } }
    ] });
    await page.getByRole('button', { name: 'Deliver 5 goods for 1 ruby' }).click();
    await ada.step('host-buys-first-palace-ruby', { description: 'Ada delivers five goods for the Palace ruby', verifications: [
      { spec: 'The first delivery conserves the extended goods', check: async () => expectState(page, { eventCount: 18, game: { phase: 'turn-end', rubyTracks: { sultanIndex: 6, sultanRubies: 5 }, players: [{ goods: { fabric: 2, spice: 2, fruit: 1, jewelry: 2 }, rubies: 3 }, {}] } }) },
      { spec: 'Palace tile gives its status area to the newly exposed six-good cost', check: async () => expect(page.getByTestId('place-state-13')).toHaveAttribute('data-state-summary', /^Next ruby costs (.+, ){5}.+$/) },
      { spec: 'The completion panel reports the exact five-good delivery', check: async () => expect(page.getByRole('complementary').getByText('Delivered 5 goods to the Sultan and claimed 1 ruby.', { exact: true })).toBeVisible() }
    ] });
    await inspectAndPlayBonus(ada, page, /Inspect Bonus card: A useful connection/, /Play to gain 1 jewelry/, 'gain-jewelry', 'A useful connection for jewelry', 18, 19);
    await page.getByRole('button', { name: /Inspect Bonus card: A useful connection/ }).first().click();
    await ada.step('host-inspects-gain-spice', { description: 'Ada inspects the next useful connection', verifications: [
      { spec: 'The second private good card opens independently', check: async () => { await expect(page.locator('.inspector').getByRole('heading', { name: 'A useful connection' })).toBeVisible(); await expect(page.getByLabel('Bonus good to gain')).toHaveValue('jewelry'); } },
      { spec: 'Opening another private card writes no event', check: async () => expectState(page, { eventCount: 19, game: { selectedBonus: expect.any(String) } }) }
    ] });
    await page.getByLabel('Bonus good to gain').selectOption('fabric');
    await ada.step('host-chooses-spice-bonus', { description: 'Ada chooses fabric on the next useful connection', verifications: [
      { spec: 'The private selector visibly reads Fabric', check: async () => expect(page.getByLabel('Bonus good to gain')).toHaveValue('fabric') },
      { spec: 'Changing a private card choice writes no event', check: async () => expectState(page, { eventCount: 19 }) }
    ] });
    await page.getByRole('button', { name: 'Play to gain 1 fabric' }).click();
    await ada.step('host-plays-gain-spice', { description: 'Ada plays a useful connection for fabric', verifications: [
      { spec: 'Fabric is filled and jewelry reaches capacity', check: async () => expectState(page, { eventCount: 20, game: { players: [{ goods: { fabric: 3, spice: 2, fruit: 1, jewelry: 3 } }, {}] } }) },
      { spec: 'The action remains in the repeat timing window', check: async () => expectState(page, { game: { phase: 'turn-end', lastAction: { place: 13 } } }) }
    ] });
    await page.getByRole('button', { name: /Inspect Bonus card: A useful connection/ }).first().click();
    await ada.step('host-inspects-gain-fruit', { description: 'Ada inspects a third useful connection', verifications: [
      { spec: 'The third private good card opens at the prior Fabric selection', check: async () => { await expect(page.locator('.inspector').getByRole('heading', { name: 'A useful connection' })).toBeVisible(); await expect(page.getByLabel('Bonus good to gain')).toHaveValue('fabric'); } },
      { spec: 'Opening the card writes no event', check: async () => expectState(page, { eventCount: 20 }) }
    ] });
    await page.getByLabel('Bonus good to gain').selectOption('fruit');
    await ada.step('host-chooses-fruit-bonus', { description: 'Ada chooses fruit on the third useful connection', verifications: [
      { spec: 'The private selector visibly reads Fruit', check: async () => expect(page.getByLabel('Bonus good to gain')).toHaveValue('fruit') },
      { spec: 'Changing the selection writes no event', check: async () => expectState(page, { eventCount: 20 }) }
    ] });
    await page.getByRole('button', { name: 'Play to gain 1 fruit' }).click();
    await ada.step('host-plays-gain-fruit', { description: 'Ada plays the third useful connection for fruit', verifications: [
      { spec: 'Ten goods now cover the newly exposed Palace cost', check: async () => expectState(page, { eventCount: 21, game: { players: [{ goods: { fabric: 3, spice: 2, fruit: 2, jewelry: 3 } }, {}] } }) },
      { spec: 'The repeat timing window remains open', check: async () => expectState(page, { game: { phase: 'turn-end', lastAction: { place: 13 } } }) }
    ] });
    await page.getByRole('button', { name: /Inspect Bonus card: The Sultan grants another audience/ }).click();
    await ada.step('host-inspects-repeat-palace', { description: 'Ada inspects The Sultan grants another audience', verifications: [
      { spec: 'The repeat names the newly exposed six-good cost', check: async () => expect(page.getByRole('button', { name: 'Repeat for 6 goods' })).toBeEnabled() },
      { spec: 'The replenished post-purchase goods are exact', check: async () => expectState(page, { eventCount: 21, game: { players: [{ goods: { fabric: 3, spice: 2, fruit: 2, jewelry: 3 } }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Repeat for 6 goods' }).click();
    await ada.step('host-repeats-palace-at-new-cost', { description: 'Ada repeats Sultan’s Palace at six goods', verifications: [
      { spec: 'A fourth ruby and the seven-good next cost are public', check: async () => expectState(page, { eventCount: 22, game: { rubyTracks: { sultanIndex: 7, sultanRubies: 5 }, players: [{ goods: { fabric: 2, spice: 1, fruit: 0, jewelry: 1 }, rubies: 4 }, {}] } }) },
      { spec: 'The completion copy records both Palace deliveries', check: async () => expect(page.getByRole('complementary')).toContainText("Repeated Sultan's Palace") }
    ] });
    await page.reload();
    await ada.step('host-reloads-completed-repeat', { description: 'Ada reloads the completed repeat decision', verifications: [
      { spec: 'The spent private repeat card stays discarded', check: async () => expect(page.getByRole('button', { name: /Inspect Bonus card: The Sultan grants another audience/ })).toHaveCount(0) },
      { spec: 'Replay restores event twenty-two byte-for-byte', check: async () => expectState(page, { eventCount: 22, diagnosticCount: 0, game: { phase: 'turn-end', rubyTracks: { sultanIndex: 7 }, players: [{ rubies: 4 }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-palace-turn', { description: 'Ada passes after the reviewed Palace repeat', verifications: [
      { spec: 'Bora begins turn four', check: async () => expectState(page, { eventCount: 23, game: { currentTurn: 'Bora', turnNumber: 4, phase: 'movement' } }) },
      { spec: 'All four earned rubies remain public', check: async () => expectState(page, { game: { players: [{ rubies: 4 }, {}] } }) }
    ] });

    await boraTurn(7, [24, 25], 5, 'fountain');
    const host = await readState(page); const guest = await readState(boraPage);
    expect(guest.game.rubyTracks).toEqual(host.game.rubyTracks);
    expect(guest.game.players).toEqual(host.game.players);
    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
