import { test } from '@japa/runner'

import { PLATFORM_ROLE, type Actor } from '@maiyu/shared'

import AccountProfileShowUseCase from './show.use-case.ts'

import { UserRepository } from '#repositories/user/user.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import {
  identityDoubles,
  seedUser,
  USER_ID,
} from '#tests/identity-unit-fixtures'

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
  const useCase = await makeWithMemory(AccountProfileShowUseCase, [
    [UserRepository, doubles.users],
  ])

  return { ...doubles, useCase }
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
    })
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
