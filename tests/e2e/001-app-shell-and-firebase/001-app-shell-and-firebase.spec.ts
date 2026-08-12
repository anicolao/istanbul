import { expect, test } from '@playwright/test';
import { TestStepHelper } from '../helpers/test-step-helper';

test('application shell reaches Firebase and renders deterministically', async ({ page }, testInfo) => {
  const steps = new TestStepHelper(page, testInfo);
  steps.setMetadata(
    'Application shell and Firebase readiness',
    'The static Istanbul client loads and reaches the local Firebase emulators.'
  );

  await page.goto('/');
  await steps.step('firebase-ready', {
    description: 'The bazaar is ready for its first merchants',
    verifications: [
      {
        spec: 'The page exposes the stable Istanbul title',
        check: async () =>
          expect(page).toHaveTitle('Istanbul — Race through the bazaar')
      },
      {
        spec: 'The landing page introduces the four-step route to a ruby',
        check: async () => {
          await expect(page.getByRole('heading', { level: 1 })).toHaveText(
            'Build your route through the bazaar.'
          );
          await expect(page.getByRole('listitem')).toHaveCount(4);
          await expect(page.getByRole('heading', { name: 'Four steps to a ruby' })).toBeVisible();
        }
      },
      {
        spec: 'The client reaches the Firebase emulators through anonymous authentication',
        check: async () =>
          expect(page.getByRole('status')).toHaveText('Firebase emulator ready')
      },
      {
        spec: 'The deterministic short build marker is visible',
        check: async () =>
          expect(page.getByTestId('build-marker')).toHaveText('Build e2e-tes')
      }
    ]
  });

  steps.generateDocs();
});
