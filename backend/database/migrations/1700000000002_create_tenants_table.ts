import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The tenant is the client inside a city (DECISIONS.md #390): the school, the city hall, the
 * restaurant. `parent_id` is one level: the contractor that groups others and reads them. The
 * slug is unique per city, the second URL segment when the product is per client.
 */
export default class extends BaseSchema {
  protected tableName = 'tenants'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.knexRawQuery('gen_random_uuid()'))
      table.string('name', 120).notNullable()
      table.string('slug', 80).notNullable()
      // Literal values (DECISIONS.md #354): they match `TENANT_TYPE` in the shared, the project's
      // extension point, and a new kind comes with its own migration.
      table.enum('type', ['ORGANIZATION']).notNullable()
      table
        .uuid('city_id')
        .notNullable()
        .references('id')
        .inTable('cities')
        .onDelete('RESTRICT')
      table
        .uuid('parent_id')
        .nullable()
        .references('id')
        .inTable(this.tableName)
        .onDelete('RESTRICT')
      table
        .enum('status', ['ACTIVE', 'INACTIVE'])
        .notNullable()
        .defaultTo('ACTIVE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['city_id', 'slug'])
      table.index(['parent_id'])
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
