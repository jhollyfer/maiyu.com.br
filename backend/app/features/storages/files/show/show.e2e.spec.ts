import { test } from '@japa/runner'

import {
  ErrorEnvelope,
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
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'
import {
  customerUploadPath,
  openUpload,
  storageRow,
  uploadFile,
} from '#tests/storages-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/**
 * The file is a record the form does not own, and it is the one who uploaded it, or the staff of
 * the tenant, who reaches it by id (`StoragePolicy`, DECISIONS.md #803). Besides that, what rules is the state
 * (`PENDING` or `UPLOADED`) and the live reference.
 */

/** Opens an upload through the real endpoint and returns the envelope. */

/** Sends a part to the signed URL and returns the `ETag`. */

/** The whole path, from zero to `UPLOADED`, for a single-part file. */

/** A `storages` row with no binary at all: only the metadata matters here. */

test.group('storages > detalhe', (group) => {
  group.each.setup(() => resetDatabase())

  test('responds 200 with the derived url', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await storageRow()

    const response = await client
      .get(`/storages/${storage.id}`)
      .cookies(session)

    response.assertStatus(200)
    assert.equal(body(response, StoragesFileShowResponse).id, storage.id)
    assert.equal(
      body(response, StoragesFileShowResponse).originalName,
      'capa.png',
    )
    // Not a column: the model hook resolves it on read from `path`.
    assert.include(body(response, StoragesFileShowResponse).url, storage.path)
  })

  test('reaches the still PENDING upload', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await storageRow({ status: UPLOAD_STATUS.PENDING })

    // The detail screen is where one discovers that an upload was left half-done.
    // What requires `UPLOADED` is the attachment, not the read.
    const response = await client
      .get(`/storages/${storage.id}`)
      .cookies(session)

    response.assertStatus(200)
    assert.equal(body(response, StoragesFileShowResponse).status, 'PENDING')
  })

  test('nonexistent id responds 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get('/storages/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
  })

  test('malformed id responds 422 instead of a Postgres 500', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get('/storages/nao-e-uuid').cookies(session)

    response.assertStatus(422)
    // The key is the dotted path itself, and `property` would read it as a nested path.
    assert.include(
      Object.keys(body(response, ErrorEnvelope).errors ?? {}),
      'params.id',
    )
  })
})

test.group('storages > detalhe > acesso', (group) => {
  group.each.setup(() => resetDatabase())

  test('without a session responds 401', async ({ client }) => {
    const storage = await storageRow()

    const response = await client.get(`/storages/${storage.id}`)

    response.assertStatus(401)
  })
})

/**
 * `StoragePolicy.show` (DECISIONS.md #803): the detail hands out a signed URL, so it reaches the
 * one who uploaded and the staff of the tenant, never another member nor a stranger. The denial
 * is the 404 of a missing file.
 */
test.group('storages > detalhe > autorização', (group) => {
  group.each.setup(() => resetDatabase())

  test('the member sees the file it uploaded, even still PENDING', async ({
    client,
    assert,
  }) => {
    const member = await authenticateAsNonStaff(client)
    const opened = await openUpload(client, member, {
      fileName: 'foto.png',
      mimetype: 'image/png',
      size: 1024,
    })

    const response = await client
      .get(`/storages/${opened.storage.id}`)
      .cookies(member)

    response.assertStatus(200)
    assert.equal(body(response, StoragesFileShowResponse).status, 'PENDING')
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("another member of the same tenant does not see a member's pending photo: 404", async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsNonStaff(client)
    const other = await authenticateAsNonStaff(client)
    const opened = await openUpload(client, author, {
      fileName: 'foto.png',
      mimetype: 'image/png',
      size: 1024,
    })

    const response = await client
      .get(`/storages/${opened.storage.id}`)
      .cookies(other)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
    assert.notProperty(body(response), 'url')
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("the staff of the tenant sees a member's file", async ({ client }) => {
    const author = await authenticateAsNonStaff(client)
    const staff = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, author)

    const response = await client.get(`/storages/${file.id}`).cookies(staff)

    response.assertStatus(200)
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test('the staff of another tenant does not see the file: 404', async ({
    client,
  }) => {
    const author = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, author)
    const elsewhere = await Tenants.create()
    const { session } = await signInWithFactory(client, 'staff', elsewhere)

    const response = await client.get(`/storages/${file.id}`).cookies(session)

    response.assertStatus(404)
  })

  test("the customer sees the file it uploaded, the store's staff sees it too, and nobody else", async ({
    client,
  }) => {
    const store = await Tenants.create()
    const customer = await authenticateAsCustomer(client)
    const stranger = await authenticateAsCustomer(client)
    const staff = await signInWithFactory(client, 'staff', store)
    const proof = await uploadFile(
      client,
      customer,
      await customerUploadPath(store),
    )

    const own = await client.get(`/storages/${proof.id}`).cookies(customer)
    const foreign = await client.get(`/storages/${proof.id}`).cookies(stranger)
    const tenantStaff = await client
      .get(`/storages/${proof.id}`)
      .cookies(staff.session)

    own.assertStatus(200)
    foreign.assertStatus(404)
    // The staff of the store reads the proof (DECISIONS.md #803); it never writes it.
    tenantStaff.assertStatus(200)
  })

  test("the customer with no link to the store does not see a store's file: 404", async ({
    client,
  }) => {
    const staff = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, staff)
    const customer = await authenticateAsCustomer(client)

    const response = await client.get(`/storages/${file.id}`).cookies(customer)

    response.assertStatus(404)
  })
})

test.group('storages > detalhe > plataforma', (group) => {
  group.each.setup(() => resetDatabase())

  test("the platform team reads the platform's file and no tenant's", async ({
    client,
  }) => {
    const platformFile = await storageRow({ tenantId: null })
    const tenantFile = await storageRow()
    const admin = await authenticateAsPlatformAdministrator(client)

    const own = await client.get(`/storages/${platformFile.id}`).cookies(admin)
    const foreign = await client
      .get(`/storages/${tenantFile.id}`)
      .cookies(admin)

    own.assertStatus(200)
    foreign.assertStatus(404)
  })
})
