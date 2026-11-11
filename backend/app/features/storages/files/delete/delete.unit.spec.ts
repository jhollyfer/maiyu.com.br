import { HttpContext } from '@adonisjs/core/http'
import { test } from '@japa/runner'

import StoragesFileDeleteUseCase from './delete.use-case.ts'

import { StorageRepository } from '#repositories/storage/storage.repository'
import { MultipartContract } from '#services/multipart/multipart.contract'
import { StorageContract } from '#services/storage/storage.contract'
import { makeWithMemory } from '#tests/container-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import {
  FILE_ID,
  pendingFile,
  storageDoubles,
  uploadedFile,
} from '#tests/storages-unit-fixtures'

async function setup() {
  const doubles = storageDoubles()
  const useCase = await makeWithMemory(StoragesFileDeleteUseCase, [
    [StorageRepository, doubles.storages],
    [StorageContract, doubles.bucket],
    [MultipartContract, doubles.multipart],
  ])

  return { ...doubles, useCase }
}

test.group('storages/files > delete (unit)', (group) => {
  insideHttpContext(group)

  test('orphan file goes: binary and row', async ({ assert }) => {
    const { storages, bucket, useCase } = await setup()
    await storages.save(uploadedFile())

    const result = await useCase.execute({ id: FILE_ID })

    assert.isTrue(result.isRight())
    assert.deepEqual(bucket.discarded, ['capa.png'])
    assert.isNull(await storages.findById(FILE_ID))
  })

  test('file in use is 409 STORAGE_IN_USE and nothing is deleted', async ({
    assert,
  }) => {
    const { storages, bucket, useCase } = await setup()
    await storages.save(uploadedFile())
    storages.markUsed(FILE_ID, ['avatar de usuário'])

    const result = await useCase.execute({ id: FILE_ID })

    assert.deepInclude(result.value, { status: 409, code: 'STORAGE_IN_USE' })
    assert.deepEqual(bucket.discarded, [])
    assert.isNotNull(await storages.findById(FILE_ID))
  })

  test('PENDING multipart is cancelled: aborts the upload and deletes the row', async ({
    assert,
  }) => {
    const { storages, multipart, useCase } = await setup()
    await storages.save(pendingFile({ uploadId: 'up' }))

    const result = await useCase.execute({ id: FILE_ID })

    assert.isTrue(result.isRight())
    assert.deepEqual(multipart.aborted, ['capa.png'])
    assert.isNull(await storages.findById(FILE_ID))
  })

  test('PENDING single-part deletes the object, and the missing object is not an error', async ({
    assert,
  }) => {
    const { storages, bucket, useCase } = await setup()
    await storages.save(pendingFile())
    bucket.discard = async () => {
      throw new Error('object does not exist')
    }

    const result = await useCase.execute({ id: FILE_ID })

    assert.isTrue(result.isRight())
    assert.isNull(await storages.findById(FILE_ID))
  })

  test('PENDING that a concurrent complete confirmed is 409 STORAGE_ALREADY_UPLOADED and stays', async ({
    assert,
  }) => {
    const { storages, useCase } = await setup()
    await storages.save(pendingFile())
    storages.deletePending = async () => {
      await storages.save(uploadedFile())

      return false
    }

    const result = await useCase.execute({ id: FILE_ID })

    assert.deepInclude(result.value, {
      status: 409,
      code: 'STORAGE_ALREADY_UPLOADED',
    })
    assert.isTrue((await storages.findById(FILE_ID))?.isUploaded())
  })

  test('PENDING that another cancel already took is done, not an error', async ({
    assert,
  }) => {
    const { storages, multipart, useCase } = await setup()
    await storages.save(pendingFile({ uploadId: 'up' }))
    multipart.abort = async () => {
      await storages.delete(pendingFile())
      throw new Error('NoSuchUpload')
    }

    const result = await useCase.execute({ id: FILE_ID })

    assert.isTrue(result.isRight())
  })

  test('nonexistent file is 404 STORAGE_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: FILE_ID })

    assert.deepInclude(result.value, { status: 404, code: 'STORAGE_NOT_FOUND' })
  })

  test('when the bucket fails, is 500 STORAGES_FILE_DELETE_ERROR, logged on the request logger', async ({
    assert,
  }) => {
    const { storages, bucket, useCase } = await setup()
    await storages.save(uploadedFile())
    bucket.discard = async () => {
      throw new Error('bucket down')
    }
    const { logger } = HttpContext.getOrFail()
    let logged = 0
    logger.error = () => {
      logged += 1
    }

    const result = await useCase.execute({ id: FILE_ID })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'STORAGES_FILE_DELETE_ERROR',
    })
    assert.equal(logged, 1)
  })

  test('when the caller has no request, hands in its logger and the error goes there', async ({
    assert,
  }) => {
    const { storages, bucket, useCase } = await setup()
    await storages.save(uploadedFile())
    bucket.discard = async () => {
      throw new Error('bucket down')
    }
    const request = HttpContext.getOrFail().logger
    const command = request.child({ command: 'storages:prune' })
    const logged = { request: 0, command: 0 }
    request.error = () => {
      logged.request += 1
    }
    command.error = () => {
      logged.command += 1
    }

    await useCase.execute({ id: FILE_ID, logger: command })

    assert.deepEqual(logged, { request: 0, command: 1 })
  })
})
