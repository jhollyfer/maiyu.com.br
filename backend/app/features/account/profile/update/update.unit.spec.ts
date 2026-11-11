import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import { left, USER_ROLE, type Actor, type Either } from '@maiyu/shared'

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

const ACTOR: Actor = {
  id: USER_ID,
  email: 'ana@mail.com',
  role: USER_ROLE.ADMINISTRATOR,
  avatarId: null,
}

/**
 * A unit of work that only tells whether its callback is running, so a test can ask a double
 * "were you called inside the unit?" without a database. The memory unit of work cannot: it
 * just calls the callback.
 */
class WatchedUnitOfWork extends UnitOfWork {
  open = false
  runs = 0

  async run<L, R>(work: () => Promise<Either<L, R>>): Promise<Either<L, R>> {
    this.runs += 1
    this.open = true
    try {
      return await work()
    } finally {
      this.open = false
    }
  }
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

  test('a new name with the right current password is saved and keeps the sessions', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        name: 'Ana Souza',
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.name, 'Ana Souza')
    assert.isFalse(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [])
    assert.equal((await users.findById(USER_ID))?.snapshot().name, 'Ana Souza')
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

  test('a new password equal to the current one is 422 PASSWORD_SAME_AS_CURRENT and changes nothing', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    const before = (await users.findById(USER_ID))?.snapshot().password

    const result = await useCase.execute({
      actor: ACTOR,
      password: PASSWORD,
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'PASSWORD_SAME_AS_CURRENT',
    })
    if (result.isRight()) throw new Error('expected a refusal')
    assert.deepEqual(Object.keys(result.value.errors ?? {}), ['password'])
    assert.equal((await users.findById(USER_ID))?.snapshot().password, before)
    assert.deepEqual(sessions.revokedAll, [])
  })

  test('a wrong current password on a name change is refused and the name stays', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      name: 'Ana Souza',
      currentPassword: 'Errada@123',
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'CURRENT_PASSWORD_INVALID',
    })
    assert.equal((await users.findById(USER_ID))?.snapshot().name, 'Ana')
  })

  test('a missing current password is refused the same way', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      name: 'Ana Souza',
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'CURRENT_PASSWORD_INVALID',
    })
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

  test('the save runs inside the unit of work, and only once', async ({
    assert,
  }) => {
    const doubles = identityDoubles()
    const unitOfWork = new WatchedUnitOfWork()
    const useCase = await makeWithMemory(AccountProfileUpdateUseCase, [
      [UserRepository, doubles.users],
      [UnitOfWork, unitOfWork],
      [ClockContract, new ClockFake(NOW)],
    ])
    await seedUser(doubles.users)
    const insideWhenSaved: boolean[] = []
    const save = doubles.users.save.bind(doubles.users)
    doubles.users.save = async (user) => {
      insideWhenSaved.push(unitOfWork.open)

      return save(user)
    }

    rightOf(
      await useCase.execute({
        actor: ACTOR,
        password: NEW_PASSWORD,
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(unitOfWork.runs, 1)
    assert.deepEqual(insideWhenSaved, [true])
  })
})
