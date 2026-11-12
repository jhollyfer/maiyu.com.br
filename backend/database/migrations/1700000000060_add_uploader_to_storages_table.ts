import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The account that opened the upload. A profile photo is accepted only from the account that
 * uploaded it: before this column the id of any file the request reaches (another member's, or a
 * served customer's, for the staff) could be set as an `avatarId`. `null` keeps every existing
 * row valid (it just cannot be taken as someone's photo), and the file stays when the account
 * goes (`SET NULL`), like `customer_id`.
 */
export default class extends BaseSchema {
  protected tableName = 'storages'

  override up(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table
        .uuid('uploaded_by')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('uploaded_by')
    })

    return Promise.resolve()
  }
}
