import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

import { PLATFORM_ROLE, type Actor } from '@maiyu/shared'

import AccountProfileUpdateUseCase from './update.use-case.ts'

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

const ACTOR: Actor = {
  id: USER_ID,
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  tenant: null,
  avatarId: null,
}

const NEW_PASSWORD = 'Nova@12345'

async function setup() {
  const doubles = identityDoubles()
  const useCase = await makeWithMemory(AccountProfileUpdateUseCase, [
    [UserRepository, doubles.users],
    [SessionRepository, doubles.sessions],
  ])
  await seedUser(doubles.users)

  return { ...doubles, useCase }
}

test.group('account/profile > update (unit)', (group) => {
  insideHttpContext(group)

  test('a new name keeps the sessions and the password', async ({ assert }) => {
    const { users, sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        name: 'Ana Maria',
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.name, 'Ana Maria')
    assert.isFalse(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [])
    const stored = await users.findById(USER_ID)
    assert.isTrue(
      await hash.verify(stored?.snapshot().password ?? '', PASSWORD),
    )
  })

  test('a new password is hashed and ends every session of the account', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        password: NEW_PASSWORD,
        currentPassword: PASSWORD,
      }),
    )

    assert.isTrue(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [USER_ID])
    const stored = await users.findById(USER_ID)
    assert.isTrue(
      await hash.verify(stored?.snapshot().password ?? '', NEW_PASSWORD),
    )
  })

  test('a wrong current password is 422 on currentPassword and changes nothing', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      name: 'Outro',
      currentPassword: 'Errada@123',
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'CURRENT_PASSWORD_INVALID',
    })
    assert.equal((await users.findById(USER_ID))?.snapshot().name, 'Ana')
  })

  test('the new password equal to the current one is 422 PASSWORD_SAME_AS_CURRENT', async ({
    assert,
  }) => {
    const { sessions, useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      password: PASSWORD,
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'PASSWORD_SAME_AS_CURRENT',
    })
    assert.deepEqual(sessions.revokedAll, [])
  })

  test('a new phone is saved and ends every session of the account', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        phone: '+5597991234567',
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.phone, '+5597991234567')
    assert.isTrue(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [USER_ID])
    assert.equal(
      (await users.findById(USER_ID))?.snapshot().phone,
      '+5597991234567',
    )
  })

  test('the phone the account already has is not a change: the sessions stay', async ({
    assert,
  }) => {
    const doubles = identityDoubles()
    const useCase = await makeWithMemory(AccountProfileUpdateUseCase, [
      [UserRepository, doubles.users],
      [SessionRepository, doubles.sessions],
    ])
    await seedUser(doubles.users, { phone: '+5597991234567' })

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        phone: '+5597991234567',
        currentPassword: PASSWORD,
      }),
    )

    assert.isFalse(result.sessionsRevoked)
    assert.deepEqual(doubles.sessions.revokedAll, [])
  })

  test('a phone another account holds is 422 PHONE_TAKEN on phone and changes nothing', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users, {
      id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      email: 'bia@mail.com',
      phone: '+5597998887766',
    })

    const result = await useCase.execute({
      actor: ACTOR,
      phone: '+5597998887766',
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, { status: 422, code: 'PHONE_TAKEN' })
    assert.deepInclude(result.value, {
      errors: { phone: 'Este celular já está em uso por outra conta' },
    })
    assert.deepEqual(sessions.revokedAll, [])
    assert.isNull((await users.findById(USER_ID))?.snapshot().phone)
  })

  test('an account that vanished after the guard is 401', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      actor: { ...ACTOR, id: 'ffffffff-ffff-4fff-8fff-ffffffffffff' },
      name: 'Ana',
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, { status: 401 })
  })
})
