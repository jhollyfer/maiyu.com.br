import { PublicTenantFilter } from '#core/public-tenant-filter'

/** The kit's default (DECISIONS.md #812): every tenant is released to the public. */
export class AllPublicTenantFilter extends PublicTenantFilter {
  released(ids: ReadonlyArray<string>): Promise<ReadonlyArray<string>> {
    return Promise.resolve(ids)
  }
}
