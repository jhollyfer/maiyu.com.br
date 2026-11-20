import { test } from '@japa/runner'

import { ErrorEnvelope, StoragesFileUploadResponse } from '@maiyu/shared'

import { PART_SIZE } from '#services/multipart/multipart.contract'
import {
  authenticateAsAdministrator,
  authenticateAsCustomer,
  authenticateAsNonStaff,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'
import {
  customerUploadPath,
  openUpload,
  partUrl,
  putPart,
  uploadFile,
  pngBytes,
} from '#tests/storages-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/**
 * The file is a record the form does not own, and it is the one who uploaded it, or the staff of
 * the tenant, who reaches it by id (`StoragePolicy`, DECISIONS.md #803). Besides that, what rules is the state
 * (`PENDING` or `UPLOADED`) and the live reference.
 */

/**
 * Content of a non-final part. S3 refuses less than 5 MB
 * (`EntityTooSmall`), and `PART_SIZE` is what the server promises per part.
 */
const FULL_PART = pngBytes(PART_SIZE, 65)

const SMALL = pngBytes(1024)

/** A `storages` row with no binary at all: only the metadata matters here. */

test.group('storages > parts', (group) => {
  group.each.setup(() => resetDatabase())

  test('lists what was uploaded and signs only what is missing', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const opened = await openUpload(client, session, {
      fileName: 'galeria.png',
      mimetype: 'image/png',
      size: PART_SIZE * 2 + SMALL.byteLength,
    })

    assert.equal(opened.totalParts, 3)

    // Uploads the first two and "drops" before the third.
    await putPart(partUrl(opened), FULL_PART)
    await putPart(partUrl(opened, 1), FULL_PART)

    const response = await client
      .get(`/storages/${opened.storage.id}/parts`)
      .cookies(session)

    response.assertStatus(200)

    const resumed = body(response, StoragesFileUploadResponse)

    assert.deepEqual(
      resumed.uploaded.map((part: { partNumber: number }) => part.partNumber),
      [1, 2],
    )
    assert.deepEqual(
      resumed.parts.map((part: { partNumber: number }) => part.partNumber),
      [3],
    )
    assert.equal(resumed.totalParts, 3)
    assert.equal(resumed.partSize, PART_SIZE)
  })

  test('the returned URL really uploads - re-signing cannot give a broken address', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const opened = await openUpload(client, session, {
      fileName: 'galeria.png',
      mimetype: 'image/png',
      size: PART_SIZE + SMALL.byteLength,
    })

    const response = await client
      .get(`/storages/${opened.storage.id}/parts`)
      .cookies(session)

    await putPart(
      partUrl(body(response, StoragesFileUploadResponse)),
      FULL_PART,
    )

    const after = await client
      .get(`/storages/${opened.storage.id}/parts`)
      .cookies(session)

    assert.lengthOf(body(after, StoragesFileUploadResponse).uploaded, 1)
  })

  test('an already confirmed file responds with empty lists', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    const response = await client
      .get(`/storages/${storage.id}/parts`)
      .cookies(session)

    response.assertStatus(200)
    assert.isEmpty(body(response, StoragesFileUploadResponse).parts)
    assert.isEmpty(body(response, StoragesFileUploadResponse).uploaded)
    assert.equal(
      body(response, StoragesFileUploadResponse).storage.status,
      'UPLOADED',
    )
  })
})

test.group('storages > parts > acesso e identificador', (group) => {
  group.each.setup(() => resetDatabase())

  test('without a session responds 401', async ({ client }) => {
    const response = await client.get(
      `/storages/00000000-0000-4000-8000-000000000000/parts`,
    )

    response.assertStatus(401)
  })

  test('nonexistent id responds 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .get(`/storages/00000000-0000-4000-8000-000000000000/parts`)
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
  })

  test('malformed id responds 422 instead of a Postgres 500', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get('/storages/x/parts').cookies(session)

    response.assertStatus(422)
    // The key is the dotted path itself, and `property` would read it as a nested path.
    assert.include(
      Object.keys(body(response, ErrorEnvelope).errors ?? {}),
      'params.id',
    )
  })
})

/**
 * `StoragePolicy.upload` (DECISIONS.md #803): the route hands out the signed PUT URLs and the
 * signed `url` of the file, so it reaches the one who uploaded and the staff of the tenant, and a
 * customer's file is the customer's alone. The denial is the 404 of a missing file.
 */
test.group('storages > parts > autorização', (group) => {
  group.each.setup(() => resetDatabase())

  test("another member cannot get the signed URLs of a member's pending upload: 404", async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsNonStaff(client)
    const other = await authenticateAsNonStaff(client)
    const opened = await openUpload(client, author, {
      fileName: 'foto.png',
      mimetype: 'image/png',
      size: SMALL.byteLength,
    })

    const response = await client
      .get(`/storages/${opened.storage.id}/parts`)
      .cookies(other)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
    assert.notProperty(body(response), 'parts')
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("another member cannot get the signed url of a member's confirmed file: 404", async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsNonStaff(client)
    const other = await authenticateAsNonStaff(client)
    const file = await uploadFile(client, author)

    const response = await client
      .get(`/storages/${file.id}/parts`)
      .cookies(other)

    response.assertStatus(404)
    assert.notProperty(body(response), 'storage')
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test('the author resumes its own upload, and the staff of the tenant too', async ({
    client,
  }) => {
    const author = await authenticateAsNonStaff(client)
    const staff = await authenticateAsAdministrator(client)
    const opened = await openUpload(client, author, {
      fileName: 'foto.png',
      mimetype: 'image/png',
      size: SMALL.byteLength,
    })

    const own = await client
      .get(`/storages/${opened.storage.id}/parts`)
      .cookies(author)
    const served = await client
      .get(`/storages/${opened.storage.id}/parts`)
      .cookies(staff)

    own.assertStatus(200)
    served.assertStatus(200)
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("the staff of the store does not get the signed url of the customer's file: 404; the customer does", async ({
    client,
  }) => {
    const store = await Tenants.create()
    const customer = await authenticateAsCustomer(client)
    const staff = await signInWithFactory(client, 'staff', store)
    const proof = await uploadFile(
      client,
      customer,
      await customerUploadPath(store),
    )

    const served = await client
      .get(`/storages/${proof.id}/parts`)
      .cookies(staff.session)
    const own = await client
      .get(`/storages/${proof.id}/parts`)
      .cookies(customer)

    served.assertStatus(404)
    own.assertStatus(200)
  })

  test('the staff of another tenant gets 404', async ({ client }) => {
    const author = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, author)
    const elsewhere = await Tenants.create()
    const { session } = await signInWithFactory(client, 'staff', elsewhere)

    const response = await client
      .get(`/storages/${file.id}/parts`)
      .cookies(session)

    response.assertStatus(404)
  })
})
