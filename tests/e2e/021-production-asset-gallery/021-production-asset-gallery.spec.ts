import { expect, test, type Locator } from '@playwright/test';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('the production gallery exposes every source asset and composed demand tile for review', async ({ page }, testInfo) => {
  const journal = new ScenarioJournal();
  const reviewer = new TestStepHelper(page, testInfo, journal, 'The art reviewer');
  reviewer.setMetadata(
    'Reviewing every Istanbul production asset',
    'The reviewer opens the dedicated gallery without creating a game, inspects the first board square at full size, and then walks every page of board squares, player mats, people and markers, Bonus cards, composed Market demand tiles, and physical components. Stable review IDs, exact category totals, loaded production images, responsive pagination, and the no-scroll/no-clipping contract are checked after every input so any visual feedback can name the precise asset that needs improvement.'
  );

  await page.goto('/gallery/');
  await reviewer.step('reviewer-opens-gallery', {
    description: 'The reviewer opens the complete production gallery',
    verifications: [
      { spec: 'The gallery declares all 73 source assets and 10 composed demand tiles', check: async () => { const gallery = page.locator('[data-e2e-layout]'); await expect(gallery).toHaveAttribute('data-gallery-raw-count', '73'); await expect(gallery).toHaveAttribute('data-gallery-composite-count', '10'); } },
      { spec: 'All six category totals are immediately visible', check: async () => { const nav = page.getByRole('navigation', { name: 'Asset categories' }); for (const [name, count] of [['Board squares', 16], ['Player mats', 5], ['People & markers', 20], ['Bonus cards', 12], ['Demand tiles', 10], ['Components', 20]] as const) await expect(nav.getByRole('button', { name: new RegExp(`${name}.*${count}`) })).toBeVisible(); } },
      { spec: 'The first six numbered board squares load at review size', check: async () => expectAssetPage(page.locator('.asset-grid'), ['place-01', 'place-02', 'place-03', 'place-04', 'place-05', 'place-06']) }
    ]
  });

  await page.getByRole('button', { name: 'Inspect 1. Wainwright' }).click();
  await reviewer.step('reviewer-enlarges-wainwright', {
    description: 'The reviewer enlarges the Wainwright board square',
    verifications: [
      { spec: 'The modal names the stable review reference and source file', check: async () => { const dialog = page.getByRole('dialog', { name: '1. Wainwright' }); await expect(dialog.getByText('Review reference · place-01')).toBeVisible(); await expect(dialog.getByText('art/game/locations/01-wainwright.webp')).toBeVisible(); } },
      { spec: 'The unmasked full board-square image is loaded', check: async () => expect(await loadedBackgrounds(page.getByRole('dialog', { name: '1. Wainwright' }).locator('[data-art-kind="location"]'))).toEqual([true]) }
    ]
  });

  await page.getByRole('button', { name: 'Close asset review' }).click();
  await reviewer.step('reviewer-closes-wainwright', {
    description: 'The reviewer closes the enlarged board square',
    verifications: [
      { spec: 'The unclipped first Place page returns', check: async () => { await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByRole('button', { name: 'Inspect 1. Wainwright' })).toBeVisible(); } }
    ]
  });

  await nextPage('reviewer-opens-board-squares-7-12', 'The reviewer advances to board squares seven through twelve', ['place-07', 'place-08', 'place-09', 'place-10', 'place-11', 'place-12']);
  await nextPage('reviewer-opens-board-squares-13-16', 'The reviewer advances to the final four board squares', ['place-13', 'place-14', 'place-15', 'place-16']);

  await chooseCategory('Player mats', 'reviewer-opens-player-mats', 'The reviewer opens all five player mats', ['mat-ruby', 'mat-saffron', 'mat-teal', 'mat-indigo', 'mat-plum']);

  await chooseCategory('People & markers', 'reviewer-opens-player-pieces', 'The reviewer opens the first player-piece page', ['merchant-ruby', 'merchant-saffron', 'merchant-teal', 'merchant-indigo', 'merchant-plum', 'assistant-ruby']);
  await nextPage('reviewer-opens-assistants', 'The reviewer advances through assistants and family members', ['assistant-saffron', 'assistant-teal', 'assistant-indigo', 'assistant-plum', 'family-ruby', 'family-saffron']);
  await nextPage('reviewer-opens-families-and-neutrals', 'The reviewer advances through family and neutral figures', ['family-teal', 'family-indigo', 'family-plum', 'neutral-merchant', 'governor', 'smuggler']);
  await nextPage('reviewer-opens-special-markers', 'The reviewer reaches the first-player and dice markers', ['first-player', 'dice-pair']);

  await chooseCategory('Bonus cards', 'reviewer-opens-first-bonus-faces', 'The reviewer opens the first six Bonus-card faces', ['bonus-gain-good', 'bonus-gain-lira', 'bonus-repeat-sultan', 'bonus-repeat-post', 'bonus-repeat-gemstone', 'bonus-return-family']);
  await nextPage('reviewer-opens-remaining-bonus-art', 'The reviewer reaches every remaining face, back, and deck image', ['bonus-stay', 'bonus-long-move', 'bonus-wild-small-market', 'bonus-return-assistant', 'bonus-card-back', 'bonus-deck-face']);

  await chooseCategory('Demand tiles', 'reviewer-opens-large-demand-tiles', 'The reviewer opens all Large Market demands and the first Small Market demand', ['demand-large-1', 'demand-large-2', 'demand-large-3', 'demand-large-4', 'demand-large-5', 'demand-small-1']);
  await nextPage('reviewer-opens-small-demand-tiles', 'The reviewer reaches the remaining Small Market demands', ['demand-small-2', 'demand-small-3', 'demand-small-4', 'demand-small-5']);

  await chooseCategory('Components', 'reviewer-opens-goods-and-rubies', 'The reviewer opens the goods, money, and ruby components', ['component-fabric', 'component-spice', 'component-fruit', 'component-jewelry', 'component-lira', 'component-ruby']);
  await nextPage('reviewer-opens-upgrades-and-first-powers', 'The reviewer advances through upgrades, markers, and the first Mosque powers', ['component-wheelbarrow', 'component-die', 'component-mail', 'component-bonus-deck', 'component-mosque-fabric', 'component-mosque-spice']);
  await nextPage('reviewer-opens-powers-and-public-tracks', 'The reviewer advances through the remaining powers and public tracks', ['component-mosque-fruit', 'component-mosque-jewelry', 'component-sultan-track', 'component-demand-large', 'component-demand-small', 'component-gemstone-track']);
  await nextPage('reviewer-opens-public-supplies', 'The reviewer reaches the final ruby and goods supplies', ['component-ruby-supply', 'component-goods-supply']);

  await page.getByRole('button', { name: 'Inspect Goods supply' }).click();
  await reviewer.step('reviewer-enlarges-final-component', {
    description: 'The reviewer enlarges the final goods-supply component',
    verifications: [
      { spec: 'The last source asset has a stable reference and exact path', check: async () => { const dialog = page.getByRole('dialog', { name: 'Goods supply' }); await expect(dialog.getByText('Review reference · component-goods-supply')).toBeVisible(); await expect(dialog.getByText('art/game/components/goods-supply.webp')).toBeVisible(); } },
      { spec: 'The final production component loads at full review size', check: async () => expect(await loadedBackgrounds(page.getByRole('dialog', { name: 'Goods supply' }).locator('[data-art-kind="component"]'))).toEqual([true]) }
    ]
  });

  reviewer.generateDocs();

  async function chooseCategory(name: string, id: string, description: string, expectedIds: string[]) {
    await page.getByRole('navigation', { name: 'Asset categories' }).getByRole('button', { name: new RegExp(name) }).click();
    await reviewer.step(id, { description, verifications: [
      { spec: `${name} resets to its first complete review page`, check: async () => { await expect(page.getByRole('button', { name: 'Previous asset page' })).toBeDisabled(); await expectAssetPage(page.locator('.asset-grid'), expectedIds); } }
    ] });
  }

  async function nextPage(id: string, description: string, expectedIds: string[]) {
    await page.getByRole('button', { name: 'Next asset page' }).click();
    await reviewer.step(id, { description, verifications: [
      { spec: 'The next exact inventory slice replaces the prior page without scrolling', check: async () => expectAssetPage(page.locator('.asset-grid'), expectedIds) }
    ] });
  }
});

async function expectAssetPage(grid: Locator, expectedIds: string[]) {
  const cards = grid.locator('[data-asset-id]');
  await expect(cards).toHaveCount(expectedIds.length);
  expect(await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-asset-id')))).toEqual(expectedIds);
  expect((await loadedBackgrounds(cards.locator('[data-art-kind]'))).every(Boolean)).toBe(true);
}

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
