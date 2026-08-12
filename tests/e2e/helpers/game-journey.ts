import { expect, type Page } from '@playwright/test';
import type { TestStepHelper } from './test-step-helper';

export async function readState(page: Page) {
  const output = page.getByTestId('projection-state');
  await expect(output).toBeAttached();
  return JSON.parse(await output.textContent() ?? '{}') as Record<string, any>;
}

export async function expectState(page: Page, expected: Record<string, unknown>) {
  await expect.poll(() => readState(page)).toMatchObject(expected);
}

export async function openTwoPlayerGame(options: {
  hostPage: Page;
  guestPage: Page;
  host: TestStepHelper;
  guest: TestStepHelper;
  roomCode: string;
  seed: string;
}) {
  const { hostPage, guestPage, host, guest, roomCode, seed } = options;
  await hostPage.goto(`/?e2eRoom=${roomCode}&e2eSeed=${seed}`);
  await host.step('host-opens-creator', { description: 'Ada opens the private-table creator', verifications: [
    { spec: 'Firebase reports ready before setup begins', check: async () => expect(hostPage.getByRole('status')).toHaveText('Firebase emulator ready') },
    { spec: 'The landing projection is empty', check: async () => expectState(hostPage, { screen: 'landing', eventCount: 0, game: null }) }
  ] });

  await hostPage.getByLabel('Your merchant name').fill('Ada');
  await host.step('host-enters-name', { description: 'Ada enters the first merchant name', verifications: [
    { spec: 'Ada remains visible in the public-name field', check: async () => expect(hostPage.getByLabel('Your merchant name')).toHaveValue('Ada') },
    { spec: 'Typing has not appended an event', check: async () => expectState(hostPage, { eventCount: 0 }) }
  ] });

  await hostPage.getByLabel('Seats').selectOption('2');
  await host.step('host-chooses-two-seats', { description: 'Ada chooses a two-player Short Path table', verifications: [
    { spec: 'Two players and Short Path are the visible form values', check: async () => { await expect(hostPage.getByLabel('Seats')).toHaveValue('2'); await expect(hostPage.getByLabel('Layout')).toHaveValue('short-path'); } },
    { spec: 'Draft configuration still has no immutable history', check: async () => expectState(hostPage, { eventCount: 0 }) }
  ] });

  await hostPage.getByRole('button', { name: /Create private room/ }).click();
  await host.step('host-creates-room', { description: `Ada creates private room ${roomCode}`, verifications: [
    { spec: 'Ada owns seat one of two', check: async () => { await expect(hostPage.getByText('Ada · you')).toBeVisible(); await expect(hostPage.getByText('1/2')).toBeVisible(); } },
    { spec: 'One creation event projects the lobby', check: async () => expectState(hostPage, { screen: 'lobby', roomCode, eventCount: 1, seatCount: 1, maxPlayers: 2 }) }
  ] });

  await guestPage.goto(`/?room=${roomCode}`);
  await guest.step('guest-opens-invitation', { description: 'Bora follows Ada’s room invitation', verifications: [
    { spec: 'Ada and Short Path identify the invited table', check: async () => { await expect(guestPage.getByRole('heading', { name: 'Take a seat at Ada’s table.' })).toBeVisible(); await expect(guestPage.getByText('Short Path', { exact: true })).toBeVisible(); } },
    { spec: 'Bora observes exactly the creation event', check: async () => expectState(guestPage, { screen: 'join-room', eventCount: 1, seatCount: 1 }) }
  ] });

  await guestPage.getByLabel('Your merchant name').fill('Bora');
  await guest.step('guest-enters-name', { description: 'Bora enters the second merchant name', verifications: [
    { spec: 'Bora remains visible in the join field', check: async () => expect(guestPage.getByLabel('Your merchant name')).toHaveValue('Bora') },
    { spec: 'Join is enabled and history is unchanged', check: async () => { await expect(guestPage.getByRole('button', { name: /Join the room/ })).toBeEnabled(); await expectState(guestPage, { eventCount: 1 }); } }
  ] });

  await guestPage.getByRole('button', { name: /Join the room/ }).click();
  await guest.step('guest-joins', { description: 'Bora claims clockwise seat two', verifications: [
    { spec: 'Both named seats appear in order', check: async () => { await expect(guestPage.getByText('Ada')).toBeVisible(); await expect(guestPage.getByText('Bora · you')).toBeVisible(); } },
    { spec: 'The join is event two with neither merchant ready', check: async () => expectState(guestPage, { screen: 'lobby', eventCount: 2, seatCount: 2, ready: [false, false] }) }
  ] });

  await guestPage.getByRole('button', { name: /I am ready/ }).click();
  await guest.step('guest-readies', { description: 'Bora readies for the reviewed layout', verifications: [
    { spec: 'The table shows one of two merchants ready', check: async () => expect(guestPage.getByText('1/2')).toBeVisible() },
    { spec: 'Only Bora is ready in event three', check: async () => expectState(guestPage, { eventCount: 3, ready: [false, true] }) }
  ] });

  await hostPage.getByRole('button', { name: /I am ready/ }).click();
  await host.step('host-readies', { description: 'Ada readies and unlocks the bazaar', verifications: [
    { spec: 'The host sees Table ready and an enabled start button', check: async () => { await expect(hostPage.getByText('Table ready')).toBeVisible(); await expect(hostPage.getByRole('button', { name: /Open the bazaar/ })).toBeEnabled(); } },
    { spec: 'Event four has both merchants ready and no setup yet', check: async () => expectState(hostPage, { eventCount: 4, ready: [true, true], game: null }) }
  ] });

  await hostPage.getByRole('button', { name: /Open the bazaar/ }).click();
  await host.step('host-starts-game', { description: 'Ada commits the seed and opens the bazaar', verifications: [
    { spec: 'All sixteen Place controls are rendered', check: async () => expect(hostPage.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16) },
    { spec: 'Ada is the seeded first merchant at Fountain', check: async () => expectState(hostPage, { screen: 'game', eventCount: 5, diagnosticCount: 0, game: { seed, currentTurn: 'Ada', turnNumber: 1, phase: 'movement', players: [{ name: 'Ada', merchantPlace: 7 }, { name: 'Bora', merchantPlace: 7 }] } }) }
  ] });
}
