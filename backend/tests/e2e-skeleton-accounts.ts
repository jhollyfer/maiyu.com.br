import app from '@adonisjs/core/services/app'

import { ACTIVE_STATUS, PLATFORM_ROLE } from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import User from '#models/user'
import { E2eIdentities } from '#tests/e2e-identity'
import type { E2eAccount } from '#tests/e2e-identity'
import type { ProjectE2eAccountSpec } from '#tests/e2e-project-accounts'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/**
 * The role map of the project (DECISIONS.md #778): the names `E2E_ACCOUNTS=` prints the roles under.
 * The frontend lists the same names in `e2e/support/project-accounts.ts` (`PROJECT_E2E_ROLE_NAMES`)
 * and fails the setup when the two differ. A project with only staff roles (`administrator`,
 * `operator`) lists those, and the multi-tenant model below lists the kit's own.
 */
export type E2eSkeletonRoleName = (typeof E2eSkeletonAccounts.roleNames)[number]

/** One entry per name of the role map: `null` is a role the project does not have in this run, and the setup skips it. */
export type E2eSkeletonRoles = Readonly<
  Record<E2eSkeletonRoleName, E2eAccount | null>
>

/** What the skeleton made for one run: the roles, the project's accounts and a way to find a project user. */
export type E2eSkeletonRun = {
  readonly roles: E2eSkeletonRoles
  readonly project: Readonly<Record<string, E2eAccount>>
  readonly userOf: (name: string) => User
}

/**
 * Everything of `e2e:accounts` that needs the multi-tenant skeleton (DECISIONS.md #778): the
 * `platformRole` column, the tenant and its memberships. It is the project's file (KIT.md §3.4):
 * the sync creates this model when it is missing and never overwrites it. The command itself
 * (guard, random password, `E2E-` marker, the printed line, the order of the link step) does not
 * import the skeleton, so a project without it writes its own version of this file: create the
 * users it has, return `null` for the roles it does not have, and keep the same shape.
 */
export class E2eSkeletonAccounts {
  /** The role map: every key `create` returns in `roles`, and the names a project account cannot take. */
  static readonly roleNames = [
    'platformOwner',
    'platformAdministrator',
    'staff',
    'nonStaff',
    'customer',
  ] as const

  /** The roles and the project accounts of one run, all created before anything is printed. */
  static async create(
    specs: Readonly<Record<string, ProjectE2eAccountSpec>>,
  ): Promise<E2eSkeletonRun> {
    // The tenant the public anonymous writes land in: in the single-client mode the one of
    // `SINGLE_TENANT_SLUG` (DECISIONS.md #711), the same config the middleware reads.
    const config = await app.container.make(TenantConfig)
    const tenant = await Tenants.forE2e(config.singleSlug)
    const { nonStaff } = ROLE_FIXTURES

    const users = new Map<string, User>()
    const project: Record<string, E2eAccount> = {}
    for (const [name, spec] of Object.entries(specs)) {
      let platformRole: PlatformRole = PLATFORM_ROLE.USER
      if ('platformRole' in spec) platformRole = spec.platformRole
      const created = await E2eSkeletonAccounts.user(name, platformRole)
      if ('tenantRole' in spec)
        await Tenants.addMember(created.user, tenant, spec.tenantRole)
      users.set(name, created.user)
      project[name] = created.account
    }

    const member = async (
      label: string,
      role: Parameters<typeof Tenants.addMember>[2],
    ): Promise<E2eAccount> => {
      const created = await E2eSkeletonAccounts.user(label, PLATFORM_ROLE.USER)
      await Tenants.addMember(created.user, tenant, role)

      return created.account
    }
    const optionalMember = async (
      label: string,
      role: Parameters<typeof Tenants.addMember>[2] | null,
    ): Promise<E2eAccount | null> => {
      if (role === null) return null

      return member(label, role)
    }
    const platform = async (
      label: string,
      platformRole: PlatformRole,
    ): Promise<E2eAccount> =>
      (await E2eSkeletonAccounts.user(label, platformRole)).account

    const roles: E2eSkeletonRoles = {
      platformOwner: await platform('platform-owner', PLATFORM_ROLE.OWNER),
      platformAdministrator: await platform(
        'platform-administrator',
        PLATFORM_ROLE.ADMINISTRATOR,
      ),
      staff: await member('staff', ROLE_FIXTURES.staff),
      nonStaff: await optionalMember('non-staff', nonStaff),
      customer: await platform('customer', PLATFORM_ROLE.USER),
    }

    return { roles, project, userOf: E2eSkeletonAccounts.finder(users) }
  }

  private static finder(users: ReadonlyMap<string, User>) {
    return (name: string): User => {
      const user = users.get(name)
      if (!user) throw new Error(`no project account named ${name}`)

      return user
    }
  }

  private static async user(
    label: string,
    platformRole: PlatformRole,
  ): Promise<{ user: User; account: E2eAccount }> {
    const identity = E2eIdentities.of(label)
    const user = await User.create({
      name: identity.name,
      email: identity.login,
      password: identity.password,
      platformRole,
      status: ACTIVE_STATUS.ACTIVE,
    })

    return {
      user,
      account: { login: identity.login, password: identity.password },
    }
  }
}
