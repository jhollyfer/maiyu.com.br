import { test } from '@japa/runner'

import AuthenticationSessionRefreshUseCase from './refresh.use-case.ts'

import { SessionRepository } from '#repositories/session/session.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { MemoryUnitOfWork } from '#repositories/unit-of-work/unit-of-work.memory'
import { UserRepository } from '#repositories/user/user.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import {
  identityDoubles,
  seedUser,
  USER_ID,
} from '#tests/identity-unit-fixtures'

const GRANT = { userId: USER_ID, identifier: '7' }

async function setup() {
  const doubles = identityDoubles()
  doubles.sessions.withRefresh('refresh-ok', GRANT)
  const useCase = await makeWithMemory(AuthenticationSessionRefreshUseCase, [
    [UserRepository, doubles.users],
    [SessionRepository, doubles.sessions],
    [UnitOfWork, new MemoryUnitOfWork()],
  ])

  return { ...doubles, useCase }
}

test.group('authentication/sessions > refresh (unit)', (group) => {
  insideHttpContext(group)

  test('when the refresh is valid, spends it and issues the new pair', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)

    const tokens = rightOf(
      await useCase.execute({ refreshToken: 'refresh-ok' }),
    )

    assert.isString(tokens.refreshToken)
    assert.deepEqual(sessions.issued, [USER_ID])
  })

  test('when a consumed refresh comes back, revokes the whole family and is 401 AUTHENTICATION_REQUIRED', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)
    await sessions.issue(USER_ID)
    const rotated = rightOf(
      await useCase.execute({ refreshToken: 'refresh-ok' }),
    )

    const replay = await useCase.execute({ refreshToken: 'refresh-ok' })

    assert.deepInclude(replay.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
    assert.deepEqual(sessions.revokedAll, [USER_ID])
    assert.equal(sessions.liveRefresh(USER_ID), 0)
    assert.isNull(await sessions.readRefresh(rotated.refreshToken))
  })

  test('a valid refresh rotates without revoking the other sessions', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)
    await sessions.issue(USER_ID)

    rightOf(await useCase.execute({ refreshToken: 'refresh-ok' }))

    assert.deepEqual(sessions.revokedAll, [])
    assert.equal(sessions.liveRefresh(USER_ID), 2)
  })

  test('losing the race to consume is not reuse: is 401 AUTHENTICATION_REQUIRED and keeps the family', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)
    await sessions.issue(USER_ID)
    // A parallel rotation with the same token deleted the row first.
    sessions.consume = async () => false

    const result = await useCase.execute({ refreshToken: 'refresh-ok' })

    assert.deepInclude(result.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
    assert.deepEqual(sessions.revokedAll, [])
    assert.deepEqual(sessions.issued, [USER_ID])
    assert.equal(sessions.liveRefresh(USER_ID), 2)
  })

  test('a rotation committed between the two reads is still caught as reuse', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)
    const readRefresh = sessions.readRefresh.bind(sessions)
    let parallel = ''
    sessions.readRefresh = async (value) => {
      // Another request with the same token rotates and commits before this read.
      sessions.readRefresh = readRefresh
      parallel = rightOf(
        await useCase.execute({ refreshToken: value }),
      ).refreshToken
      return readRefresh(value)
    }

    const result = await useCase.execute({ refreshToken: 'refresh-ok' })

    assert.deepInclude(result.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
    assert.isNull(await sessions.readRefresh(parallel))
  })

  test('an unknown token that was never consumed revokes nothing', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)

    await useCase.execute({ refreshToken: 'never-issued' })

    assert.deepEqual(sessions.revokedAll, [])
    assert.equal(sessions.liveRefresh(USER_ID), 1)
  })

  test('when there is no cookie, is 401 AUTHENTICATION_REQUIRED', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({})

    assert.deepInclude(result.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
  })

  test('when the token is unreadable or unknown, is 401 AUTHENTICATION_REQUIRED', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ refreshToken: 'lixo' })

    assert.deepInclude(result.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
  })

  test('when the account is inactive or deleted, does not refresh', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    const user = await seedUser(users, { inactive: true })

    const inactive = await useCase.execute({ refreshToken: 'refresh-ok' })
    await users.delete(user)
    const gone = await useCase.execute({ refreshToken: 'refresh-ok' })

    assert.deepInclude(inactive.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
    assert.deepInclude(gone.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
    assert.deepEqual(sessions.issued, [])
  })

  test('when the repository fails, is 500 AUTHENTICATION_SESSION_REFRESH_ERROR', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    users.findById = async () => {
      throw new Error('database down')
    }

    const result = await useCase.execute({ refreshToken: 'refresh-ok' })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'AUTHENTICATION_SESSION_REFRESH_ERROR',
    })
  })
})
