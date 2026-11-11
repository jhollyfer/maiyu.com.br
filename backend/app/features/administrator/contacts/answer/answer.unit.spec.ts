import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import AdministratorContactAnswerUseCase from './answer.use-case.ts'

import { ContactMemoryRepository } from '#repositories/contact/contact.memory.repository'
import { ContactRepository } from '#repositories/contact/contact.repository'
import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import {
  CONTACT_ID,
  contactDoubles,
  pendingContact,
} from '#tests/contacts-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

const NOW = DateTime.fromISO('2026-11-05T15:00:00Z', { zone: 'utc' })

/** A repository that always loses the claim: the other answer got there first. */
class LostClaimRepository extends ContactMemoryRepository {
  override async claimAnswer(): Promise<boolean> {
    return false
  }
}

async function setup(contacts: ContactMemoryRepository) {
  const useCase = await makeWithMemory(AdministratorContactAnswerUseCase, [
    [ContactRepository, contacts],
    [ClockContract, new ClockFake(NOW)],
  ])

  return useCase
}

test.group('administrator/contacts > answer (unit)', (group) => {
  insideHttpContext(group)

  test('answering a pending contact stamps the clock instant and returns it', async ({
    assert,
  }) => {
    const { contacts } = contactDoubles()
    await contacts.create(pendingContact())
    const useCase = await setup(contacts)

    const contact = rightOf(await useCase.execute({ id: CONTACT_ID }))

    assert.equal(contact.answeredAt, '2026-11-05T15:00:00.000Z')
    const stored = await contacts.findById(CONTACT_ID)
    assert.equal(
      stored?.snapshot().answeredAt?.toISOString(),
      '2026-11-05T15:00:00.000Z',
    )
  })

  test('an already answered contact is 409 and keeps the first instant', async ({
    assert,
  }) => {
    const { contacts } = contactDoubles()
    const answered = pendingContact()
    answered.answer(new Date('2026-11-02T09:30:00Z'))
    await contacts.create(answered)
    const useCase = await setup(contacts)

    const result = await useCase.execute({ id: CONTACT_ID })

    assert.deepInclude(result.value, {
      status: 409,
      code: 'CONTACT_ALREADY_ANSWERED',
    })
    const stored = await contacts.findById(CONTACT_ID)
    assert.equal(
      stored?.snapshot().answeredAt?.toISOString(),
      '2026-11-02T09:30:00.000Z',
    )
  })

  test('losing the claim to a concurrent answer is 409 too', async ({
    assert,
  }) => {
    const contacts = new LostClaimRepository()
    await contacts.create(pendingContact())
    const useCase = await setup(contacts)

    const result = await useCase.execute({ id: CONTACT_ID })

    assert.deepInclude(result.value, {
      status: 409,
      code: 'CONTACT_ALREADY_ANSWERED',
    })
  })

  test('an unknown id is 404 CONTACT_NOT_FOUND', async ({ assert }) => {
    const { contacts } = contactDoubles()
    const useCase = await setup(contacts)

    const result = await useCase.execute({ id: CONTACT_ID })

    assert.deepInclude(result.value, {
      status: 404,
      code: 'CONTACT_NOT_FOUND',
    })
  })
})
