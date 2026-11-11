import {
  STORAGE_MIMETYPES,
  STORAGE_SORT_COLUMNS,
  UPLOAD_STATUSES,
} from '@maiyu/shared'

import { UPLOAD_MAX_SIZE } from '#config/drive'
import { Rule, vine } from '#core/validator'
import type { Infer } from '#core/validator'

/**
 * What `POST /storages` receives: metadata, never bytes.
 *
 * The binary goes from the browser straight to the bucket, so type and size
 * are **declared** here and checked against the real object in
 * `POST /storages/:id/complete`. Refusing before signing is what keeps a
 * forbidden file from reaching the bucket; checking afterwards is what catches the
 * declaration having been a lie.
 */

export const StoragesFileCreateValidator = vine.create({
  fileName: vine.string().trim().minLength(1).maxLength(255),
  mimetype: vine.enum(STORAGE_MIMETYPES),
  size: vine.number().min(1).max(UPLOAD_MAX_SIZE).withoutDecimals(),
})

export type StoragesFileCreatePayload = Infer<
  typeof StoragesFileCreateValidator
>

/**
 * What `POST /storages/:id/complete` receives: the `:id` of the route and the `ETag` of
 * each uploaded part, in one schema read by one `validateUsing` (`DECISIONS.md` #375).
 *
 * Empty - or absent - is a single-part upload, which has no part to
 * confirm. The ceiling of ten thousand is S3's own.
 */
export const StoragesFileCompleteValidator = vine.create({
  ...Rule.identifierParams(),
  parts: vine
    .array(
      vine.object({
        partNumber: vine.number().min(1).max(10_000).withoutDecimals(),
        etag: vine.string().trim().maxLength(64).minLength(1),
      }),
    )
    .optional(),
})

export type StoragesFileCompletePayload = Infer<
  typeof StoragesFileCompleteValidator
>

/**
 * What `GET /storages` receives.
 *
 * The panel file library: `?search` finds by original label, by generated
 * name or by type - it is the `backend-old` search, on the columns that
 * survived the mapping -, and `?status` and `?mimetype` cut what has already gone up
 * and what is an image.
 *
 * Without `Rule.trashedField()`: `storages` has `deleted_at`, but deleting a file is
 * `DELETE /storages/:id`, which removes the row **and** the binary. There is no file
 * trash to restore, and the parameter would be accepted and silently ignored.
 */
export const StoragesFilePaginateValidator = vine.create({
  ...Rule.paginationFields(),
  status: vine.enum(UPLOAD_STATUSES).optional(),
  // The closed list, not free text: it is the same tuple `POST /storages`
  // accepts, so filtering by a type the API never saves is a 422 instead of an
  // empty page that looks like a bug.
  mimetype: vine.enum(STORAGE_MIMETYPES).optional(),
  ...Rule.sortFields(STORAGE_SORT_COLUMNS),
})

export type StoragesFilePaginatePayload = Infer<
  typeof StoragesFilePaginateValidator
>
