import {
  expect,
  type Browser,
  type BrowserContext,
  type Page,
  type TestInfo
} from '@playwright/test';
import { readState, expectState } from './game-journey';
import { TestStepHelper } from './test-step-helper';

export const roomTile = (page: Page) => page.locator('.zoom-tile:not([inert])');
export async function openTable(
  page: Page,
  browser: Browser,
  info: TestInfo,
  number: number,
  options: {
    seed?: string;
    review?: string;
    recovery?: boolean;
    count?: number;
  } = {}
) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const names = ['Ada', 'Bora', 'Cem', 'Derya', 'Emre'].slice(
    0,
    options.count ?? 2
  );
  const room = `U${String.fromCharCode(65 + number) + 'A'}${info.project.name === 'phone' ? 'PP' : info.project.name === 'tablet' ? 'TT' : info.project.name === 'mobile-landscape' ? 'LL' : 'DD'}`;
  const contexts: BrowserContext[] = [];
  const pages = [page];
  await page.goto(
    `/?e2eRoom=${room}&e2eSeed=${options.seed ?? 'move-desktop-4'}${options.review ? '&e2eReview=' + options.review : ''}${options.recovery ? '&e2eRecovery=1' : ''}`
  );
  await expect(page.getByRole('status')).toHaveText('Firebase emulator ready');
  await page.getByLabel('Your merchant name').fill(names[0]);
  await page.getByRole('button', { name: /Create private room/ }).click();
  await expectState(page, { screen: 'lobby' });
  for (const name of names.slice(1)) {
    const context = await browser.newContext({
      baseURL: String(info.project.use.baseURL),
      viewport: info.project.use.viewport,
      reducedMotion: 'reduce'
    });
    contexts.push(context);
    const guest = await context.newPage();
    pages.push(guest);
    await guest.goto(`/?room=${room}`);
    await expectState(guest, { screen: 'join-room' });
    await guest.getByLabel('Your merchant name').fill(name);
    await guest.getByRole('button', { name: /Join the room/ }).click();
    await guest.getByRole('button', { name: /I am ready/ }).click();
  }
  await page.getByRole('button', { name: /I am ready/ }).click();
  await page.getByRole('button', { name: /Open the bazaar/ }).click();
  await expectState(page, { game: { phase: 'movement', currentTurn: 'Ada' } });
  const steps = new TestStepHelper(page, info);
  return {
    page,
    pages,
    room,
    steps,
    names,
    close: async () => {
      for (const context of contexts) await context.close();
    }
  };
}
export async function move(page: Page, id: number) {
  const before = await readState(page);
  await page.locator(`[data-place-id="${id}"]`).click();
  const blocked = roomTile(page).getByRole('button', {
    name: 'Move here & lose this turn'
  });
  if (await blocked.isVisible()) await blocked.click();
  await expect
    .poll(async () => (await readState(page)).eventCount)
    .toBeGreaterThan(before.eventCount);
  const state = await readState(page);
  if (state.game.phase === 'merchant-payment') {
    await roomTile(page)
      .getByRole('button', { name: /Pay .* & roll/ })
      .click();
    await expect
      .poll(async () => (await readState(page)).game.phase)
      .not.toBe('merchant-payment');
  }
}
export async function end(page: Page) {
  await expect
    .poll(async () => (await readState(page)).actionPending)
    .toBe(false);
  const before = await readState(page);
  for (let i = 0; i < 8; i++) {
    await expect
      .poll(async () => (await readState(page)).actionPending)
      .toBe(false);
    const state = await readState(page);
    if (
      state.game.turnNumber !== before.game.turnNumber ||
      state.game.currentTurn !== before.game.currentTurn ||
      state.game.phase === 'game-over'
    )
      return;
    const tile = roomTile(page);
    if (
      await tile
        .getByRole('button', { name: 'Keep dice', exact: true })
        .isVisible()
    ) {
      await tile
        .getByRole('button', { name: 'Keep dice', exact: true })
        .click();
      continue;
    }
    if (
      await tile
        .getByRole('button', { name: 'Catch family for 3 Lira', exact: true })
        .count()
    ) {
      await tile
        .getByRole('button', { name: 'Catch family for 3 Lira', exact: true })
        .first()
        .click();
      continue;
    }
    const finish = tile.getByRole('button', {
      name: /^(End turn|Finish trading)$/
    });
    if (await finish.isVisible()) {
      await finish.click();
      await expect
        .poll(async () => (await readState(page)).eventCount)
        .toBeGreaterThan(state.eventCount);
      continue;
    }
    throw Error(`Cannot end ${state.game.phase}`);
  }
  throw Error('Turn did not finish');
}
export async function nextAda(table: Awaited<ReturnType<typeof openTable>>) {
  for (let n = 0; n < 5; n++) {
    const s = await readState(table.page);
    if (s.game.currentTurn === 'Ada') return;
    const index = table.names.indexOf(s.game.currentTurn),
      page = table.pages[index];
    await expectState(page, { game: { currentTurn: table.names[index] } });
    const p = (await readState(page)).game.players[index];
    await move(page, p.merchantPlace === 7 ? 4 : 7);
    await end(page);
    await expect
      .poll(async () => (await readState(table.page)).game.currentTurn)
      .not.toBe(table.names[index]);
  }
}
export async function travel(
  table: Awaited<ReturnType<typeof openTable>>,
  destination: number
) {
  for (let n = 0; n < 10; n++) {
    await nextAda(table);
    const s = await readState(table.page),
      g = s.game,
      p = g.players[0];
    const distance = (a: number, b: number) => {
      const x = g.board.indexOf(a),
        y = g.board.indexOf(b);
      return (
        Math.abs((x % 4) - (y % 4)) +
        Math.abs(Math.floor(x / 4) - Math.floor(y / 4))
      );
    };
    const legal = g.board.filter(
      (id: number) =>
        distance(p.merchantPlace, id) > 0 &&
        distance(p.merchantPlace, id) <= 2 &&
        (id === 7 || p.assistantsCarried > 0 || p.assistantsByPlace[id])
    );
    const next = legal.includes(destination)
      ? destination
      : legal.sort(
          (a: number, b: number) =>
            distance(a, destination) - distance(b, destination)
        )[0];
    await move(table.page, next);
    if (next === destination) return;
    if (
      next === 7 &&
      (await roomTile(table.page)
        .getByRole('button', { name: 'Recall all', exact: true })
        .isVisible())
    )
      await roomTile(table.page)
        .getByRole('button', { name: 'Recall all', exact: true })
        .click();
    await end(table.page);
  }
  throw Error('Could not reach destination');
}
export async function supply(page: Page) {
  const before = (await readState(page)).eventCount;
  await page
    .getByRole('button', { name: 'Review ruby routes with supplied resources' })
    .click();
  await expect
    .poll(async () => (await readState(page)).eventCount)
    .toBeGreaterThan(before);
}
export async function hand(page: Page, title: RegExp) {
  await page
    .getByRole('button', { name: 'Your Bonus cards', exact: true })
    .click();
  await page.getByRole('button', { name: title }).first().click();
}
export async function capture(
  table: Awaited<ReturnType<typeof openTable>>,
  title: string,
  check: () => Promise<void>
) {
  table.steps.setMetadata(
    title,
    'Real browser actions on the common game table, with immutable replay and private-card boundaries.'
  );
  await table.steps.step('table-result', {
    description: title,
    verifications: [
      { spec: 'The game state and visible components agree', check }
    ]
  });
  table.steps.generateDocs();
}
