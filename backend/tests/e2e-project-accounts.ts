import type { PlatformRole, UserRole } from '@maiyu/shared'

import type User from '#models/user'

/** How the command creates one extra account: a member of the fallback tenant, or a platform-only user. */
export type ProjectE2eAccountSpec =
  { readonly tenantRole: UserRole } | { readonly platformRole: PlatformRole }

/**
 * The domain accounts of the E2E run, beyond the roles of the skeleton (DECISIONS.md #611). It is
 * the project's file (KIT.md §3.4): the sync creates this empty model when it is missing and never
 * overwrites it. `e2e:accounts` creates one account per key of `accounts` (random password, same
 * `NODE_ENV` guard), calls `link` with them, and prints them under `project` in `E2E_ACCOUNTS=`.
 * The same names go in `frontend/e2e/support/project-accounts.ts`, which types
 * `E2eAccountsStore.stateOf('<name>')`; the store fails the setup when the two lists differ.
 *
 * A name cannot repeat a role of the kit (`platformOwner`, `platformAdministrator`, `staff`, `nonStaff`,
 * `customer`, nor `project` or `accounts`): the type refuses it, and so does the command, which creates
 * nothing. `{ platformRole: PLATFORM_ROLE.OWNER }` is accepted, since the project asks for it by name.
 *
 * Example: `{ councilorA: { tenantRole: USER_ROLE.COUNCILOR }, councilorB: ..., representative: ... }`.
 */
export class ProjectE2eAccounts {
  static readonly accounts = {} as const satisfies Record<
    string,
    ProjectE2eAccountSpec
  >

  /**
   * `userOf('<name>')` is the account of that name. Creates the domain data that ties the accounts together (a class for each councilor, two
   * councilors of the same category in different classes). It runs after every account exists
   * and before anything is printed: a failure here fails the command and prints no account. Go
   * through the project's use cases or repositories, and keep it idempotent, because the command
   * runs on a database that may already hold the data of an earlier run.
   */
  static async link(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- the skeleton has no account to link
    _userOf: (name: ProjectE2eAccountName) => User,
  ): Promise<void> {}
}

export type ProjectE2eAccountName = keyof typeof ProjectE2eAccounts.accounts
