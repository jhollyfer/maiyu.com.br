import { randomUUID } from 'node:crypto'

import { test } from '@japa/runner'

import { UserFactory } from '#database/factories/user.factory'
import {
  authenticateAsAdministrator,
  authenticateAsPlatformOwner,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

test.group('platform/members > delete', (group) => {
  group.each.setup(() => resetDatabase())

  test("removing the membership ends the account's sessions", async ({
    client,
    assert,
  }) => {
    const owner = await authenticateAsPlatformOwner(client)
    const { user, session, tenant } = await signInWithFactory(client, 'staff')
    if (!tenant) return assert.fail('the member has a tenant')
    const membership = await Tenants.addMember(
      await UserFactory.create(),
      tenant,
      ROLE_FIXTURES.staff,
    )
    const own = await Tenants.membershipOf(user, tenant)

    const removed = await client
      .delete(`/platform/members/${own.id}`)
      .cookies(owner)
    removed.assertStatus(204)

    const old = await client.get('/authentication/tenants').cookies(session)
    old.assertStatus(401)

    const denied = await client
      .delete(`/platform/members/${membership.id}`)
      .cookies(await authenticateAsAdministrator(client))
    denied.assertStatus(403)
    const missing = await client
      .delete(`/platform/members/${randomUUID()}`)
      .cookies(owner)
    missing.assertStatus(404)
  })
})
