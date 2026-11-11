/**
 * An account's role. It is the project's file (KIT.md §3.4): the sync creates this
 * skeleton when it is missing and never overwrites it, because the kit reads the names
 * (`actor.validator.ts`, the role and documentation middlewares, `StoragePolicy`, the
 * owner seeder) but the roles themselves are the product's. The skeleton has only the
 * owner the seeder creates, the same literal as the `users` migration.
 */
export const USER_ROLE = {
  ADMINISTRATOR: 'ADMINISTRATOR',
} as const

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE]

export const USER_ROLES = Object.values(USER_ROLE)

/**
 * Whoever operates the panel, and not only their own account. Apart from `USER_ROLES` so
 * that a new public role is left out of the staff checks by construction.
 */
export const STAFF_USER_ROLES: ReadonlyArray<UserRole> = [
  USER_ROLE.ADMINISTRATOR,
]
