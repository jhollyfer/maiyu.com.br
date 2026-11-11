import { AuthorizationResponse } from '@adonisjs/bouncer'
import { test } from '@japa/runner'

import { STAFF_USER_ROLES, UPLOAD_STATUS, type Actor } from '@maiyu/shared'

import { Storage } from '#domain/storage/storage.entity'
import StoragePolicy from '#policies/storage.policy'

/**
 * The policy called directly, without route or Bouncer (`_standards/backend.md` §4.6,
 * DECISIONS.md #358). The denial carries the key and the code, never a translated text: who
 * translates is the handler (#346).
 */
test.group('StoragePolicy > download', () => {
  const policy = new StoragePolicy()
  const [role] = STAFF_USER_ROLES
  if (role === undefined) throw new Error('the project declares no staff role')

  const staff: Actor = {
    id: 'actor-1',
    email: 'staff@mail.com',
    role,
    avatarId: null,
  }
  const storage = Storage.restore({
    id: 'storage-1',
    filename: 'a.png',
    originalName: 'a.png',
    mimetype: 'image/png',
    size: 10,
    path: 'a.png',
    status: UPLOAD_STATUS.UPLOADED,
    uploadId: null,
    partSize: null,
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
  })

  test('when the file exists and the actor is staff, allows', ({ assert }) => {
    assert.isTrue(policy.download(staff, storage))
  })

  test('when the file is missing, denies with 404, the code and the key, untranslated', ({
    assert,
  }) => {
    const response = policy.download(staff, null)

    if (!(response instanceof AuthorizationResponse))
      return assert.fail('expected a denial')

    assert.equal(response.status, 404)
    assert.equal(response.message, 'STORAGE_NOT_FOUND')
    assert.equal(response.translation?.identifier, 'files.not_found')
  })
})
