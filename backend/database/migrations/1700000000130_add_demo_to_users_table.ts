import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Marks the accounts the demonstration seeds (DECISIONS.md #802, #807): `demo:purge` deletes
 * only the accounts the seed itself created and marked, never one that merely has a similar name
 * or e-mail. Additive: `false` keeps every existing account as it was.
 */
export default class extends BaseSchema {
  protected tableName = 'users'

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
