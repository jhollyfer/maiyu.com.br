import { randomUUID } from 'node:crypto'

import { test } from '@japa/runner'

import { ErrorEnvelope, PlatformMemberResponse } from '@maiyu/shared'

import { UserFactory } from '#database/factories/user.factory'
import {
  authenticateAsAdministrator,
  authenticateAsPlatformOwner,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import {
  NO_ROLE_CHANGE,
  ROLE_CHANGE,
  ROLE_FIXTURES,
} from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

test.group('platform/members > save', (group) => {
  group.each.setup(() => resetDatabase())

  test("a new role ends the account's sessions; the same role again keeps them", async ({
    client,
    assert,
  }) => {
    if (!ROLE_CHANGE) return assert.fail('the project has two roles')
    const owner = await authenticateAsPlatformOwner(client)
    const { user, session, tenant } = await signInWithFactory(client, 'staff')
    if (!tenant) return assert.fail('the member has a tenant')
    const path = `/platform/tenants/${tenant.id}/members`

    const same = await client
      .put(path)
      .cookies(owner)
      .json({ userId: user.id, role: ROLE_CHANGE.from })
    same.assertStatus(200)
    const kept = await client.get('/authentication/tenants').cookies(session)
    kept.assertStatus(200)

    const promoted = await client
      .put(path)
      .cookies(owner)
      .json({ userId: user.id, role: ROLE_CHANGE.to })
    promoted.assertStatus(200)
    assert.equal(body(promoted, PlatformMemberResponse).role, ROLE_CHANGE.to)

    const old = await client.get('/authentication/tenants').cookies(session)
    old.assertStatus(401)
  }).skip(ROLE_CHANGE === undefined, NO_ROLE_CHANGE)

  test('an unknown tenant is 404, an unknown account 422, and an administrator 403', async ({
    client,
    assert,
  }) => {
    const owner = await authenticateAsPlatformOwner(client)
    const tenant = await Tenants.create()
    const user = await UserFactory.create()

    const missingTenant = await client
      .put(`/platform/tenants/${randomUUID()}/members`)
      .cookies(owner)
      .json({ userId: user.id, role: ROLE_FIXTURES.staff })
    const missingUser = await client
      .put(`/platform/tenants/${tenant.id}/members`)
      .cookies(owner)
      .json({ userId: randomUUID(), role: ROLE_FIXTURES.staff })
    const denied = await client
      .put(`/platform/tenants/${tenant.id}/members`)
      .cookies(await authenticateAsAdministrator(client))
      .json({ userId: user.id, role: ROLE_FIXTURES.staff })

    missingTenant.assertStatus(404)
    missingUser.assertStatus(422)
    assert.equal(body(missingUser, ErrorEnvelope).code, 'MEMBER_USER_NOT_FOUND')
    denied.assertStatus(403)
  })
})
