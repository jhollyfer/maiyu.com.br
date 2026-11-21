/** A column as the first-visit fit sees it: its width and whether it can leave the table. */
export type FitColumn = {
  readonly id: string
  readonly size: number
  /** Pinned columns (selection, actions) are always there: they take their width first. */
  readonly pinned: boolean
  readonly canHide: boolean
}

/**
 * The columns that do not fit the width, as a visibility state (`false` = hidden), in the shape
 * TanStack Table's `columnVisibility` takes.
 *
 * Pinned columns are counted first and never hidden. The data columns then take the width in
 * order until it runs out; the first data column is kept even on a container narrower than it,
 * so the table never shows zero fields. What was cut stays one click away in the visible-columns
 * menu. `{}` means everything fits.
 */
export function columnsThatDoNotFit(
  columns: ReadonlyArray<FitColumn>,
  width: number,
): Record<string, false> {
  let used = 0
  for (const column of columns) {
    if (column.pinned) used += column.size
  }

  const hidden: Record<string, false> = {}
  let shown = 0
  for (const column of columns) {
    if (column.pinned || !column.canHide) continue

    used += column.size
    if (used > width && shown > 0) {
      hidden[column.id] = false
      continue
    }
    shown += 1
  }

  return hidden
}
