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

const NO_SKELETON = {
  platformOwner: null,
  platformAdministrator: null,
  staff: null,
  nonStaff: null,
  customer: null,
}

function printed(
  project: Record<string, typeof ACCOUNT>,
  roles: object = {
    platformOwner: ACCOUNT,
    platformAdministrator: ACCOUNT,
    staff: ACCOUNT,
    nonStaff: null,
    customer: ACCOUNT,
  },
) {
  const base = { ...roles, project }

  return `E2E_ACCOUNTS=${JSON.stringify(base)}`
}

const TENANT_ROLES = [
  'platformOwner',
  'platformAdministrator',
  'staff',
  'nonStaff',
  'customer',
]

async function load(
  declared: ReadonlyArray<string>,
  owner: string | null = null,
  roles: ReadonlyArray<string> = TENANT_ROLES,
) {
  vi.resetModules()
  vi.stubEnv('E2E_BASE_URL', 'http://localhost:3000')
  vi.doMock('../e2e/support/project-accounts', () => ({
    PROJECT_E2E_ACCOUNT_NAMES: declared,
    PROJECT_E2E_OWNER_ACCOUNT: owner,
    PROJECT_E2E_ROLE_NAMES: roles,
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

  describe('two role maps, same code (DECISIONS.md #778)', () => {
    const STAFF_ONLY = ['administrator', 'operator']

    it('tenant map: the five roles are read, the null one is skipped', async () => {
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

    it('administrator and operator map: those two are read, in the order of the map, and the first one is the default session', async () => {
      const store = await load([], 'administrator', STAFF_ONLY)
      const accounts = store.parse(
        printed({}, { administrator: ACCOUNT, operator: ACCOUNT }),
      )

      expect(store.entries(accounts).map((each) => each.role)).toEqual([
        'administrator',
        'operator',
      ])
      expect(store.owner()).toBe('administrator')
    })

    it('a role of the map that the command printed null is skipped and the others stay', async () => {
      const store = await load([], 'administrator', STAFF_ONLY)
      const accounts = store.parse(
        printed({}, { administrator: ACCOUNT, operator: null }),
      )

      expect(store.entries(accounts).map((each) => each.role)).toEqual([
        'administrator',
      ])
    })

    it('refuses a line whose roles are not the ones the map lists, in both directions', async () => {
      const store = await load([], 'administrator', STAFF_ONLY)

      expect(() =>
        store.parse(printed({}, { administrator: ACCOUNT })),
      ).toThrow(/PROJECT_E2E_ROLE_NAMES/)
      expect(() =>
        store.parse(
          printed(
            {},
            { administrator: ACCOUNT, operator: ACCOUNT, staff: ACCOUNT },
          ),
        ),
      ).toThrow(/PROJECT_E2E_ROLE_NAMES/)
    })

    it('reserves the names of the map in use: `operator` is refused, `staff` is free', async () => {
      const refused = await load(['operator'], 'administrator', STAFF_ONLY)
      expect(() =>
        refused.parse(
          printed(
            { operator: ACCOUNT },
            { administrator: ACCOUNT, operator: ACCOUNT },
          ),
        ),
      ).toThrow(/repete um papel do kit/)

      const free = await load(['staff'], 'administrator', STAFF_ONLY)
      const accounts = free.parse(
        printed(
          { staff: ACCOUNT },
          { administrator: ACCOUNT, operator: ACCOUNT },
        ),
      )
      expect(free.entries(accounts).map((each) => each.role)).toEqual([
        'administrator',
        'operator',
        'staff',
      ])
    })
  })

  describe('a project without the multi-tenant skeleton (DECISIONS.md #778)', () => {
    it('takes the null roles and the project accounts, and signs the owner it names in as the default session', async () => {
      const store = await load(['admin', 'visitor'], 'admin')
      const accounts = store.parse(
        printed({ admin: ACCOUNT, visitor: ACCOUNT }, NO_SKELETON),
      )

      expect(store.entries(accounts).map((each) => each.role)).toEqual([
        'admin',
        'visitor',
      ])
      expect(store.owner()).toBe('admin')
      expect(store.stateOf('platformOwner')).toBe(
        'playwright/.auth/platformOwner.json',
      )
      expect(store.stateOf('staff')).toBe('playwright/.auth/staff.json')
    })

    it('refuses when no account holds the default session', async () => {
      const store = await load(['admin'])

      expect(() =>
        store.parse(printed({ admin: ACCOUNT }, NO_SKELETON)),
      ).toThrow(/PROJECT_E2E_OWNER_ACCOUNT/)
    })

    it('refuses an owner that the command did not print', async () => {
      const store = await load(['admin'], 'chief')

      expect(() =>
        store.parse(printed({ admin: ACCOUNT }, NO_SKELETON)),
      ).toThrow(/chief/)
    })

    it('keeps the platform owner as the default session when the project names none', async () => {
      const store = await load([])

      expect(store.owner()).toBe('platformOwner')
      expect(store.stateOf('platformOwner')).toBe('playwright/.auth/owner.json')
    })

    it('asks for a role the project does not have with the name of the role in the error', async () => {
      const store = await load(['admin'], 'admin')
      const accounts = store.parse(printed({ admin: ACCOUNT }, NO_SKELETON))

      expect(() => store.accountOf(accounts, 'staff')).toThrow(/staff/)
    })
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
