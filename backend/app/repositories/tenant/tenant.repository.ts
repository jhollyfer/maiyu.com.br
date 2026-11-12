import type {
  AuthenticationTenantsResponse,
  CityTenantsResponse,
  PlatformMemberResponse,
  PlatformOverviewResponse,
  TenantAccess,
  UserRole,
} from '@maiyu/shared'

import type { Tenant, TenantHierarchy } from '#domain/tenant/tenant.entity'

export type TenantMembershipRead = AuthenticationTenantsResponse['data'][number]

/** A membership as the platform owner manages it. */
export type TenantMemberRead = PlatformMemberResponse

/** A tenant as the public city list shows it. */
export type TenantPublicRead = CityTenantsResponse[number]

/** What a public URL resolves to: the city, and the tenant when the URL names one. */
export type PublicTenantTarget = {
  readonly cityId: string
  readonly tenantId: string | null
  readonly cityTenantIds: ReadonlyArray<string>
}

/**
 * The tenant and membership reads the kit needs (DECISIONS.md #390), by intent
 * (`_standards/domain.md` §5.1). Only active tenants count: an inactive one is as good as absent
 * for access, for the public URL and for the selector.
 */
export abstract class TenantRepository {
  /**
   * The membership the request works in: the `preferred` one when the account still has it,
   * else the only one when there is exactly one, else `null` (the account picks among several).
   * `childIds` are the active tenants under it.
   */
  abstract accessFor(
    userId: string,
    preferred: string | null,
  ): Promise<TenantAccess | null>
  /** Whether the account has any membership in an active tenant: it is then never a customer. */
  abstract hasMembership(userId: string): Promise<boolean>
  /** The account's memberships, for the tenant selector. */
  abstract membershipsOf(userId: string): Promise<TenantMembershipRead[]>
  /** Records the account's pick; the access is checked again on every request. */
  abstract setActive(userId: string, tenantId: string): Promise<void>
  /** A public URL's city and, when given, tenant; `null` when either does not exist. */
  abstract resolvePublic(
    citySlug: string,
    tenantSlug: string | null,
  ): Promise<PublicTenantTarget | null>
  /**
   * The active tenant with this slug, for the single-client mode (DECISIONS.md #399): no city
   * segment, so the slug is the whole address. `null` when none is active, and also when two
   * cities share the slug: the address would be ambiguous, and serving one of them by id order
   * could show the wrong client's public data.
   */
  abstract resolveSingle(slug: string): Promise<PublicTenantTarget | null>
  /** The active tenants among `ids`, by name. */
  abstract listPublic(ids: ReadonlyArray<string>): Promise<TenantPublicRead[]>
  /** The platform owner's counts: tenants per city, members per tenant. */
  abstract overview(): Promise<PlatformOverviewResponse>

  /**
   * The tenant, active or not, for the platform owner's CRUD (DECISIONS.md #397). The platform area
   * sits above the tenants, so no tenant scope applies here.
   */
  abstract findById(id: string): Promise<Tenant | null>
  /**
   * What the one-level rule needs (the `Tenant` entity's): the parent's own parent and whether the
   * tenant `id` (`null` when it is being born) already has children. `null` when `parentId` names
   * no tenant.
   */
  abstract hierarchyOf(
    id: string | null,
    parentId: string | null,
  ): Promise<TenantHierarchy | null>
  /** Whether another tenant of the city already holds the slug, the URL segment. */
  abstract slugTaken(
    cityId: string,
    slug: string,
    exceptId: string | null,
  ): Promise<boolean>
  abstract save(tenant: Tenant): Promise<void>
  /**
   * Adds the account to the tenant with `role`, or changes the role it has there, and ends every
   * session of the account in the same transaction (`_standards/backend.md` §4.2). `changed` is
   * `false` when the membership already had that role: then nothing is written and no session ends.
   */
  abstract saveMember(
    tenantId: string,
    userId: string,
    role: UserRole,
  ): Promise<{ member: TenantMemberRead; changed: boolean }>
  /**
   * Removes a membership and ends every session of its account in the same transaction; `null`
   * when there was none with that id.
   */
  abstract removeMember(id: string): Promise<TenantMemberRead | null>
}
