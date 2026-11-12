import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * `contacts` becomes a customer table (DECISIONS.md #390, #397): the storefront form is an
 * anonymous write, and a public route that declares one creates rows only in a table that carries
 * the tenant. `tenant_id` is the client whose form was filled in, and the panel reads only its own.
 * `customer_id` is the end customer when the sender was signed in; the form is anonymous, so it
 * stays `null` (a row of the tenant, read by its staff). A separate migration because the table
 * is born after `tenants` but before this decision; it is `NOT NULL` with no default and no
 * backfill, since the database is born empty and a contact with no tenant would belong to nobody.
 * When the account goes, the message stays with the tenant (`SET NULL`).
 */
export default class extends BaseSchema {
  protected tableName = 'contacts'

  override up(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('tenant_id')
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('RESTRICT')
      table
        .uuid('customer_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      // The tenant goes first: the panel listing cuts by it before anything else, newest first.
      table.index(['tenant_id', 'created_at'])
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['tenant_id', 'created_at'])
      table.dropColumn('customer_id')
      table.dropColumn('tenant_id')
    })

    return Promise.resolve()
  }
}
