import { test } from '@japa/runner'

import { ErrorEnvelope } from '@maiyu/shared'

import { ContactFactory } from '#database/factories/contact.factory'
import {
  authenticateAsAdministrator,
  authenticateAsNonStaff,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const UNKNOWN = '0c1f9d1e-8b7a-4c3d-9e2f-1a2b3c4d5e6f'

/** The owner's deletion: `DELETE /administrator/contacts/:id`, for good. */
test.group('administrator/contacts > delete', (group) => {
  group.each.setup(() => resetDatabase())

  test('deleting removes the contact for good', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const contact = await ContactFactory.create()
    const kept = await ContactFactory.create()

    const response = await client
      .delete(`/administrator/contacts/${contact.id}`)
      .cookies(session)

    response.assertStatus(204)
    assert.isNull(await Stored.contact(contact.id))
    assert.isNotNull(await Stored.contact(kept.id))
  })

  test('deleting an unknown id answers 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const kept = await ContactFactory.create()

    const response = await client
      .delete(`/administrator/contacts/${UNKNOWN}`)
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'CONTACT_NOT_FOUND')
    assert.isNotNull(await Stored.contact(kept.id))
  })

  test('deleting without a session answers 401', async ({ client, assert }) => {
    const contact = await ContactFactory.create()

    const response = await client.delete(
      `/administrator/contacts/${contact.id}`,
    )

    response.assertStatus(401)
    assert.isNotNull(await Stored.contact(contact.id))
  })

  test('a member cannot delete', async ({ client, assert }) => {
    const session = await authenticateAsNonStaff(client)
    const contact = await ContactFactory.create()

    const response = await client
      .delete(`/administrator/contacts/${contact.id}`)
      .cookies(session)

    response.assertStatus(403)
    assert.isNotNull(await Stored.contact(contact.id))
  })

  test('a malformed id answers 422 instead of a Postgres 500', async ({
    client,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .delete('/administrator/contacts/x')
      .cookies(session)

    response.assertStatus(422)
  })
})
