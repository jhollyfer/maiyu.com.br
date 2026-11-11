import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { ErrorEnvelope } from '@maiyu/shared'

import { StorageContract } from '#services/storage/storage.contract'
import {
  authenticateAsAdministrator,
  authenticateAsNonStaff,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { uploadFile } from '#tests/storages-fixtures'

/**
 * The file as a neutral, shared record: it does not belong to the
 * form that submitted it, and ownership authorizes nothing. What rules is the state
 * (`PENDING` or `UPLOADED`) and the live reference.
 */

/** A `storages` row with no binary at all: only the metadata matters here. */

test.group('storages > download', (group) => {
  group.each.setup(() => resetDatabase())

  test('refuses whoever has no session', async ({ client }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    // With the bucket private, this route is the only path to the binary. Open,
    // it issued a signed URL for any uuid without a session - the back
    // door the closing of the bucket left open.
    const response = await client
      .get(`/storages/${storage.id}/download`)
      .redirects(0)

    response.assertStatus(401)
  })

  test('redirects to a temporary bucket URL', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    // Without following the redirect, to see what the **application** responds.
    const response = await client
      .get(`/storages/${storage.id}/download`)
      .cookies(session)
      .redirects(0)

    response.assertStatus(302)

    const location = response.header('location')

    // Signed and temporary: never the raw, permanent URL of the object.
    assert.include(location, 'X-Amz-Signature')
    assert.include(location, 'X-Amz-Expires')
  })

  test('the file arrives with the original name at the end of the redirect', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, session)

    const response = await client
      .get(`/storages/${storage.id}/download`)
      .cookies(session)

    response.assertStatus(200)

    const disposition = response.header('content-disposition')

    assert.include(disposition, 'attachment')
    // Both names, as RFC 6266 asks.
    assert.include(disposition, 'filename="capa.png"')
    assert.include(disposition, "filename*=UTF-8''capa.png")
  })

  test('the advisor cannot download a file that is not theirs: only the administrator operates the collection', async ({
    client,
  }) => {
    const admin = await authenticateAsAdministrator(client)
    const storage = await uploadFile(client, admin)

    const advisor = await authenticateAsNonStaff(client)

    const response = await client
      .get(`/storages/${storage.id}/download`)
      .cookies(advisor)
      .redirects(0)

    response.assertStatus(404)
  })

  test('responds 404 for a nonexistent id', async ({ client, assert }) => {
    const session = await authenticateAsAdministrator(client)
    const response = await client
      .get('/storages/00000000-0000-4000-8000-000000000000/download')
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
  })
})

/**
 * The header that makes the file arrive with the name the person uploaded.
 *
 * RFC 6266 asks for both names: `filename=` carries only ASCII, and
 * `filename*=UTF-8''` is what preserves accents. Sending only one of them breaks
 * half of the clients.
 */
test.group('storages > contentDisposition', () => {
  test('keeps the accent in the UTF-8 version and removes it in the ASCII one', async ({
    assert,
  }) => {
    const service = await app.container.make(StorageContract)

    const header = service.contentDisposition('Relatório Anual.pdf')

    assert.include(header, 'filename="Relatorio Anual.pdf"')
    assert.include(header, "filename*=UTF-8''Relat%C3%B3rio%20Anual.pdf")
  })

  test('neutralizes quotes, which would escape the header', async ({
    assert,
  }) => {
    const service = await app.container.make(StorageContract)

    const header = service.contentDisposition('nota "final".pdf')

    assert.include(header, 'filename="nota _final_.pdf"')
  })
})

test.group('storages > download > identificador', (group) => {
  group.each.setup(() => resetDatabase())

  test('malformed id responds 422 instead of a Postgres 500', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get('/storages/x/download').cookies(session)

    response.assertStatus(422)
    assert.property(body(response, ErrorEnvelope).errors, 'params.id')
  })
})
