import { test, expect } from '@playwright/test';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';
import { expectState, readState } from '../helpers/game-journey';

test('Gameroom guests wait, launch into seats, and reopen without duplicate events', async ({ page, browser }, info) => {
  const code = info.project.name === 'phone' ? 'A1B2C3D4' : 'B1C2D3E4';
  const guestContext = await browser.newContext({ baseURL: String(info.project.use.baseURL), viewport: info.project.use.viewport, deviceScaleFactor: 1, locale: 'en-CA', timezoneId: 'America/Toronto' });
  const guest = await guestContext.newPage();
  const journal = new ScenarioJournal();
  const hostSteps = new TestStepHelper(page, info, journal, 'Host');
  const guestSteps = new TestStepHelper(guest, info, journal, 'Guest');
  hostSteps.setMetadata('Launch Istanbul from Gameroom', 'Invitations seat authenticated players without another name form, preserve table codes, and resume safely.');
  const create = `/?table=${code}&launch=create&name=Ada`;
  const join = `/?table=${code}&launch=join&name=Ada&returnTo=https://example.com/room`;
  try {
    await guest.goto(join);
    await expect(guest.getByRole('heading', { name: 'Waiting for your host…' })).toBeVisible();
    await expectState(guest, { eventCount: 0, roomCode: null });
    await guestSteps.step('waiting-for-host', { description: 'A guest arrives before the host', verifications: [{ spec: 'Waiting does not create a room', check: async () => expectState(guest, { eventCount: 0 }) }] });
    await page.goto(create);
    for (const actor of [page, guest]) {
      await expectState(actor, { screen: 'lobby', roomCode: code, seatCount: 2, eventCount: 2, diagnosticCount: 0, localSeat: 'Ada' });
      await expect(actor).toHaveURL(new RegExp(`\\?room=${code}$`));
    }
    await hostSteps.step('launcher-seated-host', { description: 'Gameroom opens the shared lobby', verifications: [{ spec: 'Two identities with the same name keep separate seats', check: async () => expectState(page, { seatCount: 2, eventCount: 2, diagnosticCount: 0 }) }] });
    // Reopening original invitations and a simultaneous host tab must resume,
    // not identify a seat by name or append another create/join event.
    const secondHost = await page.context().newPage();
    await Promise.all([page.goto(create), secondHost.goto(create), guest.goto(join)]);
    for (const actor of [page, secondHost, guest]) await expectState(actor, { eventCount: 2, diagnosticCount: 0, seatCount: 2 });
    await secondHost.close();
    await page.getByLabel('Reviewed layout').selectOption('long-path');
    await expectState(guest, { layout: 'long-path' });
    await guest.getByRole('button', { name: /I am ready/ }).click();
    await page.getByRole('button', { name: /I am ready/ }).click();
    await page.getByRole('button', { name: /Open the bazaar/ }).click();
    await expectState(page, { screen: 'game', diagnosticCount: 0 });
    const before = (await readState(page)).eventCount;
    await guest.goto(join);
    await expectState(guest, { screen: 'game', eventCount: before, diagnosticCount: 0 });
    await page.reload();
    await expectState(page, { screen: 'game', eventCount: before, diagnosticCount: 0 });
    hostSteps.generateDocs();
  } finally { await guestContext.close(); }
});
