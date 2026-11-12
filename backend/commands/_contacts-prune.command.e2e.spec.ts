import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import ContactsPrune from '#commands/contacts-prune.command'
import { ContactFactory } from '#database/factories/contact.factory'
import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import { resetDatabase } from '#tests/http-fixtures'
import { Stored } from '#tests/stored-fixtures'

const NOW = DateTime.fromISO('2026-11-05T15:00:00Z', { zone: 'utc' })

/** A contact created `months` before the fixed clock, plus a day of slack for the sides of the cutoff. */
function created(months: number, extraDays = 0) {
  return { createdAt: NOW.minus({ months, days: extraDays }) }
}

async function prune(...args: Array<string>) {
  const ace = await app.container.make('ace')
  const command = await ace.create(ContactsPrune, args)

  await command.exec()

  return command
}

/**
 * The retention sweep (`node ace contacts:prune`): the age is the creation's, the clock is the
 * fixed one, and the cutoff is 12 months before it. An answered contact is not exempt.
 */
test.group('contacts > prune', (group) => {
  group.each.setup(() => resetDatabase())
  group.each.setup(() => {
    app.container.swap(ClockContract, () => new ClockFake(NOW))

    return () => app.container.restore(ClockContract)
  })

  test('deletes contacts older than 12 months', async ({ assert }) => {
    const pending = await ContactFactory.merge(created(13)).create()
    const answered = await ContactFactory.merge({
      ...created(14),
      answeredAt: NOW.minus({ months: 1 }),
    }).create()
    // One day over the 12 months is already old.
    const dayOver = await ContactFactory.merge(created(12, 1)).create()

    const command = await prune()

    command.assertSucceeded()
    assert.isNull(await Stored.contact(pending.id))
    assert.isNull(await Stored.contact(answered.id))
    assert.isNull(await Stored.contact(dayOver.id))
  })

  test('keeps contacts of 12 months or less', async ({ assert }) => {
    const recent = await ContactFactory.merge(created(11)).create()
    const exactly = await ContactFactory.merge(created(12)).create()
    const fresh = await ContactFactory.merge(created(0)).create()

    const command = await prune()

    command.assertSucceeded()
    assert.isNotNull(await Stored.contact(recent.id))
    assert.isNotNull(await Stored.contact(exactly.id))
    assert.isNotNull(await Stored.contact(fresh.id))
  })

  test('dry run counts and deletes nothing', async ({ assert }) => {
    const old = await ContactFactory.merge(created(13)).create()

    const command = await prune('--dry-run')

    command.assertSucceeded()
    assert.isNotNull(await Stored.contact(old.id))
  })

  test('running twice leaves the same state', async ({ assert }) => {
    await ContactFactory.merge(created(13)).create()
    const kept = await ContactFactory.merge(created(2)).create()

    const first = await prune()
    const second = await prune()

    first.assertSucceeded()
    second.assertSucceeded()
    const left = await Stored.contacts()
    assert.deepEqual(
      left.map((row) => row.id),
      [kept.id],
    )
  })
})
