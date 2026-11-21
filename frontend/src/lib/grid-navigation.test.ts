import { describe, expect, it } from 'vitest'

import { clampGridCell, nextGridCell } from '#/lib/grid-navigation'
import type { GridMove } from '#/lib/grid-navigation'

const SIZE = { rows: 30, cols: 4 } as const

function press(key: string, ctrl = false): GridMove {
  return { key, ctrl, pageRows: 10 }
}

describe('nextGridCell', () => {
  it('the arrows move by one cell', () => {
    const cell = { row: 5, col: 2 }

    expect(nextGridCell(cell, SIZE, press('ArrowDown'))).toEqual({
      row: 6,
      col: 2,
    })
    expect(nextGridCell(cell, SIZE, press('ArrowUp'))).toEqual({
      row: 4,
      col: 2,
    })
    expect(nextGridCell(cell, SIZE, press('ArrowRight'))).toEqual({
      row: 5,
      col: 3,
    })
    expect(nextGridCell(cell, SIZE, press('ArrowLeft'))).toEqual({
      row: 5,
      col: 1,
    })
  })

  it('stops at the edges and does not wrap', () => {
    expect(nextGridCell({ row: 29, col: 3 }, SIZE, press('ArrowDown'))).toEqual(
      { row: 29, col: 3 },
    )
    expect(
      nextGridCell({ row: 29, col: 3 }, SIZE, press('ArrowRight')),
    ).toEqual({ row: 29, col: 3 })
    expect(nextGridCell({ row: 0, col: 0 }, SIZE, press('ArrowUp'))).toEqual({
      row: 0,
      col: 0,
    })
    expect(nextGridCell({ row: 0, col: 0 }, SIZE, press('ArrowLeft'))).toEqual({
      row: 0,
      col: 0,
    })
  })

  it('Home and End go to the ends of the row, and with Control to the ends of the grid', () => {
    const cell = { row: 5, col: 2 }

    expect(nextGridCell(cell, SIZE, press('Home'))).toEqual({ row: 5, col: 0 })
    expect(nextGridCell(cell, SIZE, press('End'))).toEqual({ row: 5, col: 3 })
    expect(nextGridCell(cell, SIZE, press('Home', true))).toEqual({
      row: 0,
      col: 0,
    })
    expect(nextGridCell(cell, SIZE, press('End', true))).toEqual({
      row: 29,
      col: 3,
    })
  })

  it('PageDown and PageUp jump a page of rows and stop at the edges', () => {
    expect(nextGridCell({ row: 5, col: 1 }, SIZE, press('PageDown'))).toEqual({
      row: 15,
      col: 1,
    })
    expect(nextGridCell({ row: 25, col: 1 }, SIZE, press('PageDown'))).toEqual({
      row: 29,
      col: 1,
    })
    expect(nextGridCell({ row: 5, col: 1 }, SIZE, press('PageUp'))).toEqual({
      row: 0,
      col: 1,
    })
  })

  it('a key that is not navigation is left alone', () => {
    expect(nextGridCell({ row: 0, col: 0 }, SIZE, press('a'))).toBeNull()
    expect(nextGridCell({ row: 0, col: 0 }, SIZE, press('Enter'))).toBeNull()
  })

  it('on an empty grid the target stays at the origin', () => {
    const empty = { rows: 0, cols: 0 }

    expect(nextGridCell({ row: 0, col: 0 }, empty, press('End', true))).toEqual(
      { row: 0, col: 0 },
    )
  })
})

describe('clampGridCell', () => {
  it('holds the cursor at the edge when rows and columns shrink under it', () => {
    expect(clampGridCell({ row: 40, col: 9 }, SIZE)).toEqual({
      row: 29,
      col: 3,
    })
    expect(clampGridCell({ row: 2, col: 1 }, SIZE)).toEqual({ row: 2, col: 1 })
  })
})
