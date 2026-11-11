import { randomUUID } from 'node:crypto'

import { inject } from '@adonisjs/core'
import { HttpContext } from '@adonisjs/core/http'
import { I18n } from '@adonisjs/i18n'

import {
  left,
  right,
  type Either,
  type StoragesFileUploadResponse,
} from '@maiyu/shared'

import { FileRefusal } from '../_shared.file-refusal.ts'
import { FilePresenter } from '../files.presenter.ts'

import { Storage } from '#domain/storage/storage.entity'
import HTTPException from '#exceptions/http.exception'
import { UploadParts } from '#features/storages/_shared.parts'
import { StorageRepository } from '#repositories/storage/storage.repository'
import {
  MultipartContract,
  PART_SIZE,
  PRESIGNED_BATCH,
  type PresignedPart,
} from '#services/multipart/multipart.contract'
import { StorageContract } from '#services/storage/storage.contract'
import type { StoragesFileCreatePayload } from '#validators/storages/files.validator'

type Payload = StoragesFileCreatePayload
type Response = Either<HTTPException, StoragesFileUploadResponse>

/**
 * Opens an upload: registers the file as `PENDING` and returns where to upload it.
 *
 * **Does not receive bytes**. The binary goes from the browser straight to the bucket,
 * by signed URL, and never crosses this application. It is not a style
 * preference: a large file in an HTTP body hits the proxy limit before
 * getting here, occupies the whole application for the duration of the upload, and cannot
 * be resumed when the connection drops midway.
 *
 * Type and size are **declared** by the client and refused in the validator before
 * any signature - a forbidden file gets no URL, so it never reaches the
 * bucket. That the declared is true is what `POST /storages/:id/complete`
 * checks, against the real object.
 *
 * A file smaller than one part does not become a multipart: it gets a single URL, a null `uploadId`
 * and a direct `PUT`. `UploadId`, `ETag` collection and two-step
 * confirmation for a 40 KB avatar would be ceremony with no function.
 *
 * The file is born without an owner: whoever attaches keeps the id.
 */
@inject()
export default class StoragesFileCreateUseCase {
  constructor(
    private readonly bucket: StorageContract,
    private readonly multipart: MultipartContract,
    private readonly storages: StorageRepository,
    private readonly i18n: I18n,
  ) {}

  async execute(payload: Payload): Promise<Response> {
    const key = this.bucket.key(payload.mimetype)
    const totalParts = UploadParts.count(payload.size, PART_SIZE)

    let uploadId: string | null = null
    let parts: Array<PresignedPart> = []

    try {
      if (totalParts <= 1) {
        parts = [
          {
            partNumber: 1,
            url: await this.multipart.signSingle(
              key,
              payload.mimetype,
              payload.size,
            ),
          },
        ]
      }

      if (totalParts > 1) {
        uploadId = await this.multipart.initiate(key, payload.mimetype)
        parts = await this.multipart.signParts(
          key,
          uploadId,
          UploadParts.sized(
            UploadParts.pending({
              totalParts,
              uploaded: [],
              batch: PRESIGNED_BATCH,
            }),
            payload.size,
            PART_SIZE,
          ),
        )
      }

      const opened = Storage.open({
        id: randomUUID(),
        key,
        originalName: payload.fileName,
        mimetype: payload.mimetype,
        size: payload.size,
        uploadId,
        partSize: PART_SIZE,
        now: new Date(),
      })

      // No row is born, so the URLs already signed point to a key nothing will
      // ever confirm; only the open multipart would keep billing, and it goes.
      if (opened.isLeft()) {
        if (uploadId) await this.abortQuietly(key, uploadId)

        return left(FileRefusal.http(opened.value, this.i18n))
      }

      const storage = opened.value

      await this.storages.save(storage)

      return right(
        FilePresenter.upload({
          storage,
          uploadId,
          partSize: PART_SIZE,
          totalParts,
          parts,
          uploaded: [],
        }),
      )
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[storages/files > create][error]',
      )

      // The multipart may have been opened before the row failed. Without this
      // abort it hangs in the bucket forever: orphan parts do not
      // show up in the object listing and keep being billed.
      if (uploadId) await this.abortQuietly(key, uploadId)

      return left(
        HTTPException.InternalServerError(
          this.i18n.t('errors.internal'),
          'STORAGES_FILE_CREATE_ERROR',
        ),
      )
    }
  }

  /**
   * Aborts without letting the abort failure mask the original failure - the caller
   * is already on the error path, and what matters to report is the first one.
   */
  private async abortQuietly(key: string, uploadId: string): Promise<void> {
    try {
      await this.multipart.abort(key, uploadId)
    } catch (error) {
      HttpContext.getOrFail().logger.error(
        { err: error },
        '[storages/files > create][abort][error]',
      )
    }
  }
}
