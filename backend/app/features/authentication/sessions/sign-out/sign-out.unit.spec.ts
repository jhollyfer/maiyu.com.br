import { test } from '@japa/runner'

import AuthenticationSessionSignOutUseCase from './sign-out.use-case.ts'

import { SessionRepository } from '#repositories/session/session.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import { identityDoubles, USER_ID } from '#tests/identity-unit-fixtures'

const ACTOR = {
  id: USER_ID,
  email: 'ana@mail.com',
  role: 'ADMINISTRATOR',
  avatarId: null,
} as const

async function setup() {
  const doubles = identityDoubles()
  doubles.sessions.withRefresh('refresh-ok', {
    userId: USER_ID,
    identifier: '8',
  })
  doubles.sessions.withRefresh('access-id', {
    userId: USER_ID,
    identifier: '7',
  })
  const useCase = await makeWithMemory(AuthenticationSessionSignOutUseCase, [
    [SessionRepository, doubles.sessions],
  ])

  return { ...doubles, useCase }
}

test.group('authentication/sessions > sign-out (unit)', (group) => {
  insideHttpContext(group)

  test('when both tokens come, deletes the account access and refresh tokens', async ({
    assert,
  }) => {
    const { sessions, useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      accessTokenId: '7',
      refreshToken: 'refresh-ok',
    })

    assert.isTrue(result.isRight())
    // Already deleted: deleting again finds no row.
    assert.isFalse(await sessions.revoke(USER_ID, '7'))
    assert.isFalse(await sessions.revoke(USER_ID, '8'))
  })

  test('when the refresh is unreadable, still signs out', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      accessTokenId: '7',
      refreshToken: 'lixo',
    })

    assert.isTrue(result.isRight())
  })

  test('when no token comes, still signs out', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ actor: ACTOR })

    assert.isTrue(result.isRight())
  })

  test('when the session store fails, is 500 AUTHENTICATION_SESSION_SIGN_OUT_ERROR', async ({
    assert,
  }) => {
    const { sessions, useCase } = await setup()
    sessions.revoke = async () => {
      throw new Error('database down')
    }

    const result = await useCase.execute({ actor: ACTOR, accessTokenId: '7' })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'AUTHENTICATION_SESSION_SIGN_OUT_ERROR',
    })
  })
})
