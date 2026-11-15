import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { KitNameCollision } from '../e2e/support/accounts'

/**
 * The accounts the E2E setup reads from `e2e:accounts` (DECISIONS.md #611): the names of the
 * project's domain accounts cannot repeat a role of the kit, and the printed ones must be the
 * declared ones. `playwright/.auth/<name>.json` is one file per name, so a repeated name would have
 * the setup overwrite the session of another account (`platformOwner` is the one every project of
 * `playwright.config.ts` signs in with).
 */
const ACCOUNT = { login: 'a@example.com', password: 'secret' }

function printed(project: Record<string, typeof ACCOUNT>) {
  const base = {
    platformOwner: ACCOUNT,
    platformAdministrator: ACCOUNT,
    staff: ACCOUNT,
    nonStaff: null,
    customer: ACCOUNT,
    project,
  }

  return `E2E_ACCOUNTS=${JSON.stringify(base)}`
}

async function load(declared: ReadonlyArray<string>) {
  vi.resetModules()
  vi.stubEnv('E2E_BASE_URL', 'http://localhost:3000')
  vi.doMock('../e2e/support/project-accounts', () => ({
    PROJECT_E2E_ACCOUNT_NAMES: declared,
  }))
  const { E2eAccountsStore } = await import('../e2e/support/accounts')

  return E2eAccountsStore
}

describe('E2eAccountsStore.parse', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.doUnmock('../e2e/support/project-accounts')
  })

  it('takes the project accounts it declared, after the kit ones', async () => {
    const store = await load(['councilorA'])
    const accounts = store.parse(printed({ councilorA: ACCOUNT }))

    expect(store.entries(accounts).map((each) => each.role)).toEqual([
      'platformOwner',
      'platformAdministrator',
      'staff',
      'customer',
      'councilorA',
    ])
  })

  it('refuses a printed list that differs from the declared one', async () => {
    const store = await load(['councilorA'])

    expect(() => store.parse(printed({ councilorB: ACCOUNT }))).toThrow(
      /difere das contas do projeto/,
    )
    expect(() => store.parse(printed({}))).toThrow(
      /difere das contas do projeto/,
    )
  })

  it.each([
    'platformOwner',
    'platformAdministrator',
    'staff',
    'nonStaff',
    'customer',
    'project',
    'accounts',
  ])('refuses a project account named %s, a role of the kit', async (name) => {
    const store = await load([name])

    expect(() => store.parse(printed({ [name]: ACCOUNT }))).toThrow(
      /repete um papel do kit/,
    )
  })

  it('refuses a name declared twice', async () => {
    const store = await load(['councilorA', 'councilorA'])

    expect(() => store.parse(printed({ councilorA: ACCOUNT }))).toThrow(
      /repete/,
    )
  })

  it('refuses a printed project account that repeats a role of the kit', async () => {
    const store = await load([])

    expect(() => store.parse(printed({ staff: ACCOUNT }))).toThrow(
      /repete um papel do kit/,
    )
  })

  it('types: a project name equal to a role of the kit is a compile error', () => {
    // @ts-expect-error `staff` is a role of the kit: the collision type is not empty
    const bad: Record<KitNameCollision<'staff' | 'councilorA'>, never> = {}
    const good: Record<KitNameCollision<'councilorA'>, never> = {}

    expect(bad).toEqual({})
    expect(good).toEqual({})
  })
})
