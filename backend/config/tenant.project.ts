import { TENANT_TYPE } from '@maiyu/shared'
import type { TenantType } from '@maiyu/shared'

/** The first tenant the seed creates (DECISIONS.md #390): the four fields go together. */
export type TenantSeed = {
  readonly name: string
  readonly slug: string
  /** The slug of a seeded city (`benjamin-constant`). */
  readonly city: string
  readonly type: TenantType
}

export type TenantProject = {
  /** Single-client mode (DECISIONS.md #399): the slug of the one tenant, or `null` for the multi-tenant product. */
  readonly singleSlug: string | null
  /** The first tenant (DECISIONS.md #390), or `null` to skip the tenant seed. */
  readonly seed: TenantSeed | null
}

/**
 * What the product decides about its tenants (DECISIONS.md #782). It is the project's file
 * (KIT.md §3.4): the sync creates this skeleton when it is missing and never overwrites it. The
 * values are neither secrets nor different between environments, so they are versioned here and
 * not in ENV (_doc-lib/adonisjs.md#configuration, https://docs.adonisjs.com/configuration: ENV is
 * for secrets and for what changes between environments). `null` is "off" and the default: a slug,
 * a name or a city written in the kit would point every project at a client that is not theirs.
 * Only `config/tenant.ts` and the seeders read it; the specs swap `TenantConfig`.
 *
 * Example: `singleSlug: 'adacaibs'`, `seed: { name: 'ADACAIBS', slug: 'adacaibs', city: 'benjamin-constant', type: TENANT_TYPE.ORGANIZATION }`.
 */
export const TENANT_PROJECT: TenantProject = {
  singleSlug: 'maiyu',
  seed: {
    name: 'Maiyu',
    slug: 'maiyu',
    city: 'benjamin-constant',
    type: TENANT_TYPE.ORGANIZATION,
  },
}
