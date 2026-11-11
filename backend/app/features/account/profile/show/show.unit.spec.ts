import { test } from '@japa/runner'

import { USER_ROLE, type Actor } from '@maiyu/shared'

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
  role: USER_ROLE.ADMINISTRATOR,
  avatarId: null,
}

async function setup() {
  const { users } = identityDoubles()
  const useCase = await makeWithMemory(AccountProfileShowUseCase, [
    [UserRepository, users],
  ])

  return { users, useCase }
}

test.group('account/profile > show (unit)', (group) => {
  insideHttpContext(group)

  test('reads the account of the session with id, name, email and role, and nothing else', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    await seedUser(users)

    const profile = rightOf(await useCase.execute({ actor: ACTOR }))

    assert.deepEqual(profile, {
      id: USER_ID,
      name: 'Ana',
      email: 'ana@mail.com',
      role: USER_ROLE.ADMINISTRATOR,
    })
  })

  test('a session whose account vanished is 401 AUTHENTICATION_REQUIRED', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ actor: ACTOR })

    assert.deepInclude(result.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
  })

  test('a failing read is 500 ACCOUNT_PROFILE_SHOW_ERROR', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    users.findById = async () => {
      throw new Error('database down')
    }

    const result = await useCase.execute({ actor: ACTOR })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'ACCOUNT_PROFILE_SHOW_ERROR',
    })
  })
})
