import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Marks the tenants the demonstration seeds (`node ace db:seed` with `SEED_DEMO_PASSWORD`,
 * DECISIONS.md #802): a demo tenant is left out of every public list, search and count, and is
 * opened only by its slug. Additive: `false` keeps every existing tenant as it was.
 */
export default class extends BaseSchema {
  protected tableName = 'tenants'

  override up(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('demo').notNullable().defaultTo(false)
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('demo')
    })

    return Promise.resolve()
  }
}
