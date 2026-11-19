import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { ACTIVE_STATUS, PLATFORM_ROLE, STAFF_USER_ROLES } from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import City from '#models/city'
import Tenant from '#models/tenant'
import TenantMembership from '#models/tenant-membership'
import User from '#models/user'
import env from '#start/env'

/**
 * The platform owner: no endpoint creates an account without a session, so a new database
 * would have nowhere to start. When the first tenant was seeded (`tenant.seed.ts`, which runs
 * before this one), the owner also administers it, so the existing panel keeps working after the
 * multi-tenant migration (DECISIONS.md #390).
 *
 * No `static environment` (DECISIONS.md #329): production seeds its owner too, and what
 * switches it on is `SEED_OWNER_PASSWORD` having a value (`_standards/backend.md` §6.2).
 */
export default class extends BaseSeeder {
  override async run() {
    const email = env.get('SEED_OWNER_EMAIL')
    const password = env.get('SEED_OWNER_PASSWORD')

    // `db:seed` runs on every deploy and the keys are only needed on the first one: throwing
    // here would fail the deploy, and a default would be a credential known to every reader.
    if (!email || !password) {
      logger.info(
        'SEED_OWNER_EMAIL or SEED_OWNER_PASSWORD is empty: owner seed skipped',
      )
      return
    }

    // `firstOrCreate` and never `updateOrCreate` (DECISIONS.md #292): the row found is
    // returned as is, so a password changed in the panel is not reset on the next deploy.
    // _doc-lib/lucid.md#crud-operations, https://lucid.adonisjs.com/docs/crud-operations
    const owner = await User.firstOrCreate(
      { email },
      {
        name: 'Administrator',
        password,
        platformRole: PLATFORM_ROLE.OWNER,
        status: ACTIVE_STATUS.ACTIVE,
      },
    )

    const { seed } = await app.container.make(TenantConfig)
    if (!seed) return

    // The slug is unique per city, so the city goes in the lookup.
    const tenant = await Tenant.query()
      .where('slug', seed.slug)
      .whereIn('cityId', City.query().select('id').where('slug', seed.city))
      .first()
    if (!tenant) return

    // The first staff role is the one `ROLE_FIXTURES.owner` has (`tests/role-fixtures.ts`), whatever
    // roles the project's `USER_ROLE` holds (DECISIONS.md #785).
    const [ownerRole] = STAFF_USER_ROLES
    if (ownerRole === undefined) {
      throw new Error('STAFF_USER_ROLES is empty: no role for the tenant owner')
    }

    await TenantMembership.firstOrCreate(
      { userId: owner.id, tenantId: tenant.id },
      { role: ownerRole },
    )
  }
}
