import { test } from '@japa/runner'

import { AccountProfileShowResponse } from '@maiyu/shared'

import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

test.group('account/profile > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('answers with the account of the session, with no password', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get('/account/profile').cookies(session)

    response.assertStatus(200)
    const profile = body(response, AccountProfileShowResponse)
    assert.isString(profile.name)
    assert.notProperty(response.body(), 'password')
    assert.property(response.body(), 'tenant')
  })

  test('without a session is 401', async ({ client }) => {
    const response = await client.get('/account/profile')

    response.assertStatus(401)
  })
})
