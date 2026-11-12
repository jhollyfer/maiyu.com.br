import { column } from '@adonisjs/lucid/orm'

import type { UserRole } from '@maiyu/shared'

import { TenantMembershipSchema } from '#database/schema'

/** An account's access to a tenant, with the role it has there (DECISIONS.md #390). */
export default class TenantMembership extends TenantMembershipSchema {
  @column()
  declare role: UserRole
}
