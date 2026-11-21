/**
 * The CSV text of a table of values, and its download. Loaded on demand (`import()` by
 * `ExportCsvButton`), so it stays out of the bundle of every screen that never exports.
 *
 * The part that fails silently is the cell: a value that starts with `=`, `+`, `-` or `@` is a
 * formula to Excel, LibreOffice and Sheets, so a name typed by an attacker (`=HYPERLINK(...)`)
 * would run on the machine of whoever opens the export (CSV injection, OWASP). It is isolated here
 * to be tested with strings, without opening a spreadsheet.
 * https://owasp.org/www-community/attacks/CSV_Injection
 */

/**
 * What a spreadsheet reads as the start of a formula. TAB and CR are in because the spreadsheet
 * eats them before deciding what the cell is.
 */
const FORMULA_TRIGGERS = new Set(['=', '+', '-', '@', '\t', '\r'])

/** Written first so Excel reads the file as UTF-8 and keeps the accents of "ação". */
const BYTE_ORDER_MARK = '﻿'

/**
 * A value of any kind, as the one string a cell holds. `null` and `undefined` are an empty cell, an
 * object is its JSON (never `[object Object]`).
 */
function cellText(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  if (typeof value === 'object') return JSON.stringify(value)
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value)
  }
  // A symbol or a function has no text a spreadsheet could use.
  return ''
}

/**
 * A CSV cell, ready to join: a formula neutralised with a leading apostrophe (the marker
 * spreadsheets read as "this is text", which they do not show) and the quotes escaped.
 *
 * A formula behind leading spaces or tabs (`"  =1+1"`) is neutralised too. A **number** is never a formula and is not prefixed, so `-5` still sums; a **string** `"-5"`
 * is, because it is whatever the user typed. That is why the caller passes numbers as numbers.
 */
export function csvCell(value: unknown): string {
  const text = cellText(value)
  let cell = text

  // Leading spaces and tabs are looked past: a spreadsheet may trim them and still read a formula.
  const first = text.replace(/^[ \t]+/, '').charAt(0)

  if (typeof value !== 'number' && FORMULA_TRIGGERS.has(first)) {
    cell = `'${text}`
  }

  if (/[",\r\n]/.test(cell)) return `"${cell.replace(/"/g, '""')}"`

  return cell
}

/** Rows of values as CSV text (RFC 4180): each cell through `csvCell`, one row per `\r\n`. */
export function csvTable(rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

/**
 * The CSV as a `Blob` of UTF-8 with the byte order mark. The browser keeps the `﻿` as the
 * first character, and `Blob` does not rewrite the text.
 */
export function csvBlob(rows: ReadonlyArray<ReadonlyArray<unknown>>): Blob {
  return new Blob([BYTE_ORDER_MARK, csvTable(rows)], {
    type: 'text/csv;charset=utf-8',
  })
}

/**
 * Downloads the file through a temporary object URL and revokes it. Browser only: the button calls
 * it from a click, never from a render.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
