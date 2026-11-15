import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The tenant that owns the file (DECISIONS.md #390). Nullable: a file uploaded outside a tenant
 * (the platform owner's) belongs to the platform. A separate migration because `storages` is born
 * before `tenants`, and the users table points at `storages`.
 */
export default class extends BaseSchema {
  protected tableName = 'storages'

  override up(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('tenant_id')
        .nullable()
        .references('id')
        .inTable('tenants')
        .onDelete('RESTRICT')
      // The tenant goes first: every read of the library cuts by it before anything else.
      table.index(['tenant_id', 'created_at'])
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropIndex(['tenant_id', 'created_at'])
      table.dropColumn('tenant_id')
    })

    return Promise.resolve()
  }
}
