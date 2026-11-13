/**
 * What the tenant refuses, as a fact (`_standards/domain.md` §2). A tenant has at most one level
 * above it (DECISIONS.md #390): its parent is a top-level tenant, a tenant with children has no
 * parent, and no tenant is its own parent (`TENANT_PARENT_NESTED`). The parent is an active tenant of
 * the same city (`TENANT_PARENT_ELSEWHERE`), so a tenant with children does not change city
 * (`TENANT_HAS_CHILDREN`).
 */
export type TenantError =
  | { readonly code: 'TENANT_PARENT_NESTED' }
  | { readonly code: 'TENANT_PARENT_ELSEWHERE' }
  | { readonly code: 'TENANT_HAS_CHILDREN' }
