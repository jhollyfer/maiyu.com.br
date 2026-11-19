import app from '@adonisjs/core/services/app'
import type { ApiClient } from '@japa/api-client'

import { TenantConfig } from '#config/tenant'
import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import type Tenant from '#models/tenant'
import type User from '#models/user'
import {
  authenticate,
  truncateAndSeed,
  type Session,
} from '#tests/http-core-fixtures'
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'
import { loginOf } from '#tests/users-fixtures'

/**
 * Everything of the HTTP fixtures that needs the multi-tenant skeleton (DECISIONS.md #784): the
 * tenant and its memberships, the platform roles and the `TenantConfig` swap. It is the project's
 * file (KIT.md §3.4): the sync creates this model when it is missing and never overwrites it. The
 * core (`tests/http-core-fixtures.ts`) does not import the skeleton, so a project without it
 * writes its own version of this file: it exports `resetDatabase` (the core's `truncateAndSeed`,
 * with whatever the project arranges around it) and the sign-in helpers for the roles it has.
 * `tests/http-fixtures.ts`, the module the specs import, re-exports the core and this file.
 */
/**
 * An administrator's session, the most used: the administrator of the default tenant
 * (`tests/tenants-fixtures.ts`). The account comes from the factory in the test itself and not
 * from the seeder: the seeder's owner depends on `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD`,
 * which the test environment does not have to define, and a fixed e-mail here would match no
 * account the project's seeder creates.
 */
export async function authenticateAsAdministrator(
  client: ApiClient,
): Promise<Session> {
  const { session } = await signInWithFactory(client, 'staff')

  return session
}

/**
 * A session with the least role, a member of the default tenant outside `STAFF_USER_ROLES`
 * (project extension point in `shared/src/enums/user-role.ts`): it reaches nothing of the
 * administrative panel. It is the other side of every panel permission assertion.
 */
export async function authenticateAsNonStaff(
  client: ApiClient,
): Promise<Session> {
  const { session } = await signInWithFactory(client, 'nonStaff')

  return session
}

/** The platform owner's session (DECISIONS.md #390): no tenant, the city catalog and the overview. */
export async function authenticateAsPlatformOwner(
  client: ApiClient,
): Promise<Session> {
  const { session } = await signInWithFactory(client, 'platformOwner')

  return session
}

/**
 * The platform staff's session (DECISIONS.md #404): `PLATFORM_ROLE.ADMINISTRATOR`, no tenant. It does
 * the platform's own back-office work and reaches nothing of `/platform/*`.
 */
export async function authenticateAsPlatformAdministrator(
  client: ApiClient,
): Promise<Session> {
  const user = await UserFactory.apply('platformAdministrator').create()

  return authenticate(client, loginOf(user), FACTORY_PASSWORD)
}

/**
 * An end customer's session (DECISIONS.md #397): an account with no membership, such as the
 * resident who orders from a store. It reaches only the rows of customer tables it owns.
 */
export async function authenticateAsCustomer(
  client: ApiClient,
): Promise<Session> {
  const user = await UserFactory.create()

  return authenticate(client, loginOf(user), FACTORY_PASSWORD)
}

/** The tenant role each fixture state gets; the owner gets none. */
const STATE_ROLES = {
  staff: ROLE_FIXTURES.staff,
  nonStaff: ROLE_FIXTURES.nonStaff,
} as const

/**
 * Creates the account through the factory, makes it a member of `tenant` (the default one when
 * omitted) with the state's role, and signs in with it. The platform owner gets no membership.
 * Returns the account and its tenant along with the session.
 */
export async function signInWithFactory(
  client: ApiClient,
  state: 'staff' | 'nonStaff' | 'platformOwner' = 'staff',
  tenant?: Tenant,
): Promise<{ user: User; session: Session; tenant: Tenant | null }> {
  if (state === 'platformOwner') {
    const owner = await UserFactory.apply('platformOwner').create()

    return {
      user: owner,
      session: await authenticate(client, loginOf(owner), FACTORY_PASSWORD),
      tenant: null,
    }
  }

  const user = await UserFactory.create()
  const member = tenant ?? (await Tenants.fallback())
  const role = STATE_ROLES[state]
  if (role === null)
    throw new Error(`the project has no ${state} role: ${NO_NON_STAFF_ROLE}`)
  await Tenants.addMember(user, member, role)

  return {
    user,
    session: await authenticate(client, loginOf(user), FACTORY_PASSWORD),
    tenant: member,
  }
}

/**
 * Empties the database and runs the seeders again, so the data the project seeds (catalogs,
 * the owner when its keys are set) is back for the next test. Sessions do not depend on it:
 * they come from the factory (`signInWithFactory`).
 */
export async function resetDatabase() {
  // The kit's specs address tenants by segment, so they run in the multi-tenant mode whatever
  // `TENANT_PROJECT.singleSlug` the project sets (DECISIONS.md #410); the single-client
  // mode has its own specs, which swap the config again.
  app.container.swap(TenantConfig, () => new TenantConfig(null))

  const teardown = await truncateAndSeed()

  return async () => {
    app.container.restore(TenantConfig)
    await teardown()
  }
}
