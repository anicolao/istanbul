import { expect, test } from '@playwright/test';
import { expectState } from '../helpers/game-journey';

test('a full browser store never blocks creating or syncing a tabletop game', async ({ page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'FULLP' : 'FULLD';
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    };
  });

  await page.goto(`/tabletop/?e2eRoom=${roomCode}`);

  await expect(page.getByRole('status')).toHaveText('Firebase emulator ready');
  await expect(page.getByRole('heading', { name: 'Choose your place.' })).toBeVisible();
  await expect(page.getByText(roomCode, { exact: true })).toBeVisible();
  await expectState(page, {
    screen: 'shared-display',
    roomCode,
    eventCount: 1,
    mode: 'shared-table',
    tabletopOwned: true
  });
});
