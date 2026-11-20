import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { PLATFORM_ROLE, type PlatformRole } from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'

/** The roles the platform's area admits when the route names none: the owner only. */
const DEFAULT_ROLES: ReadonlyArray<PlatformRole> = [PLATFORM_ROLE.OWNER]

/**
 * The platform's area (DECISIONS.md #390, #797): the city catalog and the overview of every tenant
 * for the owner, and, when the route lists it (`middleware.platform({ roles: PLATFORM_STAFF_ROLES })`),
 * the platform's back-office for its staff too (DECISIONS.md #404). Without `roles` only the owner
 * passes, so a route that never changed keeps its behavior. A tenant's administrator is nobody here.
 * Runs after `middleware.auth()`, on the group, like `role.middleware.ts`, and answers the same `403`.
 */
export default class PlatformMiddleware {
  async handle(
    context: HttpContext,
    next: NextFn,
    options: { roles?: ReadonlyArray<PlatformRole> } = {},
  ) {
    const roles = options.roles ?? DEFAULT_ROLES

    if (!roles.includes(context.actor.platformRole)) {
      throw HTTPException.Forbidden(
        context.i18n.t('errors.access_denied'),
        'ACCESS_DENIED',
      )
    }

    await next()
  }
}
