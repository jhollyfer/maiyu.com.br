import { STORAGE_MIMETYPES } from '../../enums/storage-mimetype.js'
import { UPLOAD_STATUSES } from '../../enums/upload-status.js'
import { Rule, z } from '../../validator.js'

/**
 * Which columns the file library can be sorted by. Lives with the validator that reads it:
 * a list per resource gathered elsewhere would mix the domain lists into the common kit.
 */
export const STORAGE_SORT_COLUMNS = [
  'originalName',
  'mimetype',
  'size',
  'createdAt',
] as const

/**
 * What `POST /storages` receives to open a multipart upload.
 *
 * The `size` ceiling here is only the safe integer's: the per-file ceiling is the
 * `UPLOAD_MAX_SIZE` of each deploy's environment, which the backend reads and checks, and
 * which `shared/` - pure code, without ENV - does not see.
 */
export const StoragesFileCreateValidator = z.object({
  fileName: Rule.fileName(),
  mimetype: z.enum(STORAGE_MIMETYPES),
  size: z.int().min(1),
})

/**
 * What `POST /storages/:id/complete` receives: the parts sent, with the ETag
 * that the bucket returned for each one. The part number goes up to 10,000, the
 * limit of S3 multipart.
 */
export const StoragesFileCompleteValidator = z.object({
  parts: Rule.optional(
    z.array(
      z.object({
        partNumber: z.int().min(1).max(10_000),
        etag: z.string().trim().min(1).max(64),
      }),
    ),
  ),
})

/** What `GET /storages` accepts in the query. */
export const StoragesFilePaginateValidator = z.object({
  ...Rule.paginationFields(),
  status: Rule.optional(z.enum(UPLOAD_STATUSES)),
  mimetype: Rule.optional(z.enum(STORAGE_MIMETYPES)),
  ...Rule.sortFields(STORAGE_SORT_COLUMNS),
})

export type StoragesFileCreatePayload = z.infer<
  typeof StoragesFileCreateValidator
>
export type StoragesFileCompletePayload = z.infer<
  typeof StoragesFileCompleteValidator
>
export type StoragesFilePaginatePayload = z.infer<
  typeof StoragesFilePaginateValidator
>
