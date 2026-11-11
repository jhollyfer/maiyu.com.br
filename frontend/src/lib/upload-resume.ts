/**
 * What the upload needs to remember to survive a reload.
 *
 * Without this, resuming only covers a network drop: the `storageId` stays in a
 * component variable, and reloading the page loses it. The upload would keep
 * existing on the server, open and invisible, and the user would restart from scratch a
 * file that is already 90% in the bucket.
 *
 * `localStorage` and not TanStack's query cache: what we want is precisely what
 * crosses the reload, and the cache does not cross it.
 */

import type { Merge } from '@maiyu/shared'

import {
  localKeys,
  readLocalItem,
  removeLocalItem,
  writeLocalItem,
} from './local-store'

export type ResumeEntry = {
  storageId: string
  /** Null in a single-part upload. */
  uploadId: string | null
  partSize: number
}

/** What goes to disk: the entry plus the time it was written. */
type StoredEntry = Merge<ResumeEntry, { savedAt: number }>

const PREFIX = 'upload:'

/**
 * How long a resume keeps making sense, in ms.
 *
 * Twenty-four hours because it is the `node ace storages:prune` window: after
 * that the server already deleted the abandoned upload, and the entry points to a
 * `storageId` that no longer exists. Without the deadline it stayed forever: whoever
 * closes the tab mid-upload never comes back to clean it, and the only thing
 * that removed it was the `404` of a resume the user needed to attempt.
 */
const TTL = 24 * 60 * 60 * 1000

/**
 * The identity of a local file, to find its upload again.
 *
 * Name, size and modification date: what the File API gives without reading the content.
 * It is not a hash: computing a hash of a large file costs as much as
 * sending it, and what we want here is to recognize "it is the same file I was
 * sending a minute ago", not to prove identity against the world.
 *
 * The risk is recognizing as equal a swapped file that matches on all three
 * fields. The confirmation catches the case: the size declared on the server will not
 * match what was uploaded, and the answer is `422`.
 */
export function resumeKey(file: File): string {
  return `${PREFIX}${file.name}:${file.size}:${file.lastModified}`
}

export function readResume(file: File): ResumeEntry | null {
  const key = resumeKey(file)
  const entry = parse(readLocalItem(key))

  if (!entry) return null

  if (expired(entry)) {
    removeLocalItem(key)
    return null
  }

  // Without `savedAt`: it is this module's bookkeeping, not part of what the
  // upload needs to know to resume.
  return {
    storageId: entry.storageId,
    uploadId: entry.uploadId,
    partSize: entry.partSize,
  }
}

export function writeResume(file: File, entry: ResumeEntry): void {
  sweep()
  writeLocalItem(
    resumeKey(file),
    JSON.stringify({ ...entry, savedAt: Date.now() }),
  )
}

export function clearResume(file: File): void {
  removeLocalItem(resumeKey(file))
}

/**
 * Deletes the expired resumes of **all** files, and not only the one being
 * sent now.
 *
 * `readResume` only reaches the entry of a file the user tried again,
 * and most are not tried again: that is precisely why they
 * pile up. The sweep goes along with the write because it is the only moment when
 * this module is called knowing it will touch the disk anyway.
 */
function sweep(): void {
  // Unreadable counts as expired: there is no way to resume from it.
  for (const key of localKeys(PREFIX)) {
    const entry = parse(readLocalItem(key))

    if (!entry || expired(entry)) removeLocalItem(key)
  }
}

function parse(stored: string | null): StoredEntry | null {
  if (!stored) return null

  try {
    const parsed: unknown = JSON.parse(stored)

    if (!isStoredEntry(parsed)) return null

    return parsed
  } catch {
    return null
  }
}

function expired(entry: StoredEntry): boolean {
  return Date.now() - entry.savedAt > TTL
}

/** Narrows what came from `localStorage`, which is text of unknown origin. */
function isStoredEntry(value: unknown): value is StoredEntry {
  if (typeof value !== 'object' || value === null) return false

  const candidate: Record<string, unknown> = { ...value }

  if (typeof candidate.storageId !== 'string') return false
  if (typeof candidate.partSize !== 'number') return false
  if (typeof candidate.savedAt !== 'number') return false
  if (candidate.uploadId !== null && typeof candidate.uploadId !== 'string') {
    return false
  }

  return true
}
