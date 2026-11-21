import { describe, expect, it } from 'vitest'

import {
  splitVisibleChips,
  typedSearch,
  withSelectedOptions,
} from './combobox-search'

describe('typedSearch', () => {
  it('only typing is a search; pick, clear and blur reset it', () => {
    expect(typedSearch('ana', { reason: 'input-change' })).toBe('ana')
    expect(typedSearch('Ana Souza', { reason: 'item-press' })).toBe('')
    expect(typedSearch('x', { reason: 'clear' })).toBe('')
  })
})

describe('withSelectedOptions', () => {
  const loaded = [{ value: 'a', label: 'A' }]

  it('adds the chosen option the loaded pages do not bring', () => {
    expect(
      withSelectedOptions(loaded, [
        { value: 'a', label: 'A' },
        { value: 'z', label: 'Z' },
      ]),
    ).toEqual([
      { value: 'a', label: 'A' },
      { value: 'z', label: 'Z' },
    ])
  })

  it('returns the same list when every chosen option is already loaded', () => {
    expect(withSelectedOptions(loaded, [{ value: 'a', label: 'A' }])).toBe(
      loaded,
    )
  })
})

describe('splitVisibleChips', () => {
  const chips = ['a', 'b', 'c', 'd']

  it('collapses the chips past the limit into a count', () => {
    expect(splitVisibleChips(chips, 2)).toEqual({
      visible: ['a', 'b'],
      hiddenCount: 2,
    })
  })

  it('shows every chip with no limit or a limit that is not exceeded', () => {
    expect(splitVisibleChips(chips, undefined).hiddenCount).toBe(0)
    expect(splitVisibleChips(chips, null).visible).toBe(chips)
    expect(splitVisibleChips(chips, 4).hiddenCount).toBe(0)
  })
})
