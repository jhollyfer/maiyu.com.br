import { test } from '@japa/runner'

import AdministratorContactShowUseCase from './show.use-case.ts'

import { ContactRepository } from '#repositories/contact/contact.repository'
import {
  CONTACT_ID,
  contactDoubles,
  pendingContact,
} from '#tests/contacts-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

async function setup() {
  const { contacts } = contactDoubles()
  const useCase = await makeWithMemory(AdministratorContactShowUseCase, [
    [ContactRepository, contacts],
  ])

  return { contacts, useCase }
}

test.group('administrator/contacts > show (unit)', (group) => {
  insideHttpContext(group)

  test('returns the whole contact', async ({ assert }) => {
    const { contacts, useCase } = await setup()
    await contacts.create(pendingContact())

    const contact = rightOf(await useCase.execute({ id: CONTACT_ID }))

    assert.deepEqual(contact, {
      id: CONTACT_ID,
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      message: 'Quero conversar sobre um projeto.',
      locale: 'pt-BR',
      answeredAt: null,
      createdAt: '2026-11-01T10:00:00.000Z',
      updatedAt: '2026-11-01T10:00:00.000Z',
    })
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
