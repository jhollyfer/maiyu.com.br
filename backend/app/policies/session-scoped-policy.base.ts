import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'

import { STAFF_USER_ROLES, type Actor } from '@maiyu/shared'

import { TenantScope } from '#core/tenant-scope'

/**
 * Policy base: the two denials the API returns, each with a stable `code` and a
 * translation key (`<module>.<fact_snake>`, the `code` is never the key,
 * `_standards/i18n.md` §3).
 *
 * The policy passes the translation key (`<module>.<fact_snake>`, DECISIONS.md #334) and the
 * `code`, and does not translate: `app/exceptions/handler.ts` translates the key in the request
 * language (#346). Bouncer's `AuthorizationResponse` carries a message, a status and a
 * translation identifier: the key goes in `.t()`, which the doc reserves for this, and the
 * `code` in the message, which the doc makes the fallback when the translation is missing
 * (_doc-lib/adonisjs.md#guides/auth/authorization, https://docs.adonisjs.com/guides/auth/authorization,
 * "When your application uses @adonisjs/i18n"). A key missing in a language thus shows the
 * code, never text in another language, and `lang.unit.spec.ts` keeps the keys complete.
 *
 * - `hidden`: the record's existence is a secret. A missing record and a record
 *   the `actor` cannot reach answer **the same** (same status, `code` and
 *   message), so the response does not allow enumerating ids
 *   (`_standards/backend.md` §4.6).
 * - `forbidden`: the `actor` sees the record and cannot act on it.
 *
 * The tenant checks (DECISIONS.md #390) read the `actor`'s active membership through
 * `TenantScope`, the same rule the repository base filters by: a record of another tenant is
 * `hidden`, and a parent tenant reads its children's records and never writes them. The end
 * customer (no membership) owns the rows of customer tables whose `customer_id` is its own
 * (`ownsRow`, DECISIONS.md #397).
 */
export default abstract class SessionScopedPolicy extends BasePolicy {
  protected hidden(code: string, key: string): AuthorizationResponse {
    return AuthorizationResponse.deny(code, 404).t(key)
  }

  protected forbidden(code: string, key: string): AuthorizationResponse {
    return AuthorizationResponse.deny(code, 403).t(key)
  }

  /** Whether the record's tenant is one the `actor` reads: its own or a child. */
  protected readsTenant(actor: Actor, tenantId: string | null): boolean {
    return TenantScope.ofAccess(actor).canRead(tenantId)
  }

  /** Whether the record's tenant is the one the `actor` writes in. */
  protected writesTenant(actor: Actor, tenantId: string | null): boolean {
    return TenantScope.ofAccess(actor).canWrite(tenantId)
  }

  /**
   * Whether the row of a customer table is the `actor`'s own (`customer_id`, DECISIONS.md #397):
   * the end customer reaches its rows in any tenant, and only them.
   */
  protected ownsRow(actor: Actor, customerId: string | null): boolean {
    return TenantScope.ofAccess(actor).owns(customerId)
  }

  /**
   * Who reaches a row of a customer table: its owner, the staff of its own tenant for a row a
   * customer owns (never a plain member, never the parent), the tenant's staff for the tenant's own
   * row. The same rule as `CustomerScoped`.
   */
  protected reachesCustomerRow(
    actor: Actor,
    tenantId: string | null,
    customerId: string | null,
  ): boolean {
    if (this.ownsRow(actor, customerId)) return true
    if (customerId !== null)
      return TenantScope.ofAccess(actor).servesCustomersOf(tenantId)

    return this.isStaffOf(actor, tenantId)
  }

  /** Staff of the active tenant reading a record of a tenant it reads. */
  protected isStaffOf(actor: Actor, tenantId: string | null): boolean {
    const role = actor.tenant?.role
    if (!role || !STAFF_USER_ROLES.includes(role)) return false

    return this.readsTenant(actor, tenantId)
  }
}
