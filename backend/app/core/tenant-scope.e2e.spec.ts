import { test } from '@japa/runner'

import {
  ErrorEnvelope,
  ResponseRule,
  StoragesFileShowResponse,
  UPLOAD_STATUS,
} from '@maiyu/shared'

import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import {
  authenticate,
  authenticateAsCustomer,
  body,
  resetDatabase,
  signInWithFactory,
} from '#tests/http-fixtures'
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'
import {
  customerUploadPath,
  storageRow,
  uploadFile,
} from '#tests/storages-fixtures'
import { Tenants } from '#tests/tenants-fixtures'
import { loginOf } from '#tests/users-fixtures'

const StoragesPage = ResponseRule.paginated(StoragesFileShowResponse)

/**
 * Zero leakage between tenants (DECISIONS.md #390), proved over HTTP on the kit's one tenant-owned
 * resource, the file library: a record of another tenant answers exactly what a missing record
 * answers, on every route that reaches it by id, and never shows in a list. The filter is the
 * repository base's (`TenantScoped`), so a new resource that uses it inherits this proof.
 */
test.group('tenant scope > zero leakage', (group) => {
  group.each.setup(() => resetDatabase())

  test("another tenant's file is 404 on show, download and delete, and absent from the list", async ({
    client,
    assert,
  }) => {
    const owner = await Tenants.create()
    const file = await storageRow({ tenantId: owner.id })
    const { session } = await signInWithFactory(
      client,
      'staff',
      await Tenants.create(),
    )

    for (const request of [
      client.get(`/storages/${file.id}`),
      client.get(`/storages/${file.id}/download`),
      client.delete(`/storages/${file.id}`),
    ]) {
      const response = await request.cookies(session)
      response.assertStatus(404)
      assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
    }

    const list = await client.get('/storages').cookies(session)
    list.assertStatus(200)
    assert.deepEqual(body(list, StoragesPage).data, [])
  })

  test("a parent tenant reads its child's file and never deletes it", async ({
    client,
    assert,
  }) => {
    const parent = await Tenants.create()
    const child = await Tenants.create({ parentId: parent.id })
    const file = await storageRow({ tenantId: child.id })
    const { session } = await signInWithFactory(client, 'staff', parent)

    const shown = await client.get(`/storages/${file.id}`).cookies(session)
    shown.assertStatus(200)

    const list = await client.get('/storages').cookies(session)
    assert.deepEqual(
      body(list, StoragesPage).data.map((item) => item.id),
      [file.id],
    )

    const removed = await client.delete(`/storages/${file.id}`).cookies(session)
    removed.assertStatus(404)
  })

  // `parts` hands out presigned PUT URLs: a write, so the parent that reads its child's file
  // must not get them for the child's open upload (DECISIONS.md #394).
  test("a parent tenant gets no upload URLs for its child's open file", async ({
    client,
    assert,
  }) => {
    const parent = await Tenants.create()
    const child = await Tenants.create({ parentId: parent.id })
    const file = await storageRow({
      tenantId: child.id,
      status: UPLOAD_STATUS.PENDING,
    })
    const { session } = await signInWithFactory(client, 'staff', parent)

    const response = await client
      .get(`/storages/${file.id}/parts`)
      .cookies(session)

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
  })

  test('a child tenant does not read its parent', async ({ client }) => {
    const parent = await Tenants.create()
    const child = await Tenants.create({ parentId: parent.id })
    const file = await storageRow({ tenantId: parent.id })
    const { session } = await signInWithFactory(client, 'staff', child)

    const response = await client.get(`/storages/${file.id}`).cookies(session)

    response.assertStatus(404)
  })

  test('an upload is born in the session tenant, under its prefix', async ({
    client,
    assert,
  }) => {
    const { session, tenant } = await signInWithFactory(client, 'staff')
    if (!tenant) return assert.fail('the administrator has a tenant')

    const file = await uploadFile(client, session)

    assert.isTrue(file.path.startsWith(`${tenant.id}/`))
  })

  test("a parent tenant does not confirm its child's open upload", async ({
    client,
    assert,
  }) => {
    const parent = await Tenants.create()
    const child = await Tenants.create({ parentId: parent.id })
    const file = await storageRow({
      tenantId: child.id,
      status: UPLOAD_STATUS.PENDING,
    })
    const { session } = await signInWithFactory(client, 'staff', parent)

    const response = await client
      .post(`/storages/${file.id}/complete`)
      .cookies(session)
      .json({})

    response.assertStatus(404)
    assert.equal(body(response, ErrorEnvelope).code, 'STORAGE_NOT_FOUND')
  })

  // An account with no membership owns no rows: before, every such account shared the platform's
  // files (`tenant_id` null), with signed URLs and delete (DECISIONS.md #394).
  test('an account with no membership reads, deletes and opens nothing', async ({
    client,
    assert,
  }) => {
    const platformFile = await storageRow({ tenantId: null })
    const user = await UserFactory.create()
    const session = await authenticate(client, loginOf(user), FACTORY_PASSWORD)

    const list = await client.get('/storages').cookies(session)
    list.assertStatus(200)
    assert.deepEqual(body(list, StoragesPage).data, [])

    for (const request of [
      client.get(`/storages/${platformFile.id}`),
      client.delete(`/storages/${platformFile.id}`),
    ]) {
      const response = await request.cookies(session)
      response.assertStatus(404)
    }

    const opened = await client
      .post('/storages')
      .cookies(session)
      .json({ fileName: 'capa.png', mimetype: 'image/png', size: 1024 })
    opened.assertStatus(403)
    assert.equal(body(opened, ErrorEnvelope).code, 'TENANT_REQUIRED')
  })

  test("the platform owner reads the platform's files and no tenant's", async ({
    client,
    assert,
  }) => {
    const platformFile = await storageRow({ tenantId: null })
    await storageRow()
    const { session } = await signInWithFactory(client, 'platformOwner')

    const list = await client.get('/storages').cookies(session)
    assert.deepEqual(
      body(list, StoragesPage).data.map((item) => item.id),
      [platformFile.id],
    )
  })
})

/**
 * The end customer (DECISIONS.md #397): an account with no membership. The kit's customer table is
 * the file library (`CustomerScoped`): the customer uploads into the store the URL names and reads
 * its own files in any tenant, and nothing else; the store's members read what it uploaded.
 */
test.group('tenant scope > end customer', (group) => {
  group.each.setup(() => resetDatabase())

  test("a customer's upload goes to the store, under its prefix, and the store's staff reads it", async ({
    client,
    assert,
  }) => {
    const store = await Tenants.create()
    const session = await authenticateAsCustomer(client)

    const file = await uploadFile(
      client,
      session,
      await customerUploadPath(store),
    )
    assert.isTrue(file.path.startsWith(`${store.id}/`))

    const own = await client.get(`/storages/${file.id}`).cookies(session)
    own.assertStatus(200)
    const download = await client
      .get(`/storages/${file.id}/download`)
      .cookies(session)
    assert.notEqual(download.status(), 404)
    const mine = await client.get('/storages').cookies(session)
    assert.deepEqual(
      body(mine, StoragesPage).data.map((item) => item.id),
      [file.id],
    )

    const staff = await signInWithFactory(client, 'staff', store)
    const seen = await client.get(`/storages/${file.id}`).cookies(staff.session)
    seen.assertStatus(200)
  })

  test("customer A never reaches customer B's file", async ({
    client,
    assert,
  }) => {
    const store = await Tenants.create()
    const path = await customerUploadPath(store)
    const file = await uploadFile(
      client,
      await authenticateAsCustomer(client),
      path,
    )
    const other = await authenticateAsCustomer(client)

    for (const request of [
      client.get(`/storages/${file.id}`),
      client.get(`/storages/${file.id}/download`),
      client.get(`/storages/${file.id}/parts`),
      client.delete(`/storages/${file.id}`),
    ]) {
      const response = await request.cookies(other)
      response.assertStatus(404)
    }

    const list = await client.get('/storages').cookies(other)
    assert.deepEqual(body(list, StoragesPage).data, [])
  })

  test("a customer reads none of the store's own files, even with the store in the URL", async ({
    client,
    assert,
  }) => {
    const store = await Tenants.create()
    const storeFile = await storageRow({ tenantId: store.id })
    const session = await authenticateAsCustomer(client)
    await uploadFile(client, session, await customerUploadPath(store))

    const response = await client
      .get(`/storages/${storeFile.id}`)
      .cookies(session)
    response.assertStatus(404)

    const list = await client.get('/storages').cookies(session)
    assert.notInclude(
      body(list, StoragesPage).data.map((item) => item.id),
      storeFile.id,
    )
  })

  // The verifier's finding 1: a plain member of the store is not its staff.
  test("a plain member of the store neither reads nor deletes a customer's file", async ({
    client,
    assert,
  }) => {
    const store = await Tenants.create()
    const file = await uploadFile(
      client,
      await authenticateAsCustomer(client),
      await customerUploadPath(store),
    )
    const member = await signInWithFactory(client, 'nonStaff', store)

    for (const request of [
      client.get(`/storages/${file.id}`),
      client.get(`/storages/${file.id}/download`),
      client.delete(`/storages/${file.id}`),
    ]) {
      const response = await request.cookies(member.session)
      response.assertStatus(404)
    }
    const list = await client.get('/storages').cookies(member.session)
    assert.notInclude(
      body(list, StoragesPage).data.map((item) => item.id),
      file.id,
    )
  }).skip(ROLE_FIXTURES.nonStaff === null, NO_NON_STAFF_ROLE)

  // Finding 2: the parent reads its children in aggregate, never a customer's raw row.
  test("the parent tenant's staff does not reach a child's customer file", async ({
    client,
  }) => {
    const parent = await Tenants.create()
    const child = await Tenants.create({ parentId: parent.id })
    const file = await uploadFile(
      client,
      await authenticateAsCustomer(client),
      await customerUploadPath(child),
    )
    const staff = await signInWithFactory(client, 'staff', parent)

    for (const request of [
      client.get(`/storages/${file.id}`),
      client.get(`/storages/${file.id}/download`),
    ]) {
      const response = await request.cookies(staff.session)
      response.assertStatus(404)
    }
  })

  // Finding 5: an account with memberships is never a customer, picked or not.
  test('an account with memberships gets no customer upload, and with no pick reads nothing', async ({
    client,
    assert,
  }) => {
    const store = await Tenants.create()
    const { user, session } = await signInWithFactory(client, 'staff', store)
    await Tenants.addMember(user, await Tenants.create(), ROLE_FIXTURES.staff)
    await storageRow({ tenantId: store.id })
    const path = await customerUploadPath(store)
    const payload = { fileName: 'capa.png', mimetype: 'image/png', size: 1024 }

    const opened = await client.post(path).cookies(session).json(payload)
    opened.assertStatus(403)

    const list = await client.get('/storages').cookies(session)
    assert.deepEqual(body(list, StoragesPage).data, [])
  })

  test('a store the URL does not name (or that does not exist) gets no upload', async ({
    client,
  }) => {
    const session = await authenticateAsCustomer(client)

    const response = await client
      .post('/storages/cities/benjamin-constant/tenants/ghost')
      .cookies(session)
      .json({ fileName: 'capa.png', mimetype: 'image/png', size: 1024 })

    response.assertStatus(404)
  })
})
