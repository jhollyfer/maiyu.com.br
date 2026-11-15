import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { type UserRole } from '@maiyu/shared'

import HTTPException from '#exceptions/http.exception'

/**
 * Refuses whoever reaches a module whose role is not theirs **in the active tenant**: the role is
 * the membership's (DECISIONS.md #390), and an account with no active tenant has none.
 *
 * Applied on the route **group**, never on the endpoint: a new endpoint is born
 * protected by the module it was placed in, without depending on someone remembering to
 * annotate it.
 *
 * Always runs after `middleware.auth()`. The order matters: without a session the role
 * of the requester is unknown, so the correct answer is `401`, and it is `auth`
 * that returns it. The `403` here only makes sense when it is already known who is
 * calling - unlike data scope, which answers "not found" so as
 * not to confirm the resource exists.
 */
export default class RoleMiddleware {
  async handle(
    context: HttpContext,
    next: NextFn,
    roles: ReadonlyArray<UserRole>,
  ) {
    const role = context.actor.tenant?.role

    if (!role || !roles.includes(role)) {
      throw HTTPException.Forbidden(
        context.i18n.t('errors.access_denied'),
        'ACCESS_DENIED',
      )
    }

    await next()
  }
}
