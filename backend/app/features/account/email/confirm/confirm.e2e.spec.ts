import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import {
  AccountProfileShowResponse,
  AccountProfileUpdateResponse,
} from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'
import { FACTORY_PASSWORD } from '#database/factories/user.factory'
import { MailContract } from '#services/mail/mail.contract'
import { MailFake } from '#services/mail/mail.fake'
import {
  authenticate,
  body,
  cookieValue,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import { loginOf } from '#tests/users-fixtures'

/** The token the e-mail carried: the one `<code>` of the message. */
function tokenIn(html: string): string {
  const [, token] = /<code>([0-9a-f]+)<\/code>/.exec(html) ?? []
  if (!token) throw new Error('no token in the e-mail')

  return token
}

test.group('account/email > confirm', (group) => {
  let mail = new MailFake()

  group.each.setup(async () => {
    // SMTP is not part of the test environment: the e-mail is the double that records it.
    mail = new MailFake()
    app.container.swap(MailContract, () => mail)
    const teardown = await resetDatabase()

    return async () => {
      app.container.restore(MailContract)
      await teardown()
    }
  })

  test('the whole flow: ask, receive the token, confirm; the e-mail changes, the other sessions end, this one carries on', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client)
    const other = await authenticate(client, loginOf(user), FACTORY_PASSWORD)

    const asked = await client
      .put('/account/profile')
      .cookies(session)
      .json({ email: 'Nova@Mail.com', currentPassword: FACTORY_PASSWORD })

    asked.assertStatus(200)
    const profile = body(asked, AccountProfileUpdateResponse)
    assert.equal(profile.pendingEmail, 'nova@mail.com')
    assert.equal(profile.email, user.email)
    assert.equal(mail.sent[0]?.to, 'nova@mail.com')
    const stillOld = await client.get('/account/profile').cookies(session)
    stillOld.assertStatus(200)

    const confirmed = await client
      .post('/account/email/confirm')
      .cookies(session)
      .json({ token: tokenIn(mail.sent[0]?.html ?? '') })

    confirmed.assertStatus(204)
    const fresh = {
      [SESSION_TOKEN.ACCESS]: cookieValue(confirmed, SESSION_TOKEN.ACCESS),
      [SESSION_TOKEN.REFRESH]: cookieValue(confirmed, SESSION_TOKEN.REFRESH),
    }
    const mine = await client.get('/account/profile').cookies(fresh)
    mine.assertStatus(200)
    assert.equal(body(mine, AccountProfileShowResponse).email, 'nova@mail.com')
    const old = await client.get('/account/profile').cookies(session)
    old.assertStatus(401)
    const stale = await client.get('/account/profile').cookies(other)
    stale.assertStatus(401)
    const entered = await client
      .post('/authentication/sign-in')
      .json({ login: 'nova@mail.com', password: FACTORY_PASSWORD })
    entered.assertStatus(204)
  })

  test('the token works once', async ({ client }) => {
    const { session } = await signInWithFactory(client)
    await client
      .put('/account/profile')
      .cookies(session)
      .json({ email: 'nova@mail.com', currentPassword: FACTORY_PASSWORD })
    const token = tokenIn(mail.sent[0]?.html ?? '')
    const first = await client
      .post('/account/email/confirm')
      .cookies(session)
      .json({ token })
    const fresh = {
      [SESSION_TOKEN.ACCESS]: cookieValue(first, SESSION_TOKEN.ACCESS),
      [SESSION_TOKEN.REFRESH]: cookieValue(first, SESSION_TOKEN.REFRESH),
    }

    const again = await client
      .post('/account/email/confirm')
      .cookies(fresh)
      .json({ token })

    again.assertStatus(422)
  })

  test('a wrong token is 422 EMAIL_TOKEN_INVALID on token and changes nothing', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client)
    await client
      .put('/account/profile')
      .cookies(session)
      .json({ email: 'nova@mail.com', currentPassword: FACTORY_PASSWORD })

    const response = await client
      .post('/account/email/confirm')
      .cookies(session)
      .json({ token: 'f'.repeat(64) })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'EMAIL_TOKEN_INVALID')
    assert.include(JSON.stringify(response.body()), 'token')
    const still = await client.get('/account/profile').cookies(session)
    still.assertStatus(200)
  })

  test('the token of another account does not confirm', async ({ client }) => {
    const first = await signInWithFactory(client)
    await client
      .put('/account/profile')
      .cookies(first.session)
      .json({ email: 'nova@mail.com', currentPassword: FACTORY_PASSWORD })
    const second = await signInWithFactory(client)

    const response = await client
      .post('/account/email/confirm')
      .cookies(second.session)
      .json({ token: tokenIn(mail.sent[0]?.html ?? '') })

    response.assertStatus(422)
  })

  test('an address another account holds is 422 EMAIL_TAKEN at the request', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client)
    const holder = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ email: holder.user.email, currentPassword: FACTORY_PASSWORD })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'EMAIL_TAKEN')
    assert.lengthOf(mail.sent, 0)
  })

  test('without a session is 401', async ({ client }) => {
    const response = await client
      .post('/account/email/confirm')
      .json({ token: 'a'.repeat(64) })

    response.assertStatus(401)
  })

  test('an empty token is 422 on token', async ({ client, assert }) => {
    const { session } = await signInWithFactory(client)

    const response = await client
      .post('/account/email/confirm')
      .cookies(session)
      .json({ token: '' })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'token')
  })
})
