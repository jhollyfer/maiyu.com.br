import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { ACTIVE_STATUS } from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import City from '#models/city'
import Tenant from '#models/tenant'

/**
 * The first tenant (DECISIONS.md #390): the client the existing data migrates to
 * (`_standards/backend.md`, multi-tenant migration). Switched on by `TENANT_PROJECT.seed`
 * (`config/tenant.project.ts`, DECISIONS.md #782), `null` by default (DECISIONS.md #329): a name or a
 * city written here would seed the wrong client.
 * Runs after `city.seed.ts` (the files run in name order).
 */
export default class extends BaseSeeder {
  override async run() {
    const { seed } = await app.container.make(TenantConfig)

    if (!seed) {
      logger.info('TENANT_PROJECT.seed is null: tenant seed skipped')
      return
    }

    const { name, slug, type } = seed
    const city = await City.findBy('slug', seed.city)
    if (!city) {
      logger.warn(
        `TENANT_PROJECT.seed.city ${seed.city} is not a city: tenant seed skipped`,
      )
      return
    }

    await Tenant.firstOrCreate(
      { cityId: city.id, slug },
      { name, type, status: ACTIVE_STATUS.ACTIVE },
    )
  }
}
