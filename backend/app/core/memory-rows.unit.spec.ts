import { test } from '@japa/runner'
import { DateTime } from 'luxon'

import { SORT_DIRECTION, TRASHED_MODE } from '@maiyu/shared'

import MemoryRows from '#core/memory-rows'

const NOW = DateTime.fromISO('2026-11-08T12:00:00.000Z', { zone: 'utc' })
const LATER = NOW.plus({ hours: 1 })

test.group('core > memory rows > copy', () => {
  test('when a field is a Luxon DateTime, the copy keeps the class', ({
    assert,
  }) => {
    const copy = MemoryRows.copy({ id: 'a', publishedAt: NOW })

    assert.isTrue(DateTime.isDateTime(copy.publishedAt))
    assert.equal(copy.publishedAt.toISO(), NOW.toISO())
  })

  test('when a field is a Date or a plain structure, changing the copy leaves the original', ({
    assert,
  }) => {
    const original = {
      id: 'a',
      seenAt: new Date('2026-11-08T12:00:00.000Z'),
      body: { text: 'one', at: NOW, tags: ['x'] },
    }
    const copy = MemoryRows.copy(original)

    copy.seenAt.setTime(0)
    copy.body.text = 'changed'
    copy.body.tags.push('y')

    assert.equal(original.seenAt.toISOString(), '2026-11-08T12:00:00.000Z')
    assert.equal(original.body.text, 'one')
    assert.deepEqual(original.body.tags, ['x'])
    assert.isTrue(DateTime.isDateTime(copy.body.at))
  })
})

test.group('core > memory rows > stamp', () => {
  test('when the row is new, both stamps are now', ({ assert }) => {
    const row = MemoryRows.stamp(
      { id: 'a', name: 'x', deletedAt: null },
      undefined,
      NOW,
    )

    assert.isTrue(row.createdAt.equals(NOW))
    assert.isTrue(row.updatedAt?.equals(NOW))
  })

  test('when no column changed, updatedAt stays, even for an equal DateTime', ({
    assert,
  }) => {
    const first = MemoryRows.stamp(
      { id: 'a', when: NOW, deletedAt: null },
      undefined,
      NOW,
    )
    const again = MemoryRows.stamp(
      {
        id: 'a',
        when: DateTime.fromISO(NOW.toISO() ?? '', { zone: 'utc' }),
        deletedAt: null,
      },
      first,
      LATER,
    )

    assert.isTrue(again.updatedAt?.equals(NOW))
  })

  test('when a column changed, updatedAt moves and createdAt stays', ({
    assert,
  }) => {
    const first = MemoryRows.stamp(
      { id: 'a', name: 'x', deletedAt: null },
      undefined,
      NOW,
    )
    const next = MemoryRows.stamp(
      { id: 'a', name: 'y', deletedAt: null },
      first,
      LATER,
    )

    assert.isTrue(next.createdAt.equals(NOW))
    assert.isTrue(next.updatedAt?.equals(LATER))
  })

  test('when only a prop outside the row changed, updatedAt stays', ({
    assert,
  }) => {
    const first = MemoryRows.stamp(
      { id: 'a', gallery: ['1'], deletedAt: null },
      undefined,
      NOW,
    )
    const next = MemoryRows.stamp(
      { id: 'a', gallery: ['2'], deletedAt: null },
      first,
      LATER,
      ['gallery'],
    )

    assert.isTrue(next.updatedAt?.equals(NOW))
  })
})

test.group('core > memory rows > filters', () => {
  test('inTrash follows the trashed mode', ({ assert }) => {
    const alive = { id: 'a', deletedAt: null }
    const trashed = { id: 'b', deletedAt: NOW }

    assert.isTrue(MemoryRows.inTrash(alive))
    assert.isFalse(MemoryRows.inTrash(trashed))
    assert.isTrue(MemoryRows.inTrash(trashed, TRASHED_MODE.ONLY))
    assert.isFalse(MemoryRows.inTrash(alive, TRASHED_MODE.ONLY))
    assert.isTrue(MemoryRows.inTrash(trashed, TRASHED_MODE.WITH))
  })

  test('contains is case-insensitive and an empty search matches all', ({
    assert,
  }) => {
    assert.isTrue(MemoryRows.contains(['Cesto Ticuna'], 'ticu'))
    assert.isFalse(MemoryRows.contains(['Cesto Ticuna'], 'rede'))
    assert.isTrue(MemoryRows.contains(['Cesto Ticuna'], undefined))
  })
})

test.group('core > memory rows > page', () => {
  const rows = [
    { id: 'a', at: NOW.plus({ days: 2 }) },
    { id: 'b', at: NOW },
    { id: 'c', at: NOW.plus({ days: 1 }) },
  ]

  test('orders by a DateTime column and cuts the page', ({ assert }) => {
    const page = MemoryRows.page(
      rows,
      { page: 1, perPage: 2, sort: 'at', direction: SORT_DIRECTION.DESC },
      { sortValue: (row) => row.at, toItem: (row) => row.id },
    )

    assert.deepEqual(page.data, ['a', 'c'])
    assert.equal(page.meta.lastPage, 2)
    assert.equal(page.meta.nextPageUrl, '/?page=2')
    assert.isNull(page.meta.previousPageUrl)
  })

  test('breaks ties by id in the requested direction', ({ assert }) => {
    const tied = [
      { id: 'c', at: NOW },
      { id: 'a', at: NOW },
      { id: 'b', at: NOW },
    ]
    const read = {
      sortValue: (row: (typeof tied)[number]) => row.at,
      toItem: (row: (typeof tied)[number]) => row.id,
    }

    const asc = MemoryRows.page(
      tied,
      { page: 1, perPage: 10, sort: 'at', direction: SORT_DIRECTION.ASC },
      read,
    )
    const desc = MemoryRows.page(
      tied,
      { page: 1, perPage: 10, sort: 'at', direction: SORT_DIRECTION.DESC },
      read,
    )

    assert.deepEqual(asc.data, ['a', 'b', 'c'])
    assert.deepEqual(desc.data, ['c', 'b', 'a'])
  })

  test('slice gives the same meta as Lucid on the last page', ({ assert }) => {
    const page = MemoryRows.slice(['a', 'b', 'c'], 2, 2)

    assert.deepEqual(page.data, ['c'])
    assert.deepEqual(page.meta, {
      total: 3,
      perPage: 2,
      currentPage: 2,
      lastPage: 2,
      firstPage: 1,
      firstPageUrl: '/?page=1',
      lastPageUrl: '/?page=2',
      nextPageUrl: null,
      previousPageUrl: '/?page=1',
    })
  })

  test('an empty list still has one page', ({ assert }) => {
    const page = MemoryRows.slice([], 1, 10)

    assert.equal(page.meta.lastPage, 1)
    assert.isEmpty(page.data)
  })
})
