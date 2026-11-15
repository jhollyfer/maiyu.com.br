import { TENANT_PROJECT } from '#config/tenant.project'
import type { TenantSeed } from '#config/tenant.project'

/**
 * The tenant decisions of the product (DECISIONS.md #399, #782): single-client mode, the slug of
 * that client's tenant or `null` for the multi-tenant product, and the first tenant the seed
 * creates or `null` to skip it. The values live in the project's `config/tenant.project.ts`, read
 * here and nowhere else (`_standards/backend.md` §6.2); a class so the container hands it to the
 * public middleware and the seeders, and a spec swaps it for another value.
 */
export class TenantConfig {
  constructor(
    readonly singleSlug: string | null = TENANT_PROJECT.singleSlug,
    readonly seed: TenantSeed | null = TENANT_PROJECT.seed,
  ) {}
}
