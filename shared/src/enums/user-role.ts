/**
 * An account's role. It is the project's file (KIT.md §3.4): the sync creates this
 * skeleton when it is missing and never overwrites it, because the kit reads the names
 * (`actor.validator.ts`, the role and documentation middlewares, `StoragePolicy`, the
 * owner seeder) but the roles themselves are the product's. The skeleton has the owner the
 * seeder creates and one account outside the staff, the one the kit's specs use to prove
 * a non-staff refusal. The `tenant_memberships` migration lists the same literals (a change of
 * roles is a new migration), and `tests/role-fixtures.ts` and the owner seeder read
 * `STAFF_USER_ROLES` and `USER_ROLES`
 * (DECISIONS.md #785): the project fills in its own roles here and edits nothing else of the kit.
 * With no role outside `STAFF_USER_ROLES` the specs of a non-staff refusal skip.
 */
export const USER_ROLE = {
  ADMINISTRATOR: 'ADMINISTRATOR',
  MEMBER: 'MEMBER',
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
