import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

import AuthenticationSessionSignInUseCase from './sign-in.use-case.ts'

import { User } from '#domain/user/user.entity'
import { SessionRepository } from '#repositories/session/session.repository'
import { UserRepository } from '#repositories/user/user.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import {
  identityDoubles,
  PASSWORD,
  seedUser,
  USER_ID,
} from '#tests/identity-unit-fixtures'

async function setup() {
  const doubles = identityDoubles()
  const useCase = await makeWithMemory(AuthenticationSessionSignInUseCase, [
    [UserRepository, doubles.users],
    [SessionRepository, doubles.sessions],
  ])

  return { ...doubles, useCase }
}

/** Seeds the account and serves it with the password hashed by scrypt, as before #314. */
async function setupWithScrypt() {
  const context = await setup()
  const seeded = await seedUser(context.users)
  const legacyHash = await hash.use('scrypt').make(PASSWORD)
  const legacy = User.restore({ ...seeded.snapshot(), password: legacyHash })
  context.users.findByEmail = async () => legacy

  const rehashed: Array<readonly [string, string, string]> = []
  context.users.rehashPassword = async (id, stored, password) => {
    rehashed.push([id, stored, password])
    return true
  }

  return { ...context, legacyHash, rehashed }
}

test.group('authentication/sessions > sign-in (unit)', (group) => {
  insideHttpContext(group)

  test('when the credential is correct, issues the token pair', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)

    const tokens = rightOf(
      await useCase.execute({ login: 'ana@mail.com', password: PASSWORD }),
    )

    assert.isString(tokens.accessToken)
    assert.deepEqual(sessions.issued, [USER_ID])
  })

  test('when the login is a phone, with or without mask, issues the token pair', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users, { email: null, phone: '+5597991234567' })

    for (const login of ['(97) 99123-4567', '+5597991234567', '97991234567']) {
      rightOf(await useCase.execute({ login, password: PASSWORD }))
    }

    assert.deepEqual(sessions.issued, [USER_ID, USER_ID, USER_ID])
  })

  test('when the login is an email in another case, finds the account', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users)

    rightOf(
      await useCase.execute({ login: ' ANA@mail.com ', password: PASSWORD }),
    )

    assert.deepEqual(sessions.issued, [USER_ID])
  })

  test('when the password is wrong, the email is unknown or the account is inactive, gives the same 401', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users, { id: USER_ID, email: 'ana@mail.com' })
    await seedUser(users, {
      id: '3c4d5e6f-7a8b-4c9d-8e1f-2a3b4c5d6e7f',
      email: 'off@mail.com',
      inactive: true,
    })

    await seedUser(users, {
      id: '5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b',
      email: null,
      phone: '+5597991234567',
    })

    const results = [
      await useCase.execute({ login: 'ana@mail.com', password: 'Errada@123' }),
      await useCase.execute({ login: '97991234567', password: 'Errada@123' }),
      await useCase.execute({ login: '97998887766', password: PASSWORD }),
      await useCase.execute({ login: 'ninguem@mail.com', password: PASSWORD }),
      await useCase.execute({ login: 'off@mail.com', password: PASSWORD }),
    ]

    for (const result of results) {
      assert.deepInclude(result.value, {
        status: 401,
        code: 'INVALID_CREDENTIALS',
      })
      assert.deepEqual(result.value, results[0]?.value)
    }
    assert.deepEqual(sessions.issued, [])
  })

  test('when the repository fails, gives 500 AUTHENTICATION_SESSION_SIGN_IN_ERROR and not 401', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    users.findByEmail = async () => {
      throw new Error('database down')
    }

    const result = await useCase.execute({
      login: 'ana@mail.com',
      password: PASSWORD,
    })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'AUTHENTICATION_SESSION_SIGN_IN_ERROR',
    })
  })

  test('when the hash is scrypt, signs in and asks for the conditional rehash', async ({
    assert,
  }) => {
    const { sessions, legacyHash, rehashed, useCase } = await setupWithScrypt()

    rightOf(
      await useCase.execute({ login: 'ana@mail.com', password: PASSWORD }),
    )

    assert.deepEqual(rehashed, [[USER_ID, legacyHash, PASSWORD]])
    assert.deepEqual(sessions.issued, [USER_ID])
  })

  test('when the hash is current, does not redo it', async ({ assert }) => {
    const { users, useCase } = await setup()
    await seedUser(users)
    const rehashed: string[] = []
    users.rehashPassword = async (id) => {
      rehashed.push(id)
      return true
    }

    rightOf(
      await useCase.execute({ login: 'ana@mail.com', password: PASSWORD }),
    )

    assert.deepEqual(rehashed, [])
  })

  test('when the password is wrong on a scrypt hash, gives 401 and redoes nothing', async ({
    assert,
  }) => {
    const { rehashed, useCase } = await setupWithScrypt()

    const result = await useCase.execute({
      login: 'ana@mail.com',
      password: 'Errada@123',
    })

    assert.deepInclude(result.value, {
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })
    assert.deepEqual(rehashed, [])
  })

  test('when the rehash fails, still accepts the right password', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setupWithScrypt()
    users.rehashPassword = async () => {
      throw new Error('database down')
    }

    rightOf(
      await useCase.execute({ login: 'ana@mail.com', password: PASSWORD }),
    )

    assert.deepEqual(sessions.issued, [USER_ID])
  })
})
