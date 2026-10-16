import { expect, test } from '@playwright/test';

for (const surface of ['personal-screens', 'shared-table']) {
  test(`${surface}: payout legends use bundled glyphs rather than system fonts`, async ({ page }) => {
    await page.goto(`/dev/animations/?scenario=action-9&players=5&surface=${surface}`);
    await expect(page.locator('.mat')).toHaveCount(5);
    await page.evaluate(() => document.fonts.ready);

    // Checking rendered fonts catches missing glyphs even when font loading itself
    // succeeds: CSS font-family and document.fonts.check cannot detect fallback.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument');
    for (const part of ['.condition b', '.payout > span']) {
      const { nodeId } = await cdp.send('DOM.querySelector', {
        nodeId: root.nodeId,
        selector: `.board [data-place-id="9"] .dice-payoffs ${part}`
      });
      expect(nodeId).not.toBe(0);
      const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
      expect(fonts.some((font) => font.familyName === 'Noto Sans Math')).toBe(true);
      expect(fonts.filter((font) => !font.isCustomFont)).toEqual([]);
    }
    await cdp.detach();
  });
}
