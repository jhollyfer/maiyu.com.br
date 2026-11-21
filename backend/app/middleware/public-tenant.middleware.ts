import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { Rule, z } from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import {
  PublicTenantVisibility,
  type PublicViewer,
} from '#core/public-tenant-visibility'
import { TenantScope } from '#core/tenant-scope'
import HTTPException from '#exceptions/http.exception'
import {
  TenantRepository,
  type PublicTenantTarget,
} from '#repositories/tenant/tenant.repository'

/** The segments a public route carries: the city always, the tenant when the product is per client. */
const PublicParams = z.object({
  city: z.string().min(1).max(80),
  tenant: z.string().min(1).max(80).optional(),
})

/**
 * The optional `?city=` of the global storefront (DECISIONS.md #823): the same slug rule as the city
 * of a URL, never a body. An empty value is the same as none.
 */
const GlobalQuery = z.object({
  city: z.preprocess((value) => {
    if (value === '') return undefined

    return value
  }, Rule.slug().optional()),
})

/**
 * What a route declares: the access it grants (below) or, for a read only, the global storefront.
 * `scope: 'global'` and a write do not combine: a write needs the tenant the URL names, and the global route
 * names none.
 */
type Options =
  | { access?: 'read'; scope?: 'global' }
  | { access: Exclude<Access, 'read'>; scope?: never }

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
 * every tenant of it. A product with one client by nature sets `TENANT_PROJECT.singleSlug` and its public
 * URL keeps neither segment (`/pt-br/agenda`).
 *
 * A public route only reads, unless it declares a write (`{ access: 'insert' }`, DECISIONS.md #397):
 * then it creates rows of the tables the project declared as customer tables (`CustomerScoped`) and
 * of no other, and changes no existing row; `PROJECT_ANONYMOUS_WRITES` lists it, or the public
 * routes net fails. `{ access: 'customer' }` runs after `middleware.auth()` and makes the signed-in
 * account the end customer of the URL's tenant (`TenantScope.ofCustomer`); an account with a membership, or the platform owner, gets
 * 403 there. Both need a tenant: with
 * the city alone they have nowhere to write.
 *
 * `{ scope: 'global' }` is the global storefront (DECISIONS.md #823, block `vitrine`): the route has no
 * `:city` nor `:tenant`, and the request reads every active, released, non-demo tenant of every city,
 * or those of the city `?city=<slug>` names. Read only, and the same `PublicTenantFilter` and
 * preview as any public route.
 */
@inject()
export default class PublicTenantMiddleware {
  constructor(
    private readonly tenants: TenantRepository,
    private readonly config: TenantConfig,
    private readonly visibility: PublicTenantVisibility,
  ) {}

  async handle(context: HttpContext, next: NextFn, options: Options = {}) {
    const notFound = HTTPException.NotFound(
      context.i18n.t('errors.not_found'),
      'RESOURCE_NOT_FOUND',
    )
    const resolved = await this.resolve(context, options.scope === 'global')
    if (!resolved) throw notFound
    const target = await this.released(resolved, context.auth.user ?? null)
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
   * What the project's `PublicTenantFilter` releases (DECISIONS.md #812), plus what the viewer
   * may preview (`PublicTenantVisibility`: the account `silent-auth` checked): the city-wide read keeps only those tenants, and a URL
   * that names a tenant the viewer may not reach is as good as unknown. Ids are asked once.
   */
  private async released(
    target: PublicTenantTarget,
    viewer: PublicViewer | null,
  ): Promise<PublicTenantTarget | null> {
    const named = [target.tenantId].filter((id) => id !== null)
    const ids = [...new Set([...target.cityTenantIds, ...named])]
    const visible = new Set(await this.visibility.of(viewer, ids))
    if (target.tenantId && !visible.has(target.tenantId)) return null

    return {
      ...target,
      cityTenantIds: target.cityTenantIds.filter((id) => visible.has(id)),
    }
  }

  /**
   * Single-client mode (`TENANT_PROJECT.singleSlug`, DECISIONS.md #399): the route carries no segment and
   * the configured tenant is the address, whatever the params say. Otherwise the segments.
   */
  private async resolve(context: HttpContext, global: boolean) {
    // Single-client mode wins over the global scope: the one configured tenant is the whole address.
    if (this.config.singleSlug !== null)
      return this.tenants.resolveSingle(this.config.singleSlug)

    if (global) return this.resolveGlobal(context.request.qs())

    const segments = PublicParams.safeParse(context.params)
    if (!segments.success) return null

    return this.tenants.resolvePublic(
      segments.data.city,
      segments.data.tenant ?? null,
    )
  }

  /**
   * The global storefront (DECISIONS.md #823): no `:city` nor `:tenant` segment, every active tenant
   * the project releases, narrowed by the optional `?city=<slug>`. A malformed or unknown city is the
   * same 404 as a city segment that does not exist. The release and the preview go through the same
   * `released` as every public route, so the filter and a member's preview (#812) hold here too.
   */
  private async resolveGlobal(query: Record<string, unknown>) {
    const filter = GlobalQuery.safeParse(query)
    if (!filter.success) return null

    return this.tenants.resolveGlobal(filter.data.city ?? null)
  }
}
