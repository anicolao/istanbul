import { expect, test, type Locator } from '@playwright/test';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('the production gallery renders the same logical components used during play', async ({ page }, testInfo) => {
  const journal = new ScenarioJournal();
  const reviewer = new TestStepHelper(page, testInfo, journal, 'The art reviewer');
  reviewer.setMetadata(
    'Reviewing every Istanbul production component',
    'The reviewer opens the dedicated gallery without creating a game and walks every page of live locations, player trays, playing pieces, Bonus cards, Market demands, and physical components. Locations are the same rectangular, titled, rounded LocationTile instances used on the board; their status apparatus and occupants come from a deterministic game projection. Trays use PlayerTray, rules cards use BonusCard, and demands use MarketDemand. Stable review IDs, renderer names, representative props, loaded production images, responsive pagination, and the no-scroll/no-clipping contract are checked after every input.'
  );

  await page.goto('/gallery/');
  await reviewer.step('reviewer-opens-gallery', {
    description: 'The reviewer opens the complete production gallery',
    verifications: [
      { spec: 'The gallery declares 85 rendered review states backed by the complete 73-asset manifest', check: async () => { const gallery = page.locator('[data-e2e-layout]'); await expect(gallery).toHaveAttribute('data-gallery-rendered-count', '85'); await expect(gallery).toHaveAttribute('data-gallery-raw-count', '73'); await expect(gallery).toHaveAttribute('data-gallery-composite-count', '12'); } },
      { spec: 'All six logical-component category totals are immediately visible', check: async () => { const nav = page.getByRole('navigation', { name: 'Asset categories' }); for (const [name, count] of [['Locations', 16], ['Player trays', 5], ['Playing pieces', 20], ['Bonus cards', 12], ['Market demands', 12], ['Physical components', 20]] as const) await expect(nav.getByRole('button', { name: new RegExp(`${name}.*${count}`) })).toBeVisible(); } },
      { spec: 'The first six numbered locations are real LocationTile components with public state', check: async () => { await expectComponentPage(page.locator('.asset-grid'), ['place-01', 'place-02', 'place-03', 'place-04', 'place-05', 'place-06']); await expect(page.locator('[data-asset-id="place-05"] [data-testid="place-state-5"]')).toHaveAttribute('data-state-summary', /Exposed mail/); await expect(page.locator('[data-asset-id="place-06"] .card-pile')).toHaveCount(2); } }
    ]
  });

  await page.getByRole('button', { name: 'Inspect 1. Wainwright' }).click();
  await reviewer.step('reviewer-enlarges-wainwright', {
    description: 'The reviewer enlarges the Wainwright board square',
    verifications: [
      { spec: 'The modal names the stable review reference, renderer, and representative props', check: async () => { const dialog = page.getByRole('dialog', { name: '1. Wainwright' }); await expect(dialog.getByText('Review reference · place-01')).toBeVisible(); await expect(dialog.getByText('LocationTile · placeId=1 · projection=production-component-gallery')).toBeVisible(); } },
      { spec: 'The full component is rectangular, rounded, titled, and backed by loaded production art', check: async () => { const tile = page.getByRole('dialog', { name: '1. Wainwright' }).locator('[data-component="LocationTile"]'); const box = await tile.boundingBox(); expect(box!.width).toBeGreaterThan(box!.height); expect(await tile.evaluate((element) => getComputedStyle(element).borderRadius)).not.toBe('0px'); await expect(tile.locator('strong')).toHaveText('Wainwright'); expect((await loadedBackgrounds(tile.locator('[data-art-kind]'))).every(Boolean)).toBe(true); } }
    ]
  });

  await page.getByRole('button', { name: 'Close asset review' }).click();
  await reviewer.step('reviewer-closes-wainwright', {
    description: 'The reviewer closes the enlarged board square',
    verifications: [
      { spec: 'The unclipped first LocationTile page returns', check: async () => { await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByRole('button', { name: 'Inspect 1. Wainwright' })).toBeVisible(); } }
    ]
  });

  await nextPage('reviewer-opens-board-squares-7-12', 'The reviewer advances to board squares seven through twelve', ['place-07', 'place-08', 'place-09', 'place-10', 'place-11', 'place-12']);
  await nextPage('reviewer-opens-board-squares-13-16', 'The reviewer advances to the final four board squares', ['place-13', 'place-14', 'place-15', 'place-16']);

  await chooseCategory('Player trays', 'reviewer-opens-player-mats', 'The reviewer opens five live PlayerTray states', ['mat-ruby', 'mat-saffron', 'mat-teal', 'mat-indigo', 'mat-plum']);

  await chooseCategory('Playing pieces', 'reviewer-opens-player-pieces', 'The reviewer opens the first GameArt playing-piece page', ['merchant-ruby', 'merchant-saffron', 'merchant-teal', 'merchant-indigo', 'merchant-plum', 'assistant-ruby']);
  await nextPage('reviewer-opens-assistants', 'The reviewer advances through assistants and family members', ['assistant-saffron', 'assistant-teal', 'assistant-indigo', 'assistant-plum', 'family-ruby', 'family-saffron']);
  await nextPage('reviewer-opens-families-and-neutrals', 'The reviewer advances through family and neutral figures', ['family-teal', 'family-indigo', 'family-plum', 'neutral-merchant', 'governor', 'smuggler']);
  await nextPage('reviewer-opens-special-markers', 'The reviewer reaches the first-player and dice markers', ['first-player', 'dice-pair']);

  await chooseCategory('Bonus cards', 'reviewer-opens-first-bonus-faces', 'The reviewer opens the first six Bonus-card faces', ['bonus-gain-good', 'bonus-gain-lira', 'bonus-repeat-sultan', 'bonus-repeat-post', 'bonus-repeat-gemstone', 'bonus-return-family']);
  await nextPage('reviewer-opens-remaining-bonus-art', 'The reviewer reaches every remaining face, back, and deck image', ['bonus-stay', 'bonus-long-move', 'bonus-wild-small-market', 'bonus-return-assistant', 'bonus-card-back', 'bonus-deck-face']);

  await chooseCategory('Market demands', 'reviewer-opens-large-demand-tiles', 'The reviewer opens all six Large MarketDemand states', ['demand-large-1', 'demand-large-2', 'demand-large-3', 'demand-large-4', 'demand-large-5', 'demand-large-6']);
  await nextPage('reviewer-opens-small-demand-tiles', 'The reviewer opens all six Small MarketDemand states', ['demand-small-1', 'demand-small-2', 'demand-small-3', 'demand-small-4', 'demand-small-5', 'demand-small-6']);

  await chooseCategory('Physical components', 'reviewer-opens-goods-and-rubies', 'The reviewer opens the goods, money, and ruby GameArt components', ['component-fabric', 'component-spice', 'component-fruit', 'component-jewelry', 'component-lira', 'component-ruby']);
  await nextPage('reviewer-opens-upgrades-and-first-powers', 'The reviewer advances through upgrades, markers, and the first Mosque powers', ['component-wheelbarrow', 'component-die', 'component-mail', 'component-bonus-deck', 'component-mosque-fabric', 'component-mosque-spice']);
  await nextPage('reviewer-opens-powers-and-public-tracks', 'The reviewer advances through the remaining powers and public tracks', ['component-mosque-fruit', 'component-mosque-jewelry', 'component-sultan-track', 'component-demand-large', 'component-demand-small', 'component-gemstone-track']);
  await nextPage('reviewer-opens-public-supplies', 'The reviewer reaches the final ruby and goods supplies', ['component-ruby-supply', 'component-goods-supply']);

  await page.getByRole('button', { name: 'Inspect Goods supply' }).click();
  await reviewer.step('reviewer-enlarges-final-component', {
    description: 'The reviewer enlarges the final goods-supply component',
    verifications: [
      { spec: 'The last review state names its stable reference and exact GameArt props', check: async () => { const dialog = page.getByRole('dialog', { name: 'Goods supply' }); await expect(dialog.getByText('Review reference · component-goods-supply')).toBeVisible(); await expect(dialog.getByText('GameArt · component=goods-supply')).toBeVisible(); } },
      { spec: 'The final logical component loads at full review size', check: async () => { const art = page.getByRole('dialog', { name: 'Goods supply' }).locator('[data-component="GameArt"]'); await expect(art).toHaveAttribute('data-art-kind', 'component'); expect(await loadedBackgrounds(art)).toEqual([true]); } }
    ]
  });

  reviewer.generateDocs();

  async function chooseCategory(name: string, id: string, description: string, expectedIds: string[]) {
    await page.getByRole('navigation', { name: 'Asset categories' }).getByRole('button', { name: new RegExp(name) }).click();
    await reviewer.step(id, { description, verifications: [
      { spec: `${name} resets to its first complete rendered-component page`, check: async () => { await expect(page.getByRole('button', { name: 'Previous asset page' })).toBeDisabled(); await expectComponentPage(page.locator('.asset-grid'), expectedIds); } }
    ] });
  }

  async function nextPage(id: string, description: string, expectedIds: string[]) {
    await page.getByRole('button', { name: 'Next asset page' }).click();
    await reviewer.step(id, { description, verifications: [
      { spec: 'The next exact rendered-state slice replaces the prior page without scrolling', check: async () => expectComponentPage(page.locator('.asset-grid'), expectedIds) }
    ] });
  }
});

async function expectComponentPage(grid: Locator, expectedIds: string[]) {
  const cards = grid.locator('[data-asset-id]');
  await expect(cards).toHaveCount(expectedIds.length);
  expect(await cards.evaluateAll((elements) => elements.map((element) => element.getAttribute('data-asset-id')))).toEqual(expectedIds);
  for (const [index, id] of expectedIds.entries()) {
    const renderer = id.startsWith('place-') ? 'LocationTile'
      : id.startsWith('mat-') ? 'PlayerTray'
      : id.startsWith('demand-') ? 'MarketDemand'
      : id.startsWith('bonus-') && !['bonus-card-back', 'bonus-deck-face'].includes(id) ? 'BonusCard'
      : 'GameArt';
    await expect(cards.nth(index)).toHaveAttribute('data-renderer', renderer);
    await expect(cards.nth(index).locator(`[data-component="${renderer}"]`).first()).toBeVisible();
  }
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
