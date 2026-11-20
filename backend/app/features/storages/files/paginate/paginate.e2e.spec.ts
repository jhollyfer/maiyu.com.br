import emitter from '@adonisjs/core/services/emitter'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import {
  ErrorEnvelope,
  ResponseRule,
  StoragesFileShowResponse,
  UPLOAD_STATUS,
} from '@maiyu/shared'

import {
  authenticateAsAdministrator,
  authenticateAsCustomer,
  authenticateAsNonStaff,
  authenticateAsPlatformAdministrator,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import { QueryCount } from '#tests/query-count-fixtures'
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'
import {
  customerUploadPath,
  openUpload,
  storageRow,
  uploadFile,
} from '#tests/storages-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

const StoragesPage = ResponseRule.paginated(StoragesFileShowResponse)

/**
 * The file is a record the form does not own, and it is the one who uploaded it, or the staff of
 * the tenant, who reaches it by id (`StoragePolicy`, DECISIONS.md #803). Besides that, what rules is the state
 * (`PENDING` or `UPLOADED`) and the live reference.
 */

/** Opens an upload through the real endpoint and returns the envelope. */

/** Sends a part to the signed URL and returns the `ETag`. */

/** The whole path, from zero to `UPLOADED`, for a single-part file. */

/** A `storages` row with no binary at all: only the metadata matters here. */

/**
 * The panel file library: `GET /storages` and `GET /storages/:id`.
 *
 * `backend-old` served both on `/storage/paginate` and `/storage/:id`, and the
 * screens that consume them survived the migration. What is asserted here is what the
 * query does before paginating - the default order, the two filters and the scope of the
 * search - and that the detail also reaches the half-finished upload.
 */
test.group('storages > listagem', (group) => {
  group.each.setup(() => resetDatabase())

  test('the default order is from most recent to oldest', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const older = await storageRow({ originalName: 'antigo.png' })
    const recent = await storageRow({ originalName: 'recente.png' })

    // `createdAt` comes from `autoCreate` and the two rows are born in the same
    // millisecond: without separating them, the order would be the database's and the test would pass
    // with any `orderBy`.
    await older.merge({ createdAt: DateTime.now().minus({ days: 2 }) }).save()

    const response = await client.get('/storages').cookies(session)

    response.assertStatus(200)
    assert.deepEqual(
      body(response, StoragesPage).data.map((item) => item.id),
      [recent.id, older.id],
    )
    // Page 1 with 20 items is the default of every panel resource.
    assert.equal(body(response, StoragesPage).meta.currentPage, 1)
    assert.equal(body(response, StoragesPage).meta.perPage, 20)
  })

  test('?status narrows to the open upload', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    await storageRow()
    const pending = await storageRow({ status: UPLOAD_STATUS.PENDING })

    const response = await client
      .get('/storages')
      .qs({ status: 'PENDING' })
      .cookies(session)

    response.assertStatus(200)
    assert.lengthOf(body(response, StoragesPage).data, 1)
    assert.equal(body(response, StoragesPage).data.at(0)?.id, pending.id)
  })

  test('?mimetype narrows to one type only', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    await storageRow()
    const pdf = await storageRow({ mimetype: 'application/pdf' })

    const response = await client
      .get('/storages')
      .qs({ mimetype: 'application/pdf' })
      .cookies(session)

    response.assertStatus(200)
    assert.lengthOf(body(response, StoragesPage).data, 1)
    assert.equal(body(response, StoragesPage).data.at(0)?.id, pdf.id)
  })

  test('?search does not escape the status filter', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const confirmed = await storageRow({ originalName: 'contrato.pdf' })
    // Matches the search by **mimetype**, not by original name, and is
    // `PENDING`: with the loose `OR` it would show up even with `?status=UPLOADED`,
    // because the `OR` cancels the previous `AND`. The term has to land on a column
    // after the first, otherwise the grouped `OR` and the loose one answer the same and the
    // test measures nothing.
    await storageRow({
      originalName: 'sem-o-termo-no-nome.png',
      mimetype: 'application/pdf',
      status: UPLOAD_STATUS.PENDING,
    })

    const response = await client
      .get('/storages')
      .qs({ search: 'pdf', status: 'UPLOADED' })
      .cookies(session)

    response.assertStatus(200)
    assert.lengthOf(body(response, StoragesPage).data, 1)
    assert.equal(body(response, StoragesPage).data.at(0)?.id, confirmed.id)
  })

  test('?sort outside the closed tuple responds 422 pointing at the field', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    // `path` is a `storages` column, but not a sort column: the value would go
    // straight into `orderBy` and compose SQL.
    //
    // The query goes in the URL itself, not in `.qs()`: the Tuyau registry types the
    // object by the closed tuple, and the invalid value this test exists to
    // send would not compile.
    const response = await client.get('/storages?sort=path').cookies(session)

    response.assertStatus(422)
    assert.property(body(response, ErrorEnvelope).errors, 'sort')
  })

  // The ceilings of `Rule.pageFields()` (#382): without them `perPage=100000` reads the whole
  // table in one response and `page=1e308` reaches the offset.
  test('?perPage and ?page above the ceiling respond 422 pointing at the field', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    for (const [query, field] of [
      ['perPage=101', 'perPage'],
      ['perPage=0', 'perPage'],
      ['perPage=1.5', 'perPage'],
      ['page=10001', 'page'],
      ['page=0', 'page'],
      ['page=1e308', 'page'],
    ] as const) {
      // In the URL itself, like `?sort=path`: the value exists to be refused.
      const response = await client.get(`/storages?${query}`).cookies(session)

      response.assertStatus(422)
      assert.property(body(response, ErrorEnvelope).errors, field, query)
    }
  })

  test('?perPage and ?page at the ceiling are accepted', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get('/storages?perPage=100&page=10000')
      .cookies(session)

    response.assertStatus(200)
    assert.equal(body(response, StoragesPage).meta.perPage, 100)
    assert.lengthOf(body(response, StoragesPage).data, 0)
  })

  // The cost of the listing is locked (#382): two rows or twenty, the count is the same, and a
  // refused query stops before the page is read.
  test('the listing costs 6 queries, whatever the number of rows', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    await storageRow()
    await storageRow()

    await QueryCount.assert(
      assert,
      emitter,
      () => client.get('/storages').cookies(session),
      6,
    )
  })

  test('a refused ?sort costs 4 queries, before any select', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    await QueryCount.assert(
      assert,
      emitter,
      () => client.get('/storages?sort=path').cookies(session),
      4,
    )
  })

  test('without a session responds 401', async ({ client }) => {
    const response = await client.get('/storages')

    response.assertStatus(401)
  })
})

/**
 * Who lists what (DECISIONS.md #803): the staff of the tenant lists every file, any other account
 * only what it uploaded, and the end customer only what it owns. The same rule as the detail.
 */
test.group('storages > listagem > escopo', (group) => {
  group.each.setup(() => resetDatabase())

  const idsOf = (response: Parameters<typeof body>[0]): string[] =>
    body(response, StoragesPage).data.map((file) => file.id)

  test("a member does not list another member's pending photo, and the staff lists both", async ({
    client,
    assert,
  }) => {
    const a = await authenticateAsNonStaff(client)
    const b = await authenticateAsNonStaff(client)
    const staff = await authenticateAsAdministrator(client)
    const own = await uploadFile(client, a)
    const opened = await openUpload(client, b, {
      fileName: 'foto.png',
      mimetype: 'image/png',
      size: 1024,
    })

    const listedByA = await client.get('/storages').cookies(a)
    const listedByB = await client.get('/storages').cookies(b)
    const listedByStaff = await client.get('/storages').cookies(staff)

    listedByA.assertStatus(200)
    assert.deepEqual(idsOf(listedByA), [own.id])
    assert.deepEqual(idsOf(listedByB), [opened.storage.id])
    assert.sameMembers(idsOf(listedByStaff), [own.id, opened.storage.id])
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test('the customer lists only its own files, and the staff of the store lists all of them', async ({
    client,
    assert,
  }) => {
    const store = await Tenants.create()
    const customer = await authenticateAsCustomer(client)
    const other = await authenticateAsCustomer(client)
    const staff = await signInWithFactory(client, 'staff', store)
    const path = await customerUploadPath(store)
    const own = await uploadFile(client, customer, path)
    const foreign = await uploadFile(client, other, path)

    const listed = await client.get('/storages').cookies(customer)
    const listedByStaff = await client.get('/storages').cookies(staff.session)

    assert.deepEqual(idsOf(listed), [own.id])
    assert.sameMembers(idsOf(listedByStaff), [own.id, foreign.id])
  })

  test('the staff of another tenant does not list the file', async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, author)
    const elsewhere = await Tenants.create()
    const { session } = await signInWithFactory(client, 'staff', elsewhere)

    const listed = await client.get('/storages').cookies(session)

    assert.notInclude(idsOf(listed), file.id)
  })

  test("the platform team lists the platform's files and no tenant's", async ({
    client,
    assert,
  }) => {
    const platformFile = await storageRow({ tenantId: null })
    await storageRow()
    const admin = await authenticateAsPlatformAdministrator(client)

    const listed = await client.get('/storages').cookies(admin)

    assert.deepEqual(idsOf(listed), [platformFile.id])
  })
})
