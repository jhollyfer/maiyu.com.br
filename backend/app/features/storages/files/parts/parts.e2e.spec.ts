import { test } from '@japa/runner'

import { ErrorEnvelope, StoragesFileUploadResponse } from '@maiyu/shared'

import { PART_SIZE } from '#services/multipart/multipart.contract'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import {
  openUpload,
  partUrl,
  putPart,
  uploadFile,
  pngBytes,
} from '#tests/storages-fixtures'

/**
 * The file as a neutral, shared record: it does not belong to the
 * form that submitted it, and ownership authorizes nothing. What rules is the state
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
