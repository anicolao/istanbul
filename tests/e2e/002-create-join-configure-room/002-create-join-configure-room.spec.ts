import { expect, test, type Page } from '@playwright/test';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

interface ExpectedState {
  [key: string]: unknown;
  screen?: string;
  roomCode?: string | null;
  eventCount?: number;
  diagnosticCount?: number;
  seatCount?: number;
  maxPlayers?: number | null;
  layout?: string | null;
  ready?: boolean[];
  localSeat?: string | null;
}

async function expectProjection(page: Page, expected: ExpectedState) {
  const output = page.getByTestId('projection-state');
  await expect(output).toBeAttached();
  await expect.poll(async () => JSON.parse(await output.textContent() ?? '{}')).toMatchObject(expected);
}

test('two merchants create, join, configure, ready, and replay a room', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'BAZAR' : 'MARKT';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the host');
  const boraContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
    serviceWorkers: 'block',
    reducedMotion: 'reduce',
    deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the invited merchant');
  ada.setMetadata(
    'Creating and preparing a private Istanbul room',
    'Ada opens a private table, Bora follows the invitation in an isolated browser, and both merchants watch an immutable room history converge through configuration, readiness, and reload.'
  );

  try {
    await page.goto(`/?e2eRoom=${roomCode}`);
    await ada.step('host-opens-room-creator', {
      description: 'Ada arrives at the private-room creator',
      verifications: [
        { spec: 'Firebase authentication is ready before any room action', check: async () => expect(page.getByRole('status')).toHaveText('Firebase emulator ready') },
        { spec: 'The host chooses a reviewed layout without predicting attendance', check: async () => { await expect(page.getByLabel('Seats')).toHaveCount(0); await expect(page.getByLabel('Layout')).toHaveValue('short-path'); } },
        { spec: 'No room events exist before Ada creates one', check: async () => expectProjection(page, { screen: 'landing', roomCode: null, eventCount: 0 }) }
      ]
    });

    await page.getByLabel('Your merchant name').fill('Ada');
    await ada.step('host-enters-name', {
      description: 'Ada writes her public merchant name',
      verifications: [
        { spec: 'The exact name is visible in the host field', check: async () => expect(page.getByLabel('Your merchant name')).toHaveValue('Ada') },
        { spec: 'Creating the private room becomes available', check: async () => expect(page.getByRole('button', { name: /Create private room/ })).toBeEnabled() },
        { spec: 'Editing the form does not create an event', check: async () => expectProjection(page, { screen: 'landing', eventCount: 0 }) }
      ]
    });

    await page.getByRole('button', { name: /Create private room/ }).click();
    await ada.step('host-creates-room', {
      description: `Ada creates room ${roomCode} and takes clockwise seat one`,
      verifications: [
        { spec: `The lobby exposes the stable five-letter room code ${roomCode}`, check: async () => expect(page.getByText(`Private room · ${roomCode}`)).toBeVisible() },
        { spec: 'Ada is visibly identified as host and current user', check: async () => expect(page.getByText('Ada · you')).toBeVisible() },
        { spec: 'The immutable projection contains one creation event and one joined merchant', check: async () => expectProjection(page, { screen: 'lobby', roomCode, eventCount: 1, diagnosticCount: 0, seatCount: 1, maxPlayers: 5, layout: 'short-path', ready: [false], localSeat: 'Ada' }) }
      ]
    });

    await boraPage.goto(`/?room=${roomCode}`);
    await bora.step('guest-opens-invitation', {
      description: `Bora follows Ada’s invitation to room ${roomCode}`,
      verifications: [
        { spec: 'The invitation names Ada as the host', check: async () => expect(boraPage.getByRole('heading', { name: 'Take a seat at Ada’s table.' })).toBeVisible() },
        { spec: 'The public ticket shows one merchant present and room to join', check: async () => expect(boraPage.getByText('1 merchant here · 4 open')).toBeVisible() },
        { spec: 'Bora replays the creation event but has no local seat', check: async () => expectProjection(boraPage, { screen: 'join-room', roomCode, eventCount: 1, seatCount: 1, localSeat: null }) }
      ]
    });

    await boraPage.getByLabel('Your merchant name').fill('Bora');
    await bora.step('guest-enters-name', {
      description: 'Bora writes his merchant name before claiming a seat',
      verifications: [
        { spec: 'The exact invited-player name remains visible', check: async () => expect(boraPage.getByLabel('Your merchant name')).toHaveValue('Bora') },
        { spec: 'The join control becomes available without changing room state', check: async () => expect(boraPage.getByRole('button', { name: /Join the room/ })).toBeEnabled() },
        { spec: 'The replay still contains only Ada’s creation event', check: async () => expectProjection(boraPage, { screen: 'join-room', eventCount: 1, seatCount: 1 }) }
      ]
    });

    await boraPage.getByRole('button', { name: /Join the room/ }).click();
    await bora.step('guest-joins-room', {
      description: 'Bora joins and receives clockwise seat two',
      verifications: [
        { spec: 'Bora sees himself in seat two and Ada in seat one', check: async () => { await expect(boraPage.getByText('Bora · you')).toBeVisible(); await expect(boraPage.getByText('Ada')).toBeVisible(); } },
        { spec: 'The guest sees the Short Path configuration selected by Ada', check: async () => expect(boraPage.getByText('Short Path', { exact: true })).toBeVisible() },
        { spec: 'The joined projection contains two clean events and ordered seats', check: async () => expectProjection(boraPage, { screen: 'lobby', eventCount: 2, diagnosticCount: 0, seatCount: 2, ready: [false, false], localSeat: 'Bora' }) }
      ]
    });

    await ada.step('host-observes-guest', {
      description: 'Ada sees Bora’s seat arrive through the shared event stream',
      verifications: [
        { spec: 'Bora appears in clockwise seat two without Ada refreshing', check: async () => expect(page.getByText('Bora')).toBeVisible() },
        { spec: 'Both merchants are visibly planning', check: async () => expect(page.getByText('Planning')).toHaveCount(2) },
        { spec: 'Ada’s projection independently converges on two events and two seats', check: async () => expectProjection(page, { eventCount: 2, seatCount: 2, ready: [false, false], localSeat: 'Ada' }) }
      ]
    });

    await boraPage.getByRole('button', { name: /I am ready/ }).click();
    await bora.step('guest-readies', {
      description: 'Bora declares that his route is ready',
      verifications: [
        { spec: 'Bora’s control changes to Keep planning', check: async () => expect(boraPage.getByRole('button', { name: /Keep planning/ })).toBeVisible() },
        { spec: 'Exactly one merchant is visibly ready', check: async () => expect(boraPage.getByText('1/2')).toBeVisible() },
        { spec: 'The readiness event is the third accepted event', check: async () => expectProjection(boraPage, { eventCount: 3, ready: [false, true] }) }
      ]
    });

    await ada.step('host-observes-readiness', {
      description: 'Ada sees Bora’s readiness while her own route remains open',
      verifications: [
        { spec: 'The host view reports one of two merchants ready', check: async () => expect(page.getByText('1/2')).toBeVisible() },
        { spec: 'Ada can still change the reviewed layout', check: async () => expect(page.getByLabel('Reviewed layout')).toBeEnabled() },
        { spec: 'Ada independently projects Bora as ready', check: async () => expectProjection(page, { eventCount: 3, ready: [false, true] }) }
      ]
    });

    await page.getByLabel('Reviewed layout').selectOption('long-path');
    await ada.step('host-selects-long-path', {
      description: 'Ada changes the table to the tactical Long Path layout',
      verifications: [
        { spec: 'The host selector and explanation identify Long Path', check: async () => { await expect(page.getByLabel('Reviewed layout')).toHaveValue('long-path'); await expect(page.getByText(/Ruby routes sit farther apart/)).toBeVisible(); } },
        { spec: 'Changing configuration visibly clears every readiness marker', check: async () => { await expect(page.getByText('0/2')).toBeVisible(); await expect(page.getByText('Planning')).toHaveCount(2); } },
        { spec: 'The fourth event atomically changes layout and invalidates readiness', check: async () => expectProjection(page, { eventCount: 4, layout: 'long-path', ready: [false, false] }) }
      ]
    });

    await bora.step('guest-observes-configuration', {
      description: 'Bora sees Long Path arrive and understands he must ready again',
      verifications: [
        { spec: 'The guest’s read-only settings name Long Path', check: async () => expect(boraPage.getByText('Long Path', { exact: true })).toBeVisible() },
        { spec: 'Bora’s control returns to I am ready', check: async () => expect(boraPage.getByRole('button', { name: /I am ready/ })).toBeVisible() },
        { spec: 'Bora’s replay matches the fourth event and cleared readiness', check: async () => expectProjection(boraPage, { eventCount: 4, layout: 'long-path', ready: [false, false] }) }
      ]
    });

    await boraPage.getByRole('button', { name: /I am ready/ }).click();
    await bora.step('guest-readies-again', {
      description: 'Bora confirms the revised Long Path route',
      verifications: [
        { spec: 'Bora is ready against the new configuration', check: async () => expect(boraPage.getByRole('button', { name: /Keep planning/ })).toBeVisible() },
        { spec: 'The lobby reports one of two merchants ready', check: async () => expect(boraPage.getByText('1/2')).toBeVisible() },
        { spec: 'The fifth event records only Bora’s renewed readiness', check: async () => expectProjection(boraPage, { eventCount: 5, layout: 'long-path', ready: [false, true] }) }
      ]
    });

    await page.getByRole('button', { name: /I am ready/ }).click();
    await ada.step('host-readies-table', {
      description: 'Ada readies last and completes the table',
      verifications: [
        { spec: 'A green Table ready seal confirms the room is complete', check: async () => expect(page.getByText('Table ready')).toBeVisible() },
        { spec: 'Both seat rows are marked Ready', check: async () => expect(page.getByText('Ready', { exact: true })).toHaveCount(2) },
        { spec: 'The sixth event leaves both ordered seats ready with no diagnostics', check: async () => expectProjection(page, { eventCount: 6, diagnosticCount: 0, layout: 'long-path', ready: [true, true] }) }
      ]
    });

    await boraPage.reload();
    await bora.step('guest-reloads-replay', {
      description: 'Bora reloads and reconstructs the same ready table from history',
      verifications: [
        { spec: 'The reloaded browser returns directly to Bora’s claimed seat', check: async () => expect(boraPage.getByText('Bora · you')).toBeVisible() },
        { spec: 'Long Path and both ready markers survive reload', check: async () => { await expect(boraPage.getByText('Long Path', { exact: true })).toBeVisible(); await expect(boraPage.getByText('Ready', { exact: true })).toHaveCount(2); } },
        { spec: 'Cache-plus-subscription replay is byte-equivalent at six clean events', check: async () => expectProjection(boraPage, { screen: 'lobby', roomCode, eventCount: 6, diagnosticCount: 0, seatCount: 2, maxPlayers: 5, layout: 'long-path', ready: [true, true], localSeat: 'Bora' }) }
      ]
    });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});
