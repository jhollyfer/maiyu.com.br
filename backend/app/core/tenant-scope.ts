import { HttpContext } from '@adonisjs/core/http'

import {
  PLATFORM_ROLE,
  PLATFORM_STAFF_ROLES,
  STAFF_USER_ROLES,
} from '@maiyu/shared'
import type { Actor } from '@maiyu/shared'

/** Who the request is among the tenants' rows; each kind is one factory below. */
type Kind = 'none' | 'member' | 'platform' | 'customer' | 'public'

/** Where a new row of a customer table goes, and who owns it (`null`: the tenant's own row). */
export type InsertTarget = {
  readonly tenantId: string | null
  readonly customerId: string | null
}

/**
 * What a request may read and write among the tenants' rows (DECISIONS.md #390, #397). It is the
 * one place the tenant rule lives: the repository helpers (`TenantScoped`, `CustomerScoped`), the
 * in-memory repositories and the policy base read it, and no use case writes `where tenant_id` by
 * hand.
 *
 * Two kinds of table, each declared by its repository through the helper it uses:
 *
 * - a tenant table (`TenantScoped`) belongs to the tenant: its members read and write it, a parent
 *   reads its children's, the public reads the URL's tenant, a customer reads nothing;
 * - a customer table (`CustomerScoped`: an order, a payment proof, the file a customer uploads)
 *   also belongs to the account in its `customer_id`. The owner reads and changes its rows in any
 *   tenant; a row a customer owns reaches, besides its owner, only the staff (`STAFF_USER_ROLES`)
 *   of its own tenant: not a plain member, not the parent tenant (its read is aggregate, #390), not
 *   the public. Only here a customer, or a public route that declared its write, creates a row
 *   (`customerTarget`); a tenant table takes its new rows from `tenantTarget`, which refuses both.
 *
 * The fields:
 *
 * - `tenantId` is where a member writes and the tenant of the URL on a public route; for a customer,
 *   only the tenant its new rows go to.
 * - `readable` adds what the request reads besides its own tenant: the children of a parent tenant
 *   (read only, DECISIONS.md #390), or every tenant of the city on a city-wide public route.
 * - `accountId` is the account behind the session, the owner it matches in a customer table.
 *
 * A request carries one (`ctx.tenantScope`, set by `auth.middleware.ts` or
 * `public-tenant.middleware.ts`), and a request without one gets `none()`. Outside a request (a
 * command, a job) there is no scope: `current()` answers `null` and the repository does not filter,
 * because a system process (the storage cleanup) works across tenants on purpose.
 */
export class TenantScope {
  private constructor(
    private readonly kind: Kind,
    readonly tenantId: string | null,
    readonly readable: ReadonlyArray<string>,
    readonly accountId: string | null,
    /** A public route that declared its write: it creates rows of customer tables only. */
    private readonly inserts: boolean = false,
    /** A member whose role is staff: it reaches the customers' rows of its own tenant. */
    private readonly staff: boolean = false,
    /** The account is the platform's own staff (`PLATFORM_STAFF_ROLES`), whatever else it is. */
    readonly platformStaff: boolean = false,
  ) {}

  /** Whether the request writes a tenant's rows: a member, or the platform owner. */
  get writes(): boolean {
    return this.kind === 'member' || this.kind === 'platform'
  }

  /** Owns the rows of no tenant (`tenant_id` null): the platform owner outside any tenant. */
  get platform(): boolean {
    return this.kind === 'platform'
  }

  /** No tenant, no platform, no account: reads and writes nothing. */
  static none(): TenantScope {
    return new TenantScope('none', null, [], null)
  }

  /**
   * The session's scope: its active membership and the children it reads; without one, the
   * platform's rows for the platform owner. An account that has memberships is never a customer:
   * with several and no pick (`hasMembership`) it reaches nothing until it picks one. Only an account
   * with no membership at all is the end customer.
   */
  static ofAccess(
    actor: Pick<Actor, 'id' | 'tenant' | 'platformRole'>,
    hasMembership = false,
  ): TenantScope {
    const platformStaff = PLATFORM_STAFF_ROLES.includes(actor.platformRole)
    if (actor.tenant)
      return new TenantScope(
        'member',
        actor.tenant.id,
        actor.tenant.childIds,
        actor.id,
        false,
        STAFF_USER_ROLES.includes(actor.tenant.role),
        platformStaff,
      )
    if (actor.platformRole === PLATFORM_ROLE.OWNER)
      return new TenantScope(
        'platform',
        null,
        [],
        actor.id,
        false,
        false,
        platformStaff,
      )
    if (hasMembership)
      return new TenantScope(
        'none',
        null,
        [],
        null,
        false,
        false,
        platformStaff,
      )

    return new TenantScope(
      'customer',
      null,
      [],
      actor.id,
      false,
      false,
      platformStaff,
    )
  }

  /**
   * The end customer (DECISIONS.md #397): an account acting outside any membership, such as the
   * resident ordering from a restaurant. `tenantId` is the tenant the URL names, where its new rows
   * go; `null` when the route names none, and then it only reads and changes what it owns.
   */
  static ofCustomer(accountId: string, tenantId: string | null): TenantScope {
    return new TenantScope('customer', tenantId, [], accountId)
  }

  /**
   * A public route: one tenant, or every tenant of the city when the URL names none. Read only,
   * unless the route declares `inserts` (an anonymous report, DECISIONS.md #397): then it creates
   * rows of customer tables in the URL's tenant, and still changes no existing row. It never reads
   * the platform's rows nor a row a customer owns.
   */
  static ofPublic(
    tenantId: string | null,
    cityTenantIds: ReadonlyArray<string>,
    options: { readonly inserts?: boolean } = {},
  ): TenantScope {
    const inserts = options.inserts ?? false
    if (tenantId) return new TenantScope('public', tenantId, [], null, inserts)

    return new TenantScope('public', null, cityTenantIds, null, inserts)
  }

  /** The running request's scope; `null` outside a request (system process, no filter). */
  static current(): TenantScope | null {
    const context = HttpContext.get()
    if (!context) return null

    return context.tenantScope ?? TenantScope.none()
  }

  /** Whether the running request (or a system process) reads a row of `tenantId`. */
  static reads(tenantId: string | null): boolean {
    return TenantScope.current()?.canRead(tenantId) ?? true
  }

  /** Whether the running request (or a system process) writes a row of `tenantId`. */
  static writes(tenantId: string | null): boolean {
    return TenantScope.current()?.canWrite(tenantId) ?? true
  }

  /** `canReadOwned` for the running request; a system process reads everything. */
  static readsOwned(
    tenantId: string | null,
    customerId: string | null,
  ): boolean {
    return TenantScope.current()?.canReadOwned(tenantId, customerId) ?? true
  }

  /** `canWriteOwned` for the running request; a system process writes everything. */
  static writesOwned(
    tenantId: string | null,
    customerId: string | null,
  ): boolean {
    return TenantScope.current()?.canWriteOwned(tenantId, customerId) ?? true
  }

  /** `customerTarget` for the running request; a system process creates a row of no tenant. */
  static customerTargetOf(): InsertTarget | null {
    const scope = TenantScope.current()
    if (!scope) return { tenantId: null, customerId: null }

    return scope.customerTarget()
  }

  /** `tenantTarget` for the running request; a system process creates a row of no tenant. */
  static tenantTargetOf(): { readonly tenantId: string | null } | null {
    const scope = TenantScope.current()
    if (!scope) return { tenantId: null }

    return scope.tenantTarget()
  }

  /**
   * The membership a session works in: the `preferred` one (the account's last pick) when it is
   * still there, else the only one, else none, so an account with several picks explicitly.
   */
  static pick<TRow extends { readonly id: string }>(
    rows: ReadonlyArray<TRow>,
    preferred: string | null,
  ): TRow | undefined {
    const kept = rows.find((row) => row.id === preferred)
    if (kept) return kept
    if (rows.length !== 1) return undefined

    return rows.at(0)
  }

  /** Every tenant whose rows the scope reads: its own, then the readable ones; none for a customer. */
  tenantIds(): string[] {
    if (this.kind === 'customer' || this.kind === 'none') return []
    if (this.tenantId === null) return [...this.readable]

    return [this.tenantId, ...this.readable]
  }

  /** A row of a tenant table. */
  canRead(tenantId: string | null): boolean {
    if (tenantId === null) return this.platform

    return this.tenantIds().includes(tenantId)
  }

  /** A row of a tenant table. */
  canWrite(tenantId: string | null): boolean {
    if (!this.writes) return false
    if (tenantId === null) return this.platform

    return tenantId === this.tenantId
  }

  /** Whether `customerId` is the account behind the request. */
  owns(customerId: string | null): boolean {
    return customerId !== null && customerId === this.accountId
  }

  /** Whether the request is the end customer (no membership at all). */
  get customer(): boolean {
    return this.kind === 'customer'
  }

  /** The staff of the row's own tenant: who reaches a row a customer owns, besides its owner. */
  servesCustomersOf(tenantId: string | null): boolean {
    return tenantId !== null && tenantId === this.servedTenantId()
  }

  /** The tenant whose customers' rows the request reaches: its own, and only for staff. */
  servedTenantId(): string | null {
    if (!this.staff) return null

    return this.tenantId
  }

  /**
   * A row of a customer table: its owner; the tenant's own rows (`customer_id` null) like a tenant
   * table; a customer's row only for the staff of its own tenant.
   */
  canReadOwned(tenantId: string | null, customerId: string | null): boolean {
    if (this.owns(customerId)) return true
    if (customerId !== null) return this.servesCustomersOf(tenantId)

    return this.canRead(tenantId)
  }

  /** A row of a customer table: its owner, and the same members `canReadOwned` lets in, writing. */
  canWriteOwned(tenantId: string | null, customerId: string | null): boolean {
    if (this.owns(customerId)) return true
    if (customerId !== null) return this.servesCustomersOf(tenantId)

    return this.canWrite(tenantId)
  }

  /**
   * Where a new row of a tenant table goes: the member's tenant or, for its owner, the platform.
   * `null` for a customer and for every public route, even one that declared its write: they create
   * rows of customer tables only (`customerTarget`).
   */
  tenantTarget(): { readonly tenantId: string | null } | null {
    if (!this.writes) return null

    return { tenantId: this.tenantId }
  }

  /**
   * Where a new row of a customer table goes: the member's tenant (owned by the tenant), the
   * platform for its owner, the URL's tenant for a customer (owned by it) or for a declared public
   * write (owned by nobody). `null` when the request may not create one.
   */
  customerTarget(): InsertTarget | null {
    if (this.writes) return { tenantId: this.tenantId, customerId: null }
    if (this.tenantId === null) return null
    if (this.kind === 'customer')
      return { tenantId: this.tenantId, customerId: this.accountId }
    if (this.kind === 'public' && this.inserts)
      return { tenantId: this.tenantId, customerId: null }

    return null
  }
}
