import app from '@adonisjs/core/services/app'
import type { ApiClient } from '@japa/api-client'
import { test } from '@japa/runner'

import { CityTenantsResponse } from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import { PublicTenantFilter } from '#core/public-tenant-filter'
import type Tenant from '#models/tenant'
import {
  authenticateAsPlatformAdministrator,
  authenticateAsPlatformOwner,
  body,
  resetDatabase,
  signInWithFactory,
  type Session,
} from '#tests/http-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/**
 * The public side shows only the tenants the project releases (`PublicTenantFilter`, DECISIONS.md
 * #812), and a member of an unreleased tenant, or the platform's staff, still reaches it to preview
 * its page. Everything here goes through the real route `storefront.tenants.list` and real
 * sessions: the viewer is the account `silent-auth` checked, and no scope is set by hand. The route
 * by slug is the same route in the single-client mode (DECISIONS.md #399), which resolves the
 * configured tenant by its slug.
 */
class OnlyReleased extends PublicTenantFilter {
  constructor(private readonly released_: ReadonlyArray<string>) {
    super()
  }

  released(ids: ReadonlyArray<string>) {
    return Promise.resolve(ids.filter((id) => this.released_.includes(id)))
  }
}

async function get(client: ApiClient, url: string, session: Session | null) {
  return client.get(url).cookies(session ?? {})
}

test.group('middleware > public-tenant (e2e)', (group) => {
  let open: Tenant
  let hidden: Tenant
  let member: Session
  let stranger: Session
  let staff: Session
  let owner: Session

  group.each.setup(async () => {
    const teardown = await resetDatabase()
    open = await Tenants.create({ citySlug: 'tabatinga' })
    hidden = await Tenants.create({ citySlug: 'tabatinga' })
    app.container.swap(PublicTenantFilter, () => new OnlyReleased([open.id]))

    return async () => {
      app.container.restore(PublicTenantFilter)
      await teardown()
    }
  })

  const sessions = async (client: ApiClient) => {
    member = (await signInWithFactory(client, 'staff', hidden)).session
    stranger = (await signInWithFactory(client, 'staff', open)).session
    staff = await authenticateAsPlatformAdministrator(client)
    owner = await authenticateAsPlatformOwner(client)
  }

  const LIST = '/storefront/cities/tabatinga/tenants'
  const ids = (response: Parameters<typeof body>[0]) =>
    body(response, CityTenantsResponse).map((tenant) => tenant.id)

  test('the city list: a visitor and an account of another tenant see only the released one', async ({
    client,
    assert,
  }) => {
    await sessions(client)

    assert.deepEqual(ids(await get(client, LIST, null)), [open.id])
    assert.deepEqual(ids(await get(client, LIST, stranger)), [open.id])
  })

  test('the city list: a member of the unreleased tenant and the platform staff also see it', async ({
    client,
    assert,
  }) => {
    await sessions(client)
    const both = [open.id, hidden.id].sort()

    assert.sameMembers(ids(await get(client, LIST, member)), both)
    assert.sameMembers(ids(await get(client, LIST, staff)), both)
    assert.sameMembers(ids(await get(client, LIST, owner)), both)
  })

  test('the route by slug: 404 for a visitor and another tenant, 200 for a member and the staff', async ({
    client,
    assert,
  }) => {
    await sessions(client)
    app.container.swap(TenantConfig, () => new TenantConfig(hidden.slug))

    try {
      assert.equal((await get(client, LIST, null)).status(), 404)
      assert.equal((await get(client, LIST, stranger)).status(), 404)
      assert.deepEqual(ids(await get(client, LIST, member)), [hidden.id])
      assert.deepEqual(ids(await get(client, LIST, staff)), [hidden.id])
      assert.deepEqual(ids(await get(client, LIST, owner)), [hidden.id])

      app.container.swap(TenantConfig, () => new TenantConfig(open.slug))
      assert.deepEqual(ids(await get(client, LIST, null)), [open.id])
    } finally {
      app.container.restore(TenantConfig)
    }
  })
})
