import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * The platform's cities (DECISIONS.md #390): global data, never a constant in the code. The slug
 * is the URL segment after the language (`/pt-br/<city>/...`), unique in the whole table. The
 * coordinates use `double precision`: they place a map and check a point inside a box, and nothing
 * here sums or rounds them.
 */
export default class extends BaseSchema {
  protected tableName = 'cities'

  override up(): Promise<void> {
    this.schema.createTable(this.tableName, (table) => {
      table
        .uuid('id')
        .primary()
        .defaultTo(this.db.knexRawQuery('gen_random_uuid()'))
      table.string('name', 120).notNullable()
      table.string('state', 2).notNullable()
      table.string('slug', 80).notNullable().unique()
      // An IANA name (`America/Eirunepe`), never an offset: the offset changes with the law.
      table.string('time_zone', 64).notNullable()
      table.double('latitude').notNullable()
      table.double('longitude').notNullable()
      table.double('south').notNullable()
      table.double('west').notNullable()
      table.double('north').notNullable()
      table.double('east').notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
