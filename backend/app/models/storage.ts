import { column, scope } from '@adonisjs/lucid/orm'

import type { UploadStatus } from '@maiyu/shared'

import { StorageSchema } from '#database/schema'

/**
 * The neutral file record: key name, original label, type, size and where the
 * binary lives (`path`). The `url` is derived on read, never a column, so
 * changing bucket or CDN does not require rewriting row by row.
 *
 * Extension point (KIT.md §3.4): the project adds its columns here (who opened
 * the upload, for instance), and the kit repository only relies on what is below.
 */
export default class Storage extends StorageSchema {
  /**
   * The soft-delete filter lives in the model and nowhere else: written by hand in
   * each query it depends on someone remembering, and `pattern:check` refuses it
   * outside here.
   */
  static notDeleted = scope((query) => {
    query.whereNull('deletedAt')
  })

  /**
   * Redeclared only to narrow the type: `database/schema.ts` is generated from the
   * columns and delivers every enum as `string`, so a typo (`'UPLOADEED'`) would
   * compile and only show up on the next read.
   */
  @column()
  declare status: UploadStatus

  /**
   * Redeclared because `size` is `bigint` in the database (the upload ceiling comes
   * from the environment and exceeds `int4`), and the driver returns `int8` as a
   * string or `BigInt` depending on the path. Without `consume` the size goes out as
   * a string and the response validator, which declares it a number, refuses it.
   * `Number` fits: the safe range of a `double` is 2^53 bytes, nine petabytes.
   */
  @column({ consume: (value: bigint | number | string) => Number(value) })
  declare size: number
}
