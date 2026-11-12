/** One column of a project table that the specs of the E2E run mark with `E2E_MARKER`. */
export type ProjectE2eMarker = {
  /** The table, in snake case (`reports`). */
  readonly table: string
  /** The text column the marker is written to (`title`, `description`). */
  readonly column: string
}

/**
 * What `e2e:cleanup` deletes from the project's own tables after the run (DECISIONS.md #713). It is
 * the project's file (KIT.md §3.4): the sync creates this empty model when it is missing and never
 * overwrites it. A row goes only when `column` starts with `E2E_MARKER` (`commands/e2e-cleanup.command.ts`,
 * `E2eEnv.marker` in the frontend): the specs write that prefix in the field they create, and a row
 * without it is never touched. The accounts `e2e:accounts` creates are deleted by the kit, not listed here.
 *
 * List children before parents when a foreign key is `RESTRICT`: the command deletes in this order,
 * in one transaction, and a failure undoes all of it.
 *
 * Example: `[{ table: 'report_photos', column: 'caption' }, { table: 'reports', column: 'title' }]`.
 */
export class ProjectE2eCleanup {
  // The contact form of the storefront: the E2E writes the marker in the visitor's name.
  static readonly markers = [
    { table: 'contacts', column: 'name' },
  ] as const satisfies ReadonlyArray<ProjectE2eMarker>
}
