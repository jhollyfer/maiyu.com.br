import type {
  LucidModel,
  ModelQueryBuilderContract,
} from '@adonisjs/lucid/types/model'

import { TenantScope } from '#core/tenant-scope'
import TenantScoped from '#repositories/shared/tenant-scoped'

/**
 * The repository helper of a customer table (DECISIONS.md #397), the sibling of `TenantScoped`: a
 * table whose rows belong to a tenant and, each one, to the end customer in `customer_id` (an order,
 * a payment proof, the file a customer uploads). Using this helper instead of `TenantScoped` is how
 * a table declares itself a customer table; a table that uses `TenantScoped` stays out of a
 * customer's reach, and a public route that declared its write creates rows only here.
 *
 * The rule itself is `TenantScope`'s (`canReadOwned`, `canWriteOwned`, `customerTarget`); this is the
 * same rule as a `where`, so a row the request may not reach is simply not found and the use case
 * answers the 404 of a missing id (`_standards/backend.md` §4.6).
 */
export default class CustomerScoped {
  /** The column that holds the owner account, the same name in every customer table. */
  static readonly COLUMN = 'customer_id'

  /**
   * The owner's rows in any tenant; the tenant's own rows (`customer_id` null) as `TenantScoped`
   * reads them; a customer's row only for the staff of its own tenant (never a plain member, never
   * the parent tenant, never the public).
   */
  static readable<TModel extends LucidModel, TResult>(
    query: ModelQueryBuilderContract<TModel, TResult>,
  ): ModelQueryBuilderContract<TModel, TResult> {
    const scope = TenantScope.current()
    if (!scope) return query

    const tenantIds = scope.tenantIds()

    return query.where((rows) => {
      rows.whereRaw('false')
      if (tenantIds.length > 0)
        rows.orWhere((tenant) => {
          tenant
            .whereIn(TenantScoped.COLUMN, tenantIds)
            .whereNull(CustomerScoped.COLUMN)
        })
      if (scope.platform) rows.orWhereNull(TenantScoped.COLUMN)
      CustomerScoped.ownedOrServed(rows, scope)
    })
  }

  /** The owner's rows; the tenant's own rows it writes; its customers' rows for its staff. */
  static writable<TModel extends LucidModel, TResult>(
    query: ModelQueryBuilderContract<TModel, TResult>,
  ): ModelQueryBuilderContract<TModel, TResult> {
    const scope = TenantScope.current()
    if (!scope) return query

    const own = scope.tenantTarget()?.tenantId ?? null

    return query.where((rows) => {
      rows.whereRaw('false')
      if (own !== null)
        rows.orWhere((tenant) => {
          tenant
            .where(TenantScoped.COLUMN, own)
            .whereNull(CustomerScoped.COLUMN)
        })
      if (scope.platform) rows.orWhereNull(TenantScoped.COLUMN)
      CustomerScoped.ownedOrServed(rows, scope)
    })
  }

  /** The rows a customer owns: its own, and those of the tenant its staff serves. */
  private static ownedOrServed<TModel extends LucidModel, TResult>(
    rows: ModelQueryBuilderContract<TModel, TResult>,
    scope: TenantScope,
  ): void {
    const served = scope.servedTenantId()
    if (served !== null) rows.orWhere(TenantScoped.COLUMN, served)
    if (scope.accountId !== null)
      rows.orWhere(CustomerScoped.COLUMN, scope.accountId)
  }
}
