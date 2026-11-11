import { test } from '@japa/runner'

import {
  AccountProfileShowResponse,
  ErrorEnvelope,
  type ErrorEnvelope as ErrorBody,
} from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'
import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import {
  authenticate,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import { findUserByEmail } from '#tests/users-fixtures'

const NEW_PASSWORD = 'Nova@1234'
const NEW_EMAIL = 'dono-novo@exemplo.com'

/** The new password, with the confirmation the policy asks for. */
const PASSWORD_CHANGE = {
  password: NEW_PASSWORD,
  passwordConfirmation: NEW_PASSWORD,
  currentPassword: FACTORY_PASSWORD,
}

/**
 * The owner changes a credential: `PUT /account/profile`. Changing the password or the
 * e-mail ends every session of the account, the one that asked included, so the proof is a
 * `200` followed by a `401` with the very cookie that made the call.
 */
test.group('account/profile > update', (group) => {
  group.each.setup(() => resetDatabase())

  test('changing the password answers 200 and the new password signs in', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client, 'administrator')

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json(PASSWORD_CHANGE)

    response.assertStatus(200)
    assert.deepEqual(body(response, AccountProfileShowResponse), {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'ADMINISTRATOR',
    })
    // The new credential gets in (the helper asserts the 204), and the old one no longer does.
    await authenticate(client, user.email, NEW_PASSWORD)
    const old = await client
      .post('/authentication/sign-in')
      .json({ email: user.email, password: FACTORY_PASSWORD })
    old.assertStatus(401)
  })

  test('after a password change the old cookie answers 401', async ({
    client,
  }) => {
    const { session } = await signInWithFactory(client, 'administrator')
    const changed = await client
      .put('/account/profile')
      .cookies(session)
      .json(PASSWORD_CHANGE)
    changed.assertStatus(200)

    const response = await client.get('/account/profile').cookies(session)

    response.assertStatus(401)
  })

  test('the 200 of a credential change clears both session cookies', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client, 'administrator')

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json(PASSWORD_CHANGE)

    response.assertStatus(200)
    for (const name of [SESSION_TOKEN.ACCESS, SESSION_TOKEN.REFRESH]) {
      const cookie = response.cookie(name)
      assert.isDefined(cookie, name)
      assert.equal(cookie?.value, '', name)
    }
  })

  test('a wrong current password answers 422 and changes nothing', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client, 'administrator')
    const before = (await findUserByEmail(user.email)).password

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ ...PASSWORD_CHANGE, currentPassword: 'Errada@123' })

    response.assertStatus(422)
    const error: ErrorBody = body(response, ErrorEnvelope)
    assert.equal(error.code, 'CURRENT_PASSWORD_INVALID')
    assert.deepEqual(Object.keys(error.errors ?? {}), ['currentPassword'])
    assert.equal((await findUserByEmail(user.email)).password, before)
    // Nothing was revoked: the session still reads the account.
    const alive = await client.get('/account/profile').cookies(session)
    alive.assertStatus(200)
  })

  test('a weak new password answers 422', async ({ client, assert }) => {
    const { session } = await signInWithFactory(client, 'administrator')

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({
        password: 'fraca',
        passwordConfirmation: 'fraca',
        currentPassword: FACTORY_PASSWORD,
      })

    response.assertStatus(422)
    assert.property(body(response, ErrorEnvelope).errors ?? {}, 'password')
  })

  test('changing the email answers 200 and the new email signs in', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client, 'administrator')

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ email: NEW_EMAIL, currentPassword: FACTORY_PASSWORD })

    response.assertStatus(200)
    assert.equal(body(response, AccountProfileShowResponse).email, NEW_EMAIL)
    assert.equal((await findUserByEmail(NEW_EMAIL)).id, user.id)
    await authenticate(client, NEW_EMAIL, FACTORY_PASSWORD)
  })

  test('after an email change the old cookie answers 401', async ({
    client,
  }) => {
    const { session } = await signInWithFactory(client, 'administrator')
    const changed = await client
      .put('/account/profile')
      .cookies(session)
      .json({ email: NEW_EMAIL, currentPassword: FACTORY_PASSWORD })
    changed.assertStatus(200)

    const response = await client.get('/account/profile').cookies(session)

    response.assertStatus(401)
  })

  test('an email in use answers 409', async ({ client, assert }) => {
    const { user, session } = await signInWithFactory(client, 'administrator')
    const other = await UserFactory.create()

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ email: other.email, currentPassword: FACTORY_PASSWORD })

    response.assertStatus(409)
    const error = body(response, ErrorEnvelope)
    assert.equal(error.code, 'EMAIL_IN_USE')
    assert.deepEqual(Object.keys(error.errors ?? {}), ['email'])
    assert.equal((await findUserByEmail(user.email)).id, user.id)
    // The refused change revoked nothing.
    const alive = await client.get('/account/profile').cookies(session)
    alive.assertStatus(200)
  })

  test('the same email keeps the session', async ({ client, assert }) => {
    const { user, session } = await signInWithFactory(client, 'administrator')

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ email: user.email, currentPassword: FACTORY_PASSWORD })

    response.assertStatus(200)
    assert.equal(body(response, AccountProfileShowResponse).email, user.email)
    const alive = await client.get('/account/profile').cookies(session)
    alive.assertStatus(200)
  })

  test('a body with neither email nor password answers 422', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client, 'administrator')

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ currentPassword: FACTORY_PASSWORD })

    response.assertStatus(422)
    assert.sameMembers(
      Object.keys(body(response, ErrorEnvelope).errors ?? {}),
      ['email', 'password'],
    )
  })

  test('without a session answers 401 and changes nothing', async ({
    client,
    assert,
  }) => {
    const account = await UserFactory.create()

    const response = await client
      .put('/account/profile')
      .json({ email: NEW_EMAIL, currentPassword: FACTORY_PASSWORD })

    response.assertStatus(401)
    assert.equal((await findUserByEmail(account.email)).id, account.id)
  })

  test('two password changes at once leave no old session valid', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client, 'administrator')

    const responses = await Promise.all([
      client.put('/account/profile').cookies(session).json(PASSWORD_CHANGE),
      client.put('/account/profile').cookies(session).json(PASSWORD_CHANGE),
    ])

    // The second one either runs after the first commits (200) or finds its session gone (401).
    assert.include(
      responses.map((response) => response.status()),
      200,
    )
    const response = await client.get('/account/profile').cookies(session)
    response.assertStatus(401)
  })

  test('the eleventh change in fifteen minutes answers 429', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client, 'administrator')
    const wrong = { ...PASSWORD_CHANGE, currentPassword: 'Errada@123' }

    for (let attempt = 1; attempt <= 10; attempt++) {
      const refused = await client
        .put('/account/profile')
        .cookies(session)
        .json(wrong)

      refused.assertStatus(422)
    }

    const blocked = await client
      .put('/account/profile')
      .cookies(session)
      .json(PASSWORD_CHANGE)

    blocked.assertStatus(429)
    assert.equal(body(blocked, ErrorEnvelope).code, 'TOO_MANY_REQUESTS')
  })
})
