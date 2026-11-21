import { describe, expect, it } from 'vitest'

import { columnsThatDoNotFit } from '#/lib/fit-columns'
import type { FitColumn } from '#/lib/fit-columns'

function data(id: string, size: number): FitColumn {
  return { id, size, pinned: false, canHide: true }
}

const SELECT: FitColumn = {
  id: '_select',
  size: 40,
  pinned: true,
  canHide: false,
}
const ACTIONS: FitColumn = {
  id: '_actions',
  size: 56,
  pinned: true,
  canHide: false,
}

describe('columnsThatDoNotFit', () => {
  it('when everything fits, hides nothing', () => {
    expect(columnsThatDoNotFit([data('a', 200), data('b', 200)], 500)).toEqual(
      {},
    )
  })

  it('hides, in order, the columns that no longer fit', () => {
    const columns = [
      data('a', 200),
      data('b', 200),
      data('c', 200),
      data('d', 200),
    ]

    expect(columnsThatDoNotFit(columns, 450)).toEqual({ c: false, d: false })
  })

  it('counts the pinned columns first and never hides them', () => {
    const columns = [SELECT, data('a', 200), data('b', 200), ACTIONS]

    // 40 + 56 pinned, then 200 fits in 300, the second 200 does not.
    expect(columnsThatDoNotFit(columns, 300)).toEqual({ b: false })
  })

  it('keeps the first data column even on a frame narrower than it', () => {
    expect(columnsThatDoNotFit([data('a', 400), data('b', 100)], 120)).toEqual({
      b: false,
    })
  })

  it('leaves alone a column that cannot be hidden', () => {
    const fixed: FitColumn = {
      id: 'fixed',
      size: 500,
      pinned: false,
      canHide: false,
    }

    expect(columnsThatDoNotFit([data('a', 100), fixed], 50)).toEqual({})
  })
})
