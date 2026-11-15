import { randomUUID } from 'node:crypto'

import { test } from '@japa/runner'

import { PLATFORM_ROLE, UPLOAD_STATUS } from '@maiyu/shared'

import { TenantScope } from '#core/tenant-scope'
import { UserFactory } from '#database/factories/user.factory'
import Storage from '#models/storage'
import CustomerScoped from '#repositories/shared/customer-scoped'
import { scopedHttpContext } from '#tests/http-context-fixtures'
import { resetDatabase } from '#tests/http-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

type Row = {
  readonly id: string
  readonly tenantId: string | null
  readonly customerId: string | null
}

/**
 * `CustomerScoped` (the `where`) and `TenantScope.canReadOwned` / `canWriteOwned` (what the
 * in-memory repositories ask) are one rule written twice (DECISIONS.md #397, #511). This spec runs
 * the same fixed set of rows through both, for every kind of request, so the two cannot drift: a
 * `where` that reaches a row the in-memory rule refuses, or the reverse, fails here.
 *
 * The row that matters most is a customer's row with no tenant (`tenant_id` null, `customer_id`
 * set): the system process creates it, a marketplace customer without a store owns one. The
 * platform's branch is for the platform's own rows (`customer_id` null); it must not reach that row
 * (#511: the platform reads a customer's row only by `{ platform: true }`, and never writes it).
 */
test.group('CustomerScoped > parity with TenantScope', (group) => {
  group.each.setup(() => resetDatabase())
  const within = scopedHttpContext(group)

  async function fixture() {
    const store = await Tenants.create()
    const other = await Tenants.create()
    const platform = await UserFactory.apply('platformOwner').create()
    const staff = await UserFactory.create()
    const buyer = await UserFactory.create()
    const stranger = await UserFactory.create()

    const tenants = [store.id, other.id, null]
    const owners = [null, buyer.id, stranger.id, staff.id]
    const rows: Row[] = []
    for (const tenantId of tenants)
      for (const customerId of owners) {
        const row = await Storage.create({
          tenantId,
          customerId,
          filename: `${rows.length}.png`,
          originalName: `${rows.length}.png`,
          mimetype: 'image/png',
          size: 10,
          path: `${randomUUID()}.png`,
          status: UPLOAD_STATUS.UPLOADED,
        })
        rows.push({ id: row.id, tenantId, customerId })
      }

    const scopes = {
      platform: TenantScope.ofAccess({
        id: platform.id,
        platformRole: PLATFORM_ROLE.OWNER,
        tenant: null,
      }),
      staff: TenantScope.ofAccess({
        id: staff.id,
        platformRole: PLATFORM_ROLE.USER,
        tenant: {
          id: store.id,
          cityId: store.cityId,
          role: ROLE_FIXTURES.staff,
          childIds: [],
        },
      }),
      customerWithTenant: TenantScope.ofCustomer(buyer.id, store.id),
      customerWithoutTenant: TenantScope.ofCustomer(buyer.id, null),
      publicOneTenant: TenantScope.ofPublic(store.id, []),
      publicInsert: TenantScope.ofPublic(store.id, [], { inserts: true }),
      none: TenantScope.none(),
    }

    return { rows, scopes, buyer }
  }

  async function lucidIds(kind: 'readable' | 'writable'): Promise<string[]> {
    const query = Storage.query()
    const found = await CustomerScoped[kind](query)

    return found.map((row) => row.id).sort()
  }

  function memoryIds(
    rows: ReadonlyArray<Row>,
    scope: TenantScope,
    kind: 'canReadOwned' | 'canWriteOwned',
  ): string[] {
    return rows
      .filter((row) => scope[kind](row.tenantId, row.customerId))
      .map((row) => row.id)
      .sort()
  }

  for (const name of [
    'platform',
    'staff',
    'customerWithTenant',
    'customerWithoutTenant',
    'publicOneTenant',
    'publicInsert',
    'none',
  ] as const) {
    test(`${name}: readable and writable reach the same rows as canReadOwned and canWriteOwned`, async ({
      assert,
    }) => {
      const { rows, scopes } = await fixture()
      const scope = scopes[name]
      await within(scope)

      assert.deepEqual(
        await lucidIds('readable'),
        memoryIds(rows, scope, 'canReadOwned'),
        `${name}: readable`,
      )
      assert.deepEqual(
        await lucidIds('writable'),
        memoryIds(rows, scope, 'canWriteOwned'),
        `${name}: writable`,
      )
    })
  }

  test("the platform owner, without the platform declaration, neither reads nor writes a customer's row with no tenant", async ({
    assert,
  }) => {
    const { rows, scopes } = await fixture()
    await within(scopes.platform)

    const orphans = rows
      .filter((row) => row.tenantId === null && row.customerId !== null)
      .map((row) => row.id)
    const read = await lucidIds('readable')
    const written = await lucidIds('writable')

    assert.lengthOf(orphans, 3)
    for (const id of orphans) {
      assert.notInclude(read, id)
      assert.notInclude(written, id)
    }
  })

  test("the platform owner still reads and writes the platform's own rows", async ({
    assert,
  }) => {
    const { rows, scopes } = await fixture()
    await within(scopes.platform)

    const own = rows
      .filter((row) => row.tenantId === null && row.customerId === null)
      .map((row) => row.id)

    assert.deepEqual(
      (await lucidIds('readable')).filter((id) => own.includes(id)),
      own.sort(),
    )
    assert.deepEqual(
      (await lucidIds('writable')).filter((id) => own.includes(id)),
      own.sort(),
    )
  })

  test("only { platform: true } lets the platform staff read a customer's row with no tenant, and writable never does", async ({
    assert,
  }) => {
    const { rows } = await fixture()
    const owner = await UserFactory.apply('platformOwner').create()
    await within(
      TenantScope.ofAccess({
        id: owner.id,
        platformRole: owner.platformRole,
        tenant: null,
      }),
    )

    const orphan = rows.find(
      (row) => row.tenantId === null && row.customerId !== null,
    )
    if (!orphan) return assert.fail('fixture without an orphan row')

    const read = await CustomerScoped.readable(Storage.query(), {
      platform: true,
    })
    assert.include(
      read.map((row) => row.id),
      orphan.id,
    )
    assert.notInclude(await lucidIds('readable'), orphan.id)
    assert.notInclude(await lucidIds('writable'), orphan.id)
  })
})
