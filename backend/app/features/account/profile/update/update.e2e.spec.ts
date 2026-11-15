import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import {
  AccountProfileShowResponse,
  AccountProfileUpdateResponse,
  UPLOAD_STATUS,
} from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'
import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import { EmailChangeRepository } from '#repositories/email-change/email-change.repository'
import { EmailChangeContract } from '#services/email-change/email-change.contract'
import { EmailChangeFake } from '#services/email-change/email-change.fake'
import EmailToken from '#services/email-change/email-token'
import {
  authenticate,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import { storageRow } from '#tests/storages-fixtures'
import { Tenants } from '#tests/tenants-fixtures'
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

  test('a photo of the request scope is saved, comes back signed and keeps the session', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client)
    const file = await storageRow({ uploadedBy: user.id })

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ avatarId: file.id, currentPassword: FACTORY_PASSWORD })

    response.assertStatus(200)
    const profile = body(response, AccountProfileUpdateResponse)
    assert.equal(profile.avatar?.id, file.id)
    assert.isString(profile.avatar?.url)
    assert.isNull(profile.pendingEmail)
    const again = await client.get('/account/profile').cookies(session)
    again.assertStatus(200)
    assert.equal(body(again, AccountProfileShowResponse).avatar?.id, file.id)
  })

  test("a file the account did not upload is 422 AVATAR_INVALID: another member, another tenant, own file in another tenant, not confirmed, a customer's", async ({
    client,
    assert,
  }) => {
    const member = await signInWithFactory(client)
    const outsider = await signInWithFactory(
      client,
      'staff',
      await Tenants.create(),
    )
    const customer = await UserFactory.create()
    const mine = await signInWithFactory(client)
    const others = [
      // Same tenant, uploaded by another member.
      await storageRow({ uploadedBy: member.user.id }),
      // Another tenant's member's file.
      await storageRow({
        uploadedBy: outsider.user.id,
        tenantId: outsider.tenant?.id ?? null,
      }),
      // The account's own file, but in another tenant than the session's.
      await storageRow({
        uploadedBy: mine.user.id,
        tenantId: outsider.tenant?.id ?? null,
      }),
      // A customer's file the staff reaches (`CustomerScoped.writable`).
      await storageRow({
        uploadedBy: customer.id,
        customerId: customer.id,
      }),
      // Nobody's (a file whose uploader is unknown).
      await storageRow({ uploadedBy: null }),
    ]
    const pending = await storageRow({
      uploadedBy: mine.user.id,
      status: UPLOAD_STATUS.PENDING,
    })

    for (const file of [...others, pending]) {
      const response = await client
        .put('/account/profile')
        .cookies(mine.session)
        .json({ avatarId: file.id, currentPassword: FACTORY_PASSWORD })

      response.assertStatus(422)
      assert.include(JSON.stringify(response.body()), 'AVATAR_INVALID')
    }
    const profile = await client.get('/account/profile').cookies(mine.session)
    assert.isNull(body(profile, AccountProfileShowResponse).avatar)
  })

  test('a photo that does not exist is 422 AVATAR_INVALID on avatarId', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({
        avatarId: '00000000-0000-4000-8000-000000000000',
        currentPassword: FACTORY_PASSWORD,
      })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'AVATAR_INVALID')
  })

  test('the photo is removed with null, and null alone is a change', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client)
    const file = await storageRow({ uploadedBy: user.id })
    await client
      .put('/account/profile')
      .cookies(session)
      .json({ avatarId: file.id, currentPassword: FACTORY_PASSWORD })

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ avatarId: null, currentPassword: FACTORY_PASSWORD })

    response.assertStatus(200)
    assert.isNull(body(response, AccountProfileUpdateResponse).avatar)
    const again = await client.get('/account/profile').cookies(session)
    assert.isNull(body(again, AccountProfileShowResponse).avatar)
  })

  test('null without the current password is 422 on currentPassword', async ({
    client,
    assert,
  }) => {
    const { session } = await signInWithFactory(client)

    const response = await client
      .put('/account/profile')
      .cookies(session)
      .json({ avatarId: null })

    response.assertStatus(422)
    assert.include(JSON.stringify(response.body()), 'currentPassword')
  })

  test('where the e-mail change is unavailable (no block or no SMTP) it is 422 EMAIL_CHANGE_UNAVAILABLE and the e-mail stays', async ({
    client,
    assert,
  }) => {
    app.container.swap(EmailChangeContract, () => new EmailChangeFake(false))
    try {
      const { user, session } = await signInWithFactory(client)

      const response = await client
        .put('/account/profile')
        .cookies(session)
        .json({ email: 'nova@mail.com', currentPassword: FACTORY_PASSWORD })

      response.assertStatus(422)
      assert.include(
        JSON.stringify(response.body()),
        'EMAIL_CHANGE_UNAVAILABLE',
      )
      const still = await client.get('/account/profile').cookies(session)
      assert.equal(body(still, AccountProfileShowResponse).email, user.email)
    } finally {
      app.container.restore(EmailChangeContract)
    }
  })

  test('where the e-mail change is available it is a pending request: 200 with pendingEmail, the token is delivered and only its hash is stored, and the claim works once', async ({
    client,
    assert,
  }) => {
    const fake = new EmailChangeFake(true)
    app.container.swap(EmailChangeContract, () => fake)
    try {
      const { user, session } = await signInWithFactory(client)

      const response = await client
        .put('/account/profile')
        .cookies(session)
        .json({ email: 'Nova@Mail.com', currentPassword: FACTORY_PASSWORD })

      response.assertStatus(200)
      const profile = body(response, AccountProfileUpdateResponse)
      assert.equal(profile.pendingEmail, 'nova@mail.com')
      assert.equal(profile.email, user.email)
      assert.lengthOf(fake.delivered, 1)
      assert.equal(fake.delivered[0]?.to, 'nova@mail.com')
      const token = fake.delivered[0]?.token ?? ''

      const { rows } = await db.rawQuery<{
        rows: { new_email: string; token_hash: string }[]
      }>('select new_email, token_hash from email_changes where user_id = ?', [
        user.id,
      ])
      assert.lengthOf(rows, 1)
      assert.equal(rows[0]?.new_email, 'nova@mail.com')
      assert.equal(rows[0]?.token_hash, EmailToken.hash(token))
      assert.notEqual(rows[0]?.token_hash, token)

      // The container's own binding of the repository (not a double) is what the confirmation reads.
      const changes = await app.container.make(EmailChangeRepository)
      const claimed = await changes.claim(
        user.id,
        EmailToken.hash(token),
        new Date(),
      )
      assert.equal(claimed?.email, 'nova@mail.com')
      assert.isNull(
        await changes.claim(user.id, EmailToken.hash(token), new Date()),
      )
    } finally {
      app.container.restore(EmailChangeContract)
    }
  })
})
