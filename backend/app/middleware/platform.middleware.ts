import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { PLATFORM_ROLE } from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'

/**
 * The platform owner's area (DECISIONS.md #390): the city catalog and the overview of every tenant.
 * A tenant's administrator is nobody here. Runs after `middleware.auth()`, on the group, like
 * `role.middleware.ts`, and answers the same `403`.
 */
export default class PlatformMiddleware {
  async handle(context: HttpContext, next: NextFn) {
    if (context.actor.platformRole !== PLATFORM_ROLE.OWNER) {
      throw HTTPException.Forbidden(
        context.i18n.t('errors.access_denied'),
        'ACCESS_DENIED',
      )
    }

    await next()
  }
}
