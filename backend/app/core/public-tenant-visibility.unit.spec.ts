import { test } from '@japa/runner'

import { PLATFORM_ROLE, type PlatformRole } from '@maiyu/shared'

import { PublicTenantFilter } from '#core/public-tenant-filter'
import { PublicTenantVisibility } from '#core/public-tenant-visibility'
import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { ROLE_FIXTURES, TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

/** The project's filter: only `t1` is released to the public. */
class OnlyT1 extends PublicTenantFilter {
  released(ids: ReadonlyArray<string>) {
    return Promise.resolve(ids.filter((id) => id === 't1'))
  }
}

class CountingTenants extends TenantMemoryRepository {
  reads = 0

  override async membershipsOf(userId: string) {
    this.reads += 1

    return super.membershipsOf(userId)
  }
}

async function visibility() {
  const base = { type: TENANT_TYPE_FIXTURE, parentId: null, cityId: 'c1' }
  const tenants = new CountingTenants(new SessionMemoryRepository())
    .addCity({ id: 'c1', name: 'Tabatinga', slug: 'tabatinga' })
    .addTenant({ ...base, id: 't1', name: 'Ana', slug: 'ana' })
    .addTenant({ ...base, id: 't2', name: 'Bia', slug: 'bia' })
    .addTenant({ ...base, id: 't3', name: 'Cid', slug: 'cid' })
  tenants.addMembership({
    userId: 'member-of-t2',
    tenantId: 't2',
    role: ROLE_FIXTURES.staff,
  })

  const service = await makeWithMemory(PublicTenantVisibility, [
    [TenantRepository, tenants],
    [PublicTenantFilter, new OnlyT1()],
  ])

  return { tenants, of: service.of.bind(service) }
}

const viewer = (
  id: string,
  platformRole: PlatformRole = PLATFORM_ROLE.USER,
) => ({
  id,
  platformRole,
})
const IDS = ['t1', 't2', 't3']

test.group('core > public-tenant-visibility (unit)', () => {
  test('a visitor reaches only the released tenants, with no membership query', async ({
    assert,
  }) => {
    const { of, tenants } = await visibility()

    assert.deepEqual(await of(null, IDS), ['t1'])
    assert.equal(tenants.reads, 0)
  })

  test('an account of another tenant reaches only the released ones', async ({
    assert,
  }) => {
    const { of } = await visibility()

    assert.deepEqual(await of(viewer('stranger'), IDS), ['t1'])
  })

  test('a member reaches the released tenants and its own', async ({
    assert,
  }) => {
    const { of } = await visibility()

    assert.deepEqual(await of(viewer('member-of-t2'), IDS), ['t1', 't2'])
  })

  test('the platform staff reach every tenant, with no membership query', async ({
    assert,
  }) => {
    const { of, tenants } = await visibility()

    assert.deepEqual(await of(viewer('x', PLATFORM_ROLE.OWNER), IDS), IDS)
    assert.deepEqual(
      await of(viewer('y', PLATFORM_ROLE.ADMINISTRATOR), IDS),
      IDS,
    )
    assert.equal(tenants.reads, 0)
  })

  test('with every tenant released, nobody is asked about memberships', async ({
    assert,
  }) => {
    const { of, tenants } = await visibility()

    assert.deepEqual(await of(viewer('member-of-t2'), ['t1']), ['t1'])
    assert.equal(tenants.reads, 0)
  })
})
