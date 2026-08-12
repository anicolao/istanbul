import { expect, test, type BrowserContext, type Locator } from '@playwright/test';
import { expectState, openTwoPlayerGame } from '../helpers/game-journey';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('original production art communicates the complete tabletop', async ({ browser, page }, testInfo) => {
  const roomCode = testInfo.project.name === 'phone' ? 'APART' : 'AARTS';
  const seed = `production-art-${testInfo.project.name}`;
  const journal = new ScenarioJournal();
  const ada = new TestStepHelper(page, testInfo, journal, 'Ada, the host');
  const boraContext: BrowserContext = await browser.newContext({
    baseURL: String(testInfo.project.use.baseURL),
    viewport: testInfo.project.use.viewport as { width: number; height: number },
    locale: 'en-CA', timezoneId: 'America/Toronto', serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1
  });
  const boraPage = await boraContext.newPage();
  const bora = new TestStepHelper(boraPage, testInfo, journal, 'Bora, the second merchant');
  ada.setMetadata(
    'Playing Istanbul with original production artwork',
    'Ada and Bora create a real two-player game through the ordinary room controls. When the seeded bazaar opens, every location, merchant, assistant, encounter, good, ruby, Bonus card, and player mat is backed by an original graphical asset while its exact rules state remains available through the DOM and serialized replay projection. Bora then opens his private card to compare its hand thumbnail with the full illustrated face.'
  );

  try {
    await openTwoPlayerGame({ hostPage: page, guestPage: boraPage, host: ada, guest: bora, roomCode, seed });

    await ada.step('host-reviews-illustrated-tabletop', {
      description: 'Ada reviews the complete illustrated tabletop',
      verifications: [
        { spec: 'All sixteen Place buttons contain loaded location artwork', check: async () => {
          const tiles = page.locator('.place [data-art-kind="location"]');
          await expect(tiles).toHaveCount(16);
          expect(await loadedBackgrounds(tiles)).toEqual(Array(16).fill(true));
        } },
        { spec: 'The board uses graphical merchant, assistant, Governor, and Smuggler pieces', check: async () => {
          await expect(page.locator('.occupants [data-art-kind="piece"].merchant')).toHaveCount(5);
          await expect(page.locator('[data-art-kind="piece"].governor-piece')).toHaveCount(1);
          await expect(page.locator('[data-art-kind="piece"].smuggler-piece')).toHaveCount(1);
          expect((await loadedBackgrounds(page.locator('[data-art-kind="piece"]'))).every(Boolean)).toBe(true);
        } },
        { spec: 'Both colour-keyed player mats and every resource icon are real loaded images', check: async () => {
          await expect(page.locator('[data-art-kind="mat"]')).toHaveCount(2);
          expect(await page.locator('[data-art-kind="component"]').count()).toBeGreaterThan(50);
          expect((await loadedBackgrounds(page.locator('[data-art-kind="mat"], [data-art-kind="component"]'))).every(Boolean)).toBe(true);
        } },
        { spec: 'Every Place exposes a graphical and semantic live-state indicator', check: async () => {
          const states = page.locator('.location-state');
          await expect(states).toHaveCount(16);
          const summaries = await states.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-state-summary') ?? ''));
          expect(summaries.every((summary) => summary.length > 12)).toBe(true);
          expect(new Set(summaries).size).toBe(16);
          await expect(page.locator('[data-testid="place-state-5"]')).toHaveAttribute('data-state-summary', /Exposed mail:/);
          await expect(page.locator('[data-testid="place-state-6"]')).toHaveAttribute('data-state-summary', /Bonus cards in draw pile; 0 in discard/);
          await expect(page.locator('[data-testid="place-state-14"]')).toHaveAttribute('data-state-summary', /required, pay 1.*ruby rewards remain/);
          await expect(page.locator('[data-testid="place-state-16"]')).toHaveAttribute('data-state-summary', /Next ruby costs \d+ Lira/);
          await expect(page.locator('[data-place-id="5"]')).toHaveAttribute('aria-label', /Current state: Exposed mail:/);
        } },
        { spec: 'The canonical setup remains unchanged by its visual treatment', check: async () => expectState(page, { screen: 'game', eventCount: 5, diagnosticCount: 0, game: { seed, phase: 'movement', turnNumber: 1, players: [{ name: 'Ada', merchantPlace: 7, assistantsCarried: 4, rubies: 0 }, { name: 'Bora', merchantPlace: 7, assistantsCarried: 4, rubies: 0 }] } }) }
      ]
    });

    const cardButton = boraPage.getByRole('button', { name: /Inspect Bonus card:/ });
    const cardName = (await cardButton.getAttribute('aria-label') ?? '').replace('Inspect Bonus card: ', '');
    await cardButton.click();
    await bora.step('guest-opens-illustrated-bonus-card', {
      description: 'Bora opens his illustrated private Bonus card',
      verifications: [
        { spec: 'The hand thumbnail and large card face both load production card art', check: async () => {
          await expect(boraPage.locator('.hand-card-art')).toHaveCount(1);
          await expect(boraPage.getByTestId('illustrated-bonus-card').locator('[data-art-kind="card"]')).toHaveCount(1);
          expect((await loadedBackgrounds(boraPage.locator('.hand-card-art, [data-testid="illustrated-bonus-card"] [data-art-kind="card"]'))).every(Boolean)).toBe(true);
        } },
        { spec: 'The exact private title and rules text stay in semantic HTML over the artwork', check: async () => {
          await expect(boraPage.getByRole('heading', { name: cardName })).toBeVisible();
          await expect(boraPage.getByText('Private Bonus card')).toBeVisible();
          await expect(cardButton).toHaveAttribute('aria-pressed', 'true');
        } },
        { spec: 'Ada’s hand remains a graphical card back with no private face exposed', check: async () => {
          await expect(boraPage.locator('.masked-hand [data-art-kind="card-back"]')).toHaveCount(1);
          await expect(boraPage.getByText('Bonus hand · 1 hidden card')).toBeVisible();
        } },
        { spec: 'Card inspection is local view state and adds no immutable event', check: async () => expectState(boraPage, { eventCount: 5, diagnosticCount: 0, game: { phase: 'movement', selectedBonus: expect.any(String), opponentHandCounts: [1] } }) }
      ]
    });

    ada.generateDocs();
  } finally {
    await boraContext.close();
  }
});

async function loadedBackgrounds(locator: Locator) {
  return locator.evaluateAll(async (elements) => Promise.all(elements.map(async (element) => {
    const match = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (!match) return false;
    const image = new Image();
    const loaded = new Promise<boolean>((resolve) => {
      image.onload = () => resolve(image.naturalWidth > 0);
      image.onerror = () => resolve(false);
    });
    image.src = match[1];
    if (image.complete) return image.naturalWidth > 0;
    return loaded;
  })));
}
