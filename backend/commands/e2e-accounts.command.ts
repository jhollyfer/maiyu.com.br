import { randomBytes, randomUUID } from 'node:crypto'

import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

import { ACTIVE_STATUS, PLATFORM_ROLE } from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

import User from '#models/user'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/** The prefix of the line the Playwright setup reads: the app also logs to the same stream. */
export const E2E_ACCOUNTS_MARKER = 'E2E_ACCOUNTS='

/** The only environments where the command creates accounts. */
const E2E_ACCOUNTS_ENVIRONMENTS: ReadonlyArray<string> = ['development', 'test']

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
    // this process decides, and the caller must not override `NODE_ENV`.
    if (!E2E_ACCOUNTS_ENVIRONMENTS.includes(this.app.nodeEnvironment)) {
      this.logger.error(
        `e2e:accounts runs only in development and test, not in ${this.app.nodeEnvironment}`,
      )
      this.exitCode = 1
      return
    }

    const tenant = await Tenants.fallback()
    const { nonStaff } = ROLE_FIXTURES

    const accounts = {
      platformOwner: await this.account('platform-owner', PLATFORM_ROLE.OWNER),
      platformAdministrator: await this.account(
        'platform-administrator',
        PLATFORM_ROLE.ADMINISTRATOR,
      ),
      staff: await this.member(tenant, 'staff', ROLE_FIXTURES.staff),
      nonStaff: await this.optionalMember(tenant, 'non-staff', nonStaff),
      customer: await this.account('customer', PLATFORM_ROLE.USER),
    }

    this.logger.log(`${E2E_ACCOUNTS_MARKER}${JSON.stringify(accounts)}`)
  }

  /** `null` when the project has no role of that kind: the case does not exist, and the setup skips it. */
  private async optionalMember(
    tenant: Awaited<ReturnType<typeof Tenants.fallback>>,
    label: string,
    role: Parameters<typeof Tenants.addMember>[2] | null,
  ): Promise<E2eAccount | null> {
    if (role === null) return null

    return this.member(tenant, label, role)
  }

  private async member(
    tenant: Awaited<ReturnType<typeof Tenants.fallback>>,
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
      name: `E2E ${label}`,
      email: login,
      password,
      platformRole,
      status: ACTIVE_STATUS.ACTIVE,
    })

    return { user, account: { login, password } }
  }
}
