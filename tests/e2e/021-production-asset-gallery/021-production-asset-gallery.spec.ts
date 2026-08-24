import { expect, test, type Locator } from '@playwright/test';
import { ScenarioJournal, TestStepHelper } from '../helpers/test-step-helper';

test('the production gallery renders the same logical components used during play', async ({ page }, testInfo) => {
  const journal = new ScenarioJournal();
  const reviewer = new TestStepHelper(page, testInfo, journal, 'The art reviewer');
  let boardMerchantGlow = '';
  reviewer.setMetadata(
    'Reviewing every Istanbul production component',
    'The reviewer opens the dedicated gallery without creating a game and walks every page of live locations, player trays, playing pieces, Bonus cards, Market demands, and physical components. Locations are the same rectangular, titled, rounded LocationTile instances used on the board; their status apparatus and occupants come from a deterministic game projection. Trays use PlayerTray, rules cards use BonusCard, and demands use MarketDemand. Stable review IDs, renderer names, representative props, loaded production images, responsive pagination, and the no-scroll/no-clipping contract are checked after every input.'
  );

  await page.goto('/gallery/');
  await reviewer.step('reviewer-opens-gallery', {
    description: 'The reviewer opens the complete production gallery',
    verifications: [
      { spec: 'The gallery declares 83 rendered review states backed by the complete 71-asset manifest', check: async () => { const gallery = page.locator('[data-e2e-layout]'); await expect(gallery).toHaveAttribute('data-gallery-rendered-count', '83'); await expect(gallery).toHaveAttribute('data-gallery-raw-count', '71'); await expect(gallery).toHaveAttribute('data-gallery-composite-count', '12'); } },
      { spec: 'All six logical-component category totals are immediately visible', check: async () => { const nav = page.getByRole('navigation', { name: 'Asset categories' }); for (const [name, count] of [['Locations', 16], ['Player trays', 5], ['Playing pieces', 20], ['Bonus cards', 12], ['Market demands', 12], ['Physical components', 18]] as const) await expect(nav.getByRole('button', { name: new RegExp(`${name}.*${count}`) })).toBeVisible(); } },
      { spec: 'The first six numbered locations are real LocationTile components with public state', check: async () => { await expectComponentPage(page.locator('.asset-grid'), ['place-01', 'place-02', 'place-03', 'place-04', 'place-05', 'place-06']); await expect(page.locator('[data-asset-id="place-05"] [data-testid="place-state-5"]')).toHaveAttribute('data-state-summary', /Exposed mail/); await expect(page.locator('[data-asset-id="place-06"] .card-pile')).toHaveCount(2); } },
      { spec: 'Board merchants use the shared glowing PlayingPiece renderer', check: async () => { const merchant = page.locator('[data-asset-id="place-01"] [data-component="PlayingPiece"][data-piece-kind="merchant"]'); await expect(merchant).toHaveAttribute('data-piece-glow', 'true'); boardMerchantGlow = await merchant.evaluate((piece) => getComputedStyle(piece).filter); expect(boardMerchantGlow).toContain('drop-shadow'); } }
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

  await nextPage('reviewer-opens-board-squares-7-12', 'The reviewer advances to board squares seven through twelve', ['place-07', 'place-08', 'place-09', 'place-10', 'place-11', 'place-12'], async () => {
    const tea = page.locator('[data-asset-id="place-09"] [data-component="TeaHousePayoffs"]');
    await expect(tea).toBeVisible();
    await expect(tea.locator('[data-outcome="success"]')).toContainText('≥ wager');
    await expect(tea.locator('[data-outcome="failure"]')).toContainText('×2');
  });
  await nextPage('reviewer-opens-board-squares-13-16', 'The reviewer advances to the final four board squares', ['place-13', 'place-14', 'place-15', 'place-16'], async () => {
    const sultan = page.locator('[data-asset-id="place-13"] [data-component="SultanOffer"]');
    await expect(sultan.locator('[data-sultan-good]')).toHaveCount(5);
    expect(await sultan.locator('[data-sultan-good]').evaluateAll((slots) => slots.map((slot) => slot.getAttribute('data-required')))).toEqual(['1', '1', '1', '2', '1']);
    await expect(sultan.locator('[data-sultan-good] b')).toHaveText('2');
    await expect(sultan.locator('[data-sultan-next="fabric"]')).toBeVisible();
    const gemstone = page.locator('[data-asset-id="place-16"] [data-component="GemstoneOffer"]');
    expect(await gemstone.locator('[data-price]').evaluateAll((slots) => slots.map((slot) => slot.getAttribute('data-price')))).toEqual(['18', '19', '20']);
  });

  await chooseCategory('Player trays', 'reviewer-opens-player-mats', 'The reviewer opens five live PlayerTray states', ['mat-ruby', 'mat-saffron', 'mat-teal', 'mat-indigo', 'mat-plum'], async () => {
    const erenGoods = page.locator('[data-asset-id="mat-plum"] .good-slot.filled [data-component="GameArt"]');
    await expect(erenGoods).toHaveCount(17);
    expect(await erenGoods.evaluateAll((goods) => goods.map((good) => {
      const style = getComputedStyle(good);
      return { backgroundSize: style.backgroundSize, filter: style.filter, resolution: good.getAttribute('data-art-resolution') };
    }))).toEqual(Array.from({ length: 17 }, () => ({ backgroundSize: 'contain', filter: 'none', resolution: 'compact' })));
    const erenRubies = page.locator('[data-asset-id="mat-plum"] .compact-rubies [data-component="GameArt"]');
    await expect(erenRubies).toHaveCount(5);
    expect(await erenRubies.evaluateAll((rubies) => rubies.map((ruby) => {
      const style = getComputedStyle(ruby);
      return { backgroundSize: style.backgroundSize, filter: style.filter, resolution: ruby.getAttribute('data-art-resolution') };
    }))).toEqual(Array.from({ length: 5 }, () => ({ backgroundSize: 'contain', filter: 'none', resolution: 'compact' })));
    const erenTray = page.locator('[data-asset-id="mat-plum"] [data-component="PlayerTray"]');
    const merchantPiece = erenTray.locator('.compact-merchant [data-component="PlayingPiece"][data-piece-kind="merchant"]');
    await expect(merchantPiece).toHaveAttribute('data-piece-glow', 'true');
    expect(await merchantPiece.evaluate((piece) => getComputedStyle(piece).filter)).toBe(boardMerchantGlow);
    const merchant = merchantPiece.locator('[data-piece="merchant"]');
    await expect(merchant).toBeVisible();
    const [trayBox, merchantBox] = await Promise.all([erenTray.boundingBox(), merchant.boundingBox()]);
    expect(merchantBox!.width / trayBox!.width).toBeCloseTo(.1, 2);
    expect(merchantBox!.height / trayBox!.height).toBeCloseTo(.1, 2);
  });

  await chooseCategory('Playing pieces', 'reviewer-opens-player-pieces', 'The reviewer opens the first GameArt playing-piece page', ['merchant-ruby', 'merchant-saffron', 'merchant-teal', 'merchant-indigo', 'merchant-plum', 'assistant-ruby']);
  await nextPage('reviewer-opens-assistants', 'The reviewer advances through assistants and family members', ['assistant-saffron', 'assistant-teal', 'assistant-indigo', 'assistant-plum', 'family-ruby', 'family-saffron']);
  await nextPage('reviewer-opens-families-and-neutrals', 'The reviewer advances through family and neutral figures', ['family-teal', 'family-indigo', 'family-plum', 'neutral-merchant', 'governor', 'smuggler']);
  await nextPage('reviewer-opens-special-markers', 'The reviewer reaches the first-player and dice markers', ['first-player', 'dice-pair']);

  await chooseCategory('Bonus cards', 'reviewer-opens-first-bonus-faces', 'The reviewer opens the first six Bonus-card faces', ['bonus-gain-good', 'bonus-gain-lira', 'bonus-repeat-sultan', 'bonus-repeat-post', 'bonus-repeat-gemstone', 'bonus-return-family']);
  await nextPage('reviewer-opens-remaining-bonus-art', 'The reviewer reaches every remaining face, back, and deck image', ['bonus-stay', 'bonus-long-move', 'bonus-wild-small-market', 'bonus-return-assistant', 'bonus-card-back', 'bonus-deck-face']);

  await chooseCategory('Market demands', 'reviewer-opens-large-demand-tiles', 'The reviewer opens all six Large MarketDemand states', ['demand-large-1', 'demand-large-2', 'demand-large-3', 'demand-large-4', 'demand-large-5', 'demand-large-6'], async () => {
    const demands = page.locator('[data-component="MarketDemand"]');
    await expect(demands).toHaveCount(6);
    await expect(demands.first()).toHaveAttribute('data-good-layout', 'circular-overlay');
    await expect(demands.first().locator('[data-demand-slot]')).toHaveCount(5);
    await expect(demands.first().locator('[data-demand-slot="1"]')).toHaveCSS('border-radius', /50%/);
    await expectDemandGeometry(demands);
  });
  await nextPage('reviewer-opens-small-demand-tiles', 'The reviewer opens all six Small MarketDemand states', ['demand-small-1', 'demand-small-2', 'demand-small-3', 'demand-small-4', 'demand-small-5', 'demand-small-6'], async () => {
    const demands = page.locator('[data-component="MarketDemand"]');
    await expect(demands).toHaveCount(6);
    await expect(demands.first().locator('[data-demand-slot]')).toHaveCount(5);
    await expectDemandGeometry(demands);
  });

  await chooseCategory('Physical components', 'reviewer-opens-goods-and-rubies', 'The reviewer opens the goods, money, and ruby GameArt components', ['component-fabric', 'component-spice', 'component-fruit', 'component-jewelry', 'component-lira', 'component-ruby'], async () => {
    await expectTransparentComponentArt(page.locator('.asset-grid'), 6);
  });
  await nextPage('reviewer-opens-upgrades-and-first-powers', 'The reviewer advances through upgrades, markers, and the first Mosque powers', ['component-wheelbarrow', 'component-die', 'component-mail', 'component-bonus-deck', 'component-mosque-fabric', 'component-mosque-spice'], async () => {
    await expectTransparentComponentArt(page.locator('.asset-grid'), 5);
    const deck = page.locator('[data-asset-id="component-bonus-deck"] [data-component="BonusCard"]');
    await expect(deck).toHaveAttribute('data-card-side', 'card-deck');
    const box = await deck.boundingBox();
    expect(box!.height / box!.width).toBeCloseTo(2, 1);
  });
  await nextPage('reviewer-opens-powers-and-public-supplies', 'The reviewer advances through the remaining powers, demand bases, and public supplies', ['component-mosque-fruit', 'component-mosque-jewelry', 'component-demand-large', 'component-demand-small', 'component-ruby-supply', 'component-goods-supply'], async () => {
    await expectTransparentComponentArt(page.locator('.asset-grid'), 6);
  });

  await page.getByRole('button', { name: 'Inspect Goods supply' }).click();
  await reviewer.step('reviewer-enlarges-final-component', {
    description: 'The reviewer enlarges the final goods-supply component',
    verifications: [
      { spec: 'The last review state names its stable reference and exact GameArt props', check: async () => { const dialog = page.getByRole('dialog', { name: 'Goods supply' }); await expect(dialog.getByText('Review reference · component-goods-supply')).toBeVisible(); await expect(dialog.getByText('GameArt · component=goods-supply')).toBeVisible(); } },
      { spec: 'The final logical component loads at full review size', check: async () => { const art = page.getByRole('dialog', { name: 'Goods supply' }).locator('[data-component="GameArt"]'); await expect(art).toHaveAttribute('data-art-kind', 'component'); expect(await loadedBackgrounds(art)).toEqual([true]); } }
    ]
  });

  reviewer.generateDocs();

  async function chooseCategory(name: string, id: string, description: string, expectedIds: string[], check?: () => Promise<void>) {
    await page.getByRole('navigation', { name: 'Asset categories' }).getByRole('button', { name: new RegExp(name) }).click();
    await reviewer.step(id, { description, verifications: [
      { spec: `${name} resets to its first complete rendered-component page`, check: async () => { await expect(page.getByRole('button', { name: 'Previous asset page' })).toBeDisabled(); await expectComponentPage(page.locator('.asset-grid'), expectedIds); } },
      ...(check ? [{ spec: 'The page satisfies its shared-component geometry and rendering contract', check }] : [])
    ] });
  }

  async function nextPage(id: string, description: string, expectedIds: string[], check?: () => Promise<void>) {
    await page.getByRole('button', { name: 'Next asset page' }).click();
    await reviewer.step(id, { description, verifications: [
      { spec: 'The next exact rendered-state slice replaces the prior page without scrolling', check: async () => expectComponentPage(page.locator('.asset-grid'), expectedIds) },
      ...(check ? [{ spec: 'The page satisfies its shared-component geometry and rendering contract', check }] : [])
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
      : id.startsWith('bonus-') ? 'BonusCardShowcase'
      : id === 'component-bonus-deck' ? 'BonusCard'
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

async function expectTransparentComponentArt(grid: Locator, expectedCount: number) {
  const components = grid.locator('[data-art-kind="component"]');
  await expect(components).toHaveCount(expectedCount);
  const alphaChecks = await components.evaluateAll(async (elements) => Promise.all(elements.map(async (element) => {
    const match = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/);
    if (!match) return { png: false, transparentCorners: false, visible: false };
    const image = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error(`Could not load ${match[1]}`));
    });
    image.src = match[1];
    if (!image.complete) await loaded;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const corners = [[0, 0], [canvas.width - 1, 0], [0, canvas.height - 1], [canvas.width - 1, canvas.height - 1]];
    const transparentCorners = corners.every(([x, y]) => context.getImageData(x, y, 1, 1).data[3] === 0);
    const step = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / 16));
    let visible = false;
    for (let y = 0; y < canvas.height && !visible; y += step) {
      for (let x = 0; x < canvas.width; x += step) {
        if (context.getImageData(x, y, 1, 1).data[3] > 200) { visible = true; break; }
      }
    }
    return { png: new URL(image.src).pathname.endsWith('.png'), transparentCorners, visible };
  })));
  expect(alphaChecks).toEqual(Array.from({ length: expectedCount }, () => ({ png: true, transparentCorners: true, visible: true })));
}

async function expectDemandGeometry(demands: Locator) {
  for (const demand of await demands.all()) {
    const geometry = await demand.evaluate((board) => {
      const boardBox = board.getBoundingClientRect();
      const style = getComputedStyle(board);
      const borderLeft = Number.parseFloat(style.borderLeftWidth);
      const borderTop = Number.parseFloat(style.borderTopWidth);
      const contentWidth = boardBox.width - borderLeft - Number.parseFloat(style.borderRightWidth);
      const contentHeight = boardBox.height - borderTop - Number.parseFloat(style.borderBottomWidth);
      return { market: board.getAttribute('data-market'), slots: Array.from(board.querySelectorAll<HTMLElement>('[data-demand-slot]')).map((slot) => {
        const slotBox = slot.getBoundingClientRect();
        return {
          diameter: slotBox.width / contentWidth,
          center: [
            (slotBox.left + slotBox.width / 2 - boardBox.left - borderLeft) / contentWidth,
            (slotBox.top + slotBox.height / 2 - boardBox.top - borderTop) / contentHeight
          ]
        };
      }) };
    });
    const expectedCenters = geometry.market === 'large'
      ? [[.501, .2508], [.2719, .3819], [.726, .3845], [.3372, .6411], [.6442, .6462]]
      : [[.498, .2393], [.29, .395], [.705, .394], [.3628, .6387], [.6341, .6382]];
    expect(geometry.slots).toHaveLength(5);
    for (const [index, slot] of geometry.slots.entries()) {
      expect(slot.diameter).toBeCloseTo(.202, 2);
      expect(slot.center[0]).toBeCloseTo(expectedCenters[index][0], 2);
      expect(slot.center[1]).toBeCloseTo(expectedCenters[index][1], 2);
    }
  }
}
