import { randomUUID } from 'node:crypto'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { ACTIVE_STATUS, left, USER_ROLE } from '@maiyu/shared'

import { UserLucidRepository } from './user.lucid.repository.ts'
import type { UserRepository } from './user.repository.ts'

import LegacyAwareHashDriver from '#core/legacy-aware-hash-driver'
import { UNIQUE_CONFLICT } from '#core/unique-conflict'
import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import { User } from '#domain/user/user.entity'
import { SessionLucidRepository } from '#repositories/session/session.lucid.repository'
import type { SessionRepository } from '#repositories/session/session.repository'
import type { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { LucidUnitOfWork } from '#repositories/unit-of-work/unit-of-work.lucid'
import { MemoryUnitOfWork } from '#repositories/unit-of-work/unit-of-work.memory'
import { resetDatabase } from '#tests/http-fixtures'
import { identityDoubles } from '#tests/identity-unit-fixtures'

type Pair = {
  readonly users: UserRepository
  readonly sessions: SessionRepository
  readonly unitOfWork: UnitOfWork
  /** A saved account that can sign in with `FACTORY_PASSWORD`. */
  readonly seed: () => Promise<User>
}

const NOW = new Date('2026-11-11T09:00:00Z')

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: async (): Promise<Pair> => {
    const users = await app.container.make(UserLucidRepository)

    return {
      users,
      sessions: await app.container.make(SessionLucidRepository),
      unitOfWork: await app.container.make(LucidUnitOfWork),
      seed: async () => {
        const row = await UserFactory.create()
        const user = await users.findById(row.id)
        if (!user) throw new Error('seeded account not read back')

        return user
      },
    }
  },
  memory: async (): Promise<Pair> => {
    const { users, sessions } = identityDoubles()

    return {
      users,
      sessions,
      unitOfWork: await app.container.make(MemoryUnitOfWork),
      seed: async () => {
        const user = User.create({
          id: randomUUID(),
          name: 'Ana',
          email: `${randomUUID()}@exemplo.com`,
          password: FACTORY_PASSWORD,
          role: USER_ROLE.MEMBER,
          status: ACTIVE_STATUS.ACTIVE,
          now: NOW,
        })
        await users.save(user)

        return user
      },
    }
  },
} satisfies Record<string, () => Promise<Pair>>

/** Whether the password in the store is the one given: the hash is read back, never compared as text. */
async function passwordHolds(
  users: UserRepository,
  id: string,
  password: string,
): Promise<boolean> {
  const stored = await users.findById(id)
  if (!stored) return false

  return LegacyAwareHashDriver.hasher().verify(
    stored.snapshot().password,
    password,
  )
}

for (const [name, make] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`UserRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('save with a new password revokes the sessions in the same transaction', async ({
      assert,
    }) => {
      const { users, sessions, unitOfWork, seed } = await make()
      const user = await seed()
      const issued = await sessions.issue(user.id)
      const refreshToken = issued?.refreshToken ?? ''
      assert.isNotNull(await sessions.readRefresh(refreshToken))
      user.update({ password: 'Nova@1234' }, NOW)

      const saved = await unitOfWork.run(() => users.save(user))

      assert.isTrue(saved.isRight())
      assert.isNull(await sessions.readRefresh(refreshToken))
      assert.isTrue(await passwordHolds(users, user.id, 'Nova@1234'))
      assert.isFalse(await passwordHolds(users, user.id, FACTORY_PASSWORD))
    })

    test('save with a new email revokes the sessions and writes the email', async ({
      assert,
    }) => {
      const { users, sessions, unitOfWork, seed } = await make()
      const user = await seed()
      const issued = await sessions.issue(user.id)
      user.update({ email: 'novo@exemplo.com' }, NOW)

      await unitOfWork.run(() => users.save(user))

      assert.isNull(await sessions.readRefresh(issued?.refreshToken ?? ''))
      assert.equal(
        (await users.findById(user.id))?.snapshot().email,
        'novo@exemplo.com',
      )
    })

    test('save without a credential change keeps the sessions', async ({
      assert,
    }) => {
      const { users, sessions, unitOfWork, seed } = await make()
      const user = await seed()
      const issued = await sessions.issue(user.id)
      user.update({ email: user.snapshot().email }, NOW)

      await unitOfWork.run(() => users.save(user))

      assert.isNotNull(await sessions.readRefresh(issued?.refreshToken ?? ''))
      assert.isTrue(await passwordHolds(users, user.id, FACTORY_PASSWORD))
    })

    test('a failed save keeps the password and the sessions', async ({
      assert,
    }) => {
      const { users, sessions, unitOfWork, seed } = await make()
      const user = await seed()
      const other = await seed()
      const issued = await sessions.issue(user.id)
      user.update({ email: other.snapshot().email, password: 'Nova@1234' }, NOW)

      const saved = await unitOfWork.run(() => users.save(user))

      assert.deepEqual(saved.value, UNIQUE_CONFLICT)
      assert.isNotNull(await sessions.readRefresh(issued?.refreshToken ?? ''))
      assert.isTrue(await passwordHolds(users, user.id, FACTORY_PASSWORD))
      assert.isFalse(await passwordHolds(users, user.id, 'Nova@1234'))
      assert.notEqual(
        (await users.findById(user.id))?.snapshot().email,
        other.snapshot().email,
      )
    })

    test("save revokes only the account's own sessions", async ({ assert }) => {
      const { users, sessions, unitOfWork, seed } = await make()
      const user = await seed()
      const stranger = await seed()
      const mine = await sessions.issue(user.id)
      const theirs = await sessions.issue(stranger.id)
      user.update({ password: 'Nova@1234' }, NOW)

      await unitOfWork.run(() => users.save(user))

      assert.isNull(await sessions.readRefresh(mine?.refreshToken ?? ''))
      assert.isNotNull(await sessions.readRefresh(theirs?.refreshToken ?? ''))
    })
  })
}

test.group('UserRepository (lucid) > transaction', (group) => {
  group.each.setup(() => resetDatabase())

  test('a unit of work that ends in left undoes the save and the revocation together', async ({
    assert,
  }) => {
    const { users, sessions, unitOfWork, seed } = await IMPLEMENTATIONS.lucid()
    const user = await seed()
    const issued = await sessions.issue(user.id)
    user.update({ password: 'Nova@1234' }, NOW)

    await unitOfWork.run(async () => {
      await users.save(user)

      return left('undo')
    })

    assert.isNotNull(await sessions.readRefresh(issued?.refreshToken ?? ''))
    assert.isTrue(await passwordHolds(users, user.id, FACTORY_PASSWORD))
  })
})
