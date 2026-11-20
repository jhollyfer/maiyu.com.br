import app from '@adonisjs/core/services/app'
import drive from '@adonisjs/drive/services/main'
import { test } from '@japa/runner'

import { UPLOAD_STATUS } from '@maiyu/shared'

import { DemoImage } from '#database/demo/demo-image'
import Storage from '#models/storage'
import { StorageContract } from '#services/storage/storage.contract'
import { StorageFake } from '#services/storage/storage.fake'
import { resetDatabase } from '#tests/http-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/** A bucket that is down: the key of a new object cannot even be made. */
class DownStorage extends StorageFake {
  override key(): string {
    throw new Error('bucket down')
  }
}

test.group('seeders > demo image', (group) => {
  group.each.setup(() => resetDatabase())

  test('it sends the example image to the bucket and returns the confirmed file of the tenant', async ({
    assert,
  }) => {
    const tenant = await Tenants.create()

    const file = await DemoImage.of(tenant, 'cover')
    if (!file) return assert.fail('the image was not created')

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

    assert.equal(again?.id, first?.id)
    assert.notEqual(other?.id, first?.id)
    assert.lengthOf(await Storage.query().where('tenantId', tenant.id), 2)

    if (first) await drive.use().delete(first.path)
    if (other) await drive.use().delete(other.path)
  })

  test('a bucket that fails answers null with no row and no throw: the seed goes on without the image', async ({
    assert,
  }) => {
    const tenant = await Tenants.create()
    app.container.swap(StorageContract, () => new DownStorage())

    try {
      const file = await DemoImage.of(tenant, 'cover')

      assert.isNull(file)
      assert.lengthOf(await Storage.query().where('tenantId', tenant.id), 0)
    } finally {
      app.container.restore(StorageContract)
    }
  })
})
