import { test } from '@japa/runner'

import { PLATFORM_ROLE, type Actor } from '@maiyu/shared'

import AccountProfileShowUseCase from './show.use-case.ts'

import { StorageRepository } from '#repositories/storage/storage.repository'
import { UserRepository } from '#repositories/user/user.repository'
import { StorageContract } from '#services/storage/storage.contract'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import {
  identityDoubles,
  seedUser,
  USER_ID,
} from '#tests/identity-unit-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import {
  FILE_ID,
  storageDoubles,
  uploadedFile,
} from '#tests/storages-unit-fixtures'

const TENANT_ID = '3f1c2a52-0a43-4c0e-9d57-6f6f2f2f6a11'

const ACTOR: Actor = {
  id: USER_ID,
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  tenant: null,
  avatarId: null,
}

async function setup() {
  const doubles = identityDoubles()
  const files = storageDoubles()
  const useCase = await makeWithMemory(AccountProfileShowUseCase, [
    [UserRepository, doubles.users],
    [StorageRepository, files.storages],
    [StorageContract, files.bucket],
  ])

  return { ...doubles, ...files, useCase }
}

test.group('account/profile > show (unit)', (group) => {
  insideHttpContext(group)

  test('returns the account of the session, without the password', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    await seedUser(users)

    const profile = rightOf(await useCase.execute({ actor: ACTOR }))

    assert.deepEqual(profile, {
      id: USER_ID,
      name: 'Ana',
      email: 'ana@mail.com',
      phone: null,
      platformRole: PLATFORM_ROLE.USER,
      avatar: null,
      tenant: null,
    })
  })

  test('the active membership comes as id and role, and nothing else of the tenant', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    await seedUser(users)
    const actor: Actor = {
      ...ACTOR,
      tenant: {
        id: TENANT_ID,
        cityId: 'city-1',
        role: ROLE_FIXTURES.staff,
        childIds: ['child-1'],
      },
    }

    const profile = rightOf(await useCase.execute({ actor }))

    assert.deepEqual(profile.tenant, {
      id: TENANT_ID,
      role: ROLE_FIXTURES.staff,
    })
  })

  test('the photo comes with its signed URL', async ({ assert }) => {
    const { users, storages, useCase } = await setup()
    const user = await seedUser(users)
    await storages.save(uploadedFile())
    user.update({ avatarId: FILE_ID }, new Date('2026-10-30T12:00:00Z'))
    await users.save(user)

    const profile = rightOf(await useCase.execute({ actor: ACTOR }))

    assert.equal(profile.avatar?.id, FILE_ID)
    assert.isString(profile.avatar?.url)
  })

  test('an account that vanished after the guard is 401', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ actor: ACTOR })

    assert.deepInclude(result.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
  })
})
