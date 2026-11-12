import { test } from '@japa/runner'

import { Contact } from './contact.entity.ts'

const BORN = new Date('2026-11-01T10:00:00Z')
const ANSWERED = new Date('2026-11-02T09:30:00Z')

function pending(): Contact {
  return Contact.create({
    id: '8a7b6c5d-4e3f-4a2b-9c1d-0e9f8a7b6c5d',
    name: 'Ana Souza',
    email: 'ana@exemplo.com',
    message: 'Quero conversar sobre um projeto.',
    locale: 'pt-BR',
    now: BORN,
  })
}

test.group('Contact', () => {
  test('is born pending, with the creation instant', ({ assert }) => {
    const contact = pending()

    assert.deepInclude(contact.snapshot(), {
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      locale: 'pt-BR',
      answeredAt: null,
      createdAt: BORN,
    })
  })

  test('answering a pending contact stamps the instant it was given', ({
    assert,
  }) => {
    const contact = pending()

    const result = contact.answer(ANSWERED)

    assert.isTrue(result.isRight())
    assert.equal(contact.snapshot().answeredAt, ANSWERED)
  })

  test('answering twice is CONTACT_ALREADY_ANSWERED and keeps the first instant', ({
    assert,
  }) => {
    const contact = pending()
    contact.answer(ANSWERED)

    const result = contact.answer(new Date('2026-11-03T08:00:00Z'))

    assert.deepEqual(result.value, { code: 'CONTACT_ALREADY_ANSWERED' })
    assert.equal(contact.snapshot().answeredAt, ANSWERED)
  })

  test('a restored contact keeps its answered state', ({ assert }) => {
    const answered = Contact.restore({
      ...pending().snapshot(),
      answeredAt: ANSWERED,
    })

    assert.deepEqual(answered.answer(BORN).value, {
      code: 'CONTACT_ALREADY_ANSWERED',
    })
  })
})
