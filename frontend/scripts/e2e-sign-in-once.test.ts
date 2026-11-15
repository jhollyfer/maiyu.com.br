import { globSync, readFileSync } from 'node:fs'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Each account signs in once per run (DECISIONS.md #712). `signInAccountThrottle` allows 20 a
 * hour per account, and the three viewport projects (`mobile`, `tablet`, `desktop`) run the same
 * specs: a spec that signs in by itself spends the account's bucket three times per run, and two
 * runs in the same hour lock it out. The way out is the one the library recommends for tests that
 * do not share server state: authenticate once in the `setup` project, save the `storageState`
 * and reuse it (_doc-lib/playwright.md#docs/auth, https://playwright.dev/docs/auth, "Basic: shared
 * account in all tests"). The limiter in production stays as it is.
 */
const VIEWPORTS = ['mobile', 'tablet', 'desktop']

/** Where the API sign-in may be called: the setup, and the specs of the sign-in screen itself. */
const SIGN_IN_DOORS =
  /(^|\/)(auth\.setup\.ts|[^/]*(sign-in|authentication)[^/]*\.spec\.ts)$/

describe('E2E sign-in happens once per account', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.doUnmock('../e2e/support/project-accounts')
  })

  it('the three viewport projects reuse the same saved session', async () => {
    vi.resetModules()
    vi.stubEnv('E2E_BASE_URL', 'http://localhost:3000')
    vi.stubEnv('E2E_API_URL', 'http://localhost:3333')
    const { default: config } = await import('../e2e/playwright.config')
    const projects = (config.projects ?? []).filter((each) =>
      VIEWPORTS.includes(each.name ?? ''),
    )

    expect(projects.map((each) => each.name)).toEqual(VIEWPORTS)
    expect(new Set(projects.map((each) => each.use?.storageState))).toEqual(
      new Set(['playwright/.auth/owner.json']),
    )
  })

  it('the setup signs in one time per account, never twice the same role', async () => {
    vi.resetModules()
    vi.stubEnv('E2E_BASE_URL', 'http://localhost:3000')
    vi.doMock('../e2e/support/project-accounts', () => ({
      PROJECT_E2E_ACCOUNT_NAMES: ['councilorA', 'councilorB'],
    }))
    const { E2eAccountsStore } = await import('../e2e/support/accounts')
    const account = { login: 'a@example.com', password: 'secret' }
    const accounts = E2eAccountsStore.parse(
      `E2E_ACCOUNTS=${JSON.stringify({
        platformOwner: account,
        platformAdministrator: account,
        staff: account,
        nonStaff: account,
        customer: account,
        project: { councilorA: account, councilorB: account },
      })}`,
    )
    const roles = E2eAccountsStore.entries(accounts).map((each) => each.role)

    expect(roles).toHaveLength(7)
    expect(new Set(roles).size).toBe(roles.length)
  })

  it('no file of e2e/ calls the API sign-in outside the setup and the sign-in screen specs', () => {
    const callers = globSync('e2e/**/*.ts').filter(
      (file) =>
        !SIGN_IN_DOORS.test(file) &&
        readFileSync(file, 'utf8').includes('/authentication/sign-in'),
    )

    expect(callers).toEqual([])
  })
})
