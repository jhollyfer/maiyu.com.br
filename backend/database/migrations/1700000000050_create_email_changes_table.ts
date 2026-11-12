import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The e-mail change that waits for its confirmation (DECISIONS.md #442), part of the e-mail
 * block. One pending change per account: asking again replaces the row, and the old token stops
 * working with it. The row keeps the sha256 of the token, never the token: the plain value only
 * exists in the e-mail sent to the new address.
 */
export default class extends BaseSchema {
  protected tableName = 'email_changes'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      // `CASCADE`: the request has no meaning without the account.
      table
        .uuid('user_id')
        .primary()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.string('new_email', 254).notNullable()
      table.string('token_hash', 64).notNullable()
      table.timestamp('expires_at').notNullable()
      table.timestamp('created_at').notNullable()
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
