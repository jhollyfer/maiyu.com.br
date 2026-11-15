import { test } from '@japa/runner'

import StorefrontContactCreateUseCase from './create.use-case.ts'

import { TenantScope } from '#core/tenant-scope'
import { ContactMemoryRepository } from '#repositories/contact/contact.memory.repository'
import { ContactRepository } from '#repositories/contact/contact.repository'
import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import { IdGeneratorContract } from '#services/id-generator/id-generator.contract'
import { IdGeneratorFake } from '#services/id-generator/id-generator.fake'
import { OTHER_TENANT_ID, TENANT_ID } from '#tests/contacts-unit-fixtures'
import { makeWithMemory } from '#tests/container-fixtures'
import {
  insideHttpContext,
  scopedHttpContext,
} from '#tests/http-context-fixtures'

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
  const within = scopedHttpContext(group)

  group.each.setup(() =>
    within(TenantScope.ofPublic(TENANT_ID, [], { inserts: true })),
  )

  test('a valid message is saved pending, with the clock instant and a new id', async ({
    assert,
  }) => {
    const contacts = new ContactMemoryRepository()
    const { clock, useCase } = await setup(contacts)

    const result = await useCase.execute({ ...PAYLOAD, website: null })

    assert.deepEqual(result.value, {
      id: '00000000-0000-4000-8000-000000000001',
      createdAt: clock.now().toJSDate().toISOString(),
    })
    const [saved] = await stored(contacts)
    assert.deepInclude(saved?.snapshot(), {
      id: '00000000-0000-4000-8000-000000000001',
      tenantId: TENANT_ID,
      customerId: null,
      ...PAYLOAD,
      answeredAt: null,
      createdAt: clock.now().toJSDate(),
    })
  })

  test('a filled honeypot answers with a receipt like a success and saves nothing', async ({
    assert,
  }) => {
    const contacts = new ContactMemoryRepository()
    const { useCase } = await setup(contacts)

    const result = await useCase.execute({
      ...PAYLOAD,
      website: 'http://spam.example',
    })

    assert.sameMembers(Object.keys(result.value), ['id', 'createdAt'])
    assert.lengthOf(await stored(contacts), 0)
  })

  test('a repository failure is a 500 with its own code and nothing leaks', async ({
    assert,
  }) => {
    const { useCase } = await setup(new BrokenContactRepository())

    const result = await useCase.execute({ ...PAYLOAD, website: null })

    assert.deepInclude(result.value, {
      status: 500,
      code: 'STOREFRONT_CONTACT_CREATE_ERROR',
    })
  })

  test('the message is stored in the tenant of the public route, owned by nobody', async ({
    assert,
  }) => {
    await within(TenantScope.ofPublic(OTHER_TENANT_ID, [], { inserts: true }))
    const contacts = new ContactMemoryRepository()
    const { useCase } = await setup(contacts)

    await useCase.execute({ ...PAYLOAD, website: null })

    const [saved, ...others] = await stored(contacts)
    assert.lengthOf(others, 0)
    assert.equal(saved?.snapshot().tenantId, OTHER_TENANT_ID)
    assert.isNull(saved?.snapshot().customerId)
  })

  test('a route that names no tenant answers 403 TENANT_REQUIRED and saves nothing', async ({
    assert,
  }) => {
    await within(TenantScope.ofPublic(null, [], { inserts: true }))
    const contacts = new ContactMemoryRepository()
    const { useCase } = await setup(contacts)

    const result = await useCase.execute({ ...PAYLOAD, website: null })

    assert.deepInclude(result.value, { status: 403, code: 'TENANT_REQUIRED' })
    assert.lengthOf(await stored(contacts), 0)
  })

  test('a read-only public scope cannot write', async ({ assert }) => {
    await within(TenantScope.ofPublic(TENANT_ID, []))
    const contacts = new ContactMemoryRepository()
    const { useCase } = await setup(contacts)

    const result = await useCase.execute({ ...PAYLOAD, website: null })

    assert.deepInclude(result.value, { status: 403, code: 'TENANT_REQUIRED' })
    assert.lengthOf(await stored(contacts), 0)
  })
})
