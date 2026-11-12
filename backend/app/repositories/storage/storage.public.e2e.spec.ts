import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { PLATFORM_ROLE } from '@maiyu/shared'

import { StorageLucidRepository } from './storage.lucid.repository.ts'
import { StorageMemoryRepository } from './storage.memory.repository.ts'
import type { StorageRepository } from './storage.repository.ts'

import { TenantScope } from '#core/tenant-scope'
import { UserFactory } from '#database/factories/user.factory'
import { Storage } from '#domain/storage/storage.entity'
import { scopedHttpContext } from '#tests/http-context-fixtures'
import { resetDatabase } from '#tests/http-fixtures'
import { PNG_HEAD } from '#tests/storages-unit-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/**
 * The file a public route may serve (DECISIONS.md #582): a confirmed file of a tenant the URL names,
 * owned by nobody. The global catalog's files (`tenant_id` null: the cover of a course every tenant
 * shares) are the platform's rows, and a public route never reads them, so the visitor gets the
 * 404 of a missing file; the catalog reaches the page by the signed URL the platform's own routes
 * hand out. The same contract in both implementations (`_standards/domain.md` §5.4).
 */
const IMPLEMENTATIONS = {
  lucid: () => app.container.make(StorageLucidRepository),
  memory: () => app.container.make(StorageMemoryRepository),
} satisfies Record<string, () => Promise<StorageRepository>>

const NOW = new Date('2026-10-29T12:00:00.000Z')
const CATALOG_ID = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a01'
const TENANT_ID = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a02'
const OTHER_TENANT_ID = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a03'
const OWNED_ID = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a04'
const PENDING_ID = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a05'
const DELETED_ID = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a06'

function file(input: {
  id: string
  tenantId: string | null
  customerId?: string | null
  confirmed?: boolean
}): Storage {
  const opened = Storage.open({
    id: input.id,
    key: `${input.id}.png`,
    originalName: 'capa.png',
    mimetype: 'image/png',
    size: 1024,
    uploadId: null,
    partSize: 10,
    tenantId: input.tenantId,
    customerId: input.customerId ?? null,
    uploadedBy: null,
    now: NOW,
  })
  if (opened.isLeft()) throw new Error(`open refused: ${opened.value.code}`)

  if (input.confirmed ?? true)
    opened.value.complete({ contentLength: 1024, head: PNG_HEAD }, NOW)

  return opened.value
}

for (const [name, make] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`StorageRepository.findPublic (${name})`, (group) => {
    group.each.setup(() => resetDatabase())
    const within = scopedHttpContext(group)

    async function seed() {
      const tenant = await Tenants.create({ slug: 'escola-a' })
      const other = await Tenants.create({ slug: 'escola-b' })
      const customer = await UserFactory.create()
      const repository = await make()
      await repository.save(file({ id: CATALOG_ID, tenantId: null }))
      await repository.save(file({ id: TENANT_ID, tenantId: tenant.id }))
      await repository.save(file({ id: OTHER_TENANT_ID, tenantId: other.id }))
      await repository.save(
        file({ id: OWNED_ID, tenantId: tenant.id, customerId: customer.id }),
      )
      await repository.save(
        file({ id: PENDING_ID, tenantId: tenant.id, confirmed: false }),
      )
      const gone = file({ id: DELETED_ID, tenantId: tenant.id })
      await repository.save(
        Storage.restore({ ...gone.snapshot(), deletedAt: NOW }),
      )

      return { repository, tenant, other, customer }
    }

    test('the visitor gets the confirmed file of the URL tenant', async ({
      assert,
    }) => {
      const { repository, tenant } = await seed()
      await within(TenantScope.ofPublic(tenant.id, []))

      const found = await repository.findPublic(TENANT_ID)

      assert.equal(found?.snapshot().id, TENANT_ID)
    })

    test('the visitor of a city-wide URL gets the files of the tenants of the city', async ({
      assert,
    }) => {
      const { repository, tenant, other } = await seed()
      await within(TenantScope.ofPublic(null, [tenant.id, other.id]))

      assert.isNotNull(await repository.findPublic(TENANT_ID))
      assert.isNotNull(await repository.findPublic(OTHER_TENANT_ID))
    })

    test('the global catalog file (no tenant) is a 404 to the visitor', async ({
      assert,
    }) => {
      const { repository, tenant, other } = await seed()

      await within(TenantScope.ofPublic(tenant.id, []))
      assert.isNull(await repository.findPublic(CATALOG_ID))

      await within(TenantScope.ofPublic(null, [tenant.id, other.id]))
      assert.isNull(await repository.findPublic(CATALOG_ID))
    })

    test('a public route never reads the platform rows, not even for the platform owner', async ({
      assert,
    }) => {
      const { repository } = await seed()
      const owner = await UserFactory.create()
      await within(
        TenantScope.ofAccess({
          id: owner.id,
          platformRole: PLATFORM_ROLE.OWNER,
          tenant: null,
        }),
      )

      assert.isNull(await repository.findPublic(CATALOG_ID))
    })

    test('without a scope (a system process) the catalog file is still not public', async ({
      assert,
    }) => {
      const { repository } = await seed()

      assert.isNull(await repository.findPublic(CATALOG_ID))
      assert.isNotNull(await repository.findPublic(TENANT_ID))
    })

    test("a customer's own file is not public, not even to its owner", async ({
      assert,
    }) => {
      const { repository, tenant, customer } = await seed()
      await within(TenantScope.ofCustomer(customer.id, tenant.id))

      assert.isNotNull(await repository.findById(OWNED_ID))
      assert.isNull(await repository.findPublic(OWNED_ID))
    })

    test('a deleted file is a 404, confirmed and of the URL tenant as it is', async ({
      assert,
    }) => {
      const { repository, tenant } = await seed()
      await within(TenantScope.ofPublic(tenant.id, []))

      assert.isNull(await repository.findPublic(DELETED_ID))
    })

    test("another tenant's file, a customer's file and an unconfirmed upload are a 404", async ({
      assert,
    }) => {
      const { repository, tenant } = await seed()
      await within(TenantScope.ofPublic(tenant.id, []))

      assert.isNull(await repository.findPublic(OTHER_TENANT_ID))
      assert.isNull(await repository.findPublic(OWNED_ID))
      assert.isNull(await repository.findPublic(PENDING_ID))
    })
  })
}
