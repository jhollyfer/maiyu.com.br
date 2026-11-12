import { test } from '@japa/runner'

import { AccountProfileShowResponse } from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'
import { FACTORY_PASSWORD } from '#database/factories/user.factory'
import {
  authenticate,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import { loginOf } from '#tests/users-fixtures'

const NEW_PASSWORD = 'Nova@12345'

test.group('account/profile > update', (group) => {
  group.each.setup(() => resetDatabase())

  test('a new name answers 200 and keeps the session', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ name: '  Ana Maria ', currentPassword: FACTORY_PASSWORD })

    response.assertStatus(200)
    assert.equal(body(response, AccountProfileShowResponse).name, 'Ana Maria')
    const again = await client.get('/account/profile').cookies(session)
    again.assertStatus(200)
  })

  test('a new password ends every session, clears the cookies and the new one signs in', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client)
    const other = await authenticate(client, loginOf(user), FACTORY_PASSWORD)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({
        password: NEW_PASSWORD,
        passwordConfirmation: NEW_PASSWORD,
        currentPassword: FACTORY_PASSWORD,
      })

    response.assertStatus(200)
    assert.equal(response.cookie(SESSION_TOKEN.ACCESS)?.value, '')
    const stale = await client.get('/account/profile').cookies(other)
    stale.assertStatus(401)
    const entered = await client
      .post('/authentication/sign-in')
      .json({ login: loginOf(user), password: NEW_PASSWORD })
    entered.assertStatus(204)
  })

  test('a wrong current password is 422 on currentPassword', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ name: 'Outro', currentPassword: 'Errada@123' })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'currentPassword')
  })

  test('the new password equal to the current one is 422 PASSWORD_SAME_AS_CURRENT', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({
        password: FACTORY_PASSWORD,
        passwordConfirmation: FACTORY_PASSWORD,
        currentPassword: FACTORY_PASSWORD,
      })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'PASSWORD_SAME_AS_CURRENT')
  })

  test('a change without the current password is 422 on currentPassword', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ name: 'Outro' })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'currentPassword')
  })

  test('an empty body is 422: there is nothing to change', async ({
    client,
  }) => {
    const { session } = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ currentPassword: FACTORY_PASSWORD })

    response.assertStatus(422)
  })

  test('without a session is 401', async ({ client }) => {
    const response = await client
      .put('/account/profile')
      .json({ name: 'Ana', currentPassword: FACTORY_PASSWORD })

    response.assertStatus(401)
  })

  test('a new phone ends every session, clears the cookies and signs in by the new phone', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client)
    const other = await authenticate(client, loginOf(user), FACTORY_PASSWORD)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ phone: '(97) 99123-4567', currentPassword: FACTORY_PASSWORD })

    response.assertStatus(200)
    assert.equal(
      body(response, AccountProfileShowResponse).phone,
      '+5597991234567',
    )
    assert.equal(response.cookie(SESSION_TOKEN.ACCESS)?.value, '')
    const stale = await client.get('/account/profile').cookies(other)
    stale.assertStatus(401)
    const entered = await client
      .post('/authentication/sign-in')
      .json({ login: '+5597991234567', password: FACTORY_PASSWORD })
    entered.assertStatus(204)
  })

  test('a phone another account already signs in with is 422 PHONE_TAKEN, and the first one keeps it', async ({
    client,
    assert,
  }) => {
    const first = await signInWithFactory(client)
    await client
      .put('/account/profile')
      .cookies(first.session)
      .json({ phone: '+5597991234567', currentPassword: FACTORY_PASSWORD })
    const second = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(second.session)
      .json({ phone: '+5597991234567', currentPassword: FACTORY_PASSWORD })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'PHONE_TAKEN')
  })
})
