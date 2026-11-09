import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      // `gen_random_uuid()` is built into Postgres 13+, so no extension migration comes first.
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.knexRawQuery('gen_random_uuid()'))
      table.string('name', 120).notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('password', 255).notNullable()
      // Literal values (DECISIONS.md #354): a migration is history, and an imported enum
      // would rewrite it when the enum changes. They match `USER_ROLE` in the shared.
      // No `defaultTo`: a forgotten creation path would silently save a role nobody chose.
      table.enum('role', ['ADMINISTRATOR']).notNullable()
      table
        .enum('status', ['ACTIVE', 'INACTIVE'])
        .notNullable()
        .defaultTo('ACTIVE')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
