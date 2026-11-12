import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { ACTIVE_STATUS, TENANT_TYPES } from '@maiyu/shared'

import City from '#models/city'
import Tenant from '#models/tenant'
import env from '#start/env'

/**
 * The first tenant (DECISIONS.md #390): the client the existing data migrates to
 * (`_standards/backend.md`, multi-tenant migration). Switched on by the four `SEED_TENANT_*` keys,
 * with no default (DECISIONS.md #329): a name or a city written here would seed the wrong client.
 * Runs after `city.seed.ts` (the files run in name order).
 */
export default class extends BaseSeeder {
  override async run() {
    const name = env.get('SEED_TENANT_NAME')
    const slug = env.get('SEED_TENANT_SLUG')
    const citySlug = env.get('SEED_TENANT_CITY')
    const type = TENANT_TYPES.find(
      (each) => each === env.get('SEED_TENANT_TYPE'),
    )

    if (!name || !slug || !citySlug || !type) {
      logger.info('SEED_TENANT_* is incomplete: tenant seed skipped')
      return
    }

    const city = await City.findBy('slug', citySlug)
    if (!city) {
      logger.warn(
        `SEED_TENANT_CITY ${citySlug} is not a city: tenant seed skipped`,
      )
      return
    }

    await Tenant.firstOrCreate(
      { cityId: city.id, slug },
      { name, type, status: ACTIVE_STATUS.ACTIVE },
    )
  }
}
