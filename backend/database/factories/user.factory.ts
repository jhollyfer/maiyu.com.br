import factory from '@adonisjs/lucid/factories'

import { ACTIVE_STATUS, USER_ROLE } from '@maiyu/shared'

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
 * An account (_doc-lib/lucid.md#model-factories). The default is the least privileged role,
 * outside the staff, and a spec that needs an administrator asks for the state, so nobody
 * gains privilege by omission.
 *
 * Extension point (KIT.md §3.4): the project fills the columns and states it added to the model.
 */
export const UserFactory = factory
  .define(User, ({ faker }) => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: FACTORY_PASSWORD,
    role: USER_ROLE.MEMBER,
    status: ACTIVE_STATUS.ACTIVE,
  }))
  .state('administrator', (user) => {
    user.role = USER_ROLE.ADMINISTRATOR
  })
  .build()
