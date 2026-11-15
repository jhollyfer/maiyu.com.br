import { randomUUID } from 'node:crypto'

import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import { UNIQUE_CONFLICT } from '#core/unique-conflict'
import LucidMapping, { UNIQUE_TARGET } from '#repositories/shared/lucid-mapping'
import { PROJECT_UNIQUE_TARGET } from '#repositories/shared/unique-targets'
import { resetDatabase } from '#tests/http-fixtures'

const EMAIL_TARGET = UNIQUE_TARGET.USER_EMAIL

function userRow(email: string): Record<string, unknown> {
  return {
    id: randomUUID(),
    name: 'Ana',
    email,
    password: 'not-a-real-hash',
    platform_role: 'USER',
    status: 'ACTIVE',
    created_at: new Date(),
  }
}

async function anaCount(): Promise<number> {
  const { rows } = await db.rawQuery<{ rows: { total: string }[] }>(
    'select count(*) as total from users where lower(email) = ?',
    ['ana@maiyu.com.br'],
  )
  return Number(rows[0]?.total ?? 0)
}

/**
 * The insert of a table that holds personal data (DECISIONS.md #408): the unique violation is a
 * result, not an error, so the value never reaches the `DETAIL` of the Postgres log.
 */
test.group('lucid mapping > insertUnlessUnique', (group) => {
  group.each.setup(() => resetDatabase())

  test('when the value is free, it inserts and answers right', async ({
    assert,
  }) => {
    const result = await LucidMapping.insertUnlessUnique(
      db.connection(),
      'users',
      userRow('ana@maiyu.com.br'),
      EMAIL_TARGET,
    )

    assert.isTrue(result.isRight())
    assert.equal(await anaCount(), 1)
  })

  test('when the value is taken, even in other capitals, answers the unique fact and does not throw', async ({
    assert,
  }) => {
    await LucidMapping.insertUnlessUnique(
      db.connection(),
      'users',
      userRow('ana@maiyu.com.br'),
      EMAIL_TARGET,
    )

    for (const email of ['ana@maiyu.com.br', 'ANA@maiyu.com.br']) {
      const result = await LucidMapping.insertUnlessUnique(
        db.connection(),
        'users',
        userRow(email),
        EMAIL_TARGET,
      )

      assert.deepEqual(result.value, UNIQUE_CONFLICT)
    }
    assert.equal(await anaCount(), 1)
  })

  test('when the failure is not a unique one, it goes up', async ({
    assert,
  }) => {
    const row = { ...userRow('b@maiyu.com.br'), platform_role: 'NOBODY' }

    await assert.rejects(() =>
      LucidMapping.insertUnlessUnique(
        db.connection(),
        'users',
        row,
        EMAIL_TARGET,
      ),
    )
  })

  test('a primary-key clash is not "the value is taken": it goes up', async ({
    assert,
  }) => {
    const first = userRow('ana@maiyu.com.br')
    await LucidMapping.insertUnlessUnique(
      db.connection(),
      'users',
      first,
      EMAIL_TARGET,
    )
    const sameId = { ...userRow('bia@maiyu.com.br'), id: first['id'] }

    await assert.rejects(() =>
      LucidMapping.insertUnlessUnique(
        db.connection(),
        'users',
        sameId,
        EMAIL_TARGET,
      ),
    )
  })
})

/**
 * The update side (DECISIONS.md #435): the lookup before an `update` is serialized per value by a
 * transaction-scoped advisory lock, so two concurrent updates to the same value cannot both find
 * it free.
 */
test.group('lucid mapping > findUnderUniqueLock', () => {
  const pause = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  test("the target list is the kit's plus the project's, nothing typed by hand", ({
    assert,
  }) => {
    const targets: ReadonlyArray<string> = Object.values(UNIQUE_TARGET)

    assert.include(targets, '(lower(email))')
    const own: ReadonlyArray<string> = Object.values<string>(
      PROJECT_UNIQUE_TARGET,
    )

    for (const target of own) assert.include(targets, target)
  })

  test('when another transaction holds the same value, the lookup waits for it to end', async ({
    assert,
  }) => {
    const first = await db.transaction()
    const second = await db.transaction()
    let ran = false

    try {
      await LucidMapping.findUnderUniqueLock(
        first,
        EMAIL_TARGET,
        'ana@maiyu.com.br',
        () => Promise.resolve(null),
      )
      const waiting = LucidMapping.findUnderUniqueLock(
        second,
        EMAIL_TARGET,
        'ana@maiyu.com.br',
        () => {
          ran = true
          return Promise.resolve(null)
        },
      )

      await pause(300)
      assert.isFalse(ran, "the second lookup ran under the first one's lock")

      await first.commit()
      await waiting
      assert.isTrue(ran)
    } finally {
      if (!first.isCompleted) await first.rollback()
    }
    await second.commit()
  })

  test('another value does not wait', async ({ assert }) => {
    const first = await db.transaction()
    const second = await db.transaction()

    await LucidMapping.findUnderUniqueLock(
      first,
      EMAIL_TARGET,
      'ana@maiyu.com.br',
      () => Promise.resolve(null),
    )
    const other = await LucidMapping.findUnderUniqueLock(
      second,
      EMAIL_TARGET,
      'bia@maiyu.com.br',
      () => Promise.resolve('free'),
    )

    assert.equal(other, 'free')
    await first.commit()
    await second.commit()
  })
})
