/**
 * The account's role above the tenants (DECISIONS.md #390). `OWNER` runs the platform: the city
 * catalog and the overview of every tenant. `ADMINISTRATOR` is the platform's staff (DECISIONS.md #404):
 * it does the platform's own back-office work and nothing else; the
 * catalog, the tenants, the members and the API documentation stay the owner's. `USER` is everyone else, whose access to a tenant is a
 * membership with a `USER_ROLE`. Kit enum, the same literals as the `users` migration.
 */
export const PLATFORM_ROLE = {
  OWNER: 'OWNER',
  ADMINISTRATOR: 'ADMINISTRATOR',
  USER: 'USER',
} as const

export type PlatformRole = (typeof PLATFORM_ROLE)[keyof typeof PLATFORM_ROLE]

export const PLATFORM_ROLES = Object.values(PLATFORM_ROLE)

/** The roles of the platform's staff: the work that is the platform's own, not a tenant's. */
export const PLATFORM_STAFF_ROLES: ReadonlyArray<PlatformRole> = [
  PLATFORM_ROLE.OWNER,
  PLATFORM_ROLE.ADMINISTRATOR,
]
