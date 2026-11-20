import app from '@adonisjs/core/services/app'
import logger from '@adonisjs/core/services/logger'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

import { TenantConfig } from '#config/tenant'
import { DemoSeed } from '#database/demo/demo-seed'
import { DemoConfig } from '#database/demo/demo.config'
import env from '#start/env'

/**
 * The demonstration (DECISIONS.md #802): one account per role, one demo tenant per tenant type
 * and one record of each entity of the product, to show the system working. Switched on by
 * `SEED_DEMO_PASSWORD` having a value, in any environment, production included; empty (or only
 * spaces) skips it with one line, like the owner seed (DECISIONS.md #329). A password under
 * `DemoConfig.MIN_PASSWORD_LENGTH` characters is refused with a log, never by throwing: `db:seed`
 * runs on every deploy and a throw would fail the deploy (DECISIONS.md #292).
 *
 * No `static environment`: the key is the switch, not `NODE_ENV` (DECISIONS.md #276). Runs after
 * `city.seed.ts`, which holds the city the tenants need. The logic is in `database/demo/`:
 * Lucid loads every file of this folder as a seeder (DECISIONS.md #380).
 * _doc-lib/lucid.md#seeders, https://lucid.adonisjs.com/docs/seeders
 */
export default class extends BaseSeeder {
  override async run() {
    const password = env.get('SEED_DEMO_PASSWORD')
    if (password === undefined || password.trim() === '') {
      logger.info('SEED_DEMO_PASSWORD is empty: demo seed skipped')
      return
    }

    const refusal = DemoConfig.refusal(password)
    if (refusal !== null) {
      logger.warn(refusal)
      return
    }

    const { seed } = await app.container.make(TenantConfig)
    await DemoSeed.run({
      password,
      siteUrl: env.get('APP_CLIENT_URL') ?? env.get('APP_SERVER_URL'),
      citySlug: seed?.city ?? null,
    })
  }
}
