import { expect, test } from '@playwright/test';

test('arrival payments wait for zoom and a purchased gemstone stays off the offer', async ({
  page
}) => {
  await page.goto(
    '/dev/animations/?scenario=arrival-16&players=4&surface=shared-table&seat=6'
  );
  await page.getByRole('button', { name: 'Trigger', exact: true }).click();
  const table = page.locator('[data-motion-active]');
  await expect(table).toHaveAttribute('data-motion-active', 'true');
  const pawn = page.locator('.pawn-motion');
  await expect(pawn).toBeVisible();
  expect(
    await pawn.evaluate((node) => {
      const image = node.querySelector('img')!;
      const badge = node.querySelector('strong')!;
      return (
        image.getBoundingClientRect().height >
        badge.getBoundingClientRect().height * 2
      );
    })
  ).toBe(true);
  await page.waitForFunction(() => {
    const tile = document.querySelector('.zoom-tile');
    return (
      tile &&
      tile
        .getAnimations()
        .some((animation) => animation.playState === 'running')
    );
  });
  expect(
    await page
      .locator('.motion-token')
      .evaluateAll(
        (nodes) =>
          nodes.filter(
            (node) =>
              node
                .querySelector('img')
                ?.getAttribute('src')
                ?.endsWith('/lira.png') &&
              Number(getComputedStyle(node).opacity) > 0
          ).length
      )
  ).toBe(0);
  await expect(table).toHaveAttribute('data-motion-active', 'false');
  const now = page.locator('.zoom-tile [data-price-step="0"]');
  await expect(now).toHaveAttribute('data-price', '18');
  await expect(now.locator('[data-gemstone-ruby]')).toBeHidden();
  await page
    .locator('.zoom-tile')
    .getByRole('button', { name: 'End turn', exact: true })
    .click();
  const next = page.locator('[data-place-id="16"] [data-price-step="0"]');
  await expect(next).toHaveAttribute('data-price', '19');
  await expect(next.locator('[data-gemstone-ruby]')).toBeVisible();
});

test('dice show several different full faces before settling', async ({
  page
}) => {
  await page.goto(
    '/dev/animations/?scenario=action-9&players=4&surface=shared-table&seat=6'
  );
  await page.getByRole('button', { name: 'Trigger', exact: true }).click();
  const faces = await page.evaluate(async () => {
    const seen = new Set<string>();
    const until = performance.now() + 1200;
    while (performance.now() < until) {
      for (const die of document.querySelectorAll('.die-strip'))
        seen.add(String(new DOMMatrix(getComputedStyle(die).transform).m42));
      await new Promise(requestAnimationFrame);
    }
    return [...seen];
  });
  expect(faces.length).toBeGreaterThanOrEqual(3);
  for (const face of faces) {
    expect(Math.abs(Number(face) % 60)).toBe(0);
  }
  await expect(page.locator('[data-motion-active]')).toHaveAttribute(
    'data-motion-active',
    'false'
  );
});

for (const [place, label, selector] of [
  [6, 'Caravansary', '.card-pile'],
  [13, 'Sultan', '.sultan-offer button'],
  [14, 'Small Mosque', '.mosque-offers button'],
  [15, 'Great Mosque', '.mosque-offers button']
] as const) {
  test(`${label} components stay bright while interaction waits for zoom`, async ({
    page
  }) => {
    await page.goto(
      `/dev/animations/?scenario=arrival-${place}&players=4&surface=shared-table&seat=6`
    );
    await page.getByRole('button', { name: 'Trigger', exact: true }).click();
    const components = page.locator(`.zoom-tile ${selector}`);
    await expect(components.first()).toBeDisabled();
    for (const component of await components.all())
      await expect(component).toHaveCSS('opacity', '1');
    await expect(components.first()).toBeEnabled();
  });
}
