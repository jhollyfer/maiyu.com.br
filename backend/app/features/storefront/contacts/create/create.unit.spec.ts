import { test } from '@japa/runner'

import StorefrontContactCreateUseCase from './create.use-case.ts'

import { ContactMemoryRepository } from '#repositories/contact/contact.memory.repository'
import { ContactRepository } from '#repositories/contact/contact.repository'
import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import { IdGeneratorContract } from '#services/id-generator/id-generator.contract'
import { IdGeneratorFake } from '#services/id-generator/id-generator.fake'
import { makeWithMemory } from '#tests/container-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'

const PAYLOAD = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  message: 'Quero conversar sobre um projeto.',
  locale: 'pt-BR',
} as const

/** The repository that fails on write, to reach the 500 branch. */
class BrokenContactRepository extends ContactMemoryRepository {
  override async create(): Promise<void> {
    throw new Error('database down')
  }
}

async function setup(contacts: ContactMemoryRepository) {
  const clock = new ClockFake()
  const useCase = await makeWithMemory(StorefrontContactCreateUseCase, [
    [ContactRepository, contacts],
    [ClockContract, clock],
    [IdGeneratorContract, new IdGeneratorFake()],
  ])

  return { clock, useCase }
}

async function stored(contacts: ContactMemoryRepository) {
  const page = await contacts.paginate({
    page: 1,
    perPage: 20,
    sort: 'createdAt',
    direction: 'desc',
  })

  return page.data
}

test.group('storefront/contacts > create (unit)', (group) => {
  insideHttpContext(group)

  test('a valid message is saved pending, with the clock instant and a new id', async ({
    assert,
  }) => {
    const contacts = new ContactMemoryRepository()
    const { clock, useCase } = await setup(contacts)

    const result = await useCase.execute(PAYLOAD)

    assert.isTrue(result.isRight())
    const [saved] = await stored(contacts)
    assert.deepInclude(saved?.snapshot(), {
      id: '00000000-0000-4000-8000-000000000001',
      ...PAYLOAD,
      answeredAt: null,
      createdAt: clock.now().toJSDate(),
    })
  })

  test('a filled honeypot answers like a success and saves nothing', async ({
    assert,
  }) => {
    const contacts = new ContactMemoryRepository()
    const { useCase } = await setup(contacts)

    const result = await useCase.execute({
      ...PAYLOAD,
      website: 'http://spam.example',
    })

    assert.isTrue(result.isRight())
    assert.lengthOf(await stored(contacts), 0)
  })

  test('a repository failure is a 500 with its own code and nothing leaks', async ({
    assert,
  }) => {
    const { useCase } = await setup(new BrokenContactRepository())

    const result = await useCase.execute(PAYLOAD)

    assert.deepInclude(result.value, {
      status: 500,
      code: 'STOREFRONT_CONTACT_CREATE_ERROR',
    })
  })
})
