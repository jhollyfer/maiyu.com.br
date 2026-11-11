import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The `@adonisjs/limiter` database store (`config/limiter.ts`). The columns belong to the
 * package, which reads and writes them without a model: no timestamps, no `deleted_at`.
 */
export default class extends BaseSchema {
  protected tableName = 'rate_limits'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table.string('key', 255).notNullable().primary()
      table.integer('points', 9).notNullable().defaultTo(0)
      table.bigint('expire').unsigned()
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
