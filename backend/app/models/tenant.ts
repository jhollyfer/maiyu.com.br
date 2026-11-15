import { column } from '@adonisjs/lucid/orm'

import type { ActiveStatus, TenantType } from '@maiyu/shared'

import { TenantSchema } from '#database/schema'

/** The client inside a city (DECISIONS.md #390). */
export default class Tenant extends TenantSchema {
  /** Narrowed from the generated `string`: a wrong literal would only fail in Postgres. */
  @column()
  declare type: TenantType

  @column()
  declare status: ActiveStatus
}
