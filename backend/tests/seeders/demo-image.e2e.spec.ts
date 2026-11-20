import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'

import { UPLOAD_STATUS } from '@maiyu/shared'

import { DemoImage } from '#database/demo/demo-image'
import Storage from '#models/storage'
import { resetDatabase } from '#tests/http-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

test.group('seeders > demo image', (group) => {
  group.each.setup(() => resetDatabase())

  test('it sends the example image to the bucket and returns the confirmed file of the tenant', async ({
    assert,
  }) => {
    const tenant = await Tenants.create()

    const file = await DemoImage.of(tenant, 'cover')

    assert.equal(file.tenantId, tenant.id)
    assert.equal(file.status, UPLOAD_STATUS.UPLOADED)
    assert.equal(file.mimetype, DemoImage.MIMETYPE)
    assert.isTrue(await drive.use().exists(file.path))
    assert.equal(
      (await drive.use().getMetaData(file.path)).contentLength,
      file.size,
    )

    await drive.use().delete(file.path)
  })

  test('one label is one image: asking again returns the same row and uploads nothing', async ({
    assert,
  }) => {
    const tenant = await Tenants.create()

    const first = await DemoImage.of(tenant, 'cover')
    const again = await DemoImage.of(tenant, 'cover')
    const other = await DemoImage.of(tenant, 'banner')

    assert.equal(again.id, first.id)
    assert.notEqual(other.id, first.id)
    assert.lengthOf(await Storage.query().where('tenantId', tenant.id), 2)

    await drive.use().delete(first.path)
    await drive.use().delete(other.path)
  })
})
