/**
 * The ceilings the kit validates and the project's columns define (KIT.md §3.4, extension
 * point): the sync creates this file when it is missing and never overwrites it. The value is
 * the `varchar(N)` of the column, so a route parameter longer than the column is refused at the
 * door instead of becoming a database query. A project whose slug column is `varchar(120)`
 * writes 120 here, and the kit's `SlugValidator` follows without being copied.
 */
export const COLUMN_LIMITS = {
  SLUG: 255,
} as const satisfies Record<string, number>
