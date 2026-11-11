import { Storage } from '#domain/storage/storage.entity'
import { StorageMemoryRepository } from '#repositories/storage/storage.memory.repository'
import { MultipartFake } from '#services/multipart/multipart.fake'
import { StorageFake } from '#services/storage/storage.fake'
import { rightOf } from '#tests/either-fixtures'

export const FILE_ID = '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d'

/** A `PENDING` file of 1 KiB; a present `uploadId` means multipart. */
export function pendingFile(
  overrides: { id?: string; uploadId?: string | null } = {},
): Storage {
  const opened = Storage.open({
    id: overrides.id ?? FILE_ID,
    key: 'capa.png',
    originalName: 'capa.png',
    mimetype: 'image/png',
    size: 1024,
    uploadId: overrides.uploadId ?? null,
    partSize: 10 * 1024 * 1024,
    now: new Date('2026-10-29T12:00:00Z'),
  })

  return rightOf(opened)
}

/** An already confirmed file. */
/** The start of a PNG: the content the `image/png` type requires on `complete`. */
export const PNG_HEAD = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0,
])

export function uploadedFile(id = FILE_ID): Storage {
  const file = pendingFile({ id })
  file.complete(
    { contentLength: 1024, head: PNG_HEAD },
    new Date('2026-10-29T12:05:00Z'),
  )

  return file
}

/** The three external I/O collaborators of the file use cases, in memory. */
export function storageDoubles() {
  return {
    storages: new StorageMemoryRepository(),
    bucket: new StorageFake(),
    multipart: new MultipartFake(),
  }
}
