import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import AdministratorContactPruneUseCase from './prune.use-case.ts'

import { ContactRepository } from '#repositories/contact/contact.repository'
import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import { contactDoubles, pendingContact } from '#tests/contacts-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

const NOW = DateTime.fromISO('2026-11-05T15:00:00Z', { zone: 'utc' })
const OLD = '00000000-0000-4000-8000-000000000001'
const EXACT = '00000000-0000-4000-8000-000000000002'
const RECENT = '00000000-0000-4000-8000-000000000003'

async function setup() {
  const { contacts } = contactDoubles()
  await contacts.create(
    pendingContact({ id: OLD, createdAt: new Date('2025-11-05T14:59:59Z') }),
  )
  await contacts.create(
    pendingContact({ id: EXACT, createdAt: new Date('2025-11-05T15:00:00Z') }),
  )
  await contacts.create(
    pendingContact({ id: RECENT, createdAt: new Date('2026-09-01T00:00:00Z') }),
  )
  const useCase = await makeWithMemory(AdministratorContactPruneUseCase, [
    [ContactRepository, contacts],
    [ClockContract, new ClockFake(NOW)],
  ])

  return { contacts, useCase }
}

test.group('administrator/contacts > prune (unit)', (group) => {
  insideHttpContext(group)

  test('deletes what is older than 12 months and keeps the rest, at the exact cutoff too', async ({
    assert,
  }) => {
    const { contacts, useCase } = await setup()

    const result = rightOf(await useCase.execute({ dryRun: false }))

    assert.deepEqual(result, { matched: 1, deleted: 1 })
    assert.isNull(await contacts.findById(OLD))
    assert.isNotNull(await contacts.findById(EXACT))
    assert.isNotNull(await contacts.findById(RECENT))
  })

  test('a dry run counts and deletes nothing', async ({ assert }) => {
    const { contacts, useCase } = await setup()

    const result = rightOf(await useCase.execute({ dryRun: true }))

    assert.deepEqual(result, { matched: 1, deleted: 0 })
    assert.isNotNull(await contacts.findById(OLD))
  })

  test('running twice leaves the same state', async ({ assert }) => {
    const { useCase } = await setup()

    await useCase.execute({ dryRun: false })
    const second = rightOf(await useCase.execute({ dryRun: false }))

    assert.deepEqual(second, { matched: 0, deleted: 0 })
  })
})
