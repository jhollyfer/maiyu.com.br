import { ACTIVE_STATUS, PLATFORM_ROLE, type ActiveStatus } from '@maiyu/shared'

import { User } from '#domain/user/user.entity'
import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { UserMemoryRepository } from '#repositories/user/user.memory.repository'
import { rightOf } from '#tests/either-fixtures'

export const USER_ID = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'
export const PASSWORD = 'Senha@123'

/**
 * Extension point (KIT.md §3.4): the account and session collaborators, all in memory.
 * The project adds its own doubles; the kit session specs read `users` and `sessions`.
 */
export function identityDoubles() {
  const sessions = new SessionMemoryRepository()

  return { users: new UserMemoryRepository(sessions), sessions }
}

/** The seed options the kit session specs use; the project may add more. */
type Seed = {
  readonly id?: string
  /** Left out, the account has `ana@mail.com`; `null` makes it a phone-only account. */
  readonly email?: string | null
  readonly phone?: string
  readonly inactive?: boolean
}

/** Saves an account in the in-memory repository; the password is `PASSWORD`, hashed on `save`. */
export async function seedUser(
  users: UserMemoryRepository,
  seed: Seed = {},
): Promise<User> {
  let status: ActiveStatus = ACTIVE_STATUS.ACTIVE
  if (seed.inactive) status = ACTIVE_STATUS.INACTIVE
  let email: string | null = 'ana@mail.com'
  if (seed.email !== undefined) email = seed.email
  const user = rightOf(
    User.create({
      id: seed.id ?? USER_ID,
      name: 'Ana',
      email,
      phone: seed.phone ?? null,
      password: PASSWORD,
      platformRole: PLATFORM_ROLE.USER,
      status,
      now: new Date('2026-10-29T12:00:00Z'),
    }),
  )

  await users.save(user)

  return user
}
