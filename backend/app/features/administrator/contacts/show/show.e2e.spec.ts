import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import { AdministratorContactShowResponse, ErrorEnvelope } from '@maiyu/shared'

import { ContactFactory } from '#database/factories/contact.factory'
import {
  authenticateAsAdministrator,
  authenticateAsNonStaff,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

const UNKNOWN = '0c1f9d1e-8b7a-4c3d-9e2f-1a2b3c4d5e6f'

/** The detail of one message: `GET /administrator/contacts/:id`. */
test.group('administrator/contacts > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('shows the whole contact', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const answeredAt = DateTime.fromISO('2026-11-02T09:30:00Z')
    const contact = await ContactFactory.merge({
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      message: 'Quero conversar sobre um projeto.',
      locale: 'es',
      answeredAt,
    }).create()

    const response = await client
      .get(`/administrator/contacts/${contact.id}`)
      .cookies(session)

    response.assertStatus(200)
    assert.deepInclude(body(response, AdministratorContactShowResponse), {
      id: contact.id,
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      message: 'Quero conversar sobre um projeto.',
      locale: 'es',
      answeredAt: '2026-11-02T09:30:00.000Z',
    })
  })

  test('an unknown id answers 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get(`/administrator/contacts/${UNKNOWN}`)
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'CONTACT_NOT_FOUND')
  })

  test('a malformed id answers 422 instead of a Postgres 500', async ({
    client,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get('/administrator/contacts/x')
      .cookies(session)

    response.assertStatus(422)
  })

  test('without a session answers 401', async ({ client }) => {
    const contact = await ContactFactory.create()

    const response = await client.get(`/administrator/contacts/${contact.id}`)

    response.assertStatus(401)
  })

  test('a member answers 403', async ({ client }) => {
    const session = await authenticateAsNonStaff(client)
    const contact = await ContactFactory.create()

    const response = await client
      .get(`/administrator/contacts/${contact.id}`)
      .cookies(session)

    response.assertStatus(403)
  })
})
