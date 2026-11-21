import { inject } from '@adonisjs/core'

import { PLATFORM_STAFF_ROLES, type PlatformRole } from '@maiyu/shared'

import { PublicTenantFilter } from '#core/public-tenant-filter'
import { TenantRepository } from '#repositories/tenant/tenant.repository'

/** The account behind a public request, as the `silent-auth` left it in `ctx.auth.user`. */
export type PublicViewer = {
  readonly id: string
  readonly platformRole: PlatformRole
}

/**
 * Which of the tenants a public request may reach (DECISIONS.md #812): the ones the project's
 * `PublicTenantFilter` releases, plus the ones the viewer may preview before they are public. The
 * viewer is the account `silent-auth` already checked (`ctx.auth.user`), never a scope a middleware
 * set: the platform's staff reach every tenant, and a member reaches the tenants it belongs to (one
 * query, asked only when there is an account and some tenant is not released). An anonymous
 * visitor, or an account of another tenant, gets only the released ones.
 */
@inject()
export class PublicTenantVisibility {
  constructor(
    private readonly filter: PublicTenantFilter,
    private readonly tenants: TenantRepository,
  ) {}

  async of(
    viewer: PublicViewer | null,
    ids: ReadonlyArray<string>,
  ): Promise<ReadonlyArray<string>> {
    const released = new Set(await this.filter.released(ids))
    const hidden = ids.filter((id) => !released.has(id))
    if (hidden.length === 0 || viewer === null)
      return ids.filter((id) => released.has(id))
    if (PLATFORM_STAFF_ROLES.includes(viewer.platformRole)) return ids

    const memberships = await this.tenants.membershipsOf(viewer.id)
    const own = new Set(memberships.map((membership) => membership.id))

    return ids.filter((id) => released.has(id) || own.has(id))
  }
}
