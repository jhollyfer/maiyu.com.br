import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The account's access to a tenant, with the role it has there (DECISIONS.md #390). The account is
 * global (one e-mail, one password) and the role is per tenant: the administrator of one school is
 * nobody in the next one.
 */
export default class extends BaseSchema {
  protected tableName = 'tenant_memberships'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.knexRawQuery('gen_random_uuid()'))
      table
        .uuid('user_id')
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .uuid('tenant_id')
        .notNullable()
        .references('id')
        .inTable('tenants')
        .onDelete('CASCADE')
      // Literal values (DECISIONS.md #354), the same as `USER_ROLE` in the shared.
      table.enum('role', ['ADMINISTRATOR', 'MEMBER']).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['user_id', 'tenant_id'])
      // The overview counts members per tenant: the unique above starts with `user_id`.
      table.index(['tenant_id'])
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
