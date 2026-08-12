import { expect, test } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('Mosque tiles grant reviewed permanent abilities and a paired ruby', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'PRAYS' : 'TILES';
  const seed = 'mosque-0';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the first merchant');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Earning Mosque tiles, permanent abilities, and a paired ruby',
    'Ada fills spice, buys the exposed Green tile at Small Mosque, later fills fabric and pauses in a recoverable Green ability choice to buy extra jewelry. She returns to acquire the Red tile and immediately claims the Small Mosque ruby, then wagers at Tea House, sees the original dice, turns one die to four, reloads the adjusted result, and passes. Bora takes every intervening turn through ordinary board controls so the complete timing remains visible.'
  );

  async function boraTransit(options: {
    destination: 7 | 12;
    selectSlug: string;
    arriveSlug: string;
    endSlug: string;
    selectDescription: string;
    moveButton: string;
    endButton: string;
    afterMoveEvent: number;
    afterEndEvent: number;
    nextTurn: number;
  }) {
    const placeName = options.destination === 7 ? 'Fountain' : 'Police Station';
    await boraPage.getByRole('button', { name: new RegExp(`^${options.destination} ${placeName}.*Reachable`) }).click();
    await bora.step(options.selectSlug, { description: options.selectDescription, verifications: [
      { spec: `${placeName} is selected as Bora’s legal route`, check: async () => expect(boraPage.getByRole('button', { name: new RegExp(`^${options.destination} ${placeName}.*Reachable`) })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'The assistant operation is explicit before movement', check: async () => expect(boraPage.getByRole('button', { name: options.moveButton })).toBeEnabled() },
      { spec: 'Inspection does not alter immutable history', check: async () => expectState(boraPage, { eventCount: options.afterMoveEvent - 1, game: { currentTurn: 'Bora', phase: 'movement', selectedPlace: options.destination } }) }
    ] });
    await boraPage.getByRole('button', { name: options.moveButton }).click();
    await bora.step(options.arriveSlug, { description: `Bora arrives at ${placeName}`, verifications: [
      { spec: `${placeName} action controls replace the route planner`, check: async () => expect(boraPage.getByRole('button', { name: options.endButton })).toBeEnabled() },
      { spec: 'Bora’s move is a clean action-phase event', check: async () => expectState(boraPage, { eventCount: options.afterMoveEvent, diagnosticCount: 0, game: { currentTurn: 'Bora', phase: 'action', players: [{}, { merchantPlace: options.destination }] } }) }
    ] });
    await boraPage.getByRole('button', { name: options.endButton }).click();
    await bora.step(options.endSlug, { description: `Bora skips ${placeName} and passes`, verifications: [
      { spec: `Ada begins turn ${options.nextTurn}`, check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Skipping creates no resources or Mosque ownership', check: async () => expectState(boraPage, { eventCount: options.afterEndEvent, diagnosticCount: 0, game: { currentTurn: 'Ada', turnNumber: options.nextTurn, phase: 'movement', players: [{}, { mosqueTileIds: [] }] } }) }
    ] });
  }

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed });

    await page.getByRole('button', { name: /^3 Spice Warehouse.*Reachable/ }).click();
    await ada.step('host-selects-spice', { description: 'Ada selects adjacent Spice Warehouse', verifications: [
      { spec: 'Spice Warehouse is selected and reachable', check: async () => expect(page.getByRole('button', { name: /^3 Spice Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada must leave an assistant', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() },
      { spec: 'Ada begins without goods or Mosque tiles', check: async () => expectState(page, { eventCount: 5, game: { players: [{ goods: { spice: 0 }, mosqueTileIds: [] }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-spice', { description: 'Ada arrives at Spice Warehouse', verifications: [
      { spec: 'The fill action names capacity two', check: async () => expect(page.getByRole('button', { name: 'Fill spice to 2' })).toBeEnabled() },
      { spec: 'Only movement is event six', check: async () => expectState(page, { eventCount: 6, game: { phase: 'action', players: [{ merchantPlace: 3, assistantsCarried: 3, goods: { spice: 0 } }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Fill spice to 2' }).click();
    await ada.step('host-fills-spice', { description: 'Ada fills spice to wheelbarrow capacity', verifications: [
      { spec: 'The completed action reports exact capacity', check: async () => expect(page.getByText('Filled spice to capacity 2.', { exact: true })).toBeVisible() },
      { spec: 'No Green ability exists before buying its tile', check: async () => expectState(page, { eventCount: 7, game: { phase: 'turn-end', players: [{ goods: { spice: 2 }, mosqueTileIds: [] }, {}] } }) },
      { spec: 'No extra-good selector is rendered', check: async () => expect(page.getByLabel('Warehouse extra good')).toHaveCount(0) }
    ] });
    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-spice-turn', { description: 'Ada passes the completed spice turn', verifications: [
      { spec: 'Bora receives turn two', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Spice remains available for the Mosque', check: async () => expectState(page, { eventCount: 8, game: { currentTurn: 'Bora', turnNumber: 2, players: [{ goods: { spice: 2 } }, {}] } }) }
    ] });

    await boraPage.getByRole('button', { name: /^12 Police Station.*Reachable/ }).click();
    await bora.step('guest-selects-police-first', { description: 'Bora selects Police Station', verifications: [
      { spec: 'Police is a legal adjacent route', check: async () => expect(boraPage.getByRole('button', { name: /^12 Police Station.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Bora must leave an assistant', check: async () => expect(boraPage.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() },
      { spec: 'The family member still waits at Police', check: async () => expectState(boraPage, { eventCount: 8, game: { players: [{}, { familyPlace: 12 }] } }) }
    ] });
    await boraPage.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await bora.step('guest-arrives-police-first', { description: 'Bora arrives at Police Station', verifications: [
      { spec: 'The family dispatch control opens', check: async () => expect(boraPage.getByLabel('Family destination')).toBeVisible() },
      { spec: 'Movement is event nine', check: async () => expectState(boraPage, { eventCount: 9, game: { phase: 'action', players: [{}, { merchantPlace: 12, familyPlace: 12 }] } }) }
    ] });
    await boraPage.getByLabel('Family destination').selectOption('14');
    await bora.step('guest-chooses-small-mosque-family', { description: 'Bora chooses Small Mosque for the family member', verifications: [
      { spec: 'Small Mosque is the visible destination', check: async () => expect(boraPage.getByLabel('Family destination')).toHaveValue('14') },
      { spec: 'The dispatch button names Small Mosque', check: async () => expect(boraPage.getByRole('button', { name: 'Send family to Small Mosque' })).toBeEnabled() },
      { spec: 'The local choice adds no history', check: async () => expectState(boraPage, { eventCount: 9, game: { players: [{}, { familyPlace: 12 }] } }) }
    ] });
    await boraPage.getByRole('button', { name: 'Send family to Small Mosque' }).click();
    await bora.step('guest-dispatches-family-to-mosque', { description: 'Bora dispatches family to Small Mosque', verifications: [
      { spec: 'The unaffordable remote Mosque action appears', check: async () => expect(boraPage.getByRole('button', { name: 'Skip Mosque and end turn' })).toBeEnabled() },
      { spec: 'Family movement has no merchant encounter', check: async () => expectState(boraPage, { eventCount: 10, game: { phase: 'family-action', pending: { kind: 'family-action', destination: 14 }, players: [{}, { merchantPlace: 12, familyPlace: 14 }] } }) }
    ] });
    await boraPage.getByRole('button', { name: 'Skip Mosque and end turn' }).click();
    await bora.step('guest-skips-family-mosque', { description: 'Bora leaves family at Small Mosque and passes', verifications: [
      { spec: 'Ada begins turn three', check: async () => expect(boraPage.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() },
      { spec: 'Bora’s family remains available to catch', check: async () => expectState(boraPage, { eventCount: 11, game: { currentTurn: 'Ada', turnNumber: 3, phase: 'movement', players: [{}, { familyPlace: 14 }] } }) }
    ] });

    await page.getByRole('button', { name: /^14 Small Mosque.*Reachable/ }).click();
    await ada.step('host-selects-small-mosque-green', { description: 'Ada selects Small Mosque beside the Spice Warehouse', verifications: [
      { spec: 'Small Mosque is a one-space route', check: async () => expect(page.getByRole('button', { name: /^14 Small Mosque.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada is ready to leave a second assistant', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() },
      { spec: 'The exposed two-good stacks remain untouched', check: async () => expectState(page, { eventCount: 11, game: { players: [{ goods: { spice: 2 }, mosqueTileIds: [] }, { familyPlace: 14 }] } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-meets-neutral-at-small-mosque', { description: 'Ada arrives and meets the neutral merchant at Small Mosque', verifications: [
      { spec: 'The neutral merchant toll precedes the Mosque action', check: async () => expect(page.getByRole('button', { name: 'Pay 2 Lira and continue' })).toBeEnabled() },
      { spec: 'Ada can afford the exact two-Lira toll', check: async () => expectState(page, { eventCount: 12, game: { phase: 'merchant-payment', pending: { kind: 'merchant-payment', total: 2 }, players: [{ merchantPlace: 14, lira: 2, goods: { spice: 2 } }, { familyPlace: 14 }] } }) },
      { spec: 'Neither tile nor family reward resolves early', check: async () => expect(page.getByLabel('Small Mosque tile offers')).toHaveCount(0) }
    ] });
    await page.getByRole('button', { name: 'Pay 2 Lira and continue' }).click();
    await ada.step('host-pays-neutral-at-mosque', { description: 'Ada pays and relocates the neutral merchant', verifications: [
      { spec: 'Both official Small Mosque powers are presented as large square offers', check: async () => { const offers = page.getByLabel('Small Mosque tile offers'); await expect(offers.getByText('Red power', { exact: true })).toBeVisible(); await expect(offers.getByText('Green power', { exact: true })).toBeVisible(); await expect(offers.locator('.mosque-tile-art')).toHaveCount(2); } },
      { spec: 'Green is affordable and Red is disabled', check: async () => { await expect(page.getByRole('button', { name: 'Pay 1 spice for Green power' })).toBeEnabled(); await expect(page.getByRole('button', { name: 'Pay 1 fabric for Red power' })).toBeDisabled(); } },
      { spec: 'Payment spends Lira but no goods', check: async () => expectState(page, { eventCount: 13, game: { phase: 'action', players: [{ merchantPlace: 14, lira: 0, goods: { fabric: 0, spice: 2 } }, { familyPlace: 14 }] } }) }
    ] });
    await page.getByRole('button', { name: 'Pay 1 spice for Green power' }).click();
    await ada.step('host-buys-green-tile', { description: 'Ada pays one spice for the Green Mosque tile', verifications: [
      { spec: 'The full Green power tile settles into Ada’s tray', check: async () => { const power = page.getByLabel('Ada Mosque tiles').locator('[data-power-color="spice"]'); await expect(power).toHaveAttribute('data-enabled', 'true'); await expect(power.locator('[data-art-kind="component"]')).toBeVisible(); } },
      { spec: 'One spice is paid before the mandatory family catch', check: async () => expectState(page, { eventCount: 14, game: { phase: 'encounters', pending: { familyUids: [expect.any(String)] }, players: [{ goods: { spice: 1 }, mosqueTileIds: ['mosque-spice-2'], rubies: 0 }, { familyPlace: 14 }] } }) },
      { spec: 'Small Mosque replaces Green’s cost with the next exposed requirement', check: async () => expect(page.getByTestId('place-state-14')).toHaveAttribute('data-state-summary', /2 fabric required, pay 1; 4 spice required, pay 1; 2 ruby rewards remain/) },
      { spec: 'The acquisition summary identifies the paid color', check: async () => expectState(page, { game: { lastAction: { summary: 'Paid 1 spice and gained the spice Mosque tile.' } } }) }
    ] });
    await page.getByRole('button', { name: 'Catch for 3 Lira' }).click();
    await ada.step('host-catches-family-for-lira', { description: 'Ada catches Bora’s family for three Lira', verifications: [
      { spec: 'The catch closes every remaining encounter', check: async () => expect(page.getByRole('button', { name: 'End turn and pass clockwise' })).toBeEnabled() },
      { spec: 'Bora’s family returns to Police and Ada receives three', check: async () => expectState(page, { eventCount: 15, game: { phase: 'turn-end', players: [{ lira: 3, mosqueTileIds: ['mosque-spice-2'] }, { familyPlace: 12 }] } }) },
      { spec: 'The encounter ledger records the chosen reward', check: async () => expect(page.getByText("Caught Bora's family and gained 3 Lira.", { exact: true })).toBeVisible() }
    ] });
    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-green-tile-turn', { description: 'Ada ends the Green-tile turn', verifications: [
      { spec: 'Bora begins turn four', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Green ownership persists publicly', check: async () => expectState(page, { eventCount: 16, game: { currentTurn: 'Bora', turnNumber: 4, players: [{ lira: 3, mosqueTileIds: ['mosque-spice-2'] }, { familyPlace: 12 }] } }) }
    ] });

    await boraTransit({ destination: 7, selectSlug: 'guest-selects-fountain-first', arriveSlug: 'guest-arrives-fountain-first', endSlug: 'guest-skips-fountain-first', selectDescription: 'Bora returns from Police to Fountain', moveButton: 'Move here without leaving an assistant', endButton: 'Skip Fountain and end turn', afterMoveEvent: 17, afterEndEvent: 18, nextTurn: 5 });

    await page.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ }).click();
    await ada.step('host-selects-fabric-with-green', { description: 'Ada selects Fabric Warehouse with the Green tile', verifications: [
      { spec: 'Fabric is adjacent to Small Mosque', check: async () => expect(page.getByRole('button', { name: /^2 Fabric Warehouse.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada leaves her third assistant', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() },
      { spec: 'The Green ability has not been used this turn', check: async () => expectState(page, { eventCount: 18, game: { abilitiesUsedThisTurn: [], players: [{ lira: 3, mosqueTileIds: ['mosque-spice-2'] }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-fabric-with-green', { description: 'Ada arrives at Fabric Warehouse', verifications: [
      { spec: 'Fabric still fills before the optional ability', check: async () => expect(page.getByRole('button', { name: 'Fill fabric to 2' })).toBeEnabled() },
      { spec: 'Movement alone changes no goods', check: async () => expectState(page, { eventCount: 19, game: { phase: 'action', players: [{ merchantPlace: 2, goods: { fabric: 0, jewelry: 0 } }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Fill fabric to 2' }).click();
    await ada.step('host-opens-green-ability', { description: 'Ada fills fabric and opens the Green ability choice', verifications: [
      { spec: 'The Green timing panel pauses turn completion', check: async () => expect(page.getByRole('heading', { name: 'Green tile privilege' })).toBeVisible() },
      { spec: 'Jewelry is the default open-capacity extra good', check: async () => { await expect(page.getByLabel('Warehouse extra good')).toHaveValue('jewelry'); await expect(page.getByRole('button', { name: 'Pay 2 Lira for 1 jewelry' })).toBeEnabled(); } },
      { spec: 'The finite choice is canonical event twenty', check: async () => expectState(page, { eventCount: 20, game: { phase: 'mosque-ability', pending: { kind: 'warehouse-extra', actionPlace: 2 }, players: [{ lira: 3, goods: { fabric: 2, jewelry: 0 } }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Pay 2 Lira for 1 jewelry' }).click();
    await ada.step('host-buys-extra-jewelry', { description: 'Ada pays two Lira for one extra jewelry', verifications: [
      { spec: 'The completion summary includes both Warehouse effects', check: async () => expect(page.getByRole('complementary').getByText('Filled fabric to capacity 2. Paid 2 Lira for 1 extra jewelry.', { exact: true })).toBeVisible() },
      { spec: 'The exact payment and good are applied once', check: async () => expectState(page, { eventCount: 21, diagnosticCount: 0, game: { phase: 'turn-end', pending: null, abilitiesUsedThisTurn: ['spice'], players: [{ lira: 1, goods: { fabric: 2, jewelry: 1 } }, {}] } }) },
      { spec: 'The ability controls cannot repeat', check: async () => expect(page.getByLabel('Warehouse extra good')).toHaveCount(0) }
    ] });
    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-green-ability-turn', { description: 'Ada ends the Green-assisted Warehouse turn', verifications: [
      { spec: 'Bora begins turn six', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Per-turn ability timing resets on handoff', check: async () => expectState(page, { eventCount: 22, game: { currentTurn: 'Bora', turnNumber: 6, abilitiesUsedThisTurn: [], players: [{ lira: 1, goods: { fabric: 2, jewelry: 1 } }, {}] } }) }
    ] });

    await boraTransit({ destination: 12, selectSlug: 'guest-selects-police-return', arriveSlug: 'guest-picks-up-at-police', endSlug: 'guest-skips-police-return', selectDescription: 'Bora returns to collect the Police assistant', moveButton: 'Move here and pick up assistant', endButton: 'Skip Police Station and end turn', afterMoveEvent: 23, afterEndEvent: 24, nextTurn: 7 });

    await page.getByRole('button', { name: /^14 Small Mosque.*Reachable/ }).click();
    await ada.step('host-selects-small-mosque-red', { description: 'Ada returns to Small Mosque for the Red tile', verifications: [
      { spec: 'Small Mosque is adjacent to Fabric Warehouse', check: async () => expect(page.getByRole('button', { name: /^14 Small Mosque.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada will collect the assistant left earlier', check: async () => expect(page.getByRole('button', { name: 'Move here and pick up assistant' })).toBeEnabled() },
      { spec: 'Fabric two satisfies the exposed Red requirement', check: async () => expectState(page, { eventCount: 24, game: { players: [{ goods: { fabric: 2 }, mosqueTileIds: ['mosque-spice-2'] }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and pick up assistant' }).click();
    await ada.step('host-returns-small-mosque', { description: 'Ada picks up her Small Mosque assistant', verifications: [
      { spec: 'Red is affordable while Green is enabled in the tray', check: async () => { await expect(page.getByRole('button', { name: 'Pay 1 fabric for Red power' })).toBeEnabled(); await expect(page.getByText('Enabled in tray', { exact: true })).toBeVisible(); } },
      { spec: 'Assistant pickup and action state are exact', check: async () => expectState(page, { eventCount: 25, game: { phase: 'action', players: [{ merchantPlace: 14, assistantsCarried: 2, goods: { fabric: 2 } }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Pay 1 fabric for Red power' }).click();
    await ada.step('host-completes-small-mosque-pair', { description: 'Ada buys Red and completes the Small Mosque pair', verifications: [
      { spec: 'The action announces the paired ruby', check: async () => expect(page.getByText('Paid 1 fabric, gained its Mosque tile, and completed the pair for 1 ruby.', { exact: true })).toBeVisible() },
      { spec: 'Both tile IDs and one ruby are conserved', check: async () => expectState(page, { eventCount: 26, game: { phase: 'turn-end', players: [{ goods: { fabric: 1 }, mosqueTileIds: ['mosque-spice-2', 'mosque-fabric-2'], rubies: 1 }, {}] } }) },
      { spec: 'The paired-ruby stock on Small Mosque decreases to one', check: async () => expect(page.getByTestId('place-state-14')).toHaveAttribute('data-state-summary', /1 ruby rewards remain/) },
      { spec: 'Red and Green square powers are both enabled in the tray', check: async () => { const powers = page.getByLabel('Ada Mosque tiles').locator('[data-enabled="true"]'); await expect(powers).toHaveCount(2); await expect(powers.locator('[data-art-kind="component"]')).toHaveCount(2); } }
    ] });
    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-paired-mosque-turn', { description: 'Ada passes with the Small Mosque ruby', verifications: [
      { spec: 'Bora begins turn eight', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'The paired reward remains public', check: async () => expectState(page, { eventCount: 27, game: { currentTurn: 'Bora', turnNumber: 8, players: [{ rubies: 1, mosqueTileIds: ['mosque-spice-2', 'mosque-fabric-2'] }, {}] } }) }
    ] });

    await boraTransit({ destination: 7, selectSlug: 'guest-selects-fountain-second', arriveSlug: 'guest-arrives-fountain-second', endSlug: 'guest-ends-fountain-second', selectDescription: 'Bora returns to Fountain again', moveButton: 'Move here without leaving an assistant', endButton: 'End turn', afterMoveEvent: 28, afterEndEvent: 29, nextTurn: 9 });

    await page.getByRole('button', { name: /^9 Tea House.*Reachable/ }).click();
    await ada.step('host-selects-tea-with-red', { description: 'Ada selects Tea House with the Red tile', verifications: [
      { spec: 'Tea House is a legal two-space route', check: async () => expect(page.getByRole('button', { name: /^9 Tea House.*Reachable/ })).toHaveAttribute('aria-pressed', 'true') },
      { spec: 'Ada has an assistant available to leave', check: async () => expect(page.getByRole('button', { name: 'Move here and leave an assistant' })).toBeEnabled() },
      { spec: 'Red ownership is present before the roll', check: async () => expectState(page, { eventCount: 29, game: { players: [{ lira: 1, mosqueTileIds: ['mosque-spice-2', 'mosque-fabric-2'] }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Move here and leave an assistant' }).click();
    await ada.step('host-arrives-tea-with-red', { description: 'Ada arrives at Tea House with Red privilege', verifications: [
      { spec: 'Tea House still requires a declaration first', check: async () => expect(page.getByLabel('Tea House wager')).toHaveValue('7') },
      { spec: 'No dice exist before commitment', check: async () => expectState(page, { eventCount: 30, game: { phase: 'action', lastRoll: null, players: [{ merchantPlace: 9 }, {}] } }) }
    ] });
    await page.getByLabel('Tea House wager').selectOption('6');
    await ada.step('host-declares-six', { description: 'Ada declares a six-Lira Tea House wager', verifications: [
      { spec: 'The select visibly reads six', check: async () => expect(page.getByLabel('Tea House wager')).toHaveValue('6') },
      { spec: 'The roll button updates to wager six', check: async () => expect(page.getByRole('button', { name: 'Wager 6 and roll both dice' })).toBeEnabled() },
      { spec: 'The local declaration adds no event', check: async () => expectState(page, { eventCount: 30, game: { phase: 'action' } }) }
    ] });
    await page.getByRole('button', { name: 'Wager 6 and roll both dice' }).click();
    await ada.step('host-sees-original-red-roll', { description: 'Ada rolls three and two before using Red', verifications: [
      { spec: 'The original dice are visible before adjustment', check: async () => expect(page.getByLabel('Original dice 3 and 2')).toBeVisible() },
      { spec: 'Every official Red choice is offered', check: async () => { await expect(page.getByRole('button', { name: 'Turn first die to 4' })).toBeEnabled(); await expect(page.getByRole('button', { name: 'Turn second die to 4' })).toBeEnabled(); await expect(page.getByRole('button', { name: 'Reroll both dice once' })).toBeEnabled(); await expect(page.getByRole('button', { name: 'Keep original roll' })).toBeEnabled(); } },
      { spec: 'Reward waits in a finite post-roll phase', check: async () => expectState(page, { eventCount: 31, game: { phase: 'mosque-ability', pending: { kind: 'dice-adjust', actionPlace: 9, originalDice: [3, 2], wager: 6 }, lastRoll: { dice: [3, 2], reward: 0 }, players: [{ lira: 1 }, {}] } }) }
    ] });
    await page.getByRole('button', { name: 'Turn first die to 4' }).click();
    await ada.step('host-turns-first-die-to-four', { description: 'Ada turns the first die to four and wins six Lira', verifications: [
      { spec: 'Production dice show the adjusted four and two', check: async () => expect(page.getByLabel('Dice result 4 and 2')).toBeVisible() },
      { spec: 'The adjusted total meets the declared wager exactly', check: async () => expectState(page, { eventCount: 32, diagnosticCount: 0, game: { phase: 'turn-end', pending: null, lastRoll: { place: 9, dice: [4, 2], declared: 6, reward: 6 }, players: [{ lira: 7, rubies: 1 }, {}] } }) },
      { spec: 'The completion copy records the Red choice', check: async () => expect(page.getByRole('complementary').getByText(/Used the red Mosque ability: first to four/)).toBeVisible() }
    ] });

    const adjusted = await readState(page);
    await page.reload();
    await ada.step('host-reloads-adjusted-roll', { description: 'Ada reloads the adjusted Tea House result', verifications: [
      { spec: 'The adjusted dice and reward return exactly', check: async () => { await expect(page.getByLabel('Dice result 4 and 2')).toBeVisible(); await expectState(page, { eventCount: 32, diagnosticCount: 0, game: { lastRoll: adjusted.game.lastRoll, players: adjusted.game.players } }); } },
      { spec: 'No adjustment controls can be repeated', check: async () => expect(page.getByRole('button', { name: 'Turn first die to 4' })).toHaveCount(0) },
      { spec: 'Both permanent powers and the paired ruby remain visible', check: async () => { await expect(page.getByLabel('Ada Mosque tiles').locator('[data-enabled="true"]')).toHaveCount(2); await expect(page.getByLabel('Ada resources').getByLabel('1 rubies')).toBeVisible(); } }
    ] });
    await page.getByRole('button', { name: 'End turn and pass clockwise' }).click();
    await ada.step('host-ends-red-ability-turn', { description: 'Ada ends the adjusted Tea House turn', verifications: [
      { spec: 'Bora begins turn ten', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() },
      { spec: 'Thirty-three events finish with clean permanent abilities', check: async () => expectState(page, { eventCount: 33, diagnosticCount: 0, game: { currentTurn: 'Bora', turnNumber: 10, phase: 'movement', pending: null, players: [{ lira: 7, rubies: 1, mosqueTileIds: ['mosque-spice-2', 'mosque-fabric-2'] }, {}] } }) },
      { spec: 'The observer projects the same public resources', check: async () => { const host = await readState(page); const guest = await readState(boraPage); expect(guest.game.players).toEqual(host.game.players); } }
    ] });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
