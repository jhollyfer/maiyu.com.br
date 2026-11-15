import { randomUUID } from 'node:crypto'

import { test } from '@japa/runner'

import { UPLOAD_STATUS } from '@maiyu/shared'
import type { UploadStatus } from '@maiyu/shared'

import { TenantScope } from '#core/tenant-scope'
import { UserFactory } from '#database/factories/user.factory'
import Storage from '#models/storage'
import type User from '#models/user'
import CustomerScoped from '#repositories/shared/customer-scoped'
import type { CustomerReadOptions } from '#repositories/shared/customer-scoped'
import { scopedHttpContext } from '#tests/http-context-fixtures'
import { resetDatabase } from '#tests/http-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

const UPLOADED_ONLY: CustomerReadOptions = {
  tenantStatuses: { column: 'status', allowed: [UPLOAD_STATUS.UPLOADED] },
}

/** An account acting outside any membership, as `TenantScope.ofAccess` takes it. */
function withoutTenant(user: User): {
  id: string
  platformRole: User['platformRole']
  tenant: null
} {
  return { id: user.id, platformRole: user.platformRole, tenant: null }
}

/**
 * The platform's read and the tenant's status cut (DECISIONS.md #511), on the file library: it has a
 * `status` and a `customer_id`, which is all a customer table needs here. Writing stays out of the
 * platform's reach through `writable`.
 */
test.group('CustomerScoped > platform read and status cut', (group) => {
  group.each.setup(() => resetDatabase())
  const within = scopedHttpContext(group)

  async function file(
    tenantId: string,
    customerId: string | null,
    status: UploadStatus,
  ): Promise<Storage> {
    return Storage.create({
      tenantId,
      customerId,
      filename: `${status}.png`,
      originalName: `${status}.png`,
      mimetype: 'image/png',
      size: 10,
      path: `${randomUUID()}.png`,
      status,
    })
  }

  async function fixture() {
    const store = await Tenants.create()
    const other = await Tenants.create()
    const payer = await UserFactory.create()
    const pending = await file(store.id, payer.id, UPLOAD_STATUS.PENDING)
    const uploaded = await file(store.id, payer.id, UPLOAD_STATUS.UPLOADED)
    const elsewhere = await file(other.id, payer.id, UPLOAD_STATUS.UPLOADED)

    return { store, payer, pending, uploaded, elsewhere }
  }

  async function ids(options: CustomerReadOptions): Promise<string[]> {
    const rows = await CustomerScoped.readable(Storage.query(), options)

    return rows.map((row) => row.id).sort()
  }

  test('the platform staff reads the customers rows of every tenant, the owner and the administrator alike', async ({
    assert,
  }) => {
    const { pending, uploaded, elsewhere } = await fixture()
    const all = [pending.id, uploaded.id, elsewhere.id].sort()

    const administrator = await UserFactory.apply(
      'platformAdministrator',
    ).create()
    await within(TenantScope.ofAccess(withoutTenant(administrator)))
    assert.deepEqual(await ids({ platform: true }), all)

    const owner = await UserFactory.apply('platformOwner').create()
    await within(TenantScope.ofAccess(withoutTenant(owner)))
    assert.deepEqual(await ids({ platform: true }), all)
  })

  test('the platform read is not cut by the tenant status cut', async ({
    assert,
  }) => {
    const { pending, uploaded, elsewhere } = await fixture()
    const administrator = await UserFactory.apply(
      'platformAdministrator',
    ).create()
    await within(TenantScope.ofAccess(withoutTenant(administrator)))

    assert.deepEqual(
      await ids({ platform: true, ...UPLOADED_ONLY }),
      [pending.id, uploaded.id, elsewhere.id].sort(),
    )
  })

  test('the platform read is a declaration of the table: without it nothing widens', async ({
    assert,
  }) => {
    await fixture()
    const administrator = await UserFactory.apply(
      'platformAdministrator',
    ).create()
    await within(TenantScope.ofAccess(withoutTenant(administrator)))

    assert.deepEqual(await ids({}), [])
  })

  test('a plain platform member (role USER) does not read them', async ({
    assert,
  }) => {
    await fixture()
    const member = await UserFactory.create()
    await within(TenantScope.ofAccess(withoutTenant(member)))

    assert.deepEqual(await ids({ platform: true }), [])
  })

  test('the platform staff finds nothing through writable', async ({
    assert,
  }) => {
    const { pending } = await fixture()
    const administrator = await UserFactory.apply(
      'platformAdministrator',
    ).create()
    await within(TenantScope.ofAccess(withoutTenant(administrator)))

    const changed = await CustomerScoped.writable(
      Storage.query().where('id', pending.id),
    )
      .update({ originalName: 'trocado.png' })
      .returning('id')

    assert.lengthOf(changed, 0)
  })

  test('the store staff, with a status cut, reads only the allowed statuses of its customers', async ({
    assert,
  }) => {
    const { store, uploaded } = await fixture()
    const staff = await UserFactory.create()
    await Tenants.addMember(staff, store, ROLE_FIXTURES.staff)
    await within(
      TenantScope.ofAccess({
        id: staff.id,
        platformRole: staff.platformRole,
        tenant: {
          id: store.id,
          cityId: store.cityId,
          role: ROLE_FIXTURES.staff,
          childIds: [],
        },
      }),
    )

    assert.deepEqual(await ids(UPLOADED_ONLY), [uploaded.id])
    assert.lengthOf(await ids({}), 2)
  })

  test('the customer still sees only its own rows, whatever the cut', async ({
    assert,
  }) => {
    const { store, payer, pending, uploaded, elsewhere } = await fixture()
    const stranger = await UserFactory.create()
    await file(store.id, stranger.id, UPLOAD_STATUS.UPLOADED)
    await within(TenantScope.ofCustomer(payer.id, store.id))

    assert.deepEqual(
      await ids(UPLOADED_ONLY),
      [pending.id, uploaded.id, elsewhere.id].sort(),
    )
  })

  test('the public reads nothing of a customer table', async ({ assert }) => {
    const { store } = await fixture()
    await within(TenantScope.ofPublic(store.id, []))

    assert.deepEqual(await ids({ platform: true }), [])
  })
})
