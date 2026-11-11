import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The refresh tokens already consumed by a rotation: the reuse mark (`_standards/backend.md`
 * §4.10, `DECISIONS.md` #363, RFC 6819).
 *
 * The rotation deletes the used refresh from `auth_access_tokens`, and that `DELETE` stays
 * the critical section. What is left here is only the sha256 of the plain value, so that
 * presenting it again is told apart from garbage and drops every session of the account.
 * The row keeps the lifetime of the refresh it marks: past `expires_at`, the token would be
 * refused anyway.
 */
export default class extends BaseSchema {
  protected tableName = 'consumed_refresh_tokens'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.knexRawQuery('gen_random_uuid()'))
      // `CASCADE`: the mark has no meaning without the account and must not block removing
      // it (_doc-lib/lucid.md#table-builder, https://lucid.adonisjs.com/docs/table-builder).
      table
        .uuid('tokenable_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      // sha256 in hex of the plain token, never the token itself.
      table.string('hash', 64).notNullable().unique()
      table.timestamp('expires_at').nullable()
      table.timestamp('created_at').notNullable()
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
