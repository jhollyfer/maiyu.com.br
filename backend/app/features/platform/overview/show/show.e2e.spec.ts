import { test } from '@japa/runner'

import { PlatformOverviewResponse } from '@maiyu/shared'

import {
  authenticateAsAdministrator,
  authenticateAsPlatformAdministrator,
  authenticateAsPlatformOwner,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { DEFAULT_TENANT_SLUG } from '#tests/tenants-fixtures'

test.group('platform/overview > show', (group) => {
  group.each.setup(() => resetDatabase())

  test('the platform owner sees every city with its tenant count', async ({
    client,
    assert,
  }) => {
    await authenticateAsAdministrator(client)
    const session = await authenticateAsPlatformOwner(client)

    const response = await client.get('/platform/overview').cookies(session)

    response.assertStatus(200)
    const overview = body(response, PlatformOverviewResponse)
    // Its own fixture, by slug: a seeded tenant (`SEED_TENANT_*`) must not change the count.
    const mine = overview.tenants.find(
      (tenant) => tenant.slug === DEFAULT_TENANT_SLUG,
    )
    assert.equal(mine?.members, 1)
    assert.equal(
      overview.cities.find((city) => city.id === mine?.cityId)?.tenants,
      overview.tenants.filter((tenant) => tenant.cityId === mine?.cityId)
        .length,
    )
  })

  test("a tenant's administrator is 403", async ({ client }) => {
    const session = await authenticateAsAdministrator(client)

    const response = await client.get('/platform/overview').cookies(session)

    response.assertStatus(403)
  })

  // The platform's staff checks Pix (DECISIONS.md #404) and nothing else: the area stays the owner's.
  test("the platform's staff is 403", async ({ client }) => {
    const session = await authenticateAsPlatformAdministrator(client)

    const response = await client.get('/platform/overview').cookies(session)

    response.assertStatus(403)
  })
})
