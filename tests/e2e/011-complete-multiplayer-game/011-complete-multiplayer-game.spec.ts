import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { expectState, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('five merchants complete an ordinary game, final cards, ranking, and rematch', async ({ browser, page }, testInfo) => {
  test.setTimeout(240_000);
  const names = ['Ada', 'Bora', 'Cem', 'Derya', 'Emre'];
  const roomCode = testInfo.project.name === 'phone' ? 'FIVES' : 'RACES';
  const seed = 'complete-10956';
  const journal = new ScenarioJournal();
  const contexts: BrowserContext[] = [];
  const pages: Page[] = [page];
  for (let index = 1; index < names.length; index += 1) {
    const context = await browser.newContext({
      baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number },
      locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
    });
    contexts.push(context);
    pages.push(await context.newPage());
  }
  const actors = pages.map((actorPage, index) => new TestStepHelper(actorPage, testInfo, journal, `${names[index]}, merchant ${index + 1}`));
  actors[0].setMetadata(
    'Five merchants play an entire Istanbul game and open a rematch',
    'Five isolated browsers join one immutable table. Ada alternates Tea House earnings with the Gemstone Dealer while every other merchant takes and closes each intervening ordinary turn. The journey records every route selection, movement, wager, ruby purchase, pass, final direct-resource choice, shared ranking projection, reload, and seeded rematch. No projected state is injected: every canonical event originates in visible game controls.'
  );

  async function step(actorIndex: number, slug: string, description: string, checks: Array<{ spec: string; check: () => Promise<void> }>) {
    await actors[actorIndex].step(`${names[actorIndex].toLowerCase()}-${slug}`, { description, verifications: checks });
  }

  async function selectMove(actorIndex: number, destination: number, place: string, expectedEvents: number, slug: string) {
    const actorPage = pages[actorIndex];
    const state = await readState(actorPage);
    const player = state.game.players[actorIndex];
    const buttonName = destination === 7 ? 'Move here without leaving an assistant' : player.assistantsByPlace[String(destination)] ? 'Move here and pick up assistant' : 'Move here and leave an assistant';
    await actorPage.getByRole('button', { name: new RegExp(`^${destination} ${place}.*Reachable`) }).click();
    await step(actorIndex, `${slug}-selects-${place.toLowerCase().replaceAll(' ', '-')}`, `${names[actorIndex]} selects ${place}`, [
      { spec: 'The route is selected without appending history', check: async () => expectState(actorPage, { eventCount: expectedEvents, game: { selectedPlace: destination } }) },
      { spec: 'The required assistant operation is enabled', check: async () => expect(actorPage.getByRole('button', { name: buttonName })).toBeEnabled() }
    ]);
    await actorPage.getByRole('button', { name: buttonName }).click();
    await step(actorIndex, `${slug}-moves-${place.toLowerCase().replaceAll(' ', '-')}`, `${names[actorIndex]} moves to ${place}`, [
      { spec: 'One movement event reaches the action phase', check: async () => expectState(actorPage, { eventCount: expectedEvents + 1, diagnosticCount: 0, game: { phase: 'action', currentTurn: names[actorIndex], players: Array.from({ length: names.length }, (_, index) => index === actorIndex ? { merchantPlace: destination } : {}) } }) },
      { spec: 'The inspector names the arrived Place', check: async () => expect(actorPage.locator('.inspector').getByRole('heading', { name: place })).toBeVisible() }
    ]);
    return expectedEvents + 1;
  }

  async function closeTurn(actorIndex: number, events: number, nextName: string, slug: string) {
    const actorPage = pages[actorIndex];
    const skip = actorPage.locator('.inspector').getByRole('button', { name: /^(Skip .* and end turn|Skip warehouse and end turn|Skip Fountain and end turn|End turn)$/ }).first();
    await expect(skip).toBeEnabled();
    await skip.click();
    await step(actorIndex, `${slug}-ends-turn`, `${names[actorIndex]} ends the turn`, [
      { spec: `${nextName} receives the next clockwise turn`, check: async () => expect(actorPage.getByRole('heading', { name: `${nextName} surveys the bazaar.` })).toBeVisible() },
      { spec: 'The ordinary turn closes once with no diagnostic', check: async () => expectState(actorPage, { eventCount: events + 1, diagnosticCount: 0, game: { currentTurn: nextName, phase: 'movement' } }) }
    ]);
    return events + 1;
  }

  async function supportTurn(actorIndex: number, events: number, cycle: number) {
    const actorPage = pages[actorIndex];
    const current = (await readState(actorPage)).game.players[actorIndex].merchantPlace;
    const workPlaces = [0, 2, 3, 4, 6];
    const placeNames = ['', 'Wainwright', 'Fabric Warehouse', 'Spice Warehouse', 'Fruit Warehouse', 'Post Office', 'Caravansary'];
    const destination = current === 7 ? workPlaces[actorIndex] : 7;
    const place = destination === 7 ? 'Fountain' : placeNames[destination];
    events = await selectMove(actorIndex, destination, place, events, `cycle-${cycle}-${names[actorIndex].toLowerCase()}`);
    await actorPage.locator('.inspector').getByRole('button', { name: /^(Skip .* and end turn|Skip warehouse and end turn|Skip Fountain and end turn|End turn)$/ }).first().click();
    const finalBoundary = cycle === 14 && actorIndex === names.length - 1;
    await step(actorIndex, `cycle-${cycle}-${names[actorIndex].toLowerCase()}-ends`, `${names[actorIndex]} passes clockwise`, [
      { spec: finalBoundary ? 'The equal-turn round opens the final Bonus window' : 'The next merchant begins movement', check: async () => expectState(actorPage, { eventCount: events + 1, diagnosticCount: 0, game: { phase: finalBoundary ? 'final-bonus' : 'movement', currentTurn: names[(actorIndex + 1) % names.length] } }) },
      { spec: 'The visible turn banner agrees with replay', check: async () => expect(actorPage.getByRole('heading', { name: finalBoundary ? 'Ada makes final trades.' : `${names[(actorIndex + 1) % names.length]} surveys the bazaar.` })).toBeVisible() }
    ]);
    return events + 1;
  }

  try {
    await page.goto(`/?e2eRoom=${roomCode}&e2eSeed=${seed}`);
    await step(0, 'host-opens-five-seat-creator', 'Ada opens the five-seat table creator', [
      { spec: 'Firebase is ready before setup', check: async () => expect(page.getByRole('status')).toHaveText('Firebase emulator ready') },
      { spec: 'The landing projection is empty', check: async () => expectState(page, { screen: 'landing', eventCount: 0, game: null }) }
    ]);
    await page.getByLabel('Your merchant name').fill('Ada');
    await step(0, 'host-enters-name', 'Ada enters her merchant name', [{ spec: 'The typed name is visible', check: async () => expect(page.getByLabel('Your merchant name')).toHaveValue('Ada') }, { spec: 'Typing writes no event', check: async () => expectState(page, { eventCount: 0 }) }]);
    await page.getByLabel('Seats').selectOption('5');
    await step(0, 'host-selects-five-seats', 'Ada chooses five seats', [{ spec: 'The selector shows five players', check: async () => expect(page.getByLabel('Seats')).toHaveValue('5') }, { spec: 'The creator remains local', check: async () => expectState(page, { eventCount: 0 }) }]);
    await page.getByRole('button', { name: /Create private room/ }).click();
    await step(0, 'host-creates-five-seat-room', 'Ada creates the private five-seat room', [{ spec: 'Room FIVES or RACES is visible', check: async () => expect(page.getByText(roomCode, { exact: true }).first()).toBeVisible() }, { spec: 'One canonical creation event opens five seats', check: async () => expectState(page, { eventCount: 1, seatCount: 1, maxPlayers: 5 }) }]);

    for (let index = 1; index < names.length; index += 1) {
      await pages[index].goto(`/?room=${roomCode}&e2eSeed=${seed}`);
      await step(index, 'guest-opens-invitation', `${names[index]} opens the invitation`, [{ spec: 'The invited room is found', check: async () => expect(pages[index].getByText(roomCode, { exact: true }).first()).toBeVisible() }, { spec: 'The player remains unseated', check: async () => expectState(pages[index], { eventCount: index, seatCount: index }) }]);
      await pages[index].getByLabel('Your merchant name').fill(names[index]);
      await step(index, 'guest-enters-name', `${names[index]} enters a public name`, [{ spec: 'The public name is visible', check: async () => expect(pages[index].getByLabel('Your merchant name')).toHaveValue(names[index]) }, { spec: 'Typing writes no event', check: async () => expectState(pages[index], { eventCount: index }) }]);
      await pages[index].getByRole('button', { name: /Join the room/ }).click();
      await step(index, 'guest-joins-room', `${names[index]} claims seat ${index + 1}`, [{ spec: 'The ordered seat is visible', check: async () => expect(pages[index].getByText(`${names[index]} · you`, { exact: true })).toBeVisible() }, { spec: 'One join event adds the seat', check: async () => expectState(pages[index], { eventCount: index + 1, seatCount: index + 1, maxPlayers: 5 }) }]);
    }

    let events = 5;
    for (let index = 1; index < names.length; index += 1) {
      await pages[index].getByRole('button', { name: 'I am ready' }).click(); events += 1;
      await step(index, 'guest-readies', `${names[index]} readies the seat`, [{ spec: 'The seat readiness is true in the public projection', check: async () => expectState(pages[index], { ready: Array.from({ length: names.length }, (_, seat) => seat > index ? false : seat > 0) }) }, { spec: 'Readiness appends once', check: async () => expectState(pages[index], { eventCount: events }) }]);
    }
    await page.getByRole('button', { name: 'I am ready' }).click(); events += 1;
    await step(0, 'host-readies', 'Ada readies the final seat', [{ spec: 'The five-seat table reports ready', check: async () => expect(page.getByText('Table ready')).toBeVisible() }, { spec: 'All five readiness values are true', check: async () => expectState(page, { eventCount: events, ready: [true, true, true, true, true] }) }]);
    await page.getByRole('button', { name: /Open the bazaar/ }).click(); events += 1;
    await step(0, 'host-starts-complete-game', 'Ada opens the complete bazaar game', [{ spec: 'Ada is the deterministic starting merchant', check: async () => expect(page.getByRole('heading', { name: 'Ada surveys the bazaar.' })).toBeVisible() }, { spec: 'The target is five and every ordinary-turn counter starts at zero', check: async () => expectState(page, { eventCount: events, diagnosticCount: 0, game: { phase: 'movement', end: { target: 5, ordinaryTurnCounts: [0, 0, 0, 0, 0] }, players: [{ lira: 2, rubies: 0 }, {}, {}, {}, {}] } }) }]);

    await page.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ }).click();
    await step(0, 'host-inspects-opening-bonus', 'Ada inspects her opening Lira Bonus', [{ spec: 'The private card effect is readable', check: async () => expect(page.locator('.inspector')).toContainText('gain 5 Lira') }, { spec: 'Inspection writes no event', check: async () => expectState(page, { eventCount: events, game: { selectedBonus: expect.any(String) } }) }]);
    await page.getByRole('button', { name: 'Play to gain 5 Lira' }).click(); events += 1;
    await step(0, 'host-plays-opening-bonus', 'Ada plays the opening Lira Bonus', [{ spec: 'Ada has 7 Lira', check: async () => expectState(page, { eventCount: events, game: { players: [{ lira: 7 }, {}, {}, {}, {}] } }) }, { spec: 'The private card moves to discard', check: async () => expect(page.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ })).toHaveCount(0) }]);

    const rubyTurns = new Set([4, 6, 8, 10, 14]);
    for (let cycle = 1; cycle <= 14; cycle += 1) {
      const teaTurn = cycle % 2 === 1;
      const destination = teaTurn ? 9 : 16;
      const place = teaTurn ? 'Tea House' : 'Gemstone Dealer';
      events = await selectMove(0, destination, place, events, `cycle-${cycle}-ada`);
      if (teaTurn) {
        const wager = cycle === 1 ? 7 : cycle === 3 ? 12 : cycle === 5 ? 11 : cycle === 7 ? 12 : cycle === 9 ? 10 : cycle === 11 ? 9 : 12;
        await page.getByLabel('Tea House wager').selectOption(String(wager));
        await step(0, `cycle-${cycle}-ada-declares-wager`, `Ada declares ${wager} at Tea House`, [{ spec: 'The visible wager matches the plan', check: async () => expect(page.getByLabel('Tea House wager')).toHaveValue(String(wager)) }, { spec: 'The wager choice is local until submitted', check: async () => expectState(page, { eventCount: events }) }]);
        await page.getByRole('button', { name: `Wager ${wager} and roll both dice` }).click(); events += 1;
        await step(0, `cycle-${cycle}-ada-rolls-tea`, `Ada rolls at Tea House`, [{ spec: 'Seeded dice and Lira resolve into immutable state', check: async () => expectState(page, { eventCount: events, diagnosticCount: 0, game: { phase: 'turn-end', lastRoll: { place: 9, declared: wager, reward: expect.any(Number) } } }) }, { spec: 'The two dice are visibly rendered', check: async () => expect(page.getByLabel(/Dice result/)).toBeVisible() }]);
        await page.getByRole('button', { name: 'End turn and pass clockwise' }).click(); events += 1;
      } else if (rubyTurns.has(cycle)) {
        const purchaseNumber = [...rubyTurns].indexOf(cycle) + 1;
        const price = 11 + purchaseNumber;
        await expect(page.getByRole('button', { name: `Pay ${price} Lira for 1 ruby` })).toBeEnabled();
        await page.getByRole('button', { name: `Pay ${price} Lira for 1 ruby` }).click(); events += 1;
        await step(0, `cycle-${cycle}-ada-buys-ruby`, `Ada buys the ${price}-Lira ruby`, [{ spec: 'The escalating Dealer track advances by one', check: async () => expectState(page, { eventCount: events, game: { phase: 'turn-end', rubyTracks: { gemstonePrice: price + 1 }, players: [{ rubies: purchaseNumber }, {}, {}, {}, {}] } }) }, { spec: 'The exact payment is reported', check: async () => expect(page.locator('.inspector')).toContainText(`Paid ${price} Lira`) }]);
        await page.getByRole('button', { name: 'End turn and pass clockwise' }).click(); events += 1;
      } else {
        await page.getByRole('button', { name: 'Skip Gemstone Dealer and end turn' }).click(); events += 1;
      }
      await step(0, `cycle-${cycle}-ada-ends`, `Ada completes ordinary turn ${cycle}`, [{ spec: 'Bora begins the next clockwise turn', check: async () => expect(page.getByRole('heading', { name: 'Bora surveys the bazaar.' })).toBeVisible() }, { spec: 'Ada’s ordinary-turn counter advances exactly once', check: async () => expectState(page, { eventCount: events, diagnosticCount: 0, game: { phase: 'movement', currentTurn: 'Bora', end: { ordinaryTurnCounts: [cycle, cycle - 1, cycle - 1, cycle - 1, cycle - 1] } } }) }]);
      for (let support = 1; support < names.length; support += 1) events = await supportTurn(support, events, cycle);
    }

    await step(0, 'table-enters-final-window', 'The equal-turn round closes into final Bonus windows', [{ spec: 'Every merchant completed fourteen ordinary turns', check: async () => expectState(page, { eventCount: events, game: { phase: 'final-bonus', currentTurn: 'Ada', end: { triggeredByUid: expect.any(String), ordinaryTurnCounts: [14, 14, 14, 14, 14], finalBonusSeatsCompleted: [] }, players: [{ rubies: 5 }, {}, {}, {}, {}] } }) }, { spec: 'Only direct-resource cards remain legal', check: async () => expect(page.getByRole('heading', { name: 'Ada makes final trades.' })).toBeVisible() }]);

    for (let index = 0; index < names.length; index += 1) {
      const actorPage = pages[index];
      if (index === 3) {
        await actorPage.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ }).click();
        await step(index, 'final-derya-inspects-direct-lira', 'Derya inspects a direct-resource card in the final window', [
          { spec: 'The card promises exactly 5 Lira', check: async () => expect(actorPage.locator('.inspector')).toContainText('gain 5 Lira') },
          { spec: 'Private inspection changes no canonical history', check: async () => expectState(actorPage, { eventCount: events, game: { phase: 'final-bonus', selectedBonus: expect.any(String), players: [{}, {}, {}, { lira: 5 }, {}] } }) }
        ]);
        await actorPage.getByRole('button', { name: 'Play to gain 5 Lira' }).click(); events += 1;
        await step(index, 'final-derya-plays-direct-lira', 'Derya plays the legal final direct-resource Bonus', [
          { spec: 'Derya gains exactly 5 Lira before ranking', check: async () => expectState(actorPage, { eventCount: events, diagnosticCount: 0, game: { phase: 'final-bonus', players: [{}, {}, {}, { lira: 10 }, {}] } }) },
          { spec: 'The spent private card leaves Derya’s hand', check: async () => expect(actorPage.getByRole('button', { name: /Inspect Bonus card: A profitable bargain/ })).toHaveCount(0) }
        ]);
      }
      await actorPage.getByRole('button', { name: 'Finish final Bonus window' }).click(); events += 1;
      const last = index === names.length - 1;
      await step(index, `final-${names[index].toLowerCase()}-finishes`, `${names[index]} finishes the final Bonus window`, [
        { spec: last ? 'The final ranking is now immutable' : `${names[index + 1]} receives the next final window`, check: async () => last ? expect(actorPage.getByRole('heading', { name: 'Ada wins the ruby race.' })).toBeVisible() : expect(actorPage.getByRole('heading', { name: `${names[index + 1]} makes final trades.` })).toBeVisible() },
        { spec: 'One final-window event is accepted without diagnostics', check: async () => { await expectState(actorPage, { eventCount: events, diagnosticCount: 0, game: last ? { phase: 'game-over', end: { finalBonusSeatsCompleted: [0, 1, 2, 3, 4] } } : { phase: 'final-bonus', end: { finalBonusSeatsCompleted: Array.from({ length: index + 1 }, (_, seat) => seat) } } }); if (last) { const state = await readState(actorPage); expect(state.game.end.rankings[0]).toMatchObject({ name: 'Ada', rank: 1, rubies: 5 }); expect(state.game.end.winnerUids).toEqual([state.game.end.rankings[0].uid]); } } }
      ]);
    }

    await pages[4].reload();
    await step(4, 'guest-reloads-final-ranking', 'Emre reloads the final ranking', [{ spec: 'The winner ceremony returns from immutable history', check: async () => expect(pages[4].getByRole('heading', { name: 'Ada wins the ruby race.' })).toBeVisible() }, { spec: 'Replay restores the exact final event count', check: async () => expectState(pages[4], { eventCount: events, diagnosticCount: 0, game: { phase: 'game-over', epoch: 1 } }) }]);
    await page.getByRole('button', { name: 'Open a rematch' }).click(); events += 1;
    await step(0, 'host-opens-rematch', 'Ada opens a seeded rematch', [{ spec: 'A fresh bazaar starts at movement', check: async () => expect(page.getByRole('heading', { name: /surveys the bazaar/ })).toBeVisible() }, { spec: 'Epoch two resets every public resource while retaining all seats', check: async () => expectState(page, { eventCount: events, diagnosticCount: 0, seatCount: 5, game: { epoch: 2, phase: 'movement', turnNumber: 1, end: { triggeredByUid: null, ordinaryTurnCounts: [0, 0, 0, 0, 0] }, players: [{ rubies: 0 }, { rubies: 0 }, { rubies: 0 }, { rubies: 0 }, { rubies: 0 }] } }) }]);

    const host = await readState(page);
    for (const observer of pages.slice(1)) expect((await readState(observer)).game).toEqual(expect.objectContaining({ epoch: host.game.epoch, seed: host.game.seed, players: host.game.players }));
    actors[0].generateDocs();
  } finally {
    for (const context of contexts) await context.close();
  }
});
