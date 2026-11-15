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
) {
  const middleware = await makeWithMemory(PublicTenantMiddleware, [
    [TenantRepository, repository()],
    [TenantConfig, new TenantConfig(singleSlug)],
  ])
  const request = new RequestFactory().create()
  const context = new HttpContextFactory().merge({ request }).create()
  context.params = params
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
})
