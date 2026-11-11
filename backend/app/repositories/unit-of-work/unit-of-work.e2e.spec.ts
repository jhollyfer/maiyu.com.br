import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import { left, right } from '@maiyu/shared'

import { LucidUnitOfWork } from './unit-of-work.lucid.ts'

import { TransactionContext } from '#core/transaction-context'
import { resetDatabase } from '#tests/http-fixtures'

/**
 * A write inside the unit, through the client the repositories use. `rate_limits` because it is
 * a table the kit itself creates, with no foreign key to fill.
 */
async function insertRow(
  context: TransactionContext,
  key: string,
): Promise<void> {
  await context
    .client()
    .insertQuery()
    .table('rate_limits')
    .insert({ key, points: 1 })
}

test.group('LucidUnitOfWork', (group) => {
  group.each.setup(() => resetDatabase())

  test('right commits the write', async ({ assert }) => {
    const unit = await app.container.make(LucidUnitOfWork)
    const context = await app.container.make(TransactionContext)

    const result = await unit.run(async () => {
      await insertRow(context, 'Xadrez')
      return right(true)
    })

    assert.isTrue(result.isRight())
    assert.lengthOf(await db.from('rate_limits').where('key', 'Xadrez'), 1)
  })

  test('left undoes the write without throw', async ({ assert }) => {
    const unit = await app.container.make(LucidUnitOfWork)
    const context = await app.container.make(TransactionContext)

    const result = await unit.run(async () => {
      await insertRow(context, 'Damas')
      return left('RECUSADO')
    })

    assert.isTrue(result.isLeft())
    assert.lengthOf(await db.from('rate_limits').where('key', 'Damas'), 0)
  })

  test('an exception undoes the write and rises', async ({ assert }) => {
    const unit = await app.container.make(LucidUnitOfWork)
    const context = await app.container.make(TransactionContext)

    await assert.rejects(() =>
      unit.run(async () => {
        await insertRow(context, 'Dominó')
        throw new Error('bug')
      }),
    )
    assert.lengthOf(await db.from('rate_limits').where('key', 'Dominó'), 0)
  })
})
