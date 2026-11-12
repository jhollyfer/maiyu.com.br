import { test } from '@japa/runner'

import AdministratorContactPaginateUseCase from './paginate.use-case.ts'

import { ContactRepository } from '#repositories/contact/contact.repository'
import { contactDoubles, pendingContact } from '#tests/contacts-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

async function setup() {
  const { contacts } = contactDoubles()
  const useCase = await makeWithMemory(AdministratorContactPaginateUseCase, [
    [ContactRepository, contacts],
  ])

  return { contacts, useCase }
}

test.group('administrator/contacts > paginate (unit)', (group) => {
  insideHttpContext(group)

  test('with no parameters, answers page 1 of 20, newest first', async ({
    assert,
  }) => {
    const { contacts, useCase } = await setup()
    await contacts.create(
      pendingContact({
        id: '00000000-0000-4000-8000-000000000001',
        createdAt: new Date('2026-11-01T00:00:00Z'),
      }),
    )
    await contacts.create(
      pendingContact({
        id: '00000000-0000-4000-8000-000000000002',
        createdAt: new Date('2026-11-02T00:00:00Z'),
      }),
    )

    const page = rightOf(await useCase.execute({}))

    assert.deepEqual(
      page.data.map((item) => item.id),
      [
        '00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-000000000001',
      ],
    )
    assert.deepInclude(page.meta, { currentPage: 1, perPage: 20, total: 2 })
  })

  test('the response carries the answered instant and the ISO dates', async ({
    assert,
  }) => {
    const { contacts, useCase } = await setup()
    const answered = pendingContact()
    answered.answer(new Date('2026-11-02T09:30:00Z'))
    await contacts.create(answered)

    const [item] = rightOf(await useCase.execute({})).data

    assert.equal(item?.answeredAt, '2026-11-02T09:30:00.000Z')
    assert.equal(item?.createdAt, '2026-11-01T10:00:00.000Z')
  })

  test('the status and the search reach the repository', async ({ assert }) => {
    const { contacts, useCase } = await setup()
    await contacts.create(pendingContact({ name: 'Beatriz' }))

    const none = rightOf(
      await useCase.execute({ status: 'answered', search: 'beatriz' }),
    )
    const some = rightOf(
      await useCase.execute({ status: 'pending', search: 'BEATRIZ' }),
    )

    assert.lengthOf(none.data, 0)
    assert.lengthOf(some.data, 1)
  })
})
