import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'

import { ErrorEnvelope } from '@maiyu/shared'

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
    const { user, session } = await signInWithFactory(client, 'staff')
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
    const { user, session } = await signInWithFactory(client, 'staff')
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

/**
 * `StoragePolicy.delete` (DECISIONS.md #803): the removal reaches the one who uploaded and the
 * staff of the tenant. Another member's file, another tenant's and another customer's answer the
 * 404 of a missing file, and the binary stays.
 */
test.group('storages > delete > autorização', (group) => {
  group.each.setup(() => resetDatabase())

  test('the member discards its own orphan, the avatar swap and the cancelled form', async ({
    client,
    assert,
  }) => {
    const member = await authenticateAsNonStaff(client)
    const file = await uploadFile(client, member)

    const response = await client.delete(`/storages/${file.id}`).cookies(member)

    response.assertStatus(204)
    assert.isNull(await Stored.storage(file.id))
    assert.isFalse(await drive.use().exists(file.path))
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("another member of the same tenant cannot delete a member's file: 404, the binary stays", async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsNonStaff(client)
    const other = await authenticateAsNonStaff(client)
    const file = await uploadFile(client, author)

    const response = await client.delete(`/storages/${file.id}`).cookies(other)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
    assert.isNotNull(await Stored.storage(file.id))
    assert.isTrue(await drive.use().exists(file.path))
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("another member cannot cancel a member's pending upload: 404, the upload stays", async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsNonStaff(client)
    const other = await authenticateAsNonStaff(client)
    const opened = await openUpload(client, author, {
      fileName: 'foto.png',
      mimetype: 'image/png',
      size: PART_SIZE * 2,
    })

    const response = await client
      .delete(`/storages/${opened.storage.id}`)
      .cookies(other)

    response.assertStatus(404)
    assert.isNotNull(await Stored.storage(opened.storage.id))
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test("the staff of the tenant deletes a member's orphan", async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsNonStaff(client)
    const staff = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, author)

    const response = await client.delete(`/storages/${file.id}`).cookies(staff)

    response.assertStatus(204)
    assert.isNull(await Stored.storage(file.id))
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  test('the staff of another tenant cannot delete the file: 404', async ({
    client,
    assert,
  }) => {
    const author = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, author)
    const elsewhere = await Tenants.create()
    const { session } = await signInWithFactory(client, 'staff', elsewhere)

    const response = await client
      .delete(`/storages/${file.id}`)
      .cookies(session)

    response.assertStatus(404)
    assert.isNotNull(await Stored.storage(file.id))
  })

  test('the customer deletes its own file; another customer and the tenant staff cannot', async ({
    client,
    assert,
  }) => {
    const store = await Tenants.create()
    const customer = await authenticateAsCustomer(client)
    const stranger = await authenticateAsCustomer(client)
    const staff = await signInWithFactory(client, 'staff', store)
    const path = await customerUploadPath(store)
    const proof = await uploadFile(client, customer, path)

    const foreign = await client
      .delete(`/storages/${proof.id}`)
      .cookies(stranger)
    const tenantStaff = await client
      .delete(`/storages/${proof.id}`)
      .cookies(staff.session)

    foreign.assertStatus(404)
    tenantStaff.assertStatus(404)
    assert.isNotNull(await Stored.storage(proof.id))

    const own = await client.delete(`/storages/${proof.id}`).cookies(customer)

    own.assertStatus(204)
    assert.isNull(await Stored.storage(proof.id))
  })

  test("the customer with no link to the store cannot delete a store's file: 404", async ({
    client,
    assert,
  }) => {
    const staff = await authenticateAsAdministrator(client)
    const file = await uploadFile(client, staff)
    const customer = await authenticateAsCustomer(client)

    const response = await client
      .delete(`/storages/${file.id}`)
      .cookies(customer)

    response.assertStatus(404)
    assert.isNotNull(await Stored.storage(file.id))
  })
})
