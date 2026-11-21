/**
 * Which tenants the public storefront shows (DECISIONS.md #812, the other half of #799): a store
 * whose profile is still incomplete enters the panel but is not on the public side yet. The kit
 * gives the contract and the project says what "released" means, with its own columns
 * (`ProfileGate.missing`, an approval, a plan): there is no product rule here. A contract because
 * the project's answer reads the database (`_standards/solid.md`: external I/O enters by contract).
 *
 * The kit binds `AllPublicTenantFilter` (every tenant released), so a project with no profile rule
 * changes nothing. The project writes its own implementation, returning the subset of `ids` it
 * releases, and swaps the binding in `providers/repository.provider.ts`.
 *
 * It is asked wherever a public request gets a tenant scope: `public-tenant.middleware.ts` (every
 * public route, so lists, searches and any storefront query inherit it), `credential-tenant.middleware.ts`
 * (a code or token of an unreleased tenant is the same 404 as any wrong credential) and the storefront
 * tenant list. The platform's staff and the members of a tenant still reach that tenant, to preview
 * their own page (`PublicTenantVisibility`). The platform owner's CRUD and `overview` do not ask it.
 * `ids` carry the demonstration tenant too (DECISIONS.md #802), which the project releases.
 *
 * **Cost:** one call per public request. A project whose answer is expensive caches it itself, inside
 * its implementation; the kit does not cache, because only the project knows when a profile changes.
 */
export abstract class PublicTenantFilter {
  abstract released(ids: ReadonlyArray<string>): Promise<ReadonlyArray<string>>
}
