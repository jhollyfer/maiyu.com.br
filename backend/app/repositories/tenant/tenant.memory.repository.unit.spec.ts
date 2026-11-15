import { test } from '@japa/runner'

import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import {
  NO_NON_STAFF_ROLE,
  NO_ROLE_CHANGE,
  ROLE_CHANGE,
  ROLE_FIXTURES,
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
