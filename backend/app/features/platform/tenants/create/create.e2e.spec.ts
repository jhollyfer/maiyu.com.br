import { test } from '@japa/runner'

import { ErrorEnvelope, PlatformTenantResponse } from '@maiyu/shared'

import {
  authenticateAsAdministrator,
  authenticateAsCustomer,
  authenticateAsPlatformOwner,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

test.group('platform/tenants > create', (group) => {
  group.each.setup(() => resetDatabase())

  async function payload(parentId: string | null = null) {
    const city = await Tenants.city()

    return {
      name: 'Restaurante do Rio',
      slug: 'restaurante-do-rio',
      type: TENANT_TYPE_FIXTURE,
      cityId: city.id,
      parentId,
    }
  }

  test('the platform owner registers a tenant, born active', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsPlatformOwner(client)

    const response = await client
      .post('/platform/tenants')
      .cookies(session)
      .json(await payload())

    response.assertStatus(201)
    const tenant = body(response, PlatformTenantResponse)
    assert.equal(tenant.slug, 'restaurante-do-rio')
    assert.equal(tenant.status, 'ACTIVE')
  })

  test("a tenant's administrator and a customer are 403", async ({
    client,
  }) => {
    for (const session of [
      await authenticateAsAdministrator(client),
      await authenticateAsCustomer(client),
    ]) {
      const response = await client
        .post('/platform/tenants')
        .cookies(session)
        .json(await payload())

      response.assertStatus(403)
    }
  })

  test('a reserved slug is 422, a slug taken in the city is 409', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsPlatformOwner(client)
    const existing = await Tenants.create()

    const reserved = await client
      .post('/platform/tenants')
      .cookies(session)
      .json({ ...(await payload()), slug: 'dashboard' })
    const taken = await client
      .post('/platform/tenants')
      .cookies(session)
      .json({ ...(await payload()), slug: existing.slug })

    reserved.assertStatus(422)
    taken.assertStatus(409)
    assert.equal(body(taken, ErrorEnvelope).code, 'TENANT_SLUG_TAKEN')
  })

  test('a parent that has a parent is 422: one level only', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsPlatformOwner(client)
    const top = await Tenants.create()
    const child = await Tenants.create({ parentId: top.id })

    const response = await client
      .post('/platform/tenants')
      .cookies(session)
      .json(await payload(child.id))

    response.assertStatus(422)
    assert.equal(body(response, ErrorEnvelope).code, 'TENANT_PARENT_NESTED')
  })
})
