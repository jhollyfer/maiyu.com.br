import { test } from '@japa/runner'

import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import {
  NO_NON_STAFF_ROLE,
  NO_ROLE_CHANGE,
  ROLE_CHANGE,
  ROLE_FIXTURES,
  TENANT_TYPE_FIXTURE,
} from '#tests/role-fixtures'

const TENANT_ID = '00000000-0000-4000-8000-000000000001'
const USER_ID = '00000000-0000-4000-8000-000000000002'

function setup() {
  const sessions = new SessionMemoryRepository()

  return { sessions, tenants: new TenantMemoryRepository(sessions) }
}

/**
 * The in-memory double ends sessions by the same rule as the Lucid repository
 * (`MembershipAccess`, DECISIONS.md #581): a double that revoked on every write would let a use
 * case spec pass while the real repository behaves otherwise.
 */
test.group('TenantMemoryRepository > membership ends sessions (unit)', () => {
  test('a new membership keeps the sessions', async ({ assert }) => {
    const { sessions, tenants } = setup()
    const signedIn = await sessions.issue(USER_ID)

    await tenants.saveMember(TENANT_ID, USER_ID, ROLE_FIXTURES.staff)

    assert.isNotNull(await sessions.readRefresh(signedIn?.refreshToken ?? ''))
  })

  test('a role that takes access away, and removing the membership, revoke', async ({
    assert,
  }) => {
    if (!ROLE_CHANGE) return assert.fail(NO_ROLE_CHANGE)
    const { sessions, tenants } = setup()
    const first = await tenants.saveMember(TENANT_ID, USER_ID, ROLE_CHANGE.from)
    const lowered = await sessions.issue(USER_ID)

    await tenants.saveMember(TENANT_ID, USER_ID, ROLE_CHANGE.to)
    assert.isNull(await sessions.readRefresh(lowered?.refreshToken ?? ''))

    const removed = await sessions.issue(USER_ID)
    await tenants.removeMember(first.member.id)
    assert.isNull(await sessions.readRefresh(removed?.refreshToken ?? ''))
  }).skip(ROLE_CHANGE === undefined, NO_ROLE_CHANGE)

  test('a bigger role keeps the sessions', async ({ assert }) => {
    const { nonStaff, staff } = ROLE_FIXTURES
    if (nonStaff === null) return assert.fail(NO_NON_STAFF_ROLE)
    const { sessions, tenants } = setup()
    await tenants.saveMember(TENANT_ID, USER_ID, nonStaff)
    const signedIn = await sessions.issue(USER_ID)

    await tenants.saveMember(TENANT_ID, USER_ID, staff)

    assert.isNotNull(await sessions.readRefresh(signedIn?.refreshToken ?? ''))
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)
})

/**
 * The demonstration's tenant (DECISIONS.md #802) is in no public list or count, and opens by its
 * slug: the double answers like the Lucid repository.
 */
test.group('TenantMemoryRepository > demo tenant (unit)', () => {
  const CITY = { id: 'c1', name: 'Tabatinga', slug: 'tabatinga' }
  const base = {
    cityId: CITY.id,
    parentId: null,
    type: TENANT_TYPE_FIXTURE,
  }

  function arranged() {
    return setup()
      .tenants.addCity(CITY)
      .addTenant({ ...base, id: 'real', name: 'Real', slug: 'real' })
      .addTenant({
        ...base,
        id: 'demo',
        name: 'Demo',
        slug: 'demo-slug',
        demo: true,
      })
  }

  test('the city-wide read and the public list leave it out', async ({
    assert,
  }) => {
    const tenants = arranged()

    const target = await tenants.resolvePublic(CITY.slug, null)

    assert.deepEqual(target?.cityTenantIds, ['real'])
    assert.deepEqual(
      (await tenants.listPublic(['real', 'demo'])).map((each) => each.id),
      ['real'],
    )
  })

  test('its slug opens it, and it reads itself alone', async ({ assert }) => {
    const target = await arranged().resolvePublic(CITY.slug, 'demo-slug')

    assert.equal(target?.tenantId, 'demo')
    assert.deepEqual(target?.cityTenantIds, ['demo'])
  })

  test('the platform counts do not include it', async ({ assert }) => {
    const overview = await arranged().overview()

    assert.deepEqual(
      overview.tenants.map((each) => each.id),
      ['real'],
    )
    assert.equal(overview.cities[0]?.tenants, 1)
  })
})
