import {
  HttpContextFactory,
  RequestFactory,
} from '@adonisjs/core/factories/http'
import i18nManager from '@adonisjs/i18n/services/main'
import { test } from '@japa/runner'

import {
  ACTIVE_STATUS,
  BASE_LOCALE,
  PLATFORM_ROLE,
  type Actor,
} from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import { AllPublicTenantFilter } from '#core/all-public-tenant-filter'
import { PublicTenantFilter } from '#core/public-tenant-filter'
import { TenantScope } from '#core/tenant-scope'
import HTTPException from '#exceptions/http.exception'
import PublicTenantMiddleware from '#middleware/public-tenant.middleware'
import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { ROLE_FIXTURES, TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

const base = { type: TENANT_TYPE_FIXTURE, parentId: null, cityId: 'c1' }

function repository() {
  return new TenantMemoryRepository(new SessionMemoryRepository())
    .addCity({ id: 'c1', name: 'Tabatinga', slug: 'tabatinga' })
    .addTenant({ ...base, id: 't1', name: 'Ana', slug: 'ana' })
    .addTenant({ ...base, id: 't2', name: 'Bia', slug: 'bia' })
    .addCity({ id: 'c2', name: 'Atalaia do Norte', slug: 'atalaia-do-norte' })
    .addTenant({ ...base, id: 't4', name: 'Bia 2', slug: 'bia', cityId: 'c2' })
    .addTenant({
      ...base,
      id: 't3',
      name: 'Off',
      slug: 'off',
      status: ACTIVE_STATUS.INACTIVE,
    })
}

async function run(
  params: Record<string, string>,
  singleSlug: string | null,
  options: Parameters<PublicTenantMiddleware['handle']>[2] = {},
  tenant: Actor['tenant'] = null,
  filter: PublicTenantFilter = new AllPublicTenantFilter(),
  query: Record<string, string | ReadonlyArray<string>> = {},
) {
  const middleware = await makeWithMemory(PublicTenantMiddleware, [
    [TenantRepository, repository()],
    [TenantConfig, new TenantConfig(singleSlug)],
    [PublicTenantFilter, filter],
  ])
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query))
    for (const each of [value].flat()) search.append(key, each)
  const request = new RequestFactory()
    .merge({ url: `/storefront/tenants?${search.toString()}` })
    .create()
  const context = new HttpContextFactory().merge({ request }).create()
  context.params = params
  // `silent-auth` is not in a unit test: nobody is signed in (the e2e spec signs in for real).
  Object.assign(context, { auth: { user: undefined } })
  context.i18n = i18nManager.locale(BASE_LOCALE)
  context.actor = {
    id: 'customer-1',
    email: 'cliente@mail.com',
    phone: null,
    platformRole: PLATFORM_ROLE.USER,
    tenant,
    avatarId: null,
  }
  context.tenantScope = TenantScope.ofAccess(context.actor)

  try {
    await middleware.handle(context, async () => {}, options)
  } catch (error) {
    if (error instanceof HTTPException) return { status: error.status }
    throw error
  }

  return { status: 200, scope: context.tenantScope }
}

test.group('middleware > public-tenant (unit)', () => {
  test('without the variable, the city segment still resolves', async ({
    assert,
  }) => {
    const result = await run({ city: 'tabatinga' }, null)

    assert.equal(result.status, 200)
    assert.sameMembers([...(result.scope?.tenantIds() ?? [])], ['t1', 't2'])
  })

  test('without the variable, a route with no segment is 404', async ({
    assert,
  }) => {
    assert.equal((await run({}, null)).status, 404)
  })

  test('single mode resolves the tenant with no segment, read-only', async ({
    assert,
  }) => {
    const result = await run({}, 'ana')

    assert.equal(result.status, 200)
    assert.deepEqual([...(result.scope?.tenantIds() ?? [])], ['t1'])
    assert.isTrue(result.scope?.canRead('t1'))
    assert.isFalse(result.scope?.canRead('t2'))
    assert.isFalse(result.scope?.canWrite('t1'))
  })

  test('single mode ignores segments the route happens to carry', async ({
    assert,
  }) => {
    const result = await run({ city: 'nowhere' }, 'ana')

    assert.deepEqual([...(result.scope?.tenantIds() ?? [])], ['t1'])
  })

  test('single mode answers 404 for a tenant that does not exist or is inactive', async ({
    assert,
  }) => {
    assert.equal((await run({}, 'ghost')).status, 404)
    assert.equal((await run({}, 'off')).status, 404)
  })

  test('single mode answers 404 when two cities share the slug: the address is ambiguous', async ({
    assert,
  }) => {
    assert.equal((await run({}, 'bia')).status, 404)
  })

  // DECISIONS.md #397: the route declares what it writes; nothing else changes.
  test('a declared public write creates rows in the URL tenant only, and reads no customer row', async ({
    assert,
  }) => {
    const result = await run({ city: 'tabatinga', tenant: 'ana' }, null, {
      access: 'insert',
    })

    assert.deepEqual(result.scope?.customerTarget(), {
      tenantId: 't1',
      customerId: null,
    })
    assert.isFalse(result.scope?.canWrite('t1'))
    assert.isFalse(result.scope?.canReadOwned('t1', 'customer-1'))

    const city = await run({ city: 'tabatinga' }, null, { access: 'insert' })
    assert.isNull(city.scope?.customerTarget())
  })

  test('the customer access makes the account the owner of its new rows in the URL tenant', async ({
    assert,
  }) => {
    const result = await run({ city: 'tabatinga', tenant: 'ana' }, null, {
      access: 'customer',
    })

    assert.deepEqual(result.scope?.customerTarget(), {
      tenantId: 't1',
      customerId: 'customer-1',
    })
    assert.isFalse(result.scope?.canRead('t1'))
    assert.equal(
      (
        await run({ city: 'tabatinga', tenant: 'ghost' }, null, {
          access: 'customer',
        })
      ).status,
      404,
    )
  })

  // Finding 5: an account with a membership is never a customer, not even in another store.
  test('the customer access refuses an account that has a membership', async ({
    assert,
  }) => {
    const result = await run(
      { city: 'tabatinga', tenant: 'ana' },
      null,
      { access: 'customer' },
      { id: 't2', cityId: 'c1', role: ROLE_FIXTURES.staff, childIds: [] },
    )

    assert.equal(result.status, 403)
  })

  // DECISIONS.md #812: the project releases a tenant for the public (e.g. a complete profile).
  class OnlyT1 extends PublicTenantFilter {
    released(ids: ReadonlyArray<string>) {
      return Promise.resolve(ids.filter((id) => id === 't1'))
    }
  }
  const byUrl = { city: 'tabatinga', tenant: 'bia' }

  test('the project filter keeps an unreleased tenant out of the city-wide read of a visitor', async ({
    assert,
  }) => {
    const result = await run(
      { city: 'tabatinga' },
      null,
      {},
      null,
      new OnlyT1(),
    )

    assert.equal(result.status, 200)
    assert.deepEqual([...(result.scope?.tenantIds() ?? [])], ['t1'])
  })

  test('the URL of an unreleased tenant is 404 for a visitor', async ({
    assert,
  }) => {
    assert.equal((await run(byUrl, null, {}, null, new OnlyT1())).status, 404)
    assert.equal((await run(byUrl, null)).status, 200)
  })
})

// DECISIONS.md #823: the global storefront, no segment, `?city=` the only filter.
test.group('middleware > public-tenant (unit) > global storefront', () => {
  const GLOBAL = { scope: 'global' } as const
  const ALL = new AllPublicTenantFilter()
  const globalRun = (query: Record<string, string | ReadonlyArray<string>>) =>
    run({}, null, GLOBAL, null, ALL, query)

  test('with no city it reads every active tenant of every city, and no inactive one', async ({
    assert,
  }) => {
    const result = await globalRun({})

    assert.equal(result.status, 200)
    assert.sameMembers(
      [...(result.scope?.tenantIds() ?? [])],
      ['t1', 't2', 't4'],
    )
    assert.isFalse(result.scope?.canWrite('t1'))
  })

  test('`?city=` narrows to that city; an empty value is none', async ({
    assert,
  }) => {
    const here = await globalRun({ city: 'tabatinga' })
    const there = await globalRun({ city: 'atalaia-do-norte' })
    const empty = await globalRun({ city: '' })

    assert.sameMembers([...(here.scope?.tenantIds() ?? [])], ['t1', 't2'])
    assert.sameMembers([...(there.scope?.tenantIds() ?? [])], ['t4'])
    assert.sameMembers(
      [...(empty.scope?.tenantIds() ?? [])],
      ['t1', 't2', 't4'],
    )
  })

  test('an unknown, malformed or repeated city is 404, never an unfiltered read', async ({
    assert,
  }) => {
    assert.equal((await globalRun({ city: 'nowhere' })).status, 404)
    assert.equal((await globalRun({ city: 'Tabatinga!' })).status, 404)
    assert.equal((await globalRun({ city: ['tabatinga', 'x'] })).status, 404)
  })

  test('the project filter still narrows the global read', async ({
    assert,
  }) => {
    const only = new (class extends PublicTenantFilter {
      released(ids: ReadonlyArray<string>) {
        return Promise.resolve(ids.filter((id) => id === 't2'))
      }
    })()
    const result = await run({}, null, GLOBAL, null, only, {})

    assert.deepEqual([...(result.scope?.tenantIds() ?? [])], ['t2'])
  })

  test('single-client mode wins over the global scope: the one configured tenant', async ({
    assert,
  }) => {
    const result = await run({}, 'ana', GLOBAL, null, ALL, {
      city: 'atalaia-do-norte',
    })

    assert.deepEqual([...(result.scope?.tenantIds() ?? [])], ['t1'])
  })

  test('the route params are ignored: the global route has no city segment', async ({
    assert,
  }) => {
    const result = await run({ city: 'nowhere' }, null, GLOBAL, null, ALL, {})

    assert.equal(result.status, 200)
    assert.sameMembers(
      [...(result.scope?.tenantIds() ?? [])],
      ['t1', 't2', 't4'],
    )
  })
})
