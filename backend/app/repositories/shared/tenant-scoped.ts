import type {
  LucidModel,
  ModelQueryBuilderContract,
} from '@adonisjs/lucid/types/model'

import { TenantScope } from '#core/tenant-scope'

/**
 * The repository base of every tenant-owned table (DECISIONS.md #390). The Lucid repository passes
 * each query through `readable()` or `writable()`, like it passes rows through `LucidMapping`: a
 * helper and not a parent class, because the repository already extends its contract. The
 * `tenant_id` filter is written once, here, and a row of another tenant is simply not found, which the use case answers with the
 * same 404 as a missing id (`_standards/backend.md` §4.6). A model query scope would do the same
 * filter, but it would still depend on every query remembering `withScopes`
 * (_doc-lib/lucid.md#model-query-scopes, página oficial não conferida: host fora da rede da sessão).
 */
export default class TenantScoped {
  /** The column that holds the owner tenant, the same name in every tenant-owned table. */
  static readonly COLUMN = 'tenant_id'

  /**
   * Rows the request reads: its tenant, the readable ones, and the platform's only for the
   * platform owner. A scope that reads nothing (no membership) finds nothing.
   */
  static readable<TModel extends LucidModel, TResult>(
    query: ModelQueryBuilderContract<TModel, TResult>,
  ): ModelQueryBuilderContract<TModel, TResult> {
    const scope = TenantScope.current()
    if (!scope) return query

    const column = TenantScoped.COLUMN
    const tenantIds = scope.tenantIds()
    if (tenantIds.length === 0 && !scope.platform)
      return query.whereRaw('false')

    return query.where((builder) => {
      if (tenantIds.length > 0) builder.whereIn(column, tenantIds)
      if (scope.platform) builder.orWhereNull(column)
    })
  }

  /** Rows the request writes: only its own tenant (or the platform's for its owner), never a child's. */
  static writable<TModel extends LucidModel, TResult>(
    query: ModelQueryBuilderContract<TModel, TResult>,
  ): ModelQueryBuilderContract<TModel, TResult> {
    const scope = TenantScope.current()
    if (!scope) return query
    // A read-only scope (public route) or one with no tenant finds nothing to write.
    if (!scope.writes) return query.whereRaw('false')
    if (scope.tenantId !== null)
      return query.where(TenantScoped.COLUMN, scope.tenantId)
    if (scope.platform) return query.whereNull(TenantScoped.COLUMN)

    return query.whereRaw('false')
  }
}
