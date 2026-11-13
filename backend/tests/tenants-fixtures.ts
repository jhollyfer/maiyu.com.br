import { randomUUID } from 'node:crypto'

import { ACTIVE_STATUS, type ActiveStatus, type UserRole } from '@maiyu/shared'

import { SEED_CITIES } from '#database/data/cities'
import City from '#models/city'
import Tenant from '#models/tenant'
import TenantMembership from '#models/tenant-membership'
import type User from '#models/user'
import { TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

/** The tenant every spec signs in to unless it asks for another (DECISIONS.md #390). */
export const DEFAULT_TENANT_SLUG = 'cliente-de-teste'

/**
 * The tenant fixtures. A class with only `static`, like `LucidMapping`: the specs build tenants
 * straight in the database, as the factory builds accounts.
 */
export class Tenants {
  /** A seeded city; `firstOrCreate`, so a spec that skipped the seed still finds it. */
  static async city(slug: string = 'benjamin-constant'): Promise<City> {
    const seed = SEED_CITIES.find((each) => each.slug === slug)
    if (!seed) throw new Error(`no seeded city ${slug}`)

    return City.firstOrCreate({ slug }, seed)
  }

  /** The default tenant: the one `signInWithFactory` and `storageRow` share. */
  static async fallback(): Promise<Tenant> {
    const city = await Tenants.city()

    return Tenant.firstOrCreate(
      { cityId: city.id, slug: DEFAULT_TENANT_SLUG },
      {
        name: 'Cliente de teste',
        type: TENANT_TYPE_FIXTURE,
        status: ACTIVE_STATUS.ACTIVE,
      },
    )
  }

  /**
   * The tenant of an E2E run (DECISIONS.md #711): in the single-client mode the one `SINGLE_TENANT_SLUG`
   * names, because that is where the public anonymous writes land and the staff of the run must
   * see them; otherwise the default one. An existing tenant of that slug is reused as it is.
   */
  static async forE2e(singleSlug: string | null): Promise<Tenant> {
    if (singleSlug === null) return Tenants.fallback()

    const existing = await Tenant.query().where('slug', singleSlug).first()
    if (existing) return existing

    const city = await Tenants.city()

    return Tenant.create({
      name: 'Cliente único',
      slug: singleSlug,
      type: TENANT_TYPE_FIXTURE,
      cityId: city.id,
      status: ACTIVE_STATUS.ACTIVE,
    })
  }

  /** Another tenant, optionally under a parent. */
  static async create(
    attributes: {
      parentId?: string | null
      citySlug?: string
      slug?: string
      status?: ActiveStatus
    } = {},
  ): Promise<Tenant> {
    const city = await Tenants.city(attributes.citySlug)
    const suffix = randomUUID().slice(0, 8)

    return Tenant.create({
      name: `Cliente ${suffix}`,
      slug: attributes.slug ?? `cliente-${suffix}`,
      type: TENANT_TYPE_FIXTURE,
      cityId: city.id,
      parentId: attributes.parentId ?? null,
      status: attributes.status ?? ACTIVE_STATUS.ACTIVE,
    })
  }

  /** The account's membership in `tenant`; a spec that asks for one that is not there is wrong. */
  static async membershipOf(
    user: User,
    tenant: Tenant,
  ): Promise<TenantMembership> {
    return TenantMembership.query()
      .where('userId', user.id)
      .where('tenantId', tenant.id)
      .firstOrFail()
  }

  static async addMember(
    user: User,
    tenant: Tenant,
    role: UserRole,
  ): Promise<TenantMembership> {
    return TenantMembership.create({
      userId: user.id,
      tenantId: tenant.id,
      role,
    })
  }
}
