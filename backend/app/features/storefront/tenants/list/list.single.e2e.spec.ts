import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { CityTenantsResponse } from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import { body, resetDatabase } from '#tests/http-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/** The single-client mode (DECISIONS.md #399): the public route resolves the configured tenant. */
test.group('storefront/tenants > list, single-client mode', (group) => {
  group.each.setup(() => resetDatabase())

  test('reads the configured tenant and no other, and never writes', async ({
    client,
    assert,
  }) => {
    const mine = await Tenants.create({ citySlug: 'tabatinga' })
    await Tenants.create({ citySlug: 'tabatinga' })
    app.container.swap(TenantConfig, () => new TenantConfig(mine.slug))

    try {
      const read = await client.get('/storefront/cities/any/tenants')
      const write = await client.post('/storefront/cities/any/tenants')

      read.assertStatus(200)
      assert.deepEqual(
        body(read, CityTenantsResponse).map((each) => each.id),
        [mine.id],
      )
      assert.oneOf(write.status(), [404, 405])
    } finally {
      app.container.restore(TenantConfig)
    }
  })

  test('answers 404 when the configured tenant does not exist', async ({
    client,
  }) => {
    app.container.swap(TenantConfig, () => new TenantConfig('ghost'))

    try {
      const response = await client.get('/storefront/cities/any/tenants')

      response.assertStatus(404)
    } finally {
      app.container.restore(TenantConfig)
    }
  })
})
