import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import db from '@adonisjs/lucid/services/db'
import type { TransactionClientContract } from '@adonisjs/lucid/types/database'

import { E2eGuard } from '#tests/e2e-guard'
import {
  E2E_ACCOUNT_EMAIL_PATTERN,
  E2E_ACCOUNT_PHONE_PATTERN,
} from '#tests/e2e-identity'
import { ProjectE2eCleanup } from '#tests/e2e-project-cleanup'
import type { ProjectE2eMarker } from '#tests/e2e-project-cleanup'

/** The prefix of the line the Playwright teardown reads: the app also logs to the same stream. */
export const E2E_CLEANUP_MARKER = 'E2E_CLEANUP='

/**
 * What a spec writes at the start of the field it creates (a title, a name) for `e2e:cleanup` to
 * find the row again (DECISIONS.md #713, #732). The frontend has the same text in `E2eEnv.marker`.
 * With the hyphen: a real title that merely starts with the letters `E2E` is not a marker.
 */
export const E2E_MARKER = 'E2E-'

/**
 * Deletes what the E2E run created, after it (DECISIONS.md #713): the rows of the project tables
 * whose marker column starts with `E2E_MARKER` (`tests/e2e-project-cleanup.ts`) and the accounts
 * whose e-mail is the E2E one (`E2E_ACCOUNT_EMAIL_PATTERN`) or whose phone is the E2E one (`E2E_ACCOUNT_PHONE_PATTERN`, the resident with no
 * e-mail): the ones `e2e:accounts` made and the fresh ones a spec signs up (DECISIONS.md #819); and
 * the tenants named with `E2E_MARKER`. The e-mail or the phone is the only account marker: a sign-up
 * copies the name from the form, so a name filter would leave those accounts behind. The data tied
 * to an account goes with it by the foreign key (`ON DELETE CASCADE`; the kit's tables have it, and
 * a project table that points to `users` must too, or list its rows in `ProjectE2eCleanup.markers`
 * before the accounts). Nothing without the marker is deleted, so a table that is not listed is
 * never touched. Like `e2e:accounts` it runs only in development and test (an allow list: any
 * other environment is refused before the database is opened), and it is idempotent: a second run
 * finds nothing and says zero. Everything goes in one transaction, so a foreign key that refuses
 * undoes the whole run instead of leaving half of it.
 */
export default class E2eCleanup extends BaseCommand {
  static override commandName = 'e2e:cleanup'
  static override description =
    'Deletes the rows and accounts the E2E run created, by marker (development and test only)'

  static override options: CommandOptions = { startApp: true }

  override async run() {
    const markers: ReadonlyArray<ProjectE2eMarker> = ProjectE2eCleanup.markers
    // Before the transaction: the environment and the host (DECISIONS.md #732), then the project's list.
    const refusal =
      E2eGuard.environmentRefusal(
        'e2e:cleanup',
        this.app.nodeEnvironment,
        // The URL the Lucid connection really uses (`config/database.ts`), not a second read of `.env`.
        this.app.config.get<string | undefined>(
          'database.connections.pg.connection.connectionString',
        ),
      ) ?? E2eGuard.markersRefusal(markers, ProjectE2eCleanup.skeletonTables)
    if (refusal) {
      this.logger.error(refusal)
      this.exitCode = 1
      return
    }

    const deleted = await db.transaction(async (trx) => {
      const rows: Record<string, number> = {}
      for (const { table, column } of markers)
        rows[`${table}.${column}`] = E2eCleanup.affected(
          await trx
            .from(table)
            .where(column, 'like', `${E2E_MARKER}%`)
            .delete(),
        )

      const accounts = E2eCleanup.affected(
        await trx
          .from('users')
          .where((query) =>
            query
              .whereRaw('email ~* ?', [E2E_ACCOUNT_EMAIL_PATTERN])
              .orWhereRaw('phone ~ ?', [E2E_ACCOUNT_PHONE_PATTERN]),
          )
          .delete(),
      )

      return { accounts, rows, tenants: await E2eCleanup.tenants(trx) }
    })

    this.logger.log(`${E2E_CLEANUP_MARKER}${JSON.stringify(deleted)}`)
  }

  /**
   * The tenants a spec created (DECISIONS.md #819): the ones whose name starts with `E2E_MARKER`, with
   * what hangs on them without a cascade (the charges and the storages, in this order, because a
   * charge points to a storage). The memberships go by `CASCADE` and the users keep the row with
   * `tenant_id` null. A project without the multi-tenant skeleton has none of these tables, so a
   * missing table is skipped, not an error; the tenant's own tables of the project are in `markers`
   * (children before parents). A tenant whose name only starts with the letters `E2E` stays.
   */
  private static async tenants(
    trx: TransactionClientContract,
  ): Promise<number> {
    if (!(await trx.schema.hasTable('tenants'))) return 0

    const ids = trx
      .from('tenants')
      .where('name', 'like', `${E2E_MARKER}%`)
      .select('id')
    for (const table of ['charges', 'storages'])
      if (await trx.schema.hasTable(table))
        await trx.from(table).whereIn('tenant_id', ids).delete()

    return E2eCleanup.affected(
      await trx
        .from('tenants')
        .where('name', 'like', `${E2E_MARKER}%`)
        .delete(),
    )
  }

  /** The rows a `delete()` removed: the builder answers with the count, or with a list that holds it. */
  private static affected(result: unknown): number {
    if (typeof result === 'number') return result
    if (Array.isArray(result) && typeof result[0] === 'number') return result[0]

    return 0
  }
}
