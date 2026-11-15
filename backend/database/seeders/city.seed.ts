import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { SEED_CITIES } from '#database/data/cities'
import City from '#models/city'

/**
 * The platform's first cities (DECISIONS.md #390), in every environment: the tenant seed and the
 * city selector need them, and no key switches them off. `firstOrCreate` by slug (DECISIONS.md
 * #292): a city the owner corrected in the panel is not reset on the next deploy.
 */
export default class extends BaseSeeder {
  override async run() {
    for (const { slug, ...city } of SEED_CITIES) {
      await City.firstOrCreate({ slug }, city)
    }
  }
}
