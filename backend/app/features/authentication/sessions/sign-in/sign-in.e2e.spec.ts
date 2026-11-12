import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import { ErrorEnvelope } from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'
import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import { body, resetDatabase } from '#tests/http-fixtures'
import { loginOf } from '#tests/users-fixtures'

/**
 * The whole session through the real path: sign-in is the only way to get a
 * valid cookie, and every other test in the suite depends on it.
 *
 * What is asserted here is the contract `backend-old` did not have: the token leaves in an
 * `httpOnly` cookie and not in the body, and the refusal does not tell whether the email
 * exists - otherwise the login form becomes a registration checker.
 */
test.group('authentication > sign-in', (group) => {
  // The account comes from the factory, not from the seeder: the seeder's owner depends on
  // env keys the test environment does not have to define (K37).
  let account = { login: '', password: FACTORY_PASSWORD }
  group.each.setup(async () => {
    const teardown = await resetDatabase()
    const user = await UserFactory.create()
    account = { login: loginOf(user), password: FACTORY_PASSWORD }

    return teardown
  })

  test('correct credential responds 204 with both cookies', async ({
    client,
    assert,
  }) => {
    const response = await client.post('/authentication/sign-in').json(account)

    response.assertStatus(204)

    // No body: the token pair travels only in `Set-Cookie`, and the page's JavaScript
    // never reaches it.
    assert.isEmpty(response.text())
    assert.isDefined(response.cookie(SESSION_TOKEN.ACCESS)?.value)
    assert.isDefined(response.cookie(SESSION_TOKEN.REFRESH)?.value)
  })

  test('a phone-only account signs in by the phone, with or without the mask', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.apply('byPhone').create()
    const phone = loginOf(user)
    const masked = `(${phone.slice(3, 5)}) ${phone.slice(5, 10)}-${phone.slice(10)}`

    for (const login of [phone, masked]) {
      const response = await client
        .post('/authentication/sign-in')
        .json({ login, password: FACTORY_PASSWORD })

      response.assertStatus(204)
      assert.isDefined(response.cookie(SESSION_TOKEN.ACCESS)?.value)
    }
  })

  // The lookup is by `lower(email)` (DECISIONS.md #415): an account stored with a capital, which
  // a path that skipped `Rule.email()` can leave, still signs in with the lowercase login.
  test('an e-mail stored with capitals signs in with the lowercase login', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.merge({
      email: 'Maria.Silva@Mail.com',
    }).create()
    assert.equal(user.email, 'Maria.Silva@Mail.com')

    const response = await client
      .post('/authentication/sign-in')
      .json({ login: 'maria.silva@mail.com', password: FACTORY_PASSWORD })

    response.assertStatus(204)
  })

  // The body parser does not trim (DECISIONS.md #402): a trailing space is part of the value until a
  // rule says otherwise. The text field trims in its validator; the password has no trim and
  // reaches the hash as typed, the same as every string of a rich text document.
  test('the login is trimmed by its validator, not by the body parser', async ({
    client,
  }) => {
    const response = await client
      .post('/authentication/sign-in')
      .json({ login: `  ${account.login} `, password: account.password })

    response.assertStatus(204)
  })

  test('the password reaches the hash untouched: a trailing space is a wrong password', async ({
    client,
  }) => {
    const response = await client
      .post('/authentication/sign-in')
      .json({ login: account.login, password: `${account.password} ` })

    response.assertStatus(401)
  })

  test('a blank login responds 422 on the login field', async ({
    client,
    assert,
  }) => {
    const response = await client
      .post('/authentication/sign-in')
      .json({ login: '', password: FACTORY_PASSWORD })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'login')
  })

  test('wrong credential responds 401 without revealing whether the e-mail or the phone exists', async ({
    client,
    assert,
  }) => {
    const existing = await client
      .post('/authentication/sign-in')
      .json({ login: account.login, password: 'Errada1234!' })

    const nonexistent = await client
      .post('/authentication/sign-in')
      .json({ login: 'ninguem@mail.com', password: 'Errada1234!' })

    existing.assertStatus(401)
    nonexistent.assertStatus(401)

    // Same response in both cases: any difference - code, message or
    // pointed field - would turn the login into a registration checker.
    const unknownPhone = await client
      .post('/authentication/sign-in')
      .json({ login: '(97) 99888-7766', password: 'Errada1234!' })

    unknownPhone.assertStatus(401)
    assert.deepEqual(
      body(existing, ErrorEnvelope),
      body(nonexistent, ErrorEnvelope),
    )
    assert.deepEqual(
      body(existing, ErrorEnvelope),
      body(unknownPhone, ErrorEnvelope),
    )
    assert.equal(body(existing, ErrorEnvelope).code, 'INVALID_CREDENTIALS')

    // And no cookie is written on refusal.
    assert.isUndefined(existing.cookie(SESSION_TOKEN.ACCESS))
  })

  test('429 on the sixth attempt from the same IP in a minute, even with the right password', async ({
    client,
    assert,
  }) => {
    const wrong = { login: account.login, password: 'Errada123!' }

    for (let attempt = 1; attempt <= 5; attempt++) {
      const refused = await client.post('/authentication/sign-in').json(wrong)

      refused.assertStatus(401)
    }

    const blocked = await client
      .post('/authentication/sign-in')
      .json({ login: account.login, password: account.password })

    blocked.assertStatus(429)
    assert.equal(body(blocked, ErrorEnvelope).code, 'TOO_MANY_REQUESTS')
    assert.isUndefined(blocked.cookie(SESSION_TOKEN.ACCESS))
  })

  // The verifier's finding on #396: one account with an e-mail and a phone is one bucket, not two.
  test('the e-mail and the phone of the same account spend the same account bucket', async ({
    client,
    assert,
  }) => {
    const phone = '+5597991230001'
    const user = await UserFactory.merge({ phone }).create()
    const email = String(user.email)
    const wrong = { password: 'Errada123!' }

    await client
      .post('/authentication/sign-in')
      .json({ login: email, ...wrong })
    await client
      .post('/authentication/sign-in')
      .json({ login: phone, ...wrong })

    const { rows } = await db.rawQuery<{
      rows: { key: string; points: number }[]
    }>('select key, points from rate_limits where key like ?', [
      '%signin-user:%',
    ])

    assert.lengthOf(rows, 1)
    assert.include(String(rows[0]?.key), user.id)
    assert.equal(rows[0]?.points, 2)
  })
})
