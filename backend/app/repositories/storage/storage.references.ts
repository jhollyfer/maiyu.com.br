/**
 * Every column that points to `storages`, with the label the error message
 * shows when the file is in use. This file belongs to the project (sync extension point): each
 * table that references a file enters here.
 *
 * A single list of objects, not lists matched by index: with two, an
 * insertion in the middle of one of them shifts the label of all the following ones. Every
 * reference to `storages` is `SET NULL` or `CASCADE`, so the database would prevent
 * nothing: a column missing here is a file in use that vanishes without warning.
 */
export const STORAGE_REFERENCES = [
  { table: 'users', column: 'avatar_id', label: 'avatar de usuário' },
] as const satisfies readonly { table: string; column: string; label: string }[]
