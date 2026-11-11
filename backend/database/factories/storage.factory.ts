import factory from '@adonisjs/lucid/factories'

import { UPLOAD_STATUS } from '@maiyu/shared'

import Storage from '#models/storage'

/**
 * A confirmed file record (_doc-lib/lucid.md#model-factories). It writes only the
 * row: nothing goes to the bucket, so the signed `url` of the response opens a
 * 404, which is what a seed or a listing spec expects.
 *
 * `path` equals `filename`, with no directory: it is exactly the key the upload
 * writes in the bucket.
 *
 * Extension point (KIT.md §3.4): the project fills the columns it added to the model.
 */
export const StorageFactory = factory
  .define(Storage, ({ faker }) => {
    const filename = `${faker.string.uuid()}.png`

    return {
      filename,
      originalName: `${faker.word.noun()}.png`,
      mimetype: 'image/png',
      size: faker.number.int({ min: 1024, max: 512_000 }),
      path: filename,
      status: UPLOAD_STATUS.UPLOADED,
    }
  })
  .build()
