import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import {
  AdministratorContactShowResponse,
  ErrorEnvelope,
  ResponseRule,
} from '@maiyu/shared'

import { ContactFactory } from '#database/factories/contact.factory'
import {
  authenticateAsAdministrator,
  authenticateAsNonStaff,
  body,
  resetDatabase,
} from '#tests/http-fixtures'

const ContactsPage = ResponseRule.paginated(AdministratorContactShowResponse)

const BASE = DateTime.fromISO('2026-11-01T00:00:00Z')

/** A contact created `minutes` after `BASE`: separates the rows the order is read from. */
function createdAt(minutes: number) {
  return { createdAt: BASE.plus({ minutes }) }
}

/**
 * The panel inbox: `GET /administrator/contacts`. What is asserted is what the query does
 * before paginating (the fixed order, the page, the status cut and the search) and the two
 * refusals of the group (no session, no staff role).
 */
test.group('administrator/contacts > paginate', (group) => {
  group.each.setup(() => resetDatabase())

  test('lists 20 per page from the newest', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const rows = await ContactFactory.merge(
      Array.from({ length: 25 }, (_, index) => createdAt(index)),
    ).createMany(25)
    const newestFirst = rows.toReversed().map((row) => row.id)

    const first = await client.get('/administrator/contacts').cookies(session)
    const second = await client
      .get('/administrator/contacts')
      .qs({ page: 2 })
      .cookies(session)

    first.assertStatus(200)
    assert.deepEqual(
      body(first, ContactsPage).data.map((item) => item.id),
      newestFirst.slice(0, 20),
    )
    assert.deepInclude(body(first, ContactsPage).meta, {
      currentPage: 1,
      perPage: 20,
      total: 25,
      lastPage: 2,
    })
    assert.deepEqual(
      body(second, ContactsPage).data.map((item) => item.id),
      newestFirst.slice(20),
    )
  })

  test('status pending lists only unanswered', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const pending = await ContactFactory.create()
    await ContactFactory.merge({ answeredAt: DateTime.now() }).create()

    const response = await client
      .get('/administrator/contacts')
      .qs({ status: 'pending' })
      .cookies(session)

    response.assertStatus(200)
    assert.deepEqual(
      body(response, ContactsPage).data.map((item) => item.id),
      [pending.id],
    )
  })

  test('status answered lists only answered', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    await ContactFactory.create()
    const answered = await ContactFactory.merge({
      answeredAt: DateTime.now(),
    }).create()

    const response = await client
      .get('/administrator/contacts')
      .qs({ status: 'answered' })
      .cookies(session)

    response.assertStatus(200)
    assert.deepEqual(
      body(response, ContactsPage).data.map((item) => item.id),
      [answered.id],
    )
  })

  test('search matches name or email ignoring case', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const byName = await ContactFactory.merge({
      name: 'Beatriz Lima',
      email: 'bia@exemplo.com',
    }).create()
    const byEmail = await ContactFactory.merge({
      name: 'Carlos Dias',
      email: 'beatriz.dias@exemplo.com',
    }).create()
    await ContactFactory.merge({
      name: 'Diego Reis',
      email: 'diego@exemplo.com',
    }).create()

    const response = await client
      .get('/administrator/contacts')
      .qs({ search: 'BEATRIZ' })
      .cookies(session)

    response.assertStatus(200)
    assert.sameMembers(
      body(response, ContactsPage).data.map((item) => item.id),
      [byName.id, byEmail.id],
    )
  })

  test('a status outside the two answers 422 pointing at the field', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    // In the URL itself: the registry types `status` by the closed list, and the invalid
    // value this test exists to send would not compile in `.qs()`.
    const response = await client
      .get('/administrator/contacts?status=archived')
      .cookies(session)

    response.assertStatus(422)
    assert.property(body(response, ErrorEnvelope).errors, 'status')
  })

  test('without a session answers 401', async ({ client, assert }) => {
    await ContactFactory.create()

    const response = await client.get('/administrator/contacts')

    response.assertStatus(401)
    assert.equal(body(response, ErrorEnvelope).code, 'AUTHENTICATION_REQUIRED')
  })

  test('a member answers 403', async ({ client, assert }) => {
    const session = await authenticateAsNonStaff(client)
    await ContactFactory.create()

    const response = await client
      .get('/administrator/contacts')
      .cookies(session)

    response.assertStatus(403)
    assert.equal(body(response, ErrorEnvelope).code, 'ACCESS_DENIED')
  })
})
