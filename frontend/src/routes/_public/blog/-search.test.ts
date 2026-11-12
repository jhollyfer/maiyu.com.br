import { describe, expect, it } from 'vitest'

import { validateSearch } from './-search'

describe('validateSearch of the journal', () => {
  it('accepts a category from the list', () => {
    expect(validateSearch({ category: 'design' })).toEqual({
      category: 'design',
    })
  })

  it('falls back to "all" with an unknown category', () => {
    expect(validateSearch({ category: 'cooking' })).toEqual({})
  })

  it('falls back to "all" without a parameter', () => {
    expect(validateSearch({})).toEqual({})
  })
})
