import { test } from '@japa/runner'

import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import {
  authenticateAsAdministrator,
  resetDatabase,
} from '#tests/http-fixtures'

const PRIVATE = 'private, no-store'

/**
 * A response tied to a session never reaches a shared cache
 * (_standards/backend.md §5.7 item 8). A request without cookies gets no such
 * header: it is the response that may be cached.
 */
test.group('private-cache middleware', (group) => {
  group.each.setup(() => resetDatabase())

  test('an authenticated route answers private, no-store', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get('/storages').cookies(session)

    response.assertStatus(200)
    assert.equal(response.header('cache-control'), PRIVATE)
  })

  test('the sign-in response that writes the session is private, no-store', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.apply('administrator').create()
    const response = await client
      .post('/authentication/sign-in')
      .json({ email: user.email, password: FACTORY_PASSWORD })

    response.assertStatus(204)
    assert.equal(response.header('cache-control'), PRIVATE)
  })

  test('the refresh response that rewrites the session is private, no-store', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/authentication/refresh')
      .cookies(session)

    response.assertStatus(204)
    assert.equal(response.header('cache-control'), PRIVATE)
  })

  test('the sign-out response that clears the session is private, no-store', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/authentication/sign-out')
      .cookies(session)

    response.assertStatus(204)
    assert.equal(response.header('cache-control'), PRIVATE)
  })

  test('an error answered to a session is private, no-store', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get('/does-not-exist').cookies(session)

    response.assertStatus(404)
    assert.equal(response.header('cache-control'), PRIVATE)
  })

  test('a request without cookies is not marked private', async ({
    client,
    assert,
  }) => {
    const response = await client.get('/does-not-exist')

    response.assertStatus(404)
    assert.isUndefined(response.header('cache-control'))
  })

  test('the Cache-Control the route set is kept', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get('/health-check').cookies(session)

    response.assertStatus(200)
    assert.equal(response.header('cache-control'), 'no-store')
  })
})
