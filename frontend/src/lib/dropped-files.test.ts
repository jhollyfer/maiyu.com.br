import { describe, expect, it } from 'vitest'

import type { DroppedTransfer } from './dropped-files'
import { isFileDrag, readDroppedFiles } from './dropped-files'

/**
 * The reader of what was dropped on the list.
 *
 * It is the only new parser of the frontend, and the regressions it can have are
 * **silent**: a folder with more than 100 files truncating (`readEntries`
 * pages 100 at a time), `.DS_Store` becoming a record, and the drop zone lighting up in the
 * middle of a reorder.
 *
 * jsdom does not implement `webkitGetAsEntry`, so the doubles below build the
 * shape the browser delivers: **plain objects, with `isFile`/`isDirectory`
 * and nothing else**.
 *
 * Before they were classes, and the test registered `FileSystemFileEntry` and
 * `FileSystemDirectoryEntry` on `globalThis` for the code's `instanceof` to
 * work. That is how this file went green while production
 * threw `ReferenceError: FileSystemFileEntry is not defined` on the first
 * dropped file: **the test fabricated the global the browser does not have.** A double
 * that needs to touch the environment for the code to work is proving the
 * environment, not the code.
 */

type FakeFileEntry = {
  isFile: true
  isDirectory: false
  name: string
  file: (resolve: (value: File) => void) => void
}

type FakeDirectoryEntry = {
  isFile: false
  isDirectory: true
  name: string
  createReader: () => {
    readEntries: (resolve: (entries: Array<unknown>) => void) => void
  }
}

type FakeEntry = FakeFileEntry | FakeDirectoryEntry

function fileEntry(name: string): FakeFileEntry {
  return {
    isFile: true,
    isDirectory: false,
    name,
    file: (resolve) => resolve(new File(['x'], name)),
  }
}

function directoryEntry(
  name: string,
  children: Array<FakeEntry>,
): FakeDirectoryEntry {
  return {
    isFile: false,
    isDirectory: true,
    name,
    createReader: (): {
      readEntries: (resolve: (entries: Array<unknown>) => void) => void
    } => {
      // Pages of 100 at a time, like the real browser.
      let cursor = 0
      return {
        readEntries: (resolve): void => {
          const page = children.slice(cursor, cursor + 100)
          cursor += page.length
          resolve(page)
        },
      }
    },
  }
}

function transfer(
  entries: Array<FakeEntry>,
  types: Array<string> = ['Files'],
): DroppedTransfer {
  return {
    types,
    files: [],
    items: entries.map((entry) => ({
      kind: 'file',
      // The double is not a DOM `FileSystemEntry`, and does not need to be: the code
      // narrows by **shape** (`isFile`/`isDirectory`), not by constructor.
      webkitGetAsEntry: (): unknown => entry,
    })),
  }
}

describe('isFileDrag', () => {
  it('is only true when the drag carries a file from the system', () => {
    expect(isFileDrag(transfer([], ['Files']))).toBe(true)
    // An internal reorder: without this guard the drop zone would light up in the middle of it.
    expect(isFileDrag(transfer([], ['text/plain']))).toBe(false)
    expect(isFileDrag(null)).toBe(false)
  })
})

describe('readDroppedFiles', () => {
  it('reads a dropped file without relying on a global constructor', async () => {
    // The double is a plain object: if the code goes back to using `instanceof`, this
    // fails here instead of failing only in the user's browser.
    const dropped = await readDroppedFiles(
      transfer([fileEntry('contrato.pdf')]),
    )

    expect(dropped.map((f) => f.name)).toEqual(['contrato.pdf'])
  })

  it('walks down a folder tree, at any depth', async () => {
    const tree = directoryEntry('docs', [
      fileEntry('a.pdf'),
      directoryEntry('sub', [
        fileEntry('b.png'),
        directoryEntry('mais', [fileEntry('c.txt')]),
      ]),
    ])

    const dropped = await readDroppedFiles(transfer([tree]))

    expect(dropped.map((f) => f.name)).toEqual(['a.pdf', 'b.png', 'c.txt'])
  })

  it('does not truncate at 100: readEntries pages, and the loop must drain it', async () => {
    const many = Array.from({ length: 250 }, (_, index) =>
      fileEntry(`arquivo-${index}.pdf`),
    )

    const dropped = await readDroppedFiles(
      transfer([directoryEntry('lote', many)]),
    )

    expect(dropped).toHaveLength(250)
  })

  it('discards dotfiles and __MACOSX, at the root and deep down', async () => {
    const tree = directoryEntry('docs', [
      fileEntry('.DS_Store'),
      fileEntry('bom.pdf'),
      directoryEntry('__MACOSX', [fileEntry('._bom.pdf')]),
      directoryEntry('sub', [fileEntry('.gitkeep'), fileEntry('outro.png')]),
    ])

    const dropped = await readDroppedFiles(transfer([tree]))

    expect(dropped.map((f) => f.name)).toEqual(['bom.pdf', 'outro.png'])
  })

  it('stops scanning past the cap, instead of walking the whole tree', async () => {
    // Dropping the home folder froze the tab for minutes before showing
    // "too many files". Returns `limit + 1` so the caller can tell "at the
    // limit" from "over it".
    const many = Array.from({ length: 400 }, (_, index) =>
      fileEntry(`arquivo-${index}.pdf`),
    )

    const dropped = await readDroppedFiles(
      transfer([directoryEntry('lote', many)]),
      10,
    )

    expect(dropped).toHaveLength(11)
  })

  it('without webkitGetAsEntry it falls back to dataTransfer.files, without losing a dropped file', async () => {
    const dropped = await readDroppedFiles({
      types: ['Files'],
      files: [new File(['x'], 'legado.pdf'), new File(['x'], '.DS_Store')],
      items: [],
    })

    expect(dropped.map((f) => f.name)).toEqual(['legado.pdf'])
  })
})
