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

/**
 * Where the API sign-in may be called: the setup, the specs of the sign-in screen itself and the
 * helper of the fresh account (`E2eFreshAccount`, DECISIONS.md #819): a spec that signs a NEW
 * account up and signs in once with it. A shared account never signs in outside the setup.
 */
const SIGN_IN_DOORS =
  /(^|\/)(auth\.setup\.ts|support\/fresh-account\.ts|[^/]*(sign-in|authentication)[^/]*\.spec\.ts)$/

/** The files, by path and text, that call the API sign-in and are not a door. */
function callersOutsideDoors(files: Record<string, string>): string[] {
  return Object.entries(files)
    .filter(
      ([file, text]) =>
        !SIGN_IN_DOORS.test(file) && text.includes('/authentication/sign-in'),
    )
    .map(([file]) => file)
}

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
      PROJECT_E2E_OWNER_ACCOUNT: null,
      PROJECT_E2E_ROLE_NAMES: [
        'platformOwner',
        'platformAdministrator',
        'staff',
        'nonStaff',
        'customer',
      ],
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

  it('no file of e2e/ calls the API sign-in outside the setup, the sign-in screen specs and the fresh account helper', () => {
    const files = Object.fromEntries(
      globSync('e2e/**/*.ts').map((file) => [file, readFileSync(file, 'utf8')]),
    )

    expect(callersOutsideDoors(files)).toEqual([])
  })

  it('accepts the fresh account helper and rejects a loose sign-in, in a spec or in another support file', () => {
    const call = 'await request.post(`${api}/authentication/sign-in`)'

    expect(
      callersOutsideDoors({
        'e2e/auth.setup.ts': call,
        'e2e/support/fresh-account.ts': call,
        'e2e/sign-in.spec.ts': call,
      }),
    ).toEqual([])
    expect(
      callersOutsideDoors({
        'e2e/orders.spec.ts': call,
        'e2e/support/session.ts': call,
        'e2e/support/fresh-account-copy.ts': call,
        'e2e/fresh-account.ts': call,
      }),
    ).toEqual([
      'e2e/orders.spec.ts',
      'e2e/support/session.ts',
      'e2e/support/fresh-account-copy.ts',
      'e2e/fresh-account.ts',
    ])
  })

  it('a spec that needs a session of a new account goes through E2eFreshAccount, not through a shared one', () => {
    const helper = readFileSync('e2e/support/fresh-account.ts', 'utf8')

    // The helper signs in only the account it just signed up, once, and never with a stored one.
    expect(helper.match(/\/authentication\/sign-in/g)).toHaveLength(1)
    expect(helper).not.toContain('E2eAccountsStore')
  })
})
