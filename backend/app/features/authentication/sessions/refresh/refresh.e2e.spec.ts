import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { SESSION_TOKEN } from '#config/session-token'
import { UserFactory } from '#database/factories/user.factory'
import { SessionRepository } from '#repositories/session/session.repository'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

/**
 * More parallel refreshes than the default Postgres pool of 10 connections. With the stock
 * `DbAccessTokensProvider` each rotation held the transaction's connection and asked the
 * pool for a second one to issue, and the burst ended in `KnexTimeoutError`.
 */
const ABOVE_POOL = 12

test.group('authentication > refresh', (group) => {
  group.each.setup(() => resetDatabase())

  test('refreshes the session and returns a new token pair', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/authentication/refresh')
      .cookies(session)

    response.assertStatus(204)
    assert.notEqual(
      response.cookie(SESSION_TOKEN.ACCESS)?.value,
      session[SESSION_TOKEN.ACCESS],
    )
    assert.notEqual(
      response.cookie(SESSION_TOKEN.REFRESH)?.value,
      session[SESSION_TOKEN.REFRESH],
    )
  })

  test('without a refresh cookie responds 401', async ({ client }) => {
    const response = await client.post('/authentication/refresh')

    response.assertStatus(401)
  })

  test('replaying a consumed refresh revokes the family and responds 401', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const rotated = await client
      .post('/authentication/refresh')
      .cookies(session)
    rotated.assertStatus(204)

    const replay = await client.post('/authentication/refresh').cookies(session)

    replay.assertStatus(401)
    assert.equal(body(replay).code, 'AUTHENTICATION_REQUIRED')
    // The pair issued from the replayed token died with the family.
    const after = await client.post('/authentication/refresh').cookies({
      [SESSION_TOKEN.REFRESH]:
        rotated.cookie(SESSION_TOKEN.REFRESH)?.value ?? '',
    })
    after.assertStatus(401)
  })

  test('refreshes above the pool size in parallel without starving it', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.create()
    const sessions = await app.container.make(SessionRepository)
    const pairs = await Promise.all(
      Array.from({ length: ABOVE_POOL }, () => sessions.issue(user.id)),
    )

    const responses = await Promise.all(
      pairs.map((pair) =>
        client
          .post('/authentication/refresh')
          .cookies({ [SESSION_TOKEN.REFRESH]: pair?.refreshToken ?? '' }),
      ),
    )

    assert.deepEqual(
      responses.map((response) => response.status()),
      Array.from({ length: ABOVE_POOL }, () => 204),
    )
  }).timeout(20_000)
})
