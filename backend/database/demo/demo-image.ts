import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'

import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import drive from '@adonisjs/drive/services/main'

import { UPLOAD_STATUS } from '@maiyu/shared'

import Storage from '#models/storage'
import type Tenant from '#models/tenant'
import { StorageContract } from '#services/storage/storage.contract'

/**
 * The example image of the demonstration (DECISIONS.md #802): the one versioned file
 * `database/data/demo/sample.png`, sent to the bucket through the kit's own storage and answered
 * as the confirmed file of a demo tenant, for the project's demo records to point at.
 */
export class DemoImage {
  static readonly MIMETYPE = 'image/png'

  /**
   * The confirmed (`UPLOADED`) file with this label in the tenant, created on the first call.
   * One label is one image: asking again returns the row that is there and uploads nothing, so a
   * second `db:seed` leaves the bucket as it was. A failure (bucket down, file missing) is logged as
   * a warning and answers `null`: the record goes on without an image and the seed, which runs on
   * every deploy, never falls over for a picture (DECISIONS.md #807).
   */
  static async of(tenant: Tenant, label: string): Promise<Storage | null> {
    try {
      return await DemoImage.upload(tenant, label)
    } catch (error) {
      logger.warn(
        { err: error, tenantId: tenant.id, label },
        'demo image skipped: the record is created without it',
      )

      return null
    }
  }

  private static async upload(tenant: Tenant, label: string): Promise<Storage> {
    const originalName = `demo-${label}.png`
    const existing = await Storage.query()
      .where('tenantId', tenant.id)
      .where('originalName', originalName)
      .where('status', UPLOAD_STATUS.UPLOADED)
      .first()
    if (existing) return existing

    const bytes = await readFile(app.makePath('database/data/demo/sample.png'))
    const storage = await app.container.make(StorageContract)
    const path = storage.key(DemoImage.MIMETYPE, tenant.id)
    await drive.use().put(path, bytes, { contentType: DemoImage.MIMETYPE })

    try {
      return await Storage.create({
        tenantId: tenant.id,
        filename: basename(path),
        originalName,
        mimetype: DemoImage.MIMETYPE,
        size: bytes.byteLength,
        path,
        status: UPLOAD_STATUS.UPLOADED,
      })
    } catch (error) {
      // No row, so nothing would ever point at the object: do not leave it in the bucket.
      await storage.discard(path)
      throw error
    }
  }
}
