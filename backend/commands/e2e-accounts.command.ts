import { randomBytes, randomUUID } from 'node:crypto'

import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { ACTIVE_STATUS, PLATFORM_ROLE } from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import User from '#models/user'
import { E2eGuard } from '#tests/e2e-guard'
import { ProjectE2eAccounts } from '#tests/e2e-project-accounts'
import type {
  ProjectE2eAccountName,
  ProjectE2eAccountSpec,
} from '#tests/e2e-project-accounts'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/** The prefix of the line the Playwright setup reads: the app also logs to the same stream. */
export const E2E_ACCOUNTS_MARKER = 'E2E_ACCOUNTS='

/**
 * The names a project account cannot have (DECISIONS.md #611): the kit's own accounts, the `project`
 * group they are printed in and `accounts`, the file the setup keeps them in. The setup writes one
 * `playwright/.auth/<name>.json` per name, so a repeated name would overwrite another session.
 */
export const E2E_KIT_ACCOUNT_NAMES = [
  'platformOwner',
  'platformAdministrator',
  'staff',
  'nonStaff',
  'customer',
  'project',
  'accounts',
] as const

/** The names of `TNames` that repeat a reserved one: it must be `never`, or the check below stops compiling. */
export type KitAccountNameCollision<TNames extends string> = Extract<
  TNames,
  (typeof E2E_KIT_ACCOUNT_NAMES)[number]
>

/** The compile-time check: a project name equal to a kit one stops this `{}` from compiling. */
export const PROJECT_ACCOUNT_NAMES_FREE_OF_KIT: Record<
  KitAccountNameCollision<ProjectE2eAccountName>,
  never
> = {}

/**
 * The e-mail `e2e:accounts` gives every account it creates (`e2e-<label>-<8 hex>@example.com`) and
 * the prefix of its name, so `e2e:cleanup` finds them again and nothing else (DECISIONS.md #713).
 * The label is the role or the project's account name, which may have capitals; hence the
 * case-insensitive match on the e-mail.
 */
export const E2E_ACCOUNT_EMAIL_PATTERN =
  '^e2e-[a-z0-9-]+-[0-9a-f]{8}@example\\.com$'
export const E2E_ACCOUNT_NAME_PREFIX = 'E2E '

/** What the setup needs to sign an account in. */
type E2eAccount = { readonly login: string; readonly password: string }

/**
 * Creates, for one E2E run, an account for each role of the project and prints them
 * (DECISIONS.md #442). The password is random per run and exists only in this output and in the
 * database of the run: no `.env` key holds it, so nothing in Git or in the environment is a
 * credential someone could use against another deployment. Any `NODE_ENV` other than
 * `development` and `test` refuses to run: an account with a known login and a password nobody
 * chose has no place there.
 *
 * Roles are not named here: `tests/role-fixtures.ts` (the project's file) says which tenant roles
 * the specs sign in with, and the platform roles are the kit's own. A project with a single role
 * has no `nonStaff`, and the setup skips it.
 */
export default class E2eAccounts extends BaseCommand {
  static override commandName = 'e2e:accounts'
  static override description =
    'Creates one account per role for the E2E run (development and test only) and prints them as JSON'

  static override options: CommandOptions = { startApp: true }

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

    const reserved: ReadonlyArray<string> = E2E_KIT_ACCOUNT_NAMES
    const repeated = Object.keys(ProjectE2eAccounts.accounts).filter((name) =>
      reserved.includes(name),
    )
    if (repeated.length > 0) {
      this.logger.error(
        `e2e:accounts: project account name(s) ${repeated.join(', ')} repeat a role of the kit`,
      )
      this.exitCode = 1
      return
    }

    // The tenant the public anonymous writes land in: in the single-client mode the one of
    // `SINGLE_TENANT_SLUG` (DECISIONS.md #711), the same config the middleware reads.
    const config = await this.app.container.make(TenantConfig)
    const tenant = await Tenants.forE2e(config.singleSlug)
    const { nonStaff } = ROLE_FIXTURES

    const project = await this.projectAccounts(tenant)

    const accounts = {
      project: project.accounts,
      platformOwner: await this.account('platform-owner', PLATFORM_ROLE.OWNER),
      platformAdministrator: await this.account(
        'platform-administrator',
        PLATFORM_ROLE.ADMINISTRATOR,
      ),
      staff: await this.member(tenant, 'staff', ROLE_FIXTURES.staff),
      nonStaff: await this.optionalMember(tenant, 'non-staff', nonStaff),
      customer: await this.account('customer', PLATFORM_ROLE.USER),
    }

    // After every account exists and before anything is printed: a failing link prints no account.
    await ProjectE2eAccounts.link(project.userOf)

    this.logger.log(`${E2E_ACCOUNTS_MARKER}${JSON.stringify(accounts)}`)
  }

  /** The extra accounts of `tests/e2e-project-accounts.ts` (DECISIONS.md #611), by the name the project gave them. */
  private async projectAccounts(
    tenant: Awaited<ReturnType<typeof Tenants.forE2e>>,
  ) {
    const users = new Map<string, User>()
    const accounts: Record<string, E2eAccount> = {}
    const specs: ReadonlyArray<[string, ProjectE2eAccountSpec]> =
      Object.entries(ProjectE2eAccounts.accounts)

    for (const [name, spec] of specs) {
      let platformRole: PlatformRole = PLATFORM_ROLE.USER
      if ('platformRole' in spec) platformRole = spec.platformRole
      const created = await this.create(name, platformRole)
      if ('tenantRole' in spec)
        await Tenants.addMember(created.user, tenant, spec.tenantRole)
      users.set(name, created.user)
      accounts[name] = created.account
    }

    const userOf = (name: string): User => {
      const user = users.get(name)
      if (!user) throw new Error(`no project account named ${name}`)

      return user
    }

    return { userOf, accounts }
  }

  /** `null` when the project has no role of that kind: the case does not exist, and the setup skips it. */
  private async optionalMember(
    tenant: Awaited<ReturnType<typeof Tenants.forE2e>>,
    label: string,
    role: Parameters<typeof Tenants.addMember>[2] | null,
  ): Promise<E2eAccount | null> {
    if (role === null) return null

    return this.member(tenant, label, role)
  }

  private async member(
    tenant: Awaited<ReturnType<typeof Tenants.forE2e>>,
    label: string,
    role: Parameters<typeof Tenants.addMember>[2],
  ): Promise<E2eAccount> {
    const created = await this.create(label, PLATFORM_ROLE.USER)
    await Tenants.addMember(created.user, tenant, role)

    return created.account
  }

  private async account(
    label: string,
    platformRole: PlatformRole,
  ): Promise<E2eAccount> {
    return (await this.create(label, platformRole)).account
  }

  private async create(
    label: string,
    platformRole: PlatformRole,
  ): Promise<{ user: User; account: E2eAccount }> {
    const login = `e2e-${label}-${randomUUID().slice(0, 8)}@example.com`
    // 12 random characters plus one of each class the password policy asks for.
    const password = `${randomBytes(9).toString('base64url')}aA1!`
    const user = await User.create({
      name: `${E2E_ACCOUNT_NAME_PREFIX}${label}`,
      email: login,
      password,
      platformRole,
      status: ACTIVE_STATUS.ACTIVE,
    })

    return { user, account: { login, password } }
  }
}
