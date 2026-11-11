import { BaseCommand, flags } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import ErrorMessage from '#core/error-message'

/** How many hours a `PENDING` or an orphan `UPLOADED` may stay before it goes. */
const DEFAULT_HOURS = 24

const HOUR_IN_MS = 60 * 60 * 1000

/**
 * The refusals of the delete use case that are a race with someone else, not
 * a failure of the sweep: another replica or a `DELETE` took the row
 * (`STORAGE_NOT_FOUND`), a `complete` confirmed it first
 * (`STORAGE_ALREADY_UPLOADED`), a form attached it after the listing
 * (`STORAGE_IN_USE`). They count as skipped and log at info; the exit code
 * turns 1 only on what nobody expected (a 5xx or an exception).
 */
const BENIGN_RACES: ReadonlySet<string> = new Set([
  'STORAGE_NOT_FOUND',
  'STORAGE_ALREADY_UPLOADED',
  'STORAGE_IN_USE',
])

/**
 * Deletes the uploads that started and never finished, and the confirmed files
 * nobody attached.
 *
 * The upload has three steps and the binary does not pass through here:
 * `POST /storages` writes the `PENDING` row and signs the URLs, the client uploads the
 * parts straight to the bucket, and `POST /storages/:id/complete` confirms. Whoever
 * closes the tab midway never reaches the third step, and nothing else returns to that
 * row - `DELETE` is the explicit cancellation, and nobody calls it for an upload
 * already forgotten.
 *
 * What is left is not just a dead row. The parts already sent live under the
 * `uploadId`, do not show in the bucket's object listing, and keep being billed -
 * it is garbage only the multipart abort reaches. Without this sweep the state
 * machine never closes: `PENDING` is the only state one never leaves.
 *
 * The orphan is the other half (`StorageRepository.findOrphans`): an avatar
 * uploaded and then replaced, an attachment of a form never submitted. Its age
 * is counted from the confirmation, with the same `--hours`: a file confirmed a
 * minute ago may be the one a form is about to submit.
 *
 * Both go through `StoragesFileDeleteUseCase` instead of repeating the abort and
 * the reference rule here: two implementations of the same thing leaves one
 * behind. The use case checks the references again, so a file attached between
 * the listing and the deletion answers `STORAGE_IN_USE` and stays.
 *
 * There is no scheduler inside the application: this is a command, and whoever
 * repeats it is the environment (host cron, Kubernetes `CronJob`). Running on two
 * replicas at the same time is harmless: the second finds the row already gone
 * and counts it as skipped (`BENIGN_RACES`). Only the unexpected error makes the
 * command exit with code 1.
 */
export default class StoragesPrune extends BaseCommand {
  static override commandName = 'storages:prune'
  static override description =
    'Deletes the abandoned PENDING uploads (aborting the multipart) and the orphan UPLOADED files'

  static override options: CommandOptions = { startApp: true }

  @flags.number({
    description: `Minimum age, in hours, to consider a PENDING abandoned or an UPLOADED orphan (default: ${DEFAULT_HOURS})`,
  })
  declare hours: number

  @flags.boolean({
    description: 'Lists what would be deleted without deleting anything',
  })
  declare dryRun: boolean

  override async run() {
    const { StorageRepository } =
      await import('#repositories/storage/storage.repository')
    const { default: StoragesFileDeleteUseCase } =
      await import('#features/storages/files/delete/delete.use-case')

    const hours = this.hours ?? DEFAULT_HOURS
    const cutoff = new Date(Date.now() - hours * HOUR_IN_MS)
    const storages = await this.app.container.make(StorageRepository)

    const swept = [
      ...(await storages.findAbandoned(cutoff)),
      ...(await storages.findOrphans(cutoff)),
    ]

    if (swept.length === 0) {
      this.logger.info(
        `No PENDING upload nor orphan file older than ${hours}h.`,
      )
      return
    }

    if (this.dryRun) {
      for (const storage of swept) {
        const { originalName, status, createdAt } = storage.snapshot()

        this.logger.info(
          `${storage.id} ${originalName} ${status} (${createdAt?.toISOString()})`,
        )
      }

      this.logger.info(
        `${swept.length} file(s) would be deleted. Nothing was touched.`,
      )
      return
    }

    const useCase = await this.app.container.make(StoragesFileDeleteUseCase)
    const logger = (await this.app.container.make('logger')).child({
      command: 'storages:prune',
    })

    let removed = 0
    let skipped = 0
    let failed = 0

    for (const storage of swept) {
      // An error on one row does not bring down the batch: the bucket may refuse to abort
      // an `uploadId` it no longer knows, and the next sweep would never get past the
      // first row if that interrupted it.
      try {
        const result = await useCase.execute({ id: storage.id, logger })

        if (result.isLeft() && BENIGN_RACES.has(result.value.code)) {
          skipped += 1
          this.logger.info(`${storage.id}: ${result.value.message}`)
          continue
        }

        if (result.isLeft()) {
          failed += 1
          this.logger.warning(`${storage.id}: ${result.value.message}`)
          continue
        }

        removed += 1
      } catch (error) {
        failed += 1
        this.logger.warning(`${storage.id}: ${ErrorMessage.of(error)}`)
      }
    }

    this.logger.success(
      `${removed} file(s) deleted, ${skipped} skipped, ${failed} failed.`,
    )

    if (failed > 0) this.exitCode = 1
  }
}
