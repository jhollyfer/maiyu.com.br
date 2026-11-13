import type { AreaAccount, AreaRule } from '#/lib/area-capability'
import { PLATFORM_ROLE, STAFF_USER_ROLES } from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

/**
 * The panel areas and who enters each one, read by the area guard (`SessionGuard.requireArea`,
 * `lib/session-guard.ts`) and by the menu (`PanelMenu.visible`, `lib/panel-menu.ts`). It is the project's file (KIT.md §3.4): the
 * sync creates this skeleton when it is missing and never overwrites it, because the areas and the
 * roles are the product's. An area lists platform roles and/or roles in the active tenant
 * (DECISIONS.md #394, #397).
 */
export const AREAS = {
  platform: { platform: [PLATFORM_ROLE.OWNER] },
  administrator: { tenant: STAFF_USER_ROLES },
} as const satisfies Record<string, AreaRule>

const HOMES = {
  OWNER: '/profile',
  ADMINISTRATOR: '/profile',
  USER: '/profile',
} as const satisfies Record<PlatformRole, string>

/**
 * Where whoever just signed in, or cannot enter an area, goes: the home of the account, by its
 * `platformRole` and `tenant`. `{ to }` and never an `href`: the route is checked against the
 * generated tree, and `Link`, `redirect` and `navigate` take it the same way (DECISIONS.md #491).
 * The panel has only the profile so far, the one route the kit brings; each role gets its own home
 * when its area's routes exist, and may decide it with `AreaCapability.allows`:
 * `lib/area-capability.ts` imports nothing from this file, so the value import closes no cycle
 * (DECISIONS.md #764).
 */
export function homeOf(account: AreaAccount): {
  readonly to: (typeof HOMES)[PlatformRole]
} {
  return { to: HOMES[account.platformRole] }
}
