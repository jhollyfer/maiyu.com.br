import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { EmailChangeLucidRepository } from './email-change.lucid.repository.ts'
import { EmailChangeMemoryRepository } from './email-change.memory.repository.ts'
import type { EmailChangeRepository } from './email-change.repository.ts'

import { UserFactory } from '#database/factories/user.factory'
import { resetDatabase } from '#tests/http-fixtures'

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): the unit spec of the
 * confirmation runs on the in-memory one, and this is what keeps it from passing against a lying
 * double.
 */
const IMPLEMENTATIONS = {
  lucid: (): Promise<EmailChangeRepository> =>
    app.container.make(EmailChangeLucidRepository),
  memory: (): Promise<EmailChangeRepository> =>
    app.container.make(EmailChangeMemoryRepository),
} satisfies Record<string, () => Promise<EmailChangeRepository>>

const NOW = new Date('2026-11-12T12:00:00Z')
const LATER = new Date('2026-11-12T13:00:00Z')

for (const [name, make] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`EmailChangeRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('the claim of the right token returns the change and spends it', async ({
      assert,
    }) => {
      const changes = await make()
      const user = await UserFactory.create()
      await changes.replace({
        userId: user.id,
        email: 'nova@mail.com',
        tokenHash: 'h'.repeat(64),
        expiresAt: LATER,
      })

      const claimed = await changes.claim(user.id, 'h'.repeat(64), NOW)

      assert.equal(claimed?.email, 'nova@mail.com')
      assert.isNull(await changes.claim(user.id, 'h'.repeat(64), NOW))
    })

    test('another token, another account and an expired one claim nothing, and the row stays', async ({
      assert,
    }) => {
      const changes = await make()
      const user = await UserFactory.create()
      const other = await UserFactory.create()
      await changes.replace({
        userId: user.id,
        email: 'nova@mail.com',
        tokenHash: 'h'.repeat(64),
        expiresAt: LATER,
      })

      assert.isNull(await changes.claim(user.id, 'x'.repeat(64), NOW))
      assert.isNull(await changes.claim(other.id, 'h'.repeat(64), NOW))
      assert.isNull(await changes.claim(user.id, 'h'.repeat(64), LATER))
      assert.equal(
        (await changes.claim(user.id, 'h'.repeat(64), NOW))?.email,
        'nova@mail.com',
      )
    })

    test('a new change replaces the pending one of the account', async ({
      assert,
    }) => {
      const changes = await make()
      const user = await UserFactory.create()
      await changes.replace({
        userId: user.id,
        email: 'um@mail.com',
        tokenHash: '1'.repeat(64),
        expiresAt: LATER,
      })
      await changes.replace({
        userId: user.id,
        email: 'dois@mail.com',
        tokenHash: '2'.repeat(64),
        expiresAt: LATER,
      })

      assert.isNull(await changes.claim(user.id, '1'.repeat(64), NOW))
      assert.equal(
        (await changes.claim(user.id, '2'.repeat(64), NOW))?.email,
        'dois@mail.com',
      )
    })
  })
}
