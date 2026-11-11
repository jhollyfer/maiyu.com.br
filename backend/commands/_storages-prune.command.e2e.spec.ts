import app from '@adonisjs/core/services/app'
import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'

import StoragesPrune from '#commands/storages-prune.command'
import { UserFactory } from '#database/factories/user.factory'
import {
  MultipartContract,
  PART_SIZE,
} from '#services/multipart/multipart.contract'
import {
  authenticateAsAdministrator,
  resetDatabase,
} from '#tests/http-fixtures'
import {
  openUpload,
  partUrl,
  putPart,
  uploadFile,
  pngBytes,
  storageExists,
  ageStorage,
} from '#tests/storages-fixtures'
import { Stored } from '#tests/stored-fixtures'

/**
 * The file as a neutral, shared record: it does not belong to the form that sent it,
 * and ownership authorizes nothing. What rules is the state (`PENDING` or `UPLOADED`)
 * and the live reference.
 */

/**
 * Content of a non-final part. S3 refuses less than 5 MB
 * (`EntityTooSmall`), and `PART_SIZE` is what the server promises per part.
 */
const FULL_PART = pngBytes(PART_SIZE, 65)

const SMALL = pngBytes(1024)

/** Points a user's avatar at the file: the reference the sweep must respect. */
async function attachAsAvatar(storageId: string): Promise<void> {
  const user = await UserFactory.create()

  await Stored.attachAvatar(user.id, storageId)
}

/**
 * The sweep of abandoned `PENDING` and orphan `UPLOADED` (`node ace storages:prune`).
 *
 * `PENDING` is the only state one never leaves on one's own: whoever closes the tab
 * mid-upload never calls `complete` or `DELETE`, and the row stays up with the
 * parts hanging in the bucket, invisible in the object listing and billed
 * anyway. It is the command that closes the state machine.
 */
test.group('storages > prune', (group) => {
  group.each.setup(() => resetDatabase())

  /** Ages the row in the database: it is the age the command uses to decide. */
  const age = ageStorage

  async function prune(...args: Array<string>) {
    const ace = await app.container.make('ace')
    const command = await ace.create(StoragesPrune, args)

    await command.exec()

    return command
  }

  test('deletes the old PENDING and aborts its multipart', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const multipart = await app.container.make(MultipartContract)

    const opened = await openUpload(client, session, {
      fileName: 'galeria.png',
      mimetype: 'image/png',
      size: PART_SIZE + SMALL.byteLength,
    })

    // One part goes up and the other does not: it is the abandonment midway, and these
    // orphan parts are what only the abort reaches.
    await putPart(partUrl(opened), FULL_PART)
    await age(opened.storage.id, 48)

    const command = await prune()

    command.assertSucceeded()

    assert.isFalse(await storageExists(opened.storage.id))
    // Listing the parts of an aborted upload is an error, not an empty list - it is the
    // difference between "aborted" and "open with no part at all".
    const { uploadId } = opened
    if (!uploadId) throw new Error('a multipart upload opened without uploadId')
    await assert.rejects(() =>
      multipart.listParts(opened.storage.path, uploadId),
    )
  })

  test('does not touch a recent PENDING', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const opened = await openUpload(client, session, {
      fileName: 'capa.png',
      mimetype: 'image/png',
      size: SMALL.byteLength,
    })

    const command = await prune()

    command.assertSucceeded()

    assert.isTrue(await storageExists(opened.storage.id))
  })

  test('deletes the old orphan UPLOADED, binary and row', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    await age(storage.id, 48)

    const command = await prune()

    command.assertSucceeded()

    assert.isFalse(await storageExists(storage.id))
    assert.isFalse(await drive.use().exists(storage.path))
  })

  test('does not touch an UPLOADED in use, however old it is', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    await attachAsAvatar(storage.id)
    await age(storage.id, 24 * 365)

    const command = await prune()

    command.assertSucceeded()

    assert.isTrue(await storageExists(storage.id))
    assert.isTrue(await drive.use().exists(storage.path))
  })

  test('does not touch a recent orphan UPLOADED', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    const command = await prune()

    command.assertSucceeded()

    assert.isTrue(await storageExists(storage.id))
  })

  test('--hours adjusts the cutoff', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const opened = await openUpload(client, session, {
      fileName: 'capa.png',
      mimetype: 'image/png',
      size: SMALL.byteLength,
    })

    await age(opened.storage.id, 2)

    // Survives the 24h default and does not survive a one-hour cutoff.
    await prune()
    assert.isTrue(await storageExists(opened.storage.id))

    await prune('--hours=1')
    assert.isFalse(await storageExists(opened.storage.id))
  })

  test('--dry-run lists without deleting', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)

    const opened = await openUpload(client, session, {
      fileName: 'capa.png',
      mimetype: 'image/png',
      size: SMALL.byteLength,
    })

    await age(opened.storage.id, 48)

    const command = await prune('--dry-run')

    command.assertSucceeded()

    assert.isTrue(await storageExists(opened.storage.id))
  })
})
