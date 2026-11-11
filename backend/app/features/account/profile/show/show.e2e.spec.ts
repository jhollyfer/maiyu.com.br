import { test } from '@japa/runner'

import {
  AccountProfileShowResponse,
  ErrorEnvelope,
  USER_ROLE,
} from '@maiyu/shared'

import {
  authenticateAsNonStaff,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'

/** The owner reads their own account: `GET /account/profile`. */
test.group('account/profile > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('shows the profile without the password', async ({ client, assert }) => {
    const { user, session } = await signInWithFactory(client, 'administrator')

    const response = await client.get('/account/profile').cookies(session)

    response.assertStatus(200)
    assert.deepEqual(body(response, AccountProfileShowResponse), {
      id: user.id,
      name: user.name,
      email: user.email,
      role: USER_ROLE.ADMINISTRATOR,
    })
    assert.notProperty(response.body(), 'password')
    assert.notInclude(JSON.stringify(response.body()), user.password)
  })

  test('a signed-in account outside the staff reads its own profile too', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsNonStaff(client)

    const response = await client.get('/account/profile').cookies(session)

    response.assertStatus(200)
    assert.equal(
      body(response, AccountProfileShowResponse).role,
      USER_ROLE.MEMBER,
    )
  })

  test('without a session answers 401', async ({ client, assert }) => {
    const response = await client.get('/account/profile')

    response.assertStatus(401)
    assert.equal(body(response, ErrorEnvelope).code, 'AUTHENTICATION_REQUIRED')
  })
})
