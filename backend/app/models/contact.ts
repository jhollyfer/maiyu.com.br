import { column } from '@adonisjs/lucid/orm'

import type { Locale } from '@maiyu/shared'

import { ContactSchema } from '#database/schema'

/**
 * A message the storefront form sent. No `notDeleted` scope: the contact has no trash, and
 * a row that is deleted (by the owner or by `contacts:prune`) is deleted for good.
 */
export default class Contact extends ContactSchema {
  /**
   * Redeclared only to narrow the type: `database/schema.ts` is generated from the columns
   * and delivers every enum as `string`, so a typo (`'pt'`) would compile and only show up
   * on the next read.
   */
  @column()
  declare locale: Locale
}
