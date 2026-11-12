import { USER_ROLE } from '@maiyu/shared'
import type { UserRole } from '@maiyu/shared'

/**
 * The panel areas and who enters each one, read by `AreaCapability` (`lib/area-capability.ts`).
 * It is the project's file (KIT.md §3.4): the sync creates this skeleton when it is missing and
 * never overwrites it, because the areas and the roles are the product's.
 */
export type Role = UserRole

export const AREAS = {
  administrator: [USER_ROLE.ADMINISTRATOR],
} as const satisfies Record<string, ReadonlyArray<Role>>

/**
 * The panel home of each role. `href` and not `to` in the skeleton: the project has no route yet
 * to type against, and `redirect` accepts both. A project with its routes returns `{ to }`.
 */
const HOMES = {
  ADMINISTRATOR: '/',
  MEMBER: '/',
} as const satisfies Record<Role, string>

/** Where whoever cannot enter an area goes. */
export function homeOf(role: Role): { readonly href: string } {
  return { href: HOMES[role] }
}
