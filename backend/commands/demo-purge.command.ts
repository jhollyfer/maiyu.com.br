import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { DemoPurge } from '#database/demo/demo-purge'

/**
 * Removes the demonstration (DECISIONS.md #802): the project's demo records, the files of the demo
 * tenants in the bucket, the demo tenants and the demo accounts, and nothing else. It leaves the
 * database and the bucket as they were before `db:seed` ran with `SEED_DEMO_PASSWORD`. It runs
 * in every environment, production included, because the seed does; what keeps it from deleting
 * by mistake is the confirmation, which `--force` skips for a script. Idempotent: with no demo
 * left it deletes nothing and says zero.
 * _doc-lib/adonisjs.md#guides/ace/creating-commands, https://docs.adonisjs.com/guides/ace/creating-commands
 */
export default class DemoPurgeCommand extends BaseCommand {
  static override commandName = 'demo:purge'
  static override description =
    'Deletes the demonstration: its records, files, tenants and accounts, and nothing else'

  static override options: CommandOptions = { startApp: true }

  @flags.boolean({ description: 'Delete without asking for confirmation' })
  declare force: boolean

  @flags.boolean({ description: 'Only say what would be deleted' })
  declare dryRun: boolean

  override async run() {
    if (this.dryRun) {
      const { tenants, files, accounts } = await DemoPurge.preview()
      this.logger.info(
        `demo:purge would delete ${tenants} tenants, ${files} files and ${accounts} accounts`,
      )
      return
    }

    if (!this.force) {
      const confirmed = await this.prompt.confirm(
        'Delete the demo records, files, tenants and accounts?',
      )
      if (!confirmed) {
        this.logger.info('demo:purge cancelled: nothing was deleted')
        return
      }
    }

    const { tenants, files, accounts } = await DemoPurge.run()
    this.logger.success(
      `demo:purge deleted ${tenants} tenants, ${files} files and ${accounts} accounts`,
    )
  }
}
