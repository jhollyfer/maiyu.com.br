import { ACTIVE_STATUS, USER_ROLE } from '@maiyu/shared'
import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import User from '#models/user'
import env from '#start/env'

/**
 * The first administrator: no endpoint creates an account without a session, so a new
 * database would have nowhere to start.
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
    await User.firstOrCreate(
      { email },
      {
        name: 'Administrator',
        password,
        role: USER_ROLE.ADMINISTRATOR,
        status: ACTIVE_STATUS.ACTIVE,
      },
    )
  }
}
