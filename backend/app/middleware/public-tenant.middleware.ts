import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { z } from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import { TenantScope } from '#core/tenant-scope'
import HTTPException from '#exceptions/http.exception'
import { TenantRepository } from '#repositories/tenant/tenant.repository'

/** The segments a public route carries: the city always, the tenant when the product is per client. */
const PublicParams = z.object({
  city: z.string().min(1).max(80),
  tenant: z.string().min(1).max(80).optional(),
})

/** What a route may do in the tenant its URL names (DECISIONS.md #390, #397). */
type Access =
  /** Read only: the visitor of a public page. The default. */
  | 'read'
  /**
   * An anonymous write the route declares (a report with no account): it creates rows of customer
   * tables (`CustomerScoped`) in the URL's tenant, and still reads nothing a customer owns.
   */
  | 'insert'
  /**
   * The end customer, after `middleware.auth()`: its new rows of customer tables go to the URL's
   * tenant, owned by it; it reads and changes only what it owns.
   */
  | 'customer'

/**
 * The tenant of a route that names it in the URL (DECISIONS.md #390): the city segment and, when the
 * route has it, the tenant segment (`/:city/:tenant/...`), the same segments the frontend puts after
 * the language. No subdomain, so no wildcard DNS nor a certificate per client. A city or tenant that
 * does not exist answers 404, the same as any unknown address; with the city alone the request reads
 * every tenant of it. A product with one client by nature sets `SINGLE_TENANT_SLUG` and its public
 * URL keeps neither segment (`/pt-br/agenda`).
 *
 * A public route only reads, unless it declares a write (`{ access: 'insert' }`, DECISIONS.md #397):
 * then it creates rows of the tables the project declared as customer tables (`CustomerScoped`) and
 * of no other, and changes no existing row; `PROJECT_ANONYMOUS_WRITES` lists it, or the public
 * routes net fails. `{ access: 'customer' }` runs after `middleware.auth()` and makes the signed-in
 * account the end customer of the URL's tenant (`TenantScope.ofCustomer`); an account with a membership, or the platform owner, gets
 * 403 there. Both need a tenant: with
 * the city alone they have nowhere to write.
 */
@inject()
export default class PublicTenantMiddleware {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly config: TenantConfig,
  ) {}

  async handle(
    context: HttpContext,
    next: NextFn,
    options: { access?: Access } = {},
  ) {
    const notFound = HTTPException.NotFound(
      context.i18n.t('errors.not_found'),
      'RESOURCE_NOT_FOUND',
    )
    const target = await this.resolve(context.params)
    if (!target) throw notFound

    const access = options.access ?? 'read'
    if (access === 'customer') {
      // An account with a membership (or the platform owner) is never a customer: the session's
      // scope, set by `auth.middleware.ts`, says so, and a store's administrator gets 403 here.
      if (!context.tenantScope?.customer)
        throw HTTPException.Forbidden(
          context.i18n.t('errors.access_denied'),
          'ACCESS_DENIED',
        )
      context.tenantScope = TenantScope.ofCustomer(
        context.actor.id,
        target.tenantId,
      )
    } else {
      context.tenantScope = TenantScope.ofPublic(
        target.tenantId,
        target.cityTenantIds,
        { inserts: access === 'insert' },
      )
    }

    await next()
  }

  /**
   * Single-client mode (`SINGLE_TENANT_SLUG`, DECISIONS.md #399): the route carries no segment and
   * the configured tenant is the address, whatever the params say. Otherwise the segments.
   */
  private async resolve(params: HttpContext['params']) {
    if (this.config.singleSlug !== null)
      return this.tenants.resolveSingle(this.config.singleSlug)

    const segments = PublicParams.safeParse(params)
    if (!segments.success) return null

    return this.tenants.resolvePublic(
      segments.data.city,
      segments.data.tenant ?? null,
    )
  }
}
