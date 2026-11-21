/** A cell of the grid by position: row and column, both zero-based, over the rows and columns on screen. */
export type GridCell = { readonly row: number; readonly col: number }

/** How many rows and columns the grid has. */
export type GridSize = { readonly rows: number; readonly cols: number }

/** What the person pressed: the key, whether Control was held, and how many rows a page jump covers. */
export type GridMove = {
  readonly key: string
  readonly ctrl: boolean
  readonly pageRows: number
}

/**
 * What can take the focus inside a cell (a checkbox, the actions menu, a link): `Enter` on the
 * cell goes in, `Escape` comes back (WAI-ARIA APG grid, "Data Grids" > "Interaction": the cell is
 * the stop, and the widget inside it is entered on purpose).
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */
export const FOCUSABLE_IN_CELL =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [role="checkbox"]:not([aria-disabled="true"]), [tabindex]:not([tabindex="-1"])'

function clamp(value: number, max: number): number {
  return Math.min(Math.max(value, 0), Math.max(max, 0))
}

/**
 * The cell a key moves the focus to, per the APG grid keyboard interaction: arrows by one,
 * `Home`/`End` to the ends of the row, `Control+Home`/`Control+End` to the ends of the grid,
 * `PageUp`/`PageDown` by a page of rows. The target stops at the edges (no wrap). `null` is a key
 * that is not navigation, so the caller leaves the event alone.
 * https://www.w3.org/WAI/ARIA/apg/patterns/grid/
 */
export function nextGridCell(
  cell: GridCell,
  size: GridSize,
  move: GridMove,
): GridCell | null {
  const lastRow = size.rows - 1
  const lastCol = size.cols - 1

  switch (move.key) {
    case 'ArrowDown':
      return { row: clamp(cell.row + 1, lastRow), col: cell.col }
    case 'ArrowUp':
      return { row: clamp(cell.row - 1, lastRow), col: cell.col }
    case 'ArrowRight':
      return { row: cell.row, col: clamp(cell.col + 1, lastCol) }
    case 'ArrowLeft':
      return { row: cell.row, col: clamp(cell.col - 1, lastCol) }
    case 'PageDown':
      return { row: clamp(cell.row + move.pageRows, lastRow), col: cell.col }
    case 'PageUp':
      return { row: clamp(cell.row - move.pageRows, lastRow), col: cell.col }
    case 'Home':
      if (move.ctrl) return { row: 0, col: 0 }
      return { row: cell.row, col: 0 }
    case 'End':
      if (move.ctrl)
        return { row: clamp(lastRow, lastRow), col: clamp(lastCol, lastCol) }
      return { row: cell.row, col: clamp(lastCol, lastCol) }
    default:
      return null
  }
}

/** The cursor held inside the grid when rows or columns shrink under it (a filter, a hidden column). */
export function clampGridCell(cell: GridCell, size: GridSize): GridCell {
  return {
    row: clamp(cell.row, size.rows - 1),
    col: clamp(cell.col, size.cols - 1),
  }
}
