import { randomUUID } from 'node:crypto'

import { test } from '@japa/runner'

import {
  ACTIVE_STATUS,
  ErrorEnvelope,
  PlatformTenantResponse,
} from '@maiyu/shared'

import {
  authenticateAsAdministrator,
  authenticateAsPlatformOwner,
  body,
  resetDatabase,
} from '#tests/http-fixtures'
import { TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

test.group('platform/tenants > update', (group) => {
  group.each.setup(() => resetDatabase())

  test('the platform owner renames and inactivates a tenant', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsPlatformOwner(client)
    const tenant = await Tenants.create()

    const response = await client
      .put(`/platform/tenants/${tenant.id}`)
      .cookies(session)
      .json({
        name: 'Novo nome',
        slug: tenant.slug,
        type: TENANT_TYPE_FIXTURE,
        cityId: tenant.cityId,
        parentId: null,
        status: ACTIVE_STATUS.INACTIVE,
      })

    response.assertStatus(200)
    const updated = body(response, PlatformTenantResponse)
    assert.equal(updated.name, 'Novo nome')
    assert.equal(updated.status, ACTIVE_STATUS.INACTIVE)
  })

  test('a tenant with children gets no parent; an unknown id is 404; an administrator is 403', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsPlatformOwner(client)
    const parent = await Tenants.create()
    await Tenants.create({ parentId: parent.id })
    const other = await Tenants.create()
    const fields = {
      name: 'Pai',
      slug: parent.slug,
      type: TENANT_TYPE_FIXTURE,
      cityId: parent.cityId,
      parentId: other.id,
      status: ACTIVE_STATUS.ACTIVE,
    }

    const nested = await client
      .put(`/platform/tenants/${parent.id}`)
      .cookies(session)
      .json(fields)
    const missing = await client
      .put(`/platform/tenants/${randomUUID()}`)
      .cookies(session)
      .json(fields)
    const denied = await client
      .put(`/platform/tenants/${parent.id}`)
      .cookies(await authenticateAsAdministrator(client))
      .json(fields)

    nested.assertStatus(422)
    assert.equal(body(nested, ErrorEnvelope).code, 'TENANT_PARENT_NESTED')
    missing.assertStatus(404)
    denied.assertStatus(403)
  })

  test('a tenant with children does not move to another city, and 422 says so', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsPlatformOwner(client)
    const parent = await Tenants.create()
    await Tenants.create({ parentId: parent.id })
    const elsewhere = await Tenants.city('tabatinga')

    const response = await client
      .put(`/platform/tenants/${parent.id}`)
      .cookies(session)
      .json({
        name: 'Escola',
        slug: parent.slug,
        type: TENANT_TYPE_FIXTURE,
        cityId: elsewhere.id,
        parentId: null,
        status: ACTIVE_STATUS.ACTIVE,
      })

    response.assertStatus(422)
    assert.equal(body(response, ErrorEnvelope).code, 'TENANT_HAS_CHILDREN')
  })

  // The verifier's finding 4: the parent is an active tenant of the same city.
  test('a parent of another city, or an inactive one, is 422', async ({
    client,
    assert,
  }) => {
    const session = await authenticateAsPlatformOwner(client)
    const tenant = await Tenants.create()
    const elsewhere = await Tenants.create({ citySlug: 'tabatinga' })
    const inactive = await Tenants.create()
    inactive.status = ACTIVE_STATUS.INACTIVE
    await inactive.save()

    for (const parent of [elsewhere, inactive]) {
      const response = await client
        .put(`/platform/tenants/${tenant.id}`)
        .cookies(session)
        .json({
          name: 'Escola',
          slug: tenant.slug,
          type: TENANT_TYPE_FIXTURE,
          cityId: tenant.cityId,
          parentId: parent.id,
          status: ACTIVE_STATUS.ACTIVE,
        })

      response.assertStatus(422)
      assert.equal(
        body(response, ErrorEnvelope).code,
        'TENANT_PARENT_ELSEWHERE',
      )
    }
  })
})
