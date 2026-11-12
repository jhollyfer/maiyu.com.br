import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { ContactLucidRepository } from './contact.lucid.repository.ts'
import { ContactMemoryRepository } from './contact.memory.repository.ts'
import type {
  ContactListCriteria,
  ContactRepository,
} from './contact.repository.ts'

import { Contact } from '#domain/contact/contact.entity'
import { resetDatabase } from '#tests/http-fixtures'
import { QueryCount } from '#tests/query-count-fixtures'

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the use case unit test, which runs on the in-memory one, does not pass
 * against a lying double.
 */
const IMPLEMENTATIONS = {
  lucid: () => app.container.make(ContactLucidRepository),
  memory: () => app.container.make(ContactMemoryRepository),
} satisfies Record<string, () => Promise<ContactRepository>>

const NOW = new Date('2026-11-10T12:00:00.000Z')

const FIRST = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a01'
const SECOND = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a02'
const THIRD = '4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8a03'
const UNKNOWN = '0c1f9d1e-8b7a-4c3d-9e2f-1a2b3c4d5e6f'

const PAGE = {
  page: 1,
  perPage: 20,
  sort: 'createdAt',
  direction: 'desc',
} as const

function contact(
  id: string,
  overrides: { name?: string; email?: string; createdAt?: Date } = {},
): Contact {
  return Contact.create({
    id,
    name: overrides.name ?? 'Ana Souza',
    email: overrides.email ?? 'ana@exemplo.com',
    message: 'Quero conversar sobre um projeto.',
    locale: 'pt-BR',
    now: overrides.createdAt ?? NOW,
  })
}

/** The stored contact with the answer applied in memory only, as a use case holds it before claiming. */
async function answeredAt(
  repository: ContactRepository,
  at: Date,
): Promise<Contact> {
  const found = await repository.findById(FIRST)
  if (!found) throw new Error('the contact was not stored')
  found.answer(at)

  return found
}

function ids(page: { data: Contact[] }): string[] {
  return page.data.map((item) => item.id)
}

function criteria(overrides: Partial<ContactListCriteria> = {}) {
  return { ...PAGE, ...overrides }
}

for (const [name, make] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`ContactRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('create and findById return the same contact', async ({ assert }) => {
      const repository = await make()
      const saved = contact(FIRST)

      await repository.create(saved)

      const found = await repository.findById(FIRST)
      assert.deepEqual(found?.snapshot(), saved.snapshot())
      assert.isNull(await repository.findById(UNKNOWN))
    })

    test('claimAnswer writes the answer once and refuses the second', async ({
      assert,
    }) => {
      const repository = await make()
      await repository.create(contact(FIRST))
      const firstAt = new Date('2026-11-11T09:00:00.000Z')
      const first = await answeredAt(repository, firstAt)
      const second = await answeredAt(
        repository,
        new Date('2026-11-11T10:00:00.000Z'),
      )

      assert.isTrue(await repository.claimAnswer(first))
      assert.isFalse(await repository.claimAnswer(second))

      const stored = await repository.findById(FIRST)
      assert.equal(
        stored?.snapshot().answeredAt?.toISOString(),
        firstAt.toISOString(),
      )
    })

    test('paginate lists the newest first, breaking ties by id', async ({
      assert,
    }) => {
      const repository = await make()
      await repository.create(
        contact(FIRST, { createdAt: new Date('2026-11-01T00:00:00Z') }),
      )
      await repository.create(
        contact(SECOND, { createdAt: new Date('2026-11-03T00:00:00Z') }),
      )
      await repository.create(
        contact(THIRD, { createdAt: new Date('2026-11-03T00:00:00Z') }),
      )

      const page = await repository.paginate(criteria())

      assert.deepEqual(ids(page), [THIRD, SECOND, FIRST])
      assert.equal(page.meta.total, 3)
    })

    test('paginate cuts the page by perPage', async ({ assert }) => {
      const repository = await make()
      await repository.create(
        contact(FIRST, { createdAt: new Date('2026-11-01T00:00:00Z') }),
      )
      await repository.create(
        contact(SECOND, { createdAt: new Date('2026-11-02T00:00:00Z') }),
      )

      const page = await repository.paginate(criteria({ page: 2, perPage: 1 }))

      assert.deepEqual(ids(page), [FIRST])
      assert.equal(page.meta.lastPage, 2)
    })

    test('paginate filters by status', async ({ assert }) => {
      const repository = await make()
      const answered = contact(FIRST)
      answered.answer(NOW)
      await repository.create(answered)
      await repository.create(contact(SECOND))

      assert.deepEqual(
        ids(await repository.paginate(criteria({ status: 'pending' }))),
        [SECOND],
      )
      assert.deepEqual(
        ids(await repository.paginate(criteria({ status: 'answered' }))),
        [FIRST],
      )
      assert.lengthOf(ids(await repository.paginate(criteria())), 2)
    })

    test('paginate searches name or email ignoring case, and does not escape the status filter', async ({
      assert,
    }) => {
      const repository = await make()
      await repository.create(
        contact(FIRST, { name: 'Beatriz Lima', email: 'b@exemplo.com' }),
      )
      const answered = contact(SECOND, {
        name: 'Carlos',
        email: 'beatriz.c@exemplo.com',
      })
      answered.answer(NOW)
      await repository.create(answered)

      const byName = await repository.paginate(criteria({ search: 'BEATRIZ' }))
      // The term is in the e-mail of one and in the name of the other, and the status cut
      // must still hold: a loose `OR` would bring back the answered one.
      const pendingOnly = await repository.paginate(
        criteria({ search: 'beatriz', status: 'pending' }),
      )

      assert.sameMembers(ids(byName), [FIRST, SECOND])
      assert.deepEqual(ids(pendingOnly), [FIRST])
    })

    test('paginate takes % and _ in the search as text', async ({ assert }) => {
      const repository = await make()
      await repository.create(contact(FIRST, { name: 'Ana 50% Souza' }))
      await repository.create(contact(SECOND, { name: 'Ana 500 Souza' }))

      const page = await repository.paginate(criteria({ search: '50%' }))

      assert.deepEqual(ids(page), [FIRST])
    })

    test('delete removes the contact for good', async ({ assert }) => {
      const repository = await make()
      const saved = contact(FIRST)
      await repository.create(saved)

      await repository.delete(saved)

      assert.isNull(await repository.findById(FIRST))
    })

    test('deleteCreatedBefore deletes only what is older than the cutoff and says how many', async ({
      assert,
    }) => {
      const repository = await make()
      const cutoff = new Date('2026-01-01T00:00:00Z')
      await repository.create(
        contact(FIRST, { createdAt: new Date('2025-12-31T23:59:59Z') }),
      )
      const answered = contact(SECOND, {
        createdAt: new Date('2025-06-01T00:00:00Z'),
      })
      answered.answer(NOW)
      await repository.create(answered)
      await repository.create(
        contact(THIRD, { createdAt: new Date('2026-01-02T00:00:00Z') }),
      )

      assert.equal(await repository.countCreatedBefore(cutoff), 2)
      assert.equal(await repository.deleteCreatedBefore(cutoff), 2)

      assert.isNull(await repository.findById(FIRST))
      assert.isNull(await repository.findById(SECOND))
      assert.isNotNull(await repository.findById(THIRD))
      assert.equal(await repository.deleteCreatedBefore(cutoff), 0)
    })
  })
}

test.group('ContactRepository (queries)', (group) => {
  group.each.setup(() => resetDatabase())

  test('paginate runs a fixed number of queries', async ({ assert }) => {
    const repository = await app.container.make(ContactLucidRepository)
    const emitter = await app.container.make('emitter')

    for (let index = 0; index < 25; index += 1) {
      await repository.create(
        contact(
          `4b6f2c1e-3f2a-4c8e-9a1b-0f6d2e7c8b${String(index).padStart(2, '0')}`,
        ),
      )
    }

    // The listing costs two queries (the count and the page) and nothing per row: a preload
    // or an N+1 added later moves the number and fails here with the SQL.
    await QueryCount.assert(
      assert,
      emitter,
      () => repository.paginate(criteria({ search: 'ana', status: 'pending' })),
      2,
    )
    await QueryCount.assert(
      assert,
      emitter,
      () => repository.paginate(criteria({ page: 2 })),
      2,
    )
  })
})
