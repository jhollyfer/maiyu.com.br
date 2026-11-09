/**
 * The account role (extension point, KIT.md §3.4). The key names the role in code, the value
 * is what goes to the database and the API, and the type is derived: there is no repeated
 * literal to diverge (`_standards/typescript.md` §4).
 *
 * The site has one kind of account today, the owner who runs it, created only by the seeder
 * (`database/seeders/user.seed.ts`): no endpoint creates an account. A new role enters here
 * and in the `users.role` migration together, or Postgres refuses the insert.
 */
export const USER_ROLE = {
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const USER_ROLES = Object.values(USER_ROLE)

/**
 * Who operates the site and not only their own account: the one list that answers "this
 * person runs the panel", read by the documentation route and by who may download any file.
 * Scattered, a new role would land in one check and not in the other.
 */
export const STAFF_USER_ROLES: ReadonlyArray<UserRole> = [
  USER_ROLE.ADMINISTRATOR,
]
