import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { E2eGuard } from '#tests/e2e-guard'
import { ProjectE2eAccounts } from '#tests/e2e-project-accounts'
import type { ProjectE2eAccountName } from '#tests/e2e-project-accounts'
import { E2eSkeletonAccounts } from '#tests/e2e-skeleton-accounts'

/** The prefix of the line the Playwright setup reads: the app also logs to the same stream. */
export const E2E_ACCOUNTS_MARKER = 'E2E_ACCOUNTS='

/** The groups of the printed line that no account can be named after: `project`, and `accounts`, the file the setup keeps them in. */
export const E2E_GROUP_NAMES = ['project', 'accounts'] as const

/** The names a project account cannot have, as a type. */
export type ReservedAccountName =
  | (typeof E2eSkeletonAccounts.roleNames)[number]
  | (typeof E2E_GROUP_NAMES)[number]

/** The names of `TNames` that repeat a reserved one: it must be `never`, or the check below stops compiling. */
export type KitAccountNameCollision<TNames extends string> = Extract<
  TNames,
  ReservedAccountName
>

/** The compile-time check: a project name equal to a reserved one stops this `{}` from compiling. */
export const PROJECT_ACCOUNT_NAMES_FREE_OF_KIT: Record<
  KitAccountNameCollision<ProjectE2eAccountName>,
  never
> = {}

/**
 * Creates, for one E2E run, an account for each role of the project and prints them
 * (DECISIONS.md #442). The password is random per run and exists only in this output and in the
 * database of the run: no `.env` key holds it, so nothing in Git or in the environment is a
 * credential someone could use against another deployment. Any `NODE_ENV` other than
 * `development` and `test` refuses to run: an account with a known login and a password nobody
 * chose has no place there.
 *
 * The command has no tenant in it (DECISIONS.md #778): it keeps the guard, the random password, the
 * `E2E-` marker, the printed line and the order of the link step. The roles and the rows behind
 * them come from `tests/e2e-skeleton-accounts.ts` (the project's file, with the tenant model of the
 * kit as its skeleton), and the domain accounts from `tests/e2e-project-accounts.ts`. A role the
 * project does not have is printed as `null`, and the setup skips it.
 */
export default class E2eAccounts extends BaseCommand {
  static override commandName = 'e2e:accounts'
  static override description =
    'Creates one account per role for the E2E run (development and test only) and prints them as JSON'

  static override options: CommandOptions = { startApp: true }

  /**
   * The names a project account cannot have (DECISIONS.md #611, #778): the roles of the skeleton's
   * map and the groups above. The setup writes one `playwright/.auth/<name>.json` per name, so a
   * repeated name would overwrite another session. Read when the command runs, from the skeleton.
   */
  static reservedNames(): ReadonlyArray<string> {
    return [...E2eSkeletonAccounts.roleNames, ...E2E_GROUP_NAMES]
  }

  override async run() {
    // An allow list, not a deny list: any environment that is not one of these two (production,
    // staging, a typo) is refused. The process environment wins over `.env`, so whoever starts
    // this process decides, and the caller must not override `NODE_ENV`. The database host must
    // also be loopback: a production container started with `NODE_ENV=development` would
    // otherwise create accounts there (DECISIONS.md #732).
    const refusal = E2eGuard.environmentRefusal(
      'e2e:accounts',
      this.app.nodeEnvironment,
      // The URL the Lucid connection really uses (`config/database.ts`), not a second read of `.env`.
      this.app.config.get<string | undefined>(
        'database.connections.pg.connection.connectionString',
      ),
    )
    if (refusal) {
      this.logger.error(refusal)
      this.exitCode = 1
      return
    }

    const reserved = E2eAccounts.reservedNames()
    const specs = ProjectE2eAccounts.accounts
    const repeated = Object.keys(specs).filter((name) =>
      reserved.includes(name),
    )
    if (repeated.length > 0) {
      this.logger.error(
        `e2e:accounts: project account name(s) ${repeated.join(', ')} repeat a role of the kit`,
      )
      this.exitCode = 1
      return
    }

    const created = await E2eSkeletonAccounts.create(specs)

    // After every account exists and before anything is printed: a failing link prints no account.
    await ProjectE2eAccounts.link(created.userOf)

    this.logger.log(
      `${E2E_ACCOUNTS_MARKER}${JSON.stringify({ project: created.project, ...created.roles })}`,
    )
  }
}
