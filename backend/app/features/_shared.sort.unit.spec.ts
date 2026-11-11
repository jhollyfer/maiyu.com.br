import { test } from '@japa/runner'

import { SORT_DIRECTION } from '@maiyu/shared'

import { Sort } from './_shared.sort.ts'

test.group('_shared.sort (unit)', () => {
  test('without ?sort the listing keeps its own order, ascending', ({
    assert,
  }) => {
    assert.deepEqual(Sort.order({}, 'name'), ['name', SORT_DIRECTION.ASC])
  })

  test('?sort and ?direction win over the fallback', ({ assert }) => {
    assert.deepEqual(
      Sort.order({ sort: 'createdAt', direction: SORT_DIRECTION.DESC }, 'name'),
      ['createdAt', SORT_DIRECTION.DESC],
    )
  })

  test('a chronological listing starts from the latest record', ({
    assert,
  }) => {
    assert.deepEqual(Sort.recentFirst({}), ['createdAt', SORT_DIRECTION.DESC])
  })
})
