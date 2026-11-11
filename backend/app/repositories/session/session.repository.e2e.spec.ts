import { randomUUID } from 'node:crypto'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { SessionLucidRepository } from './session.lucid.repository.ts'
import { SessionMemoryRepository } from './session.memory.repository.ts'
import type { SessionRepository } from './session.repository.ts'

import { UserFactory } from '#database/factories/user.factory'
import { resetDatabase } from '#tests/http-fixtures'

type Pair = { readonly sessions: SessionRepository; readonly userId: string }

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: async (): Promise<Pair> => {
    const user = await UserFactory.create()

    return {
      sessions: await app.container.make(SessionLucidRepository),
      userId: user.id,
    }
  },
  memory: async (): Promise<Pair> => ({
    sessions: await app.container.make(SessionMemoryRepository),
    userId: randomUUID(),
  }),
} satisfies Record<string, () => Promise<Pair>>

for (const [name, make] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`SessionRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('the issued refresh token is read back with its owner', async ({
      assert,
    }) => {
      const { sessions, userId } = await make()

      const issued = await sessions.issue(userId)
      const refreshToken = issued?.refreshToken ?? ''
      const grant = await sessions.readRefresh(refreshToken)

      assert.equal(grant?.userId, userId)
    })

    test('an unreadable or nonexistent token is null', async ({ assert }) => {
      const { sessions } = await make()

      assert.isNull(await sessions.readRefresh('lixo'))
    })

    test('revoke deletes the token once; the second returns false', async ({
      assert,
    }) => {
      const { sessions, userId } = await make()
      const issued = await sessions.issue(userId)
      const refreshToken = issued?.refreshToken ?? ''
      const grant = await sessions.readRefresh(refreshToken)

      assert.isTrue(await sessions.revoke(userId, grant?.identifier ?? ''))
      assert.isFalse(await sessions.revoke(userId, grant?.identifier ?? ''))
      assert.isNull(await sessions.readRefresh(refreshToken))
    })

    test('consume deletes the refresh once and leaves the reuse mark', async ({
      assert,
    }) => {
      const { sessions, userId } = await make()
      const issued = await sessions.issue(userId)
      const refreshToken = issued?.refreshToken ?? ''
      const grant = await sessions.readRefresh(refreshToken)
      if (!grant) throw new Error('issued refresh token not read back')

      assert.isNull(await sessions.findReused(refreshToken))
      assert.isTrue(await sessions.consume(grant))
      assert.isFalse(await sessions.consume(grant))
      assert.isNull(await sessions.readRefresh(refreshToken))
      assert.equal(await sessions.findReused(refreshToken), userId)
    })

    test("revokeAll drops all the account's sessions and only its own", async ({
      assert,
    }) => {
      const { sessions, userId } = await make()
      const stranger = await UserFactory.create()
      const mine = await sessions.issue(userId)
      const theirs = await sessions.issue(stranger.id)

      await sessions.revokeAll(userId)

      assert.isNull(await sessions.readRefresh(mine?.refreshToken ?? ''))
      assert.isNotNull(await sessions.readRefresh(theirs?.refreshToken ?? ''))
    })
  })
}
