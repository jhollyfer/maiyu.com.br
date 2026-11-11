import { BaseSchema } from '@adonisjs/lucid/schema'

/** The columns are the `DbAccessTokensProvider` contract, not ours. */
export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.knexRawQuery('gen_random_uuid()'))
      // `CASCADE` on purpose: a token is a live credential, and a row left behind after the
      // account is deleted would be a session nobody can revoke anymore.
      table
        .uuid('tokenable_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('type').notNullable()
      table.string('name').nullable()
      table.string('hash').notNullable()
      table.text('abilities').notNullable()
      table.timestamp('created_at')
      table.timestamp('updated_at')
      table.timestamp('last_used_at').nullable()
      table.timestamp('expires_at').nullable()
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
