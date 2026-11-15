import factory from '@adonisjs/lucid/factories'

import { ACTIVE_STATUS, PLATFORM_ROLE } from '@maiyu/shared'

import User from '#models/user'

/**
 * The password of every account the factory creates. It passes the `password()` policy
 * (8 to 32 characters, lowercase, uppercase, digit and symbol), so it signs in for real
 * through the sign-in route.
 *
 * Plain text on purpose: the `withAuthFinder` mixin of `#models/user` hashes it on save, and
 * a hash here would become a hash of a hash that no sign-in matches.
 */
export const FACTORY_PASSWORD = 'Demo1234!'

/**
 * An account (_doc-lib/lucid.md#model-factories). The default is an ordinary account, below the
 * platform owner, and a spec that needs the owner asks for the state, so nobody gains privilege
 * by omission. The role inside a tenant is a membership (`tests/tenants-fixtures.ts`,
 * DECISIONS.md #390), not a column of the account.
 *
 * Extension point (KIT.md §3.4): the project fills the columns and states it added to the model.
 */
export const UserFactory = factory
  .define(User, ({ faker }) => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: FACTORY_PASSWORD,
    platformRole: PLATFORM_ROLE.USER,
    status: ACTIVE_STATUS.ACTIVE,
  }))
  .state('platformOwner', (user) => {
    user.platformRole = PLATFORM_ROLE.OWNER
  })
  // The platform's staff (DECISIONS.md #404): it does the platform's own back-office work.
  .state('platformAdministrator', (user) => {
    user.platformRole = PLATFORM_ROLE.ADMINISTRATOR
  })
  // The public account (DECISIONS.md #396): a mobile and no e-mail, in E.164 (`+55`, area code
  // 97, the leading 9 and eight digits) so it passes `Rule.phone()` and the table's `check`.
  .state('byPhone', (user, { faker }) => {
    user.email = null
    user.phone = `+55979${faker.string.numeric(8)}`
  })
  .build()
