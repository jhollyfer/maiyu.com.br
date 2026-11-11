import { randomUUID } from 'node:crypto'

import type { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'

import {
  StoragesFileShowResponse,
  StoragesFileUploadResponse,
  UPLOAD_STATUS,
} from '@maiyu/shared'
import type { StorageMimetype } from '@maiyu/shared'

import Storage from '#models/storage'
import { body } from '#tests/http-fixtures'
import type { Session } from '#tests/http-fixtures'
import { PNG_HEAD } from '#tests/storages-unit-fixtures'

/**
 * A PNG body of the requested size, for the specs that really upload a file: the
 * `complete` checks the content against the declared type, and loose bytes would be
 * refused.
 */
export function pngBytes(size: number, fill = 66): Uint8Array {
  const bytes = new Uint8Array(size).fill(fill)
  bytes.set(PNG_HEAD)

  return bytes
}

/**
 * A row with the chosen metadata, for the listing tests.
 *
 * Separate from the `record(status)` above because that one fixes `originalName` and
 * `mimetype`, which are precisely the columns the search and filters cut by.
 * `filename` comes out random so the same bucket key does not repeat on two
 * rows.
 */
export function storageRow(attributes: Partial<Storage> = {}) {
  const filename = `${randomUUID()}.png`

  return Storage.create({
    filename,
    originalName: 'capa.png',
    mimetype: 'image/png',
    size: 1024,
    path: filename,
    status: UPLOAD_STATUS.UPLOADED,
    ...attributes,
  })
}

/** Whether the `storages` row still exists, so the spec checks the effect without importing the model. */
export async function storageExists(id: string): Promise<boolean> {
  return (await Storage.find(id)) !== null
}

/**
 * Ages the row in the database: it is the age the cleanup command uses to decide,
 * from the opening for a `PENDING` and from the confirmation for an `UPLOADED`.
 */
export async function ageStorage(id: string, hours: number): Promise<void> {
  const past = DateTime.now().minus({ hours }).toSQL()

  await Storage.query()
    .where('id', id)
    .update({ created_at: past, updated_at: past })
}

/** Opens an upload through the real endpoint and returns the envelope. */
export async function openUpload(
  client: ApiClient,
  session: Session,
  payload: { fileName: string; mimetype: StorageMimetype; size: number },
): Promise<StoragesFileUploadResponse> {
  const response = await client.post('/storages').cookies(session).json(payload)

  response.assertStatus(201)

  return body(response, StoragesFileUploadResponse)
}

/**
 * The signed URL of the part at `index` (0 is the first). A missing part is a broken contract,
 * not a case of the spec: it fails here, with the storage id, instead of a `PUT` to `undefined`.
 */
export function partUrl(
  envelope: StoragesFileUploadResponse,
  index = 0,
): string {
  const part = envelope.parts.at(index)
  if (!part)
    throw new Error(`upload ${envelope.storage.id} has no part at ${index}`)

  return part.url
}

/** Sends a part to the signed URL and returns the `ETag`. */
export async function putPart(
  url: string,
  content: Uint8Array,
): Promise<string> {
  const response = await fetch(url, {
    method: 'PUT',
    body: content,
    headers: { 'Content-Type': 'image/png' },
  })

  if (!response.ok) throw new Error(`PUT answered ${response.status}`)

  return response.headers.get('etag') ?? ''
}

/** The whole path, from zero to `UPLOADED`, for a single-part file. */
export async function uploadFile(
  client: ApiClient,
  session: Session,
): Promise<StoragesFileShowResponse> {
  const content = pngBytes(1024)
  const opened = await openUpload(client, session, {
    fileName: 'capa.png',
    mimetype: 'image/png',
    size: content.byteLength,
  })

  await putPart(partUrl(opened), content)

  const completed = await client
    .post(`/storages/${opened.storage.id}/complete`)
    .cookies(session)
    .json({})

  completed.assertStatus(200)

  return body(completed, StoragesFileShowResponse)
}
