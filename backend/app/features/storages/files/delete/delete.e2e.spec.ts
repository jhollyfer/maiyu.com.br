import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'

import { ErrorEnvelope } from '@maiyu/shared'

import { PART_SIZE } from '#services/multipart/multipart.contract'
import {
  authenticateAsAdministrator,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import {
  openUpload,
  partUrl,
  putPart,
  uploadFile,
  pngBytes,
} from '#tests/storages-fixtures'
import { Stored } from '#tests/stored-fixtures'

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

/** A `storages` row with no binary at all: only the metadata matters here. */

test.group('storages > delete', (group) => {
  group.each.setup(() => resetDatabase())

  test('deletes the orphan file, and the binary vanishes from the bucket along with it', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    // The binary exists beforehand: without this assertion, a `delete` that deleted
    // nothing would pass the one below vacuously.
    assert.isTrue(await drive.use().exists(storage.path))

    const response = await client
      .delete(`/storages/${storage.id}`)
      .cookies(session)

    response.assertStatus(204)

    assert.isNull(await Stored.storage(storage.id))
    assert.isFalse(await drive.use().exists(storage.path))
  })

  test('cancels an upload in progress and discards the parts', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const opened = await openUpload(client, session, {
      fileName: 'galeria.png',
      mimetype: 'image/png',
      size: PART_SIZE * 2,
    })

    await putPart(partUrl(opened), FULL_PART)

    const response = await client
      .delete(`/storages/${opened.storage.id}`)
      .cookies(session)

    response.assertStatus(204)

    assert.isNull(await Stored.storage(opened.storage.id))
    // The upload ceased to exist: asking to resume it now is 404.
    const resumed = await client
      .get(`/storages/${opened.storage.id}/parts`)
      .cookies(session)
    resumed.assertStatus(404)
  })

  test('refuses with 409 the file in use as an avatar', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client, 'administrator')
    const storage = await uploadFile(client, session)

    // The avatar is the reference the kit itself has (`STORAGE_REFERENCES`); the screen that
    // sets it is the project's, so the row is linked directly.
    user.avatarId = storage.id
    await user.save()

    const response = await client
      .delete(`/storages/${storage.id}`)
      .cookies(session)

    response.assertStatus(409)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_IN_USE')

    // The 409 cannot be a "deleted and complained": record and binary are still there.
    assert.isNotNull(await Stored.storage(storage.id))
    assert.isTrue(await drive.use().exists(storage.path))
  })

  test('accepts again after the attachment is unlinked', async ({
    client,
    assert,
  }) => {
    const { user, session } = await signInWithFactory(client, 'administrator')
    const storage = await uploadFile(client, session)

    user.avatarId = storage.id
    await user.save()
    user.avatarId = null
    await user.save()

    const response = await client
      .delete(`/storages/${storage.id}`)
      .cookies(session)

    response.assertStatus(204)
    assert.isNull(await Stored.storage(storage.id))
  })

  test('responds 404 for a nonexistent id', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client
      .delete('/storages/00000000-0000-4000-8000-000000000000')
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
  })

  test('requires a session', async ({ client }) => {
    const response = await client.delete(
      '/storages/00000000-0000-4000-8000-000000000000',
    )

    response.assertStatus(401)
  })
})

test.group('storages > delete > identificador', (group) => {
  group.each.setup(() => resetDatabase())

  test('malformed id responds 422 instead of a Postgres 500', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.delete('/storages/x').cookies(session)

    response.assertStatus(422)
    // The key is the dotted path itself, and `property` would read it as a nested path.
    assert.include(
      Object.keys(body(response, ErrorEnvelope).errors ?? {}),
      'params.id',
    )
  })
})
