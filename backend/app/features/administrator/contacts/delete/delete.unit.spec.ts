import { test } from '@japa/runner'

import AdministratorContactDeleteUseCase from './delete.use-case.ts'

import { ContactRepository } from '#repositories/contact/contact.repository'
import {
  CONTACT_ID,
  contactDoubles,
  pendingContact,
} from '#tests/contacts-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

async function setup() {
  const { contacts } = contactDoubles()
  const useCase = await makeWithMemory(AdministratorContactDeleteUseCase, [
    [ContactRepository, contacts],
  ])

  return { contacts, useCase }
}

test.group('administrator/contacts > delete (unit)', (group) => {
  insideHttpContext(group)

  test('deletes the contact, answered or not', async ({ assert }) => {
    const { contacts, useCase } = await setup()
    const answered = pendingContact()
    answered.answer(new Date('2026-11-02T09:30:00Z'))
    await contacts.create(answered)

    const result = await useCase.execute({ id: CONTACT_ID })

    assert.isTrue(result.isRight())
    assert.isNull(await contacts.findById(CONTACT_ID))
  })

  test('an unknown id is 404 CONTACT_NOT_FOUND', async ({ assert }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({ id: CONTACT_ID })

    assert.deepInclude(result.value, {
      status: 404,
      code: 'CONTACT_NOT_FOUND',
    })
  })
})
