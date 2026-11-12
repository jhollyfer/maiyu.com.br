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
      // The two identities (DECISIONS.md #396): the public signs in by mobile and the e-mail is
      // optional, so neither column is `NOT NULL`. Postgres lets a `unique` column hold many
      // NULLs, so the accounts without one do not collide. The phone is E.164 (`+55` and eleven
      // digits, 14 characters), the one form the validator writes and the sign-in looks up.
      table.string('email', 254).nullable()
      table.string('phone', 14).nullable().unique()
      table.string('password', 255).notNullable()
      // The role above the tenants (DECISIONS.md #390); the role inside a tenant is the
      // membership's. Literal values (DECISIONS.md #354): a migration is history, and an imported
      // enum would rewrite it when the enum changes. They match `PLATFORM_ROLE` in the shared.
      // No `defaultTo`: a forgotten creation path would silently save a role nobody chose.
      table
        .enum('platform_role', ['OWNER', 'ADMINISTRATOR', 'USER'])
        .notNullable()
      table
        .enum('status', ['ACTIVE', 'INACTIVE'])
        .notNullable()
        .defaultTo('ACTIVE')
      // Whoever attaches keeps the reference, so a single files table needs no owner column.
      // `SET NULL`: deleting the avatar file must not delete the account.
      table
        .uuid('avatar_id')
        .nullable()
        .references('id')
        .inTable('storages')
        .onDelete('SET NULL')
      // The tenant the account last picked. A preference, not an access: the membership is
      // checked on every request, and a revoked one reads as no tenant.
      table
        .uuid('active_tenant_id')
        .nullable()
        .references('id')
        .inTable('tenants')
        .onDelete('SET NULL')
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.timestamp('deleted_at').nullable()
      // The invariants live in the database too (`_standards/backend.md` §4.4): an account no
      // one can reach has no way in, and a phone in another shape would never match a login.
      table.check(
        '?? is not null or ?? is not null',
        ['email', 'phone'],
        'users_contact_required',
      )
      table.check(
        "?? ~ '^\\+55[1-9][1-9]9[0-9]{8}$'",
        ['phone'],
        'users_phone_e164',
      )
    })
    // The e-mail is unique over its lowercase (DECISIONS.md #408), the second lock behind
    // `Rule.email()` writing it in lowercase: `A@x.com` and `a@x.com` are one account even for a
    // path that skipped the validator. An expression index, which the column `unique()` cannot say.
    this.schema.raw(
      'create unique index users_email_lower_key on users (lower(email))',
    )

    return Promise.resolve()
  }

  override down(): Promise<void> {
    this.schema.dropTable(this.tableName)

    return Promise.resolve()
  }
}
