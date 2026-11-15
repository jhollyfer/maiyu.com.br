import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import { ErrorEnvelope } from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'
import { UserFactory } from '#database/factories/user.factory'
import { ACCESS_TOKEN_TABLE } from '#models/user'
import { SessionRepository } from '#repositories/session/session.repository'
import {
  authenticateAsAdministrator,
  body,
  cookieValue,
  resetDatabase,
} from '#tests/http-fixtures'

/**
 * More parallel refreshes than the default Postgres pool of 10 connections. With the stock
 * `DbAccessTokensProvider` each rotation held the transaction's connection and asked the
 * pool for a second one to issue, and the burst ended in `KnexTimeoutError`.
 */
const ABOVE_POOL = 12

/**
 * Tokens with the shape of the real one (`<prefix><base64url id>.<secret>`) that the server never
 * issued: the format passes the parse, and only the hash comparison refuses them.
 */
class ForgedToken {
  /** The real identifier with another secret of the same length. */
  static withSecretOf(real: string): string {
    const dot = real.indexOf('.')

    return `${real.slice(0, dot + 1)}${'A'.repeat(real.length - dot - 1)}`
  }

  /** The real prefix with an identifier no row has. */
  static withUnknownId(real: string): string {
    const prefix = real.slice(0, real.indexOf('_') + 1)
    const id = Buffer.from('999999999').toString('base64url')

    return `${prefix}${id}.${'A'.repeat(40)}`
  }
}

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
    assert.equal(body(replay, ErrorEnvelope).code, 'AUTHENTICATION_REQUIRED')
    // The pair issued from the replayed token died with the family.
    const after = await client.post('/authentication/refresh').cookies({
      [SESSION_TOKEN.REFRESH]: cookieValue(rotated, SESSION_TOKEN.REFRESH),
    })
    after.assertStatus(401)
  })

  test('an expired refresh responds 401 and issues nothing', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    await db
      .from(ACCESS_TOKEN_TABLE)
      .where('name', SESSION_TOKEN.REFRESH)
      .update({ expires_at: DateTime.now().minus({ minutes: 1 }).toJSDate() })

    const response = await client
      .post('/authentication/refresh')
      .cookies(session)

    response.assertStatus(401)
    assert.equal(body(response, ErrorEnvelope).code, 'AUTHENTICATION_REQUIRED')
    assert.isUndefined(response.cookie(SESSION_TOKEN.ACCESS)?.value)
  })

  test('the refresh of a session already signed out responds 401', async ({
    client,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const signOut = await client
      .post('/authentication/sign-out')
      .cookies(session)
    signOut.assertStatus(204)

    const response = await client
      .post('/authentication/refresh')
      .cookies(session)

    response.assertStatus(401)
  })

  test('the access token in the refresh cookie responds 401 and keeps the session', async ({
    client,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.post('/authentication/refresh').cookies({
      [SESSION_TOKEN.REFRESH]: session[SESSION_TOKEN.ACCESS],
    })

    response.assertStatus(401)
    // Refused before consuming anything: the access token was not taken as a refresh one.
    const profile = await client.get('/account/profile').cookies(session)
    profile.assertStatus(200)
  })

  test('a forged token with a valid format responds 401 and does not revoke the family', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const real = session[SESSION_TOKEN.REFRESH] ?? ''
    assert.isNotEmpty(real)

    for (const forged of [
      ForgedToken.withSecretOf(real),
      ForgedToken.withUnknownId(real),
    ]) {
      const response = await client
        .post('/authentication/refresh')
        .cookies({ [SESSION_TOKEN.REFRESH]: forged })

      response.assertStatus(401)
    }

    // A forgery is not reuse: the real pair still rotates.
    const legit = await client.post('/authentication/refresh').cookies(session)
    legit.assertStatus(204)
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
