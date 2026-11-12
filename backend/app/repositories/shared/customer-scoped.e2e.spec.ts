import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { UPLOAD_STATUS } from '@maiyu/shared'

import { TenantScope } from '#core/tenant-scope'
import { UserFactory } from '#database/factories/user.factory'
import StoragesFileCreateUseCase from '#features/storages/files/create/create.use-case'
import Storage from '#models/storage'
import TenantMembership from '#models/tenant-membership'
import CustomerScoped from '#repositories/shared/customer-scoped'
import TenantScoped from '#repositories/shared/tenant-scoped'
import { scopedHttpContext } from '#tests/http-context-fixtures'
import { resetDatabase } from '#tests/http-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/**
 * The two declarations (DECISIONS.md #397) against Postgres: a table that uses `TenantScoped` is
 * out of reach of a customer and of a public write; a table that uses `CustomerScoped` (the file
 * library) is where they write. The kit has no anonymous write route, so the public write runs the
 * real use case under the scope `public-tenant.middleware.ts` builds for `{ access: 'insert' }`;
 * `tenant_memberships` stands for the tenant table nobody declared, since every tenant table goes
 * through the same `TenantScoped`.
 */
test.group('CustomerScoped > what each scope reaches', (group) => {
  group.each.setup(() => resetDatabase())
  const within = scopedHttpContext(group)

  test('a customer reads and changes nothing of a tenant table, even in the tenant of the URL', async ({
    assert,
  }) => {
    const store = await Tenants.create()
    const member = await UserFactory.create()
    await Tenants.addMember(member, store, ROLE_FIXTURES.staff)
    const customer = await UserFactory.create()
    await within(TenantScope.ofCustomer(customer.id, store.id))

    const read = await TenantScoped.readable(TenantMembership.query()).where(
      'tenant_id',
      store.id,
    )
    const changed = await TenantScoped.writable(TenantMembership.query())
      .where('tenant_id', store.id)
      .update({ role: ROLE_FIXTURES.owner })
      .returning('id')

    assert.lengthOf(read, 0)
    assert.lengthOf(changed, 0)
  })

  test('a declared public write creates a row of the customer table in the URL tenant, and of no other', async ({
    assert,
  }) => {
    const store = await Tenants.create()
    const storeFile = await Storage.create({
      tenantId: store.id,
      filename: 'a.png',
      originalName: 'a.png',
      mimetype: 'image/png',
      size: 10,
      path: 'a.png',
      status: UPLOAD_STATUS.UPLOADED,
    })
    await within(TenantScope.ofPublic(store.id, [], { inserts: true }))

    const useCase = await app.container.make(StoragesFileCreateUseCase)
    const opened = await useCase.execute({
      fileName: 'denuncia.png',
      mimetype: 'image/png',
      size: 1024,
    })
    if (opened.isLeft()) return assert.fail(opened.value.message)

    const row = await Storage.findOrFail(opened.value.storage.id)
    assert.equal(row.tenantId, store.id)
    assert.isNull(row.customerId)

    const membershipChanged = await TenantScoped.writable(
      TenantMembership.query(),
    )
      .update({ role: ROLE_FIXTURES.owner })
      .returning('id')
    const fileChanged = await CustomerScoped.writable(
      Storage.query().where('id', storeFile.id),
    )
      .update({ originalName: 'trocado.png' })
      .returning('id')

    assert.lengthOf(membershipChanged, 0)
    assert.lengthOf(fileChanged, 0)
  })

  // The verifier's finding 3: neither a customer nor a declared public write gets a tenant-table row.
  test('a customer and a declared public write get no target in a tenant table', async ({
    assert,
  }) => {
    const store = await Tenants.create()
    const customer = await UserFactory.create()

    await within(TenantScope.ofCustomer(customer.id, store.id))
    assert.isNull(TenantScope.tenantTargetOf())
    await within(TenantScope.ofPublic(store.id, [], { inserts: true }))
    assert.isNull(TenantScope.tenantTargetOf())
  })

  test('without a declared write the public scope creates nothing', async ({
    assert,
  }) => {
    const store = await Tenants.create()
    await within(TenantScope.ofPublic(store.id, []))

    const useCase = await app.container.make(StoragesFileCreateUseCase)
    const opened = await useCase.execute({
      fileName: 'denuncia.png',
      mimetype: 'image/png',
      size: 1024,
    })

    assert.isTrue(opened.isLeft())
    assert.lengthOf(await Storage.query().where('tenantId', store.id), 0)
  })
})
