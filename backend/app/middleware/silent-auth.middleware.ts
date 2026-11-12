import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import type { Actor } from '@maiyu/shared'

import type { TenantScope } from '#core/tenant-scope'

/**
 * Silent auth middleware can be used as a global middleware to silent check
 * if the user is logged-in or not.
 *
 * The request continues as usual, even when the user is not logged-in.
 */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    await ctx.auth.check()

    await next()
  }
}

/**
 * Who acts in the request, set by `auth.middleware.ts` after validating the account against
 * the `ActorSchema` (_standards/backend.md §4.3). Declared here, in the router middleware every
 * request goes through, as the middleware guide augments `HttpContext` next to the middleware
 * (DECISIONS.md #353; _doc-lib/adonisjs.md#guides/basics/middleware,
 * https://docs.adonisjs.com/guides/basics/middleware).
 */
declare module '@adonisjs/core/http' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- module augmentation: TypeScript only merges an `interface`
  export interface HttpContext {
    actor: Actor
    /**
     * What the request reads and writes among the tenants (DECISIONS.md #390), set by
     * `auth.middleware.ts` or `public-tenant.middleware.ts`; absent reads as no tenant.
     */
    tenantScope?: TenantScope
  }
}
