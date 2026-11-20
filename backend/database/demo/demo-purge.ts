import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'

import { DemoConfig } from '#database/demo/demo.config'
import { DemoProject } from '#database/demo/demo.project'
import Storage from '#models/storage'
import Tenant from '#models/tenant'
import User from '#models/user'
import { StorageContract } from '#services/storage/storage.contract'

export type DemoPurgeResult = {
  readonly tenants: number
  readonly files: number
  readonly accounts: number
}

/**
 * Removes the demonstration (`node ace demo:purge`, DECISIONS.md #802) and nothing else: the
 * project's records first (`DemoProject.purge`), then the files of the demo tenants (bucket and
 * rows), the tenants (their memberships go with them) and the demo accounts. What is a demo
 * row is decided by the same marks the seed writes: `tenants.demo`, and an account whose name
 * matches `DemoConfig.NAME_PATTERN` and whose e-mail matches `DemoConfig.EMAIL_PATTERN`. Idempotent: a second run finds nothing and says zero.
 */
export class DemoPurge {
  /** What `run` would delete, without deleting (`demo:purge --dry-run`). */
  static async preview(): Promise<DemoPurgeResult> {
    const tenants = await Tenant.query().where('demo', true)
    const files = await Storage.query().whereIn(
      'tenantId',
      tenants.map((tenant) => tenant.id),
    )
    const accounts = await User.query()
      .where('email', 'like', DemoConfig.EMAIL_PATTERN)
      .where('name', 'like', DemoConfig.NAME_PATTERN)
      .count('* as total')

    return {
      tenants: tenants.length,
      files: files.length,
      accounts: Number(accounts[0]?.$extras['total'] ?? 0),
    }
  }

  static async run(): Promise<DemoPurgeResult> {
    const tenants = await Tenant.query().where('demo', true)
    const ids = tenants.map((tenant) => tenant.id)

    await DemoProject.purge({ tenants })

    const storage = await app.container.make(StorageContract)
    const files = await Storage.query().whereIn('tenantId', ids)
    // The bucket first: a row left behind can be retried, an object with no row can never be found.
    for (const file of files) await storage.discard(file.path)

    return db.transaction(async (trx) => {
      if (ids.length > 0) {
        // `charges.tenant_id` has no cascade: a charge made in a demo tenant would stop its deletion.
        // The table exists only with the optional `pix` block.
        if (await trx.schema.hasTable('charges'))
          await trx.from('charges').whereIn('tenant_id', ids).delete()
        await trx.from('storages').whereIn('tenant_id', ids).delete()
        await trx.from('tenants').whereIn('id', ids).delete()
      }
      const accounts = await trx
        .from('users')
        .where('email', 'like', DemoConfig.EMAIL_PATTERN)
        .where('name', 'like', DemoConfig.NAME_PATTERN)
        .delete()
        .returning('id')

      return {
        tenants: ids.length,
        files: files.length,
        accounts: accounts.length,
      }
    })
  }
}
