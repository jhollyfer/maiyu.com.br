import { test } from '@japa/runner'

import { AuthenticationTenantsResponse } from '@maiyu/shared'

import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import { authenticate, body, resetDatabase } from '#tests/http-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'
import { loginOf } from '#tests/users-fixtures'

test.group('authentication/tenants > select', (group) => {
  group.each.setup(() => resetDatabase())

  test('an account with two tenants works in none until it picks one', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const first = await Tenants.create()
    const second = await Tenants.create()
    await Tenants.addMember(user, first, ROLE_FIXTURES.staff)
    await Tenants.addMember(user, second, ROLE_FIXTURES.staff)
    const session = await authenticate(client, loginOf(user), FACTORY_PASSWORD)

    const before = await client.get('/authentication/tenants').cookies(session)
    assert.isNull(body(before, AuthenticationTenantsResponse).activeId)
    assert.lengthOf(body(before, AuthenticationTenantsResponse).data, 2)

    const picked = await client
      .put('/authentication/tenants/active')
      .cookies(session)
      .json({ tenantId: second.id })
    picked.assertStatus(204)

    const after = await client.get('/authentication/tenants').cookies(session)
    assert.equal(body(after, AuthenticationTenantsResponse).activeId, second.id)
  })

  test('a tenant the account is not a member of is 404', async ({ client }) => {
    const user = await UserFactory.create()
    await Tenants.addMember(user, await Tenants.create(), ROLE_FIXTURES.staff)
    const stranger = await Tenants.create()
    const session = await authenticate(client, loginOf(user), FACTORY_PASSWORD)

    const response = await client
      .put('/authentication/tenants/active')
      .cookies(session)
      .json({ tenantId: stranger.id })

    response.assertStatus(404)
  })
})
