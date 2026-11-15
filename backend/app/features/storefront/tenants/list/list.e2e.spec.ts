import { test } from '@japa/runner'

import { CitiesListResponse, CityTenantsResponse } from '@maiyu/shared'

import { body, resetDatabase } from '#tests/http-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

test.group('storefront/tenants > list', (group) => {
  group.each.setup(() => resetDatabase())

  test('the seeded cities are public', async ({ client, assert }) => {
    const response = await client.get('/storefront/cities')

    response.assertStatus(200)
    assert.includeMembers(
      body(response, CitiesListResponse).map((city) => city.slug),
      ['atalaia-do-norte', 'benjamin-constant', 'tabatinga'],
    )
  })

  test("lists only the city's tenants", async ({ client, assert }) => {
    const here = await Tenants.create({ citySlug: 'tabatinga' })
    await Tenants.create({ citySlug: 'atalaia-do-norte' })

    const response = await client.get('/storefront/cities/tabatinga/tenants')

    response.assertStatus(200)
    assert.deepEqual(
      body(response, CityTenantsResponse).map((tenant) => tenant.id),
      [here.id],
    )
  })

  test('an unknown city is 404', async ({ client }) => {
    const response = await client.get('/storefront/cities/nowhere/tenants')

    response.assertStatus(404)
  })
})
