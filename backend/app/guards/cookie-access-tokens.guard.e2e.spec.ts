import { test } from '@japa/runner'

import { SESSION_TOKEN } from '#config/session-token'
import {
  authenticateAsAdministrator,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'

/**
 * The guard checks the token `name`, not just the signature.
 *
 * Both tokens come out of the same `DbAccessTokensProvider` and are indistinguishable
 * by verification: without this check, presenting the refresh one as an access token
 * would give a seven-day session where the contract promises one.
 */
/** A route behind `auth()` that the kit itself brings: the listing of the signed-in role's files. */
const PROTECTED = '/storages'

test.group('guards > cookie-access-tokens', (group) => {
  group.each.setup(() => resetDatabase())

  test('a valid access token authenticates', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get(PROTECTED).cookies(session)

    response.assertStatus(200)
  })

  test('without a cookie answers 401', async ({ client }) => {
    const response = await client.get(PROTECTED)

    response.assertStatus(401)
  })

  test('a refresh token presented as an access token answers 401', async ({
    client,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get(PROTECTED).cookies({
      [SESSION_TOKEN.ACCESS]: session[SESSION_TOKEN.REFRESH],
    })

    response.assertStatus(401)
  })

  test('a token that does not exist answers 401', async ({ client }) => {
    const response = await client.get(PROTECTED).cookies({
      [SESSION_TOKEN.ACCESS]: 'oat_abc.def',
    })

    response.assertStatus(401)
  })

  test('a deactivated account loses access on the next request', async ({
    client,
  }) => {
    const { user, session } = await signInWithFactory(client, 'staff')
    user.status = 'INACTIVE'
    await user.save()

    const response = await client.get(PROTECTED).cookies(session)

    response.assertStatus(401)
  })
})
