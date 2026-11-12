import env from '#start/env'

/**
 * The single-client mode of a product that by nature has one client (DECISIONS.md #399): the slug
 * of that client's tenant, or `null` for the multi-tenant product. Read here and nowhere else
 * (`_standards/backend.md` §6.2); a class so the container hands it to the public middleware and a
 * spec swaps it for another value. No default: a slug written here would point every project at
 * a client that is not theirs.
 */
export class TenantConfig {
  constructor(
    readonly singleSlug: string | null = env.get('SINGLE_TENANT_SLUG') ?? null,
  ) {}
}
