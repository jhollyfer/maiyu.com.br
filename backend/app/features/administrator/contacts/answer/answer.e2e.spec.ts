import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import { AdministratorContactShowResponse, ErrorEnvelope } from '@maiyu/shared'

import { ContactFactory } from '#database/factories/contact.factory'
import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import {
  authenticateAsAdministrator,
  authenticateAsNonStaff,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const UNKNOWN = '0c1f9d1e-8b7a-4c3d-9e2f-1a2b3c4d5e6f'
const NOW = DateTime.fromISO('2026-11-05T15:00:00Z', { zone: 'utc' })

/**
 * The one-way transition: `POST /administrator/contacts/:id/answer`. The clock is the fixed
 * one, so the stamp is compared with the value the spec chose and not with a recomputed now.
 */
test.group('administrator/contacts > answer', (group) => {
  group.each.setup(() => resetDatabase())
  group.each.setup(() => {
    app.container.swap(ClockContract, () => new ClockFake(NOW))

    return () => app.container.restore(ClockContract)
  })

  test('answering a pending contact stamps answered_at', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const contact = await ContactFactory.create()

    const response = await client
      .post(`/administrator/contacts/${contact.id}/answer`)
      .cookies(session)

    response.assertStatus(200)
    assert.equal(
      body(response, AdministratorContactShowResponse).answeredAt,
      '2026-11-05T15:00:00.000Z',
    )
    const stored = await Stored.contact(contact.id)
    assert.equal(stored?.answeredAt?.toMillis(), NOW.toMillis())
  })

  test('answering twice answers 409 and keeps answered_at', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const first = DateTime.fromISO('2026-11-02T09:30:00Z', { zone: 'utc' })
    const contact = await ContactFactory.merge({ answeredAt: first }).create()

    const response = await client
      .post(`/administrator/contacts/${contact.id}/answer`)
      .cookies(session)

    response.assertStatus(409)
    assert.equal(body(response, ErrorEnvelope).code, 'CONTACT_ALREADY_ANSWERED')
    const stored = await Stored.contact(contact.id)
    assert.equal(stored?.answeredAt?.toMillis(), first.toMillis())
  })

  test('two answers at once give one 200 and one 409', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const contact = await ContactFactory.create()

    const responses = await Promise.all([
      client
        .post(`/administrator/contacts/${contact.id}/answer`)
        .cookies(session),
      client
        .post(`/administrator/contacts/${contact.id}/answer`)
        .cookies(session),
    ])

    assert.sameMembers(
      responses.map((response) => response.status()),
      [200, 409],
    )
    const stored = await Stored.contact(contact.id)
    assert.equal(stored?.answeredAt?.toMillis(), NOW.toMillis())
  })

  test('an unknown id answers 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post(`/administrator/contacts/${UNKNOWN}/answer`)
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'CONTACT_NOT_FOUND')
  })

  test('without a session answers 401 and does not answer', async ({
    client,
    assert,
  }) => {
    const contact = await ContactFactory.create()

    const response = await client.post(
      `/administrator/contacts/${contact.id}/answer`,
    )

    response.assertStatus(401)
    assert.isNull((await Stored.contact(contact.id))?.answeredAt)
  })

  test('a member answers 403 and does not answer', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsNonStaff(client)
    const contact = await ContactFactory.create()

    const response = await client
      .post(`/administrator/contacts/${contact.id}/answer`)
      .cookies(session)

    response.assertStatus(403)
    assert.isNull((await Stored.contact(contact.id))?.answeredAt)
  })
})
