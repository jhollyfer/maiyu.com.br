import type { Authenticators } from '@adonisjs/auth/types'
import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { ActorSchema, PLATFORM_ROLE } from '@maiyu/shared'

import { TenantScope } from '#core/tenant-scope'
import HTTPException from '#exceptions/http.exception'
import { TenantRepository } from '#repositories/tenant/tenant.repository'

/**
 * Authenticates the request, denies whoever has no session and leaves in `ctx.actor` whoever
 * acts (_standards/backend.md §4.3). The guard's account is validated against the
 * `shared/` `ActorSchema`: the use case, the policy and Bouncer only know that
 * type, never the model.
 *
 * The private route takes its tenant from the session (DECISIONS.md #390): the account's last
 * pick when the membership still holds, else its only membership. The membership is read on
 * every request, so a revoked one stops working at once, and `ctx.tenantScope` is what the
 * repository base filters by.
 */
@inject()
export default class AuthMiddleware {
  constructor(private readonly tenants: TenantRepository) {}

  async handle(
    ctx: HttpContext,
    next: NextFn,
    options: {
      guards?: (keyof Authenticators)[]
    } = {},
  ) {
    const user = await ctx.auth.authenticateUsing(options.guards)
    const tenant = await this.tenants.accessFor(user.id, user.activeTenantId)
    const actor = ActorSchema.safeParse({
      id: user.id,
      email: user.email,
      phone: user.phone,
      platformRole: user.platformRole,
      tenant,
      avatarId: user.avatarId,
    })

    if (!actor.success) {
      throw HTTPException.Unauthorized(ctx.i18n.t('errors.unauthorized'))
    }

    ctx.actor = actor.data
    // Only an account with no membership at all is a customer (DECISIONS.md #397): one with several
    // and no pick reaches nothing until it picks. The extra read runs only for that case.
    const undecided =
      tenant === null &&
      actor.data.platformRole !== PLATFORM_ROLE.OWNER &&
      (await this.tenants.hasMembership(user.id))
    ctx.tenantScope = TenantScope.ofAccess(actor.data, undecided)

    await next()
  }
}
