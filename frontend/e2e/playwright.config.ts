import { defineConfig, devices } from '@playwright/test'

import { E2eEnv } from './support/env'

/**
 * The E2E runner (`_standards/tooling.md` §7, _doc-lib/playwright.md#docs/test-configuration).
 *
 * Credential and address come from the environment and have no default here: without `E2E_BASE_URL`,
 * `E2E_API_URL`, `E2E_OWNER_EMAIL` and `E2E_OWNER_PASSWORD`, `support/env.ts` stops the run
 * saying which one is missing (`docs/ENV.md`).
 *
 * Both servers start through `webServer`; with `reuseExistingServer` outside CI,
 * the `pnpm dev` and the `node ace serve` that are already up are reused
 * (_doc-lib/playwright.md#docs/test-webserver).
 *
 * It runs from `frontend/` (`playwright test --config e2e/playwright.config.ts`):
 * the `storageState` and the servers' `cwd` are relative to this folder and to that root.
 */
// The migration baseline (`e2e/baseline/`, `architecture.md` §4) has its own config and target and no
// login setup: the kit projects never run it.
const MIGRATION_BASELINE = /baseline\//

export default defineConfig({
  // The config lives in `e2e/` (`_standards/architecture.md` §4): the specs'
  // directory is its own, and the output stays at the app root, where CI reads it.
  testDir: '.',
  outputDir: '../test-results',
  forbidOnly: Boolean(process.env.CI),
  // No retry: a flaky test is a bug with a task, not accepted intermittence
  // (_doc-lib/playwright.md#docs/test-retries).
  retries: 0,
  // The ceiling for the whole run; without it the dead job produces no report
  // (_doc-lib/playwright.md#docs/test-timeouts).
  globalTimeout: 15 * 60 * 1000,
  // The dev server compiles the route on the first visit; 5 s of assertion does not cover a cold start.
  expect: { timeout: 15_000 },
  reporter: [['html', { open: 'never', outputFolder: '../playwright-report' }]],
  use: {
    baseURL: E2eEnv.baseUrl,
    // Unset (`undefined`), Playwright launches the Chromium it downloaded.
    launchOptions: { executablePath: E2eEnv.chromiumPath },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
      teardown: 'cleanup',
    },
    {
      name: 'cleanup',
      testMatch: /.*\.teardown\.ts/,
      use: { storageState: E2eEnv.storageState },
    },
    // One project per width the panel and the storefront must serve
    // (_doc-lib/playwright.md#docs/test-projects, #docs/emulation). The same specs run in all three:
    // a layout that breaks on the phone breaks the flow, not just the picture.
    {
      name: 'mobile',
      testMatch: /.*\.spec\.ts/,
      testIgnore: MIGRATION_BASELINE,
      dependencies: ['setup'],
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 740 },
        storageState: E2eEnv.storageState,
      },
    },
    {
      name: 'tablet',
      testMatch: /.*\.spec\.ts/,
      // The phone-only charge (`touch-targets.spec.ts`).
      testIgnore: [/touch-targets\.spec\.ts/, MIGRATION_BASELINE],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        storageState: E2eEnv.storageState,
      },
    },
    {
      name: 'desktop',
      testMatch: /.*\.spec\.ts/,
      // The phone-only charge (`touch-targets.spec.ts`).
      testIgnore: [/touch-targets\.spec\.ts/, MIGRATION_BASELINE],
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        storageState: E2eEnv.storageState,
      },
    },
  ],
  webServer: [
    {
      command: 'node ace serve',
      cwd: '../../backend',
      // The boot validates `start/env.ts`, and CI has no `.env`. Playwright
      // merges this `env` into `process.env`, so the rest comes from the step.
      env: { NODE_ENV: 'development' },
      url: 'http://localhost:3333/health-check',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      command: 'node .output/server/index.mjs',
      // The default `cwd` is the config folder (`e2e/`); `.output/` lives at the app root.
      cwd: '..',
      // Nitro listens on the environment's `PORT`, and in the E2E job it is 3333,
      // the backend's port: without this the second server falls into EADDRINUSE.
      env: { PORT: '3000' },
      url: 'http://localhost:3000/health-check',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
