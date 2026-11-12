import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { StorageLucidRepository } from './storage.lucid.repository.ts'
import { StorageMemoryRepository } from './storage.memory.repository.ts'
import type { StorageRepository } from './storage.repository.ts'

import { UserFactory } from '#database/factories/user.factory'
import { Storage } from '#domain/storage/storage.entity'
import StorageModel from '#models/storage'
import UserModel from '#models/user'
import { resetDatabase } from '#tests/http-fixtures'
import { storageRow } from '#tests/storages-fixtures'
import { PNG_HEAD } from '#tests/storages-unit-fixtures'

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: () => app.container.make(StorageLucidRepository),
  memory: () => app.container.make(StorageMemoryRepository),
} satisfies Record<string, () => Promise<StorageRepository>>

const NOW = new Date('2026-10-29T12:00:00.000Z')

function file(
  id: string,
  originalName: string,
  confirmed = true,
  uploadedBy: string | null = null,
): Storage {
  const opened = Storage.open({
    id,
    key: `${id}.png`,
    originalName,
    mimetype: 'image/png',
    size: 1024,
    uploadId: null,
    partSize: 10,
    tenantId: null,
    customerId: null,
    uploadedBy,
    now: NOW,
  })
  if (opened.isLeft()) throw new Error(`open refused: ${opened.value.code}`)

  const storage = opened.value
  if (confirmed) storage.complete({ contentLength: 1024, head: PNG_HEAD }, NOW)

  return storage
}

for (const [name, make] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`StorageRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('save and findById return the same file', async ({ assert }) => {
      const repository = await make()
      const cover = file('4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a91', 'cover.png')

      await repository.save(cover)

      const found = await repository.findById(cover.id)
      assert.deepEqual(found?.snapshot(), cover.snapshot())
      assert.isNull(
        await repository.findById('0c1f9d1e-8b7a-4c3d-9e2f-1a2b3c4d5e6f'),
      )
    })

    test('saving again updates the same file', async ({ assert }) => {
      const repository = await make()
      const cover = file(
        '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a92',
        'cover.png',
        false,
      )
      await repository.save(cover)

      cover.complete({ contentLength: 1024, head: PNG_HEAD }, NOW)
      await repository.save(cover)

      const updated = await repository.findById(cover.id)
      assert.equal(updated?.snapshot().status, 'UPLOADED')
    })

    test('detail brings the record in the response shape, without the url', async ({
      assert,
    }) => {
      const repository = await make()
      const cover = file('4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a93', 'cover.png')
      await repository.save(cover)

      const detail = await repository.detail(cover.id)

      assert.deepInclude(detail, {
        id: cover.id,
        originalName: 'cover.png',
        status: 'UPLOADED',
      })
      assert.notProperty(detail, 'url')
      assert.isNull(
        await repository.detail('0c1f9d1e-8b7a-4c3d-9e2f-1a2b3c4d5e6f'),
      )
    })

    test('detailsOf brings only the live files of the ids', async ({
      assert,
    }) => {
      const repository = await make()
      const cover = file('4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a94', 'cover.png')
      await repository.save(cover)

      const details = await repository.detailsOf([
        cover.id,
        cover.id,
        '0c1f9d1e-8b7a-4c3d-9e2f-1a2b3c4d5e6f',
      ])

      assert.deepEqual(
        details.map((item) => item.id),
        [cover.id],
      )
      assert.deepEqual(await repository.detailsOf([]), [])
    })

    test('areAttachable only accepts a confirmed, existing file the account uploaded', async ({
      assert,
    }) => {
      const repository = await make()
      const owner = await UserFactory.create()
      const other = await UserFactory.create()
      const ok = file(
        '7e1d3c2b-1a0f-4e9d-8c7b-6a5f4e3d2c11',
        'ok.png',
        true,
        owner.id,
      )
      const pending = file(
        '7e1d3c2b-1a0f-4e9d-8c7b-6a5f4e3d2c12',
        'pendente.png',
        false,
        owner.id,
      )
      const theirs = file(
        '7e1d3c2b-1a0f-4e9d-8c7b-6a5f4e3d2c13',
        'dela.png',
        true,
        other.id,
      )
      const nobodys = file(
        '7e1d3c2b-1a0f-4e9d-8c7b-6a5f4e3d2c14',
        'ninguem.png',
      )
      for (const each of [ok, pending, theirs, nobodys])
        await repository.save(each)

      assert.isTrue(await repository.areAttachable([ok.id, ok.id], owner.id))
      assert.isTrue(await repository.areAttachable([], owner.id))
      assert.isFalse(
        await repository.areAttachable([ok.id, pending.id], owner.id),
      )
      assert.isFalse(await repository.areAttachable([theirs.id], owner.id))
      assert.isFalse(await repository.areAttachable([nobodys.id], owner.id))
      assert.isFalse(await repository.areAttachable([ok.id], other.id))
      assert.isFalse(
        await repository.areAttachable(
          ['0c1f9d1e-8b7a-4c3d-9e2f-1a2b3c4d5e6f'],
          owner.id,
        ),
      )
    })

    test('paginate searches, filters by status and sorts', async ({
      assert,
    }) => {
      const repository = await make()
      await repository.save(
        file('1d2c3b4a-5f6e-4d8c-9b0a-1f2e3d4c5b61', 'zeta.png'),
      )
      await repository.save(
        file('2e3d4c5b-6a7f-4e9d-8c1b-2a3f4e5d6c72', 'alfa.png'),
      )
      await repository.save(
        file('3f4e5d6c-7b8a-4f0e-9d2c-3b4a5f6e7d83', 'beta.png', false),
      )

      const page = await repository.paginate({
        page: 1,
        perPage: 10,
        status: 'UPLOADED',
        sort: 'originalName',
        direction: 'asc',
      })
      const found = await repository.paginate({
        page: 1,
        perPage: 10,
        search: 'BET',
        sort: 'createdAt',
        direction: 'desc',
      })

      assert.deepEqual(
        page.data.map((item) => item.originalName),
        ['alfa.png', 'zeta.png'],
      )
      assert.equal(page.meta.total, 2)
      assert.deepEqual(
        found.data.map((item) => item.originalName),
        ['beta.png'],
      )
    })

    test('paginate breaks ties by id and takes the search term as text', async ({
      assert,
    }) => {
      const repository = await make()
      await repository.save(
        file('9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d', '50%-off.png'),
      )
      await repository.save(
        file('1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', '50%-off.png'),
      )
      await repository.save(
        file('5c6d7e8f-9a0b-4c1d-8e2f-3a4b5c6d7e8f', '500_x.png'),
      )
      await repository.save(
        file('6d7e8f9a-0b1c-4d2e-8f3a-4b5c6d7e8f9a', '500ax.png'),
      )

      const tied = await repository.paginate({
        page: 1,
        perPage: 10,
        search: '50%',
        sort: 'originalName',
        direction: 'asc',
      })
      const underscore = await repository.paginate({
        page: 1,
        perPage: 10,
        search: '0_x',
        sort: 'originalName',
        direction: 'asc',
      })

      assert.deepEqual(
        tied.data.map((item) => item.id),
        [
          '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
          '9b8a7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d',
        ],
      )
      assert.deepEqual(
        underscore.data.map((item) => item.originalName),
        ['500_x.png'],
      )
    })

    test('claimCompletion marks only a PENDING row, once', async ({
      assert,
    }) => {
      const repository = await make()
      const cover = file(
        '8c9d0e1f-2a3b-4c4d-8e5f-6a7b8c9d0e11',
        'cover.png',
        false,
      )
      await repository.save(cover)
      cover.complete({ contentLength: 1024, head: PNG_HEAD }, NOW)

      assert.strictEqual(await repository.claimCompletion(cover), cover)
      assert.isNull(await repository.claimCompletion(cover))
      assert.equal(
        (await repository.findById(cover.id))?.snapshot().status,
        'UPLOADED',
      )
    })

    test('deletePending deletes only a PENDING row', async ({ assert }) => {
      const repository = await make()
      const pending = file(
        '8c9d0e1f-2a3b-4c4d-8e5f-6a7b8c9d0e12',
        'pendente.png',
        false,
      )
      const confirmed = file('8c9d0e1f-2a3b-4c4d-8e5f-6a7b8c9d0e13', 'ok.png')
      await repository.save(pending)
      await repository.save(confirmed)

      assert.isTrue(await repository.deletePending(pending.id))
      assert.isFalse(await repository.deletePending(pending.id))
      assert.isFalse(await repository.deletePending(confirmed.id))
      assert.isNull(await repository.findById(pending.id))
      assert.isNotNull(await repository.findById(confirmed.id))
    })

    test('findAbandoned brings the PENDING opened before the cutoff, oldest first', async ({
      assert,
    }) => {
      const repository = await make()
      const old = file(
        '9d0e1f2a-3b4c-4d5e-8f6a-7b8c9d0e1f21',
        'velho.png',
        false,
      )
      const older = Storage.restore({
        ...file(
          '9d0e1f2a-3b4c-4d5e-8f6a-7b8c9d0e1f22',
          'mais-velho.png',
          false,
        ).snapshot(),
        createdAt: new Date(NOW.getTime() - 60_000),
      })
      await repository.save(old)
      await repository.save(older)
      await repository.save(
        file('9d0e1f2a-3b4c-4d5e-8f6a-7b8c9d0e1f23', 'ok.png'),
      )

      const abandoned = await repository.findAbandoned(
        new Date(NOW.getTime() + 1),
      )

      assert.deepEqual(
        abandoned.map((storage) => storage.id),
        [older.id, old.id],
      )
      // The cutoff is strict: the oldest one, opened exactly at it, is not abandoned yet.
      assert.deepEqual(
        await repository.findAbandoned(new Date(NOW.getTime() - 60_000)),
        [],
      )
    })

    test('findOrphans brings the UPLOADED confirmed before the cutoff', async ({
      assert,
    }) => {
      const repository = await make()
      const orphan = file('0e1f2a3b-4c5d-4e6f-9a7b-8c9d0e1f2a31', 'orfao.png')
      await repository.save(orphan)
      await repository.save(
        file('0e1f2a3b-4c5d-4e6f-9a7b-8c9d0e1f2a32', 'pendente.png', false),
      )

      const orphans = await repository.findOrphans(new Date(NOW.getTime() + 1))

      assert.deepEqual(
        orphans.map((storage) => storage.id),
        [orphan.id],
      )
      assert.deepEqual(await repository.findOrphans(NOW), [])
    })

    test('delete removes the file', async ({ assert }) => {
      const repository = await make()
      const cover = file('5a6b7c8d-9e0f-4a1b-8c2d-3e4f5a6b7c8d', 'cover.png')
      await repository.save(cover)

      await repository.delete(cover)

      assert.isNull(await repository.findById(cover.id))
    })
  })
}

test.group('StorageRepository (lucid) > usedBy', (group) => {
  group.each.setup(() => resetDatabase())

  test('lists the user avatar that points to the file', async ({ assert }) => {
    const repository = await app.container.make(StorageLucidRepository)
    const cover = file('6b7c8d9e-0f1a-4b2c-9d3e-4f5a6b7c8d9e', 'avatar.png')
    await repository.save(cover)

    assert.deepEqual(await repository.usedBy(cover.id), [])

    const user = await UserFactory.create()
    await UserModel.query().where('id', user.id).update({ avatarId: cover.id })

    assert.deepEqual(await repository.usedBy(cover.id), ['avatar de usuário'])
  })

  test('findOrphans leaves out the file a reference points to', async ({
    assert,
  }) => {
    const repository = await app.container.make(StorageLucidRepository)
    const avatar = file('6b7c8d9e-0f1a-4b2c-9d3e-4f5a6b7c8d9f', 'avatar.png')
    await repository.save(avatar)

    const user = await UserFactory.create()
    await UserModel.query().where('id', user.id).update({ avatarId: avatar.id })

    assert.deepEqual(
      await repository.findOrphans(new Date(NOW.getTime() + 1)),
      [],
    )
  })
})

test.group('StorageRepository (lucid) > uploaded_by', (group) => {
  group.each.setup(() => resetDatabase())

  test('the file stays, with no uploader, when the account that uploaded it is really deleted', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const kept = await storageRow({ uploadedBy: user.id })
    assert.equal((await StorageModel.findOrFail(kept.id)).uploadedBy, user.id)

    // Hard delete on purpose: soft delete never reaches the `ON DELETE` of the FK (`SET NULL`, not `CASCADE`).
    await UserModel.query().where('id', user.id).delete()

    const row = await StorageModel.find(kept.id)
    assert.isNotNull(row)
    assert.isNull(row?.uploadedBy ?? null)
  })
})
