import type { AreaAccount, AreaRule } from '#/lib/area-capability'
import { PLATFORM_ROLE, USER_ROLE } from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

/**
 * The panel areas and who enters each one, read by `AreaCapability` (`lib/area-capability.ts`).
 * It is the project's file (KIT.md §3.4): the sync creates this skeleton when it is missing and
 * never overwrites it, because the areas and the roles are the product's. An area lists platform
 * roles and/or roles in the active tenant (DECISIONS.md #394, #397).
 */
export const AREAS = {
  platform: { platform: [PLATFORM_ROLE.OWNER] },
  administrator: { tenant: [USER_ROLE.ADMINISTRATOR] },
} as const satisfies Record<string, AreaRule>

const HOMES = {
  OWNER: '/platform',
  ADMINISTRATOR: '/',
  USER: '/',
} as const satisfies Record<PlatformRole, string>

/**
 * Where whoever cannot enter an area goes. `href` and not `to` in the skeleton: the project has no
 * route yet to type against, and `redirect` accepts both. A project with its routes returns `{ to }`,
 * by the account's `platformRole` and `tenant`.
 */
export function homeOf(account: AreaAccount): { readonly href: string } {
  return { href: HOMES[account.platformRole] }
}
