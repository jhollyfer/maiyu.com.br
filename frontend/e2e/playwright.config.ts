import { defineConfig, devices } from '@playwright/test'

import { E2eEnv } from './support/env'

/**
 * The E2E runner (`_standards/tooling.md` §7, _doc-lib/playwright.md#docs/test-configuration).
 *
 * The address comes from the environment and has no default here: without `E2E_BASE_URL` (and, with a
 * backend, `E2E_API_URL`), `support/env.ts` stops the run saying which one is missing (`docs/ENV.md`).
 * No password is an environment key: `auth.setup.ts` creates the account of each role for the run
 * (`node ace e2e:accounts`, random password, development and test only; DECISIONS.md #443).
 *
 * Frontend-only project: without `E2E_API_URL` the API server, the `setup`/`cleanup` projects and
 * the owner's `storageState` are left out, and only the app is started (`E2eEnv.withBackend`).
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

/** Owner's session and the `setup` it depends on exist only with a backend. */
const SESSION = E2eEnv.withBackend && { storageState: E2eEnv.storageState }
const AFTER_SETUP = E2eEnv.onlyWithBackend(['setup'])
// The `painel` block's specs open a session against the API: without a backend they are left out,
// like the setup, and the run covers only the public pages.
const BACKEND_ONLY = [/session\.spec\.ts/, /panel-shell\.spec\.ts/].filter(
  () => !E2eEnv.withBackend,
)

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
    ...E2eEnv.onlyWithBackend([
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
    ]),
    // One project per width the panel and the storefront must serve
    // (_doc-lib/playwright.md#docs/test-projects, #docs/emulation). The same specs run in all three:
    // a layout that breaks on the phone breaks the flow, not just the picture.
    {
      name: 'mobile',
      testMatch: /.*\.spec\.ts/,
      testIgnore: [MIGRATION_BASELINE, ...BACKEND_ONLY],
      dependencies: AFTER_SETUP,
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 360, height: 740 },
        ...SESSION,
      },
    },
    {
      name: 'tablet',
      testMatch: /.*\.spec\.ts/,
      // The phone-only charge (`touch-targets.spec.ts`).
      testIgnore: [
        /touch-targets\.spec\.ts/,
        MIGRATION_BASELINE,
        ...BACKEND_ONLY,
      ],
      dependencies: AFTER_SETUP,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        ...SESSION,
      },
    },
    {
      name: 'desktop',
      testMatch: /.*\.spec\.ts/,
      // The phone-only charge (`touch-targets.spec.ts`).
      testIgnore: [
        /touch-targets\.spec\.ts/,
        MIGRATION_BASELINE,
        ...BACKEND_ONLY,
      ],
      dependencies: AFTER_SETUP,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
        ...SESSION,
      },
    },
  ],
  webServer: [
    ...E2eEnv.onlyWithBackend([
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
    ]),
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
