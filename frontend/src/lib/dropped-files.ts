/**
 * The files the user dropped, including those inside folders.
 *
 * A reader of `dataTransfer.files` alone does not see folders: in Chrome a folder arrives
 * there as a zero-byte `File` and is accepted as a broken file, silently. This helper actually
 * walks the tree.
 *
 * There are four browser traps, all silent:
 *
 * 1. **`webkitGetAsEntry()` must be called synchronously.**
 *    `dataTransfer.items` is emptied as soon as the event handler returns, and
 *    an `await` before collecting the entries returns **zero** in Chrome and
 *    Safari. That is why the first loop has no `await` at all.
 * 2. **`readEntries()` returns at most 100 per call.** Without repeating until an
 *    empty array comes, a folder with more than 100 files truncates without warning.
 * 3. **The narrowing is by `isFile`/`isDirectory`, not by `instanceof`.**
 *    `FileSystemFileEntry` and `FileSystemDirectoryEntry` exist in
 *    `lib.dom.d.ts` but **are not globals in every browser**; the
 *    `instanceof` that was here threw `ReferenceError: FileSystemFileEntry
 *    is not defined` on the first dropped file. `isFile`/`isDirectory` are the
 *    documented API surface and exist in any implementation; the
 *    type guards below narrow without `as` and without relying on the constructor.
 * 4. **This is an SSR app.** No `FileSystemFileEntry` at module scope;
 *    only inside the function, which only runs in the browser.
 *
 * The count cut happens **during** the scan, not after: dropping
 * the home folder or a `node_modules` froze the tab for minutes before
 * saying "too many files".
 */

/**
 * What this reader actually consumes from a `DataTransfer`.
 *
 * Typed by the minimum, not by the whole DOM interface: a real `DataTransfer`
 * satisfies this, and the test can build the double without an `as`;
 * `dropEffect`, `clearData` and friends have nothing to do with reading files.
 */
export type DroppedTransfer = {
  types: ArrayLike<string>
  items: ArrayLike<{
    kind: string
    // `unknown` and not `FileSystemEntry`: the narrowing is through the shape guards
    // below, and requiring the DOM type here would force an `as` in the test.
    webkitGetAsEntry: () => unknown
  }>
  files: ArrayLike<File>
}

/** A file no batch wants: Finder junk and tool configuration. */
function isIgnored(name: string): boolean {
  if (name.startsWith('.')) return true
  if (name === '__MACOSX') return true
  return false
}

/** A `readEntries` page, which never brings more than 100 items. */
function readPage(
  reader: FileSystemDirectoryReader,
): Promise<Array<FileSystemEntry>> {
  return new Promise((resolve, reject) => {
    reader.readEntries(resolve, reject)
  })
}

/**
 * The entries of a directory, page by page until the list runs dry **or until the
 * cap**.
 *
 * `remaining` exists because stopping only *between* already collected entries does not avoid the
 * cost: a flat directory of 50 thousand files still cost 500 `readEntries`
 * calls before the cap was checked once.
 */
async function readAllEntries(
  directory: FileSystemDirectoryEntry,
  remaining: number,
): Promise<Array<unknown>> {
  const reader = directory.createReader()
  const entries: Array<unknown> = []

  let page = await readPage(reader)
  while (page.length > 0) {
    entries.push(...page)
    if (entries.length >= remaining) return entries
    page = await readPage(reader)
  }

  return entries
}

function readFile(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject)
  })
}

/**
 * A file entry, recognized by **shape** and not by constructor.
 *
 * `entry instanceof FileSystemFileEntry` looked like the right narrowing and is not: the type
 * comes from `lib.dom.d.ts`, but the global constructor does not exist in every browser, and
 * there `instanceof` throws `ReferenceError` instead of returning `false`.
 */
function isFileEntry(entry: unknown): entry is FileSystemFileEntry {
  if (typeof entry !== 'object' || entry === null) return false
  if (!('isFile' in entry) || !('file' in entry)) return false
  return entry.isFile === true && typeof entry.file === 'function'
}

/** Twin of `isFileEntry`, for the same reason. */
function isDirectoryEntry(entry: unknown): entry is FileSystemDirectoryEntry {
  if (typeof entry !== 'object' || entry === null) return false
  if (!('isDirectory' in entry) || !('createReader' in entry)) return false
  return entry.isDirectory === true && typeof entry.createReader === 'function'
}

/** The entry name, when it has one. */
function entryName(entry: unknown): string {
  if (typeof entry !== 'object' || entry === null) return ''
  if (!('name' in entry)) return ''
  if (typeof entry.name !== 'string') return ''
  return entry.name
}

async function collect(
  entry: unknown,
  files: Array<File>,
  limit: number,
): Promise<void> {
  if (files.length >= limit) return
  if (isIgnored(entryName(entry))) return

  if (isFileEntry(entry)) {
    files.push(await readFile(entry))
    return
  }

  if (isDirectoryEntry(entry)) {
    const children = await readAllEntries(entry, limit - files.length)
    for (const child of children) {
      if (files.length >= limit) return
      await collect(child, files, limit)
    }
  }
}

/**
 * `true` when the drag carries a file from the system, not an element of the page
 * itself.
 *
 * A list that reorders through native HTML5 drag also fires `dragenter` on the ancestors when an
 * element is dragged. Without this guard the drop zone lights up in the middle of a reorder.
 */
export function isFileDrag(dataTransfer: DroppedTransfer | null): boolean {
  if (!dataTransfer) return false
  return Array.from(dataTransfer.types).includes('Files')
}

export async function readDroppedFiles(
  dataTransfer: DroppedTransfer,
  /**
   * File cap. Collecting above it is wasted work: the caller will
   * refuse the batch anyway. Returning `limit + 1` is what lets it
   * tell "at the limit" from "over it".
   */
  limit = Number.POSITIVE_INFINITY,
): Promise<Array<File>> {
  // Collected **before** any `await`: `items` is invalidated as soon as the
  // event handler returns, and the first `await` already yields control.
  const entries: Array<unknown> = []
  for (const item of Array.from(dataTransfer.items)) {
    if (item.kind !== 'file') continue
    const entry = item.webkitGetAsEntry()
    if (entry) entries.push(entry)
  }

  // A browser without `webkitGetAsEntry` falls back to what always existed. It loses folders,
  // but does not lose a dropped file.
  if (entries.length === 0) {
    return Array.from(dataTransfer.files)
      .filter((file) => !isIgnored(file.name))
      .slice(0, limit + 1)
  }

  const files: Array<File> = []
  for (const entry of entries) await collect(entry, files, limit + 1)

  return files
}
