import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import { left, USER_ROLE, type Actor } from '@maiyu/shared'

import AccountProfileUpdateUseCase from './update.use-case.ts'

import RepositoryFailure from '#core/repository-failure'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { MemoryUnitOfWork } from '#repositories/unit-of-work/unit-of-work.memory'
import { UserRepository } from '#repositories/user/user.repository'
import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import {
  identityDoubles,
  PASSWORD,
  seedUser,
  USER_ID,
} from '#tests/identity-unit-fixtures'

const NOW = DateTime.fromISO('2026-11-11T09:00:00Z', { zone: 'utc' })
const NEW_PASSWORD = 'Nova@1234'
const OTHER_ID = '9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f'

const ACTOR: Actor = {
  id: USER_ID,
  email: 'ana@mail.com',
  role: USER_ROLE.ADMINISTRATOR,
  avatarId: null,
}

async function setup() {
  const doubles = identityDoubles()
  const useCase = await makeWithMemory(AccountProfileUpdateUseCase, [
    [UserRepository, doubles.users],
    [UnitOfWork, new MemoryUnitOfWork()],
    [ClockContract, new ClockFake(NOW)],
  ])
  await seedUser(doubles.users)

  return { ...doubles, useCase }
}

test.group('account/profile > update (unit)', (group) => {
  insideHttpContext(group)

  test('a new password with the right current one is saved hashed, revokes the sessions and returns the profile', async ({
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

    assert.deepEqual(result.profile, {
      id: USER_ID,
      name: 'Ana',
      email: 'ana@mail.com',
      role: USER_ROLE.ADMINISTRATOR,
    })
    assert.isTrue(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [USER_ID])
    const stored = (await users.findById(USER_ID))?.snapshot()
    assert.notEqual(stored?.password, NEW_PASSWORD)
    assert.equal(stored?.updatedAt?.toISOString(), NOW.toJSDate().toISOString())
  })

  test('a new email with the right current password is saved and revokes the sessions', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        email: 'nova@mail.com',
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.email, 'nova@mail.com')
    assert.isTrue(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [USER_ID])
    assert.equal((await users.findByEmail('nova@mail.com'))?.id, USER_ID)
  })

  test('the same email answers the profile and keeps the sessions', async ({
    assert,
  }) => {
    const { sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        email: 'ana@mail.com',
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.email, 'ana@mail.com')
    assert.isFalse(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [])
  })

  test('a wrong current password is 422 on currentPassword and changes nothing', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    const before = (await users.findById(USER_ID))?.snapshot().password

    const result = await useCase.execute({
      actor: ACTOR,
      password: NEW_PASSWORD,
      currentPassword: 'Errada@123',
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'CURRENT_PASSWORD_INVALID',
    })
    if (result.isRight()) throw new Error('expected a refusal')
    assert.deepEqual(Object.keys(result.value.errors ?? {}), [
      'currentPassword',
    ])
    assert.equal((await users.findById(USER_ID))?.snapshot().password, before)
    assert.deepEqual(sessions.revokedAll, [])
  })

  test('a missing current password is refused the same way', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      email: 'nova@mail.com',
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'CURRENT_PASSWORD_INVALID',
    })
  })

  test('an email that belongs to another account is 409 EMAIL_IN_USE and changes nothing', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users, { id: OTHER_ID, email: 'outra@mail.com' })

    const result = await useCase.execute({
      actor: ACTOR,
      email: 'outra@mail.com',
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, { status: 409, code: 'EMAIL_IN_USE' })
    if (result.isRight()) throw new Error('expected a refusal')
    assert.deepEqual(Object.keys(result.value.errors ?? {}), ['email'])
    assert.equal(
      (await users.findById(USER_ID))?.snapshot().email,
      'ana@mail.com',
    )
    assert.deepEqual(sessions.revokedAll, [])
  })

  test('a failing database on save is 500 ACCOUNT_PROFILE_UPDATE_ERROR', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    users.save = async () => left(RepositoryFailure.of(new Error('down')))

    const result = await useCase.execute({
      actor: ACTOR,
      password: NEW_PASSWORD,
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'ACCOUNT_PROFILE_UPDATE_ERROR',
    })
  })

  test('an unexpected throw is 500 ACCOUNT_PROFILE_UPDATE_ERROR', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    users.findById = async () => {
      throw new Error('down')
    }

    const result = await useCase.execute({
      actor: ACTOR,
      password: NEW_PASSWORD,
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'ACCOUNT_PROFILE_UPDATE_ERROR',
    })
  })

  test('a session whose account vanished is 401 AUTHENTICATION_REQUIRED', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    const gone = await users.findById(USER_ID)
    if (gone) await users.delete(gone)

    const result = await useCase.execute({
      actor: ACTOR,
      password: NEW_PASSWORD,
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, {
      status: 401,
      code: 'AUTHENTICATION_REQUIRED',
    })
  })
})
