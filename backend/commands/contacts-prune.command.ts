import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

/**
 * Deletes the contacts kept longer than the 12 months declared in `docs/SECURITY.md` §8.
 *
 * A contact is personal data (name and e-mail) kept to answer whoever wrote, and a retention
 * with no job behind it is a promise nobody keeps. The rule lives in
 * `AdministratorContactPruneUseCase`; this command only reads the flag and reports.
 *
 * There is no scheduler inside the application: this is a command, and whoever repeats it is
 * the environment (the scheduled task of the Coolify app, `docs/ARCHITECTURE.md` §9.1).
 * Running it twice, or on two replicas at once, is harmless: the second finds nothing older
 * than the cutoff. Only the unexpected error makes it exit with code 1.
 */
export default class ContactsPrune extends BaseCommand {
  static override commandName = 'contacts:prune'
  static override description =
    'Deletes the contacts created more than 12 months ago, answered or not'

  static override options: CommandOptions = { startApp: true }

  @flags.boolean({
    description: 'Counts what would be deleted without deleting anything',
  })
  declare dryRun: boolean

  override async run() {
    const { default: AdministratorContactPruneUseCase } =
      await import('#features/administrator/contacts/prune/prune.use-case')

    const useCase = await this.app.container.make(
      AdministratorContactPruneUseCase,
    )
    const logger = (await this.app.container.make('logger')).child({
      command: 'contacts:prune',
    })

    const result = await useCase.execute({
      dryRun: Boolean(this.dryRun),
      logger,
    })

    if (result.isLeft()) {
      this.logger.error(result.value.message)
      this.exitCode = 1
      return
    }

    if (this.dryRun) {
      this.logger.info(
        `${result.value.matched} contact(s) would be deleted. Nothing was touched.`,
      )
      return
    }

    this.logger.success(`${result.value.deleted} contact(s) deleted.`)
  }
}
