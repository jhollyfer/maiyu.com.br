import logger from '@adonisjs/core/services/logger'

import {
  ACTIVE_STATUS,
  PLATFORM_ROLE,
  PLATFORM_ROLES,
  TENANT_TYPES,
  USER_ROLES,
} from '@maiyu/shared'
import type { PlatformRole } from '@maiyu/shared'

import { DemoConfig } from '#database/demo/demo.config'
import { DemoProject } from '#database/demo/demo.project'
import City from '#models/city'
import Tenant from '#models/tenant'
import TenantMembership from '#models/tenant-membership'
import User from '#models/user'

export type DemoSeedInput = {
  readonly password: string
  /** `APP_CLIENT_URL`, or `APP_SERVER_URL` when there is no other origin. */
  readonly siteUrl: string
  /** `TENANT_PROJECT.seed.city`; `null` takes the first seeded city by slug. */
  readonly citySlug: string | null
}

/**
 * The demonstration (DECISIONS.md #802), the smallest data that shows the product: one account
 * per role, one demo tenant per tenant type, and what the project adds (`DemoProject.seed`). It
 * runs on every deploy, so every write is `firstOrCreate` and a second run creates nothing; a
 * password changed by someone is not reset. The demo tenants are `demo: true`, which keeps them
 * out of every public list, search and count (`TenantRepository`), and reachable by slug.
 */
export class DemoSeed {
  static async run(input: DemoSeedInput): Promise<void> {
    const city = await DemoSeed.city(input.citySlug)
    if (!city) {
      logger.warn('no city to hold the demo tenants: demo seed skipped')
      return
    }

    const tenants = await DemoSeed.tenants(city)
    await DemoSeed.accounts(input, tenants)
    await DemoProject.seed({ tenants })
  }

  private static async city(slug: string | null): Promise<City | null> {
    if (slug !== null) return City.findBy('slug', slug)

    return City.query().orderBy('slug', 'asc').first()
  }

  /** One tenant per `TENANT_TYPE`, found by its slug in the city. */
  private static async tenants(city: City): Promise<Tenant[]> {
    const tenants: Tenant[] = []
    for (const type of TENANT_TYPES) {
      const tenant = await Tenant.firstOrCreate(
        { cityId: city.id, slug: DemoConfig.slug(type) },
        {
          name: DemoConfig.tenantName(type),
          type,
          status: ACTIVE_STATUS.ACTIVE,
          demo: true,
        },
      )
      // The slug is taken by a real tenant: the demo never writes into it.
      if (!tenant.demo) {
        logger.warn(
          `tenant ${tenant.slug} is not a demo tenant: demo seed skipped it`,
        )
        continue
      }
      tenants.push(tenant)
    }

    return tenants
  }

  /**
   * One account per platform role (owner, administrator), one per `USER_ROLE` (a member of every
   * demo tenant with that role) and the end customer (an account with no membership).
   */
  private static async accounts(
    input: DemoSeedInput,
    tenants: ReadonlyArray<Tenant>,
  ): Promise<void> {
    const domain = DemoConfig.domain(input.siteUrl)
    const account = async (
      label: string,
      platformRole: PlatformRole,
    ): Promise<User> => {
      // `firstOrCreate`, never `updateOrCreate` (DECISIONS.md #292): the password is only in the
      // payload of the creation, so one changed in the panel is not reset by the next deploy.
      return User.firstOrCreate(
        { email: DemoConfig.email(label, domain) },
        {
          name: `${DemoConfig.NAME_PREFIX}${label}`,
          password: input.password,
          platformRole,
          status: ACTIVE_STATUS.ACTIVE,
        },
      )
    }

    for (const role of PLATFORM_ROLES) {
      if (role === PLATFORM_ROLE.USER) continue
      await account(`platform-${DemoConfig.label(role)}`, role)
    }

    for (const role of USER_ROLES) {
      const member = await account(DemoConfig.label(role), PLATFORM_ROLE.USER)
      for (const tenant of tenants) {
        await TenantMembership.firstOrCreate(
          { userId: member.id, tenantId: tenant.id },
          { role },
        )
      }
    }

    await account('customer', PLATFORM_ROLE.USER)
  }
}
