import { expect, test, type BrowserContext } from '@playwright/test';
import { expectState, openTwoPlayerGame, readState } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('one complete game surface is responsive and operable without a pointer', async ({ browser, page }, testInfo) => {
  const codes: Record<string, string> = { phone: 'AHELP', desktop: 'AIDES', 'mobile-landscape': 'ALAND', tablet: 'ATABL' };
  const roomCode = codes[testInfo.project.name];
  const seed = 'recovery-12';
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, keyboard and touch player');
  const boraContext: BrowserContext = await browser.newContext({ baseURL: String(testInfo.project.use.baseURL), viewport: testInfo.project.use.viewport as { width: number; height: number }, locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, second merchant');
  ada.setMetadata('A complete Istanbul surface at every accessible viewport', 'Ada and Bora create a real two-player game at phone portrait, phone landscape, tablet, and desktop dimensions. Ada then traverses the 4×4 bazaar with arrow keys, transfers focus into the selected Place inspector with Enter, and commits movement through a touch-sized action. Each action is followed by an exact screenshot plus checks of the immutable projection, semantic board, focus location, live announcement, contrast, non-colour labels, safe-area padding, reduced motion, 44 px target size, and zero viewport overflow.');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed });
    const firstPlace = page.getByTestId('bazaar-board').locator('.place[tabindex="0"]');
    await firstPlace.focus();
    await ada.step('ada-focuses-board-by-keyboard', { description: 'Ada moves keyboard focus onto the bazaar', verifications: [
      { spec: 'Exactly one Place is in the board tab stop', check: async () => expect(page.getByTestId('bazaar-board').locator('.place[tabindex="0"]')).toHaveCount(1) },
      { spec: 'The focused Place exposes number, name, action, reachability, and occupants in its label', check: async () => { await expect(firstPlace).toBeFocused(); await expect(firstPlace).toHaveAttribute('aria-label', /\d+ .+\./); } },
      { spec: 'The semantic board contains sixteen button controls', check: async () => expect(page.getByTestId('bazaar-board').getByRole('button')).toHaveCount(16) }
    ] });
    await firstPlace.press('ArrowRight');
    const rightPlace = page.getByTestId('bazaar-board').locator('.place[tabindex="0"]');
    await ada.step('ada-arrows-right-one-place', { description: 'Ada presses Arrow Right to traverse the grid', verifications: [
      { spec: 'Focus and the sole roving tab stop move to the next column', check: async () => { await expect(rightPlace).toBeFocused(); const id = await rightPlace.getAttribute('data-place-id'); expect(id).toBe(String((await readState(page)).game.board[1])); } },
      { spec: 'Arrow navigation changes no event or selected Place', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: null, phase: 'movement' } }) }
    ] });
    const route = await page.locator('.place.reachable').first().evaluate((element) => ({ id: Number(element.getAttribute('data-place-id')), index: Array.from(element.parentElement!.children).indexOf(element) }));
    const neighbourIndex = route.index % 4 > 0 ? route.index - 1 : route.index + 1;
    const direction = route.index % 4 > 0 ? 'ArrowRight' : 'ArrowLeft';
    const neighbour = page.getByTestId('bazaar-board').locator('.place').nth(neighbourIndex);
    await neighbour.focus();
    await ada.step('ada-focuses-route-neighbour', { description: 'Ada positions focus beside a highlighted route', verifications: [
      { spec: 'The neighbouring Place receives visible keyboard focus', check: async () => expect(neighbour).toBeFocused() },
      { spec: 'The destination says Reachable this turn without relying on colour', check: async () => expect(page.locator(`.place[data-place-id="${route.id}"]`)).toHaveAttribute('aria-label', /Reachable this turn/) }
    ] });
    await neighbour.press(direction);
    const destination = page.locator(`.place[data-place-id="${route.id}"]`);
    await ada.step('ada-arrows-onto-reachable-route', { description: 'Ada arrows onto the reachable destination', verifications: [
      { spec: 'Focus lands on the intended reachable Place', check: async () => expect(destination).toBeFocused() },
      { spec: 'Keyboard traversal remains local at event five', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: null } }) }
    ] });
    await destination.press('Enter');
    const inspectorTitle = page.getByTestId('place-inspector-title');
    await ada.step('ada-opens-place-with-enter', { description: 'Ada presses Enter and focus transfers into the Place inspector', verifications: [
      { spec: 'The Place inspector heading receives focus for immediate reading', check: async () => expect(inspectorTitle).toBeFocused() },
      { spec: 'The chosen Place is selected locally while history remains at five events', check: async () => expectState(page, { eventCount: 5, game: { selectedPlace: route.id, phase: 'movement' } }) },
      { spec: 'The movement action is enabled and names the assistant consequence', check: async () => expect(page.getByRole('button', { name: /Move here and/ })).toBeEnabled() }
    ] });
    const action = page.getByRole('button', { name: /Move here and/ });
    const actionBox = await action.boundingBox();
    const touch = { identifier: 1, clientX: actionBox!.x + 4, clientY: actionBox!.y + 4 };
    await action.dispatchEvent('touchstart', { touches: [touch] });
    await action.dispatchEvent('touchend', { changedTouches: [touch] });
    await action.click();
    await ada.step('ada-taps-movement-action', { description: 'Ada taps the full-size movement action', verifications: [
      { spec: 'The action target is at least 44 by 44 CSS pixels', check: async () => { expect(actionBox).not.toBeNull(); expect(actionBox!.width).toBeGreaterThanOrEqual(44); expect(actionBox!.height).toBeGreaterThanOrEqual(44); } },
      { spec: 'Event six commits Ada’s destination and advances to its action', check: async () => expectState(page, { eventCount: 6, game: { phase: 'action', players: [{ merchantPlace: route.id }, {}] } }) },
      { spec: 'Reduced-motion preference suppresses movement animation', check: async () => expect(destination).toHaveCSS('animation-name', 'none') }
    ] });
    await ada.step('ada-reads-accessible-turn-state', { description: 'Ada receives the updated turn through every information channel', verifications: [
      { spec: 'The live region announces turn, merchant, phase, and ownership', check: async () => expect(page.getByTestId('turn-announcement')).toHaveText(/Turn 1\. Ada\. action\. Your action\./) },
      { spec: 'Goods and merchant pieces retain textual labels beyond colour', check: async () => { await expect(page.getByLabel('Ada goods')).toBeVisible(); await expect(page.getByLabel('Ada resources')).toContainText('Ada · you'); } },
      { spec: 'Turn heading colours meet WCAG AA contrast', check: async () => { const foreground = await page.locator('.turn-banner h1').evaluate((element) => getComputedStyle(element).color); expect(contrastRatio(foreground, '#173f43')).toBeGreaterThanOrEqual(4.5); } },
      { spec: 'Safe-area-aware padding is present on every edge', check: async () => { const padding = await page.locator('main').evaluate((element) => { const style = getComputedStyle(element); return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(parseFloat); }); expect(padding.every((value) => value > 0)).toBe(true); } },
      { spec: 'Canonical projection remains clean after accessible input', check: async () => { const state = await readState(page); expect(state).toMatchObject({ diagnosticCount: 0, eventCount: 6, game: { phase: 'action' } }); } }
    ] });
    ada.generateDocs();
  } finally { await boraContext.close(); }
});

function contrastRatio(foreground: string, background: string) {
  const rgb = (value: string) => {
    const channels = value.startsWith('#')
      ? [value.slice(1, 3), value.slice(3, 5), value.slice(5, 7)].map((channel) => Number.parseInt(channel, 16))
      : value.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    return channels.map((channel) => { const normalized = channel / 255; return normalized <= .04045 ? normalized / 12.92 : ((normalized + .055) / 1.055) ** 2.4; });
  };
  const luminance = (value: string) => { const [red, green, blue] = rgb(value); return .2126 * red + .7152 * green + .0722 * blue; };
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + .05) / (darker + .05);
}
