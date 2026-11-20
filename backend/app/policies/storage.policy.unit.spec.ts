import { AuthorizationResponse } from '@adonisjs/bouncer'
import { test } from '@japa/runner'

import {
  PLATFORM_ROLE,
  STAFF_USER_ROLES,
  UPLOAD_STATUS,
  type Actor,
  type UserRole,
} from '@maiyu/shared'

import { Storage } from '#domain/storage/storage.entity'
import StoragePolicy from '#policies/storage.policy'
import { NO_NON_STAFF_ROLE, ROLE_FIXTURES } from '#tests/role-fixtures'

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
    phone: null,
    platformRole: PLATFORM_ROLE.USER,
    tenant: { id: 'tenant-a', cityId: 'city-1', role, childIds: ['tenant-c'] },
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
    tenantId: 'tenant-a',
    customerId: null,
    uploadedBy: null,
    createdAt: null,
    updatedAt: null,
    deletedAt: null,
  })

  test('when the file exists and the actor is staff, allows', ({ assert }) => {
    assert.isTrue(policy.download(staff, storage))
  })

  test('the staff of a parent tenant reads a child file, and nobody reads another tenant', ({
    assert,
  }) => {
    const child = Storage.restore({
      ...storage.snapshot(),
      tenantId: 'tenant-c',
    })
    const other = Storage.restore({
      ...storage.snapshot(),
      tenantId: 'tenant-b',
    })

    assert.isTrue(policy.download(staff, child))
    assert.instanceOf(policy.download(staff, other), AuthorizationResponse)
  })

  // DECISIONS.md #397: the end customer has no membership and downloads the file it uploaded.
  test('a customer downloads its own file and no other', ({ assert }) => {
    const customer: Actor = { ...staff, id: 'customer-1', tenant: null }
    const own = Storage.restore({
      ...storage.snapshot(),
      customerId: 'customer-1',
    })
    const other = Storage.restore({
      ...storage.snapshot(),
      customerId: 'customer-2',
    })

    assert.isTrue(policy.download(customer, own))
    assert.instanceOf(policy.download(customer, other), AuthorizationResponse)
  })

  test("the staff of a parent tenant does not download a child's customer file", ({
    assert,
  }) => {
    const proof = Storage.restore({
      ...storage.snapshot(),
      tenantId: 'tenant-c',
      customerId: 'customer-1',
    })
    const own = Storage.restore({
      ...storage.snapshot(),
      customerId: 'customer-1',
    })

    assert.instanceOf(policy.download(staff, proof), AuthorizationResponse)
    assert.isTrue(policy.download(staff, own))
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

/**
 * `show` and `delete` (DECISIONS.md #803): the one who uploaded, the staff of the tenant, and for a
 * customer's file the customer alone. Every denial is the `404` of a missing file.
 */
test.group('StoragePolicy > show and delete', () => {
  const policy = new StoragePolicy()
  const [role] = STAFF_USER_ROLES
  if (role === undefined) throw new Error('the project declares no staff role')
  // The skeleton may have no role outside the staff: the cases that need one skip, never pass empty.
  const plain: UserRole = ROLE_FIXTURES.nonStaff ?? role
  const skip = ROLE_FIXTURES.nonStaff === null

  const actorOf = (
    id: string,
    tenantRole: UserRole,
    tenantId = 'tenant-a',
  ): Actor => ({
    id,
    email: `${id}@mail.com`,
    phone: null,
    platformRole: PLATFORM_ROLE.USER,
    tenant: {
      id: tenantId,
      cityId: 'city-1',
      role: tenantRole,
      childIds: ['tenant-c'],
    },
    avatarId: null,
  })
  const fileOf = (overrides: Partial<ReturnType<Storage['snapshot']>> = {}) =>
    Storage.restore({
      id: 'storage-1',
      filename: 'a.png',
      originalName: 'a.png',
      mimetype: 'image/png',
      size: 10,
      path: 'a.png',
      status: UPLOAD_STATUS.UPLOADED,
      uploadId: null,
      partSize: null,
      tenantId: 'tenant-a',
      customerId: null,
      uploadedBy: 'member-a',
      createdAt: null,
      updatedAt: null,
      deletedAt: null,
      ...overrides,
    })
  const actions = ['show', 'delete'] as const

  for (const action of actions) {
    test(`${action}: the uploader reaches its own file`, ({ assert }) => {
      const member = actorOf('member-a', plain)

      assert.isTrue(policy[action](member, fileOf()))
    }).skip(skip, NO_NON_STAFF_ROLE)

    test(`${action}: another plain member of the same tenant does not reach it`, ({
      assert,
    }) => {
      const other = actorOf('member-b', plain)

      assert.instanceOf(policy[action](other, fileOf()), AuthorizationResponse)
    }).skip(skip, NO_NON_STAFF_ROLE)

    test(`${action}: the staff of the tenant reaches a file it did not upload`, ({
      assert,
    }) => {
      assert.isTrue(policy[action](actorOf('staff-1', role), fileOf()))
    })

    test(`${action}: staff of another tenant and a file of another tenant are denied`, ({
      assert,
    }) => {
      const foreign = fileOf({ tenantId: 'tenant-b' })

      assert.instanceOf(
        policy[action](actorOf('staff-1', role), foreign),
        AuthorizationResponse,
      )
      assert.instanceOf(
        policy[action](actorOf('member-a', role, 'tenant-b'), fileOf()),
        AuthorizationResponse,
      )
    })

    test(`${action}: a customer file is the customer's alone, not even the tenant staff's`, ({
      assert,
    }) => {
      const proof = fileOf({
        customerId: 'customer-1',
        uploadedBy: 'customer-1',
      })
      const customer: Actor = { ...actorOf('customer-1', role), tenant: null }

      assert.isTrue(policy[action](customer, proof))
      assert.instanceOf(
        policy[action](actorOf('staff-1', role), proof),
        AuthorizationResponse,
      )
      assert.instanceOf(
        policy[action]({ ...customer, id: 'customer-2' }, proof),
        AuthorizationResponse,
      )
    })

    test(`${action}: the actor's own avatar is reachable`, ({ assert }) => {
      const stranger: Actor = {
        ...actorOf('x', role),
        tenant: null,
        avatarId: 'storage-1',
      }

      assert.isTrue(policy[action](stranger, fileOf()))
    })

    test(`${action}: a missing file is denied with 404, the code and the key, untranslated`, ({
      assert,
    }) => {
      const response = policy[action](actorOf('staff-1', role), null)

      if (!(response instanceof AuthorizationResponse))
        return assert.fail('expected a denial')

      assert.equal(response.status, 404)
      assert.equal(response.message, 'STORAGE_NOT_FOUND')
      assert.equal(response.translation?.identifier, 'files.not_found')
    })
  }

  test('delete: the parent tenant staff reads a child file and never removes it', ({
    assert,
  }) => {
    const child = fileOf({ tenantId: 'tenant-c' })
    const parentStaff = actorOf('staff-1', role)

    assert.isTrue(policy.show(parentStaff, child))
    assert.instanceOf(policy.delete(parentStaff, child), AuthorizationResponse)
  })

  test('the uploader loses the file once it leaves the tenant', ({
    assert,
  }) => {
    const moved = actorOf('member-a', plain, 'tenant-b')

    assert.instanceOf(policy.show(moved, fileOf()), AuthorizationResponse)
    assert.instanceOf(policy.delete(moved, fileOf()), AuthorizationResponse)
  }).skip(skip, NO_NON_STAFF_ROLE)
})
