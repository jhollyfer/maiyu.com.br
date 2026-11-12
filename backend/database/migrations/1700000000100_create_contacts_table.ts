import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The messages the storefront contact form sends. Personal data (name and e-mail) kept for a
 * declared period only: `node ace contacts:prune` deletes what is older than 12 months, and
 * there is no trash, so a row that goes is gone for good (the owner's deletion request and
 * the sweep share that meaning).
 */
export default class extends BaseSchema {
  protected tableName = 'contacts'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.knexRawQuery('gen_random_uuid()'))
      // Ceilings equal to the validator's: a longer value is a 422, never a database error.
      table.string('name', 120).notNullable()
      table.string('email', 254).notNullable()
      table.text('message').notNullable()
      // Literal values (DECISIONS.md #354): they match `LOCALES` in the shared.
      table.enum('locale', ['pt-BR', 'en', 'es']).notNullable()
      // Null is pending; the stamp is the only state the owner ever writes.
      table.timestamp('answered_at').nullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      // The listing reads newest first and the sweep cuts by age, both on `created_at`;
      // `answered_at` serves the `?status` filter.
      table.index(['created_at'])
      table.index(['answered_at'])
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
