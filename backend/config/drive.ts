import app from '@adonisjs/core/services/app'
import { defineConfig, services } from '@adonisjs/drive'
import type { InferDriveDisks } from '@adonisjs/drive/types'
import type { S3ClientConfig } from '@aws-sdk/client-s3'

import env from '#start/env'

/**
 * File storage: one S3-compatible bucket, MinIO in dev and in the e2e, and in
 * production whatever `STORAGE_ENDPOINT` points to (`_standards/backend.md` §5.4,
 * `DECISIONS.md` #349).
 *
 * The upload is presigned multipart, and multipart is S3 API - the `fs` driver
 * does not have it, nor signed URLs (_doc-lib/flydrive.md#services/fs). So the
 * upload flow runs on `s3` in every environment that exercises it, and `fs` is
 * there for what only writes and reads bytes (a command, a seed on a machine
 * without MinIO) and for `drive.fake()` in the unit test.
 *
 * The credentials come from `STORAGE_*`, not from a per-vendor prefix: what
 * the code depends on is the protocol. R2, S3, Spaces, Linode and MinIO swap
 * places by changing `STORAGE_ENDPOINT`.
 */
export const bucket = env.get('STORAGE_BUCKET')

/**
 * The bucket connection, exported because it has **two** consumers: the
 * FlyDrive below, and the `MultipartService`, which talks to the AWS SDK
 * directly - FlyDrive does not expose multipart (`CreateMultipartUpload` and company).
 *
 * One constant and not two `env` reads: two places reading the same
 * variables is where one of them gets forgotten the day the connection changes.
 */
export const clientConfig: S3ClientConfig = {
  credentials: {
    accessKeyId: env.get('STORAGE_KEY'),
    secretAccessKey: env.get('STORAGE_SECRET'),
  },
  region: 'auto',
  endpoint: env.get('STORAGE_ENDPOINT'),
  forcePathStyle: env.get('STORAGE_FORCE_PATH_STYLE') ?? false,

  // The SDK default is `WHEN_SUPPORTED`, and it breaks signed URLs: in presign
  // there is no body, so the checksum that goes into the query is the one of **zero bytes**
  // (`x-amz-checksum-crc32=AAAAAA==`). The browser sends the real file,
  // the bucket checks it against that value and refuses the `PUT`. With `WHEN_REQUIRED`
  // the checksum only enters where the operation requires it, and none of ours does.
  requestChecksumCalculation: 'WHEN_REQUIRED',
}

/**
 * How long a read URL is valid.
 *
 * The disk is private, so there is no permanent address for an object: every
 * read comes out signed. Fifteen minutes covers the life of an open page without
 * leaving an address in circulation - a copied link expires before serving whoever
 * should not see it.
 *
 * The cost is the cache: the URL changes on every read, and the CDN does not reuse it. On a
 * page with many images that weighs, and the way out, if it does, is to round the
 * signing date to the hour slice - the URL stays stable inside the window and
 * becomes cacheable again, without changing the security model.
 *
 * **This value has a counterpart in the frontend, and nothing links the two.** The signed
 * `url` travels inside the response, so the client cache stores it along: a query
 * with `staleTime` above this period serves an avatar with an expired URL, and the failure
 * shows up as a broken image, with no error anywhere. Today the client ceiling
 * is five minutes (`accountQueryOptions`), with the global at one. Lowering this
 * TTL, or raising that one, requires touching both - which is why the number is
 * written in both places instead of only here.
 */
export const URL_TTL = '15 mins'

/**
 * The per-file ceiling, in bytes. It comes from the environment and has no default: without the
 * variable the application does not even start (`start/env.ts`). The `size` column is
 * `bigint` precisely so as not to impose here a ceiling the operator did not ask for. Read here,
 * because ENV is read only in `config/` (`domain.md` §11.1, DECISIONS.md #314).
 */
export const UPLOAD_MAX_SIZE = env.get('UPLOAD_MAX_SIZE')

/**
 * `DRIVE_DISK` picks the disk, with no default in the code: which one an
 * environment uses is the operator's choice, and the boot stops without it
 * (_doc-lib/adonisjs.md#guides/digging-deeper/drive,
 * https://docs.adonisjs.com/guides/digging-deeper/drive). Every service any
 * environment uses is registered here, so switching is only the variable
 * (_doc-lib/flydrive.md#drive_manager).
 */
const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  services: {
    // `private`, and therefore there is no `cdnUrl`: with the private disk FlyDrive's
    // `getUrl` no longer works, and every read is signed. Without this,
    // every object in the bucket is readable by whoever knows the address - including the
    // not yet confirmed upload and the file no row references.
    //
    // `supportsACL: false`: R2 does not implement the per-object ACL commands, and the
    // bucket being private is what keeps objects closed, not an ACL on each one
    // (_doc-lib/flydrive.md#services/s3, https://flydrive.dev/docs/services/s3).
    s3: services.s3({
      ...clientConfig,
      bucket,
      visibility: 'private',
      supportsACL: false,
    }),

    // Under `tmp/`, which the project never commits. No `serveFiles`: the files
    // are private, and the `fs` driver has no signed URL to read them by.
    fs: services.fs({
      location: app.tmpPath('uploads'),
      visibility: 'private',
      serveFiles: false,
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
