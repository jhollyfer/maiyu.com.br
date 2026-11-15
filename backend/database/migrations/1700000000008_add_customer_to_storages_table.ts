import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The end customer who uploaded the file (DECISIONS.md #397): the payment proof belongs to the
 * customer and to the store's tenant. `null` is a file of the tenant, shared by its members, so
 * every existing row keeps its meaning. When the account goes, the file stays with the tenant
 * (`SET NULL`): the store still needs the proof of a paid order.
 */
export default class extends BaseSchema {
  protected tableName = 'storages'

  override up(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      // The customer's library reads by owner, across tenants.
      table.index(['customer_id', 'created_at'])
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['customer_id', 'created_at'])
      table.dropColumn('customer_id')
    })

    return Promise.resolve()
  }
}
