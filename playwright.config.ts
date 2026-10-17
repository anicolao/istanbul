import { defineConfig } from '@playwright/test';

const port = Number(process.env.ISTANBUL_E2E_PORT ?? 5189);
// Optional local proxy keeps invitation screenshots stable when another app owns 5189.
const proxy = process.env.ISTANBUL_E2E_PROXY;
const browserPort = proxy ? 5189 : port;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  forbidOnly: true,
  retries: 0,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: `http://127.0.0.1:${browserPort}`,
    trace: process.env.CI ? 'retain-on-failure' : 'off',
    serviceWorkers: 'block',
    deviceScaleFactor: 1,
    timezoneId: 'America/Toronto',
    locale: 'en-CA',
    actionTimeout: 15_000,
    launchOptions: {
      ...(proxy ? { proxy: { server: proxy, bypass: '<-loopback>' } } : {}),
      args: [
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
        '--disable-lcd-text',
        '--force-device-scale-factor=1',
        '--disable-gpu',
        '--use-gl=swiftshader'
      ]
    }
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/screenshots/{arg}{ext}',
  projects: [
    {
      name: 'webkit-phone',
      testMatch: '**/035-bonus-card-rendering/*.spec.ts',
      use: {
        browserName: 'webkit', viewport: { width: 393, height: 852 },
        isMobile: true, hasTouch: true,
        // WebKit previews contain no invitation URL; use the server directly.
        baseURL: `http://127.0.0.1:${port}`,
        launchOptions: { args: [] }
      }
    },
    {
      name: 'webkit-desktop',
      testMatch: ['**/035-bonus-card-rendering/*.spec.ts', '**/036-occupied-table-edges/*.spec.ts'],
      use: {
        browserName: 'webkit', viewport: { width: 1280, height: 1000 },
        // WebKit previews contain no invitation URL; use the server directly.
        baseURL: `http://127.0.0.1:${port}`,
        launchOptions: { args: [] }
      }
    },
    {
      name: 'phone',
      use: { browserName: 'chromium', viewport: { width: 393, height: 852 } }
    },
    {
      name: 'desktop',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 1000 } }
    },
    {
      name: 'mobile-landscape',
      testMatch: '**/014-responsive-accessible-complete-game/*.spec.ts',
      use: { browserName: 'chromium', viewport: { width: 852, height: 393 } }
    },
    {
      name: 'tablet',
      testMatch: '**/014-responsive-accessible-complete-game/*.spec.ts',
      use: { browserName: 'chromium', viewport: { width: 820, height: 1180 } }
    },
    {
      name: 'tabletop-wide',
      testMatch: '**/013-shared-table-and-private-phones/*.spec.ts',
      use: { browserName: 'chromium', viewport: { width: 3840, height: 2160 } }
    }
  ],
  webServer: {
    command: `bun run dev:e2e --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    env: {
      VITE_FIREBASE_API_KEY: 'e2e-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'istanbul-e2e.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'istanbul-e2e',
      VITE_FIREBASE_STORAGE_BUCKET: 'istanbul-e2e.firebasestorage.app',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      VITE_FIREBASE_APP_ID: '1:123456789:web:e2e',
      VITE_USE_FIREBASE_EMULATORS: 'true',
      VITE_FIRESTORE_EMULATOR_HOST: '127.0.0.1',
      VITE_FIRESTORE_EMULATOR_PORT: '8190',
      VITE_FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1',
      VITE_FIREBASE_AUTH_EMULATOR_PORT: '9204',
      VITE_GIT_HASH: 'e2e-test-commit'
    }
  },
  timeout: 120_000,
  expect: {
    timeout: 15_000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      animations: 'disabled',
      caret: 'hide',
      fullPage: true,
      scale: 'css'
    }
  }
});
