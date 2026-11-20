import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'

import { ErrorEnvelope, StoragesFileShowResponse } from '@maiyu/shared'

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
import { Stored } from '#tests/stored-fixtures'
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

test.group('storages > complete', (group) => {
  group.each.setup(() => resetDatabase())

  test('confirms the upload and the file becomes UPLOADED', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    assert.equal(storage.status, 'UPLOADED')
    assert.isTrue(await drive.use().exists(storage.path))
  })

  test('reassembles the parts of a multipart', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const size = PART_SIZE + SMALL.byteLength

    const opened = await openUpload(client, session, {
      fileName: 'galeria.png',
      mimetype: 'image/png',
      size,
    })

    const parts = [
      { partNumber: 1, etag: await putPart(partUrl(opened), FULL_PART) },
      { partNumber: 2, etag: await putPart(partUrl(opened, 1), SMALL) },
    ]

    const response = await client
      .post(`/storages/${opened.storage.id}/complete`)
      .cookies(session)
      .json({ parts })

    response.assertStatus(200)

    const metadata = await drive.use().getMetaData(opened.storage.path)

    assert.equal(metadata.contentLength, size)
    // The `uploadId` is zeroed: the conversation with the bucket is over, and keeping its
    // pointer would only keep alive an address that leads nowhere.
    assert.isNull(body(response, StoragesFileShowResponse).uploadId)
  })

  test('refuses with 422 when what was uploaded does not have the declared size', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    // Declares a thousand bytes and tries to upload ten. The first barrier is the bucket's:
    // the URL pins `content-length`, and a PUT with another size gets 403.
    const opened = await openUpload(client, session, {
      fileName: 'capa.png',
      mimetype: 'image/png',
      size: 1000,
    })

    const refused = await fetch(partUrl(opened), {
      method: 'PUT',
      body: new Uint8Array(10),
      headers: { 'Content-Type': 'image/png' },
    })
    assert.equal(refused.status, 403)

    // The second is `complete`, for the object that reached the bucket another
    // way (storage without the size signature): it writes directly, without the URL.
    await drive.use().put(opened.storage.path, Buffer.from(new Uint8Array(10)))

    const response = await client
      .post(`/storages/${opened.storage.id}/complete`)
      .cookies(session)
      .json({})

    response.assertStatus(422)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_SIZE_MISMATCH')

    // Refused is refused: neither the row nor the binary survive, and the record
    // never reaches `UPLOADED`.
    assert.isNull(await Stored.storage(opened.storage.id))
    assert.isFalse(await drive.use().exists(opened.storage.path))
  })

  test('confirming twice returns the same record', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    const again = await client
      .post(`/storages/${storage.id}/complete`)
      .cookies(session)
      .json({})

    again.assertStatus(200)
    assert.equal(body(again, StoragesFileShowResponse).id, storage.id)
    assert.equal(body(again, StoragesFileShowResponse).status, 'UPLOADED')
  })
})

test.group('storages > complete > acesso e identificador', (group) => {
  group.each.setup(() => resetDatabase())

  test('without a session responds 401', async ({ client }) => {
    const response = await client
      .post(`/storages/00000000-0000-4000-8000-000000000000/complete`)
      .json({})

    response.assertStatus(401)
  })

  test('nonexistent id responds 404', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post(`/storages/00000000-0000-4000-8000-000000000000/complete`)
      .cookies(session)
      .json({})

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
  })

  test('malformed id responds 422 instead of a Postgres 500', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .post('/storages/x/complete')
      .cookies(session)
      .json({})

    response.assertStatus(422)
    // The key is the dotted path itself, and `property` would read it as a nested path.
    assert.include(
      Object.keys(body(response, ErrorEnvelope).errors ?? {}),
      'params.id',
    )
  })
})

/**
 * `StoragePolicy.upload` (DECISIONS.md #803): closing an upload is the author's, or the staff of
 * the tenant's. Another member cannot hijack a pending upload by sending its own bytes to the
 * signed URL and confirming it, and cannot read a confirmed file through this route either.
 */
test.group('storages > complete > autorização', (group) => {
  group.each.setup(() => resetDatabase())

  test("another member cannot confirm a member's pending upload: 404, the upload stays PENDING and the author still completes it", async ({
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
    await putPart(partUrl(opened), SMALL)

    const attack = await client
      .post(`/storages/${opened.storage.id}/complete`)
      .cookies(other)
      .json({})

    attack.assertStatus(404)
    assert.equal(body(attack, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
    const row = await Stored.storage(opened.storage.id)
    assert.equal(row?.status, 'PENDING')

    const own = await client
      .post(`/storages/${opened.storage.id}/complete`)
      .cookies(author)
      .json({})

    own.assertStatus(200)
    assert.equal(body(own, StoragesFileShowResponse).status, 'UPLOADED')
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("another member gets no signed url from a member's confirmed file: 404", async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsNonStaff(client)
    const other = await authenticateAsNonStaff(client)
    const file = await uploadFile(client, author)

    const response = await client
      .post(`/storages/${file.id}/complete`)
      .cookies(other)
      .json({})

    response.assertStatus(404)
    assert.notProperty(body(response), 'url')
    assert.isTrue(await drive.use().exists(file.path))
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("the staff of the store cannot confirm the customer's upload: 404; the customer does", async ({
    client,
    assert,
  }) => {
    const store = await Tenants.create()
    const customer = await authenticateAsCustomer(client)
    const staff = await signInWithFactory(client, 'staff', store)
    const opened = await openUpload(
      client,
      customer,
      { fileName: 'pix.png', mimetype: 'image/png', size: SMALL.byteLength },
      await customerUploadPath(store),
    )
    await putPart(partUrl(opened), SMALL)

    const served = await client
      .post(`/storages/${opened.storage.id}/complete`)
      .cookies(staff.session)
      .json({})
    const own = await client
      .post(`/storages/${opened.storage.id}/complete`)
      .cookies(customer)
      .json({})

    served.assertStatus(404)
    own.assertStatus(200)
    assert.equal(body(own, StoragesFileShowResponse).status, 'UPLOADED')
  })

  test('the staff of another tenant cannot confirm: 404', async ({
    client,
  }) => {
    const author = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, author)
    const elsewhere = await Tenants.create()
    const { session } = await signInWithFactory(client, 'staff', elsewhere)

    const response = await client
      .post(`/storages/${file.id}/complete`)
      .cookies(session)
      .json({})

    response.assertStatus(404)
  })
})
