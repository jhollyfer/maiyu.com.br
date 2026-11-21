import { describe, expect, it } from 'vitest'

import {
  draftFromSearch,
  draftSignature,
  filledFilterCount,
  readFilterValue,
} from '#/lib/filter-draft'

describe('readFilterValue', () => {
  it('keeps a text and a list of texts', () => {
    expect(readFilterValue('OPEN')).toBe('OPEN')
    expect(readFilterValue(['a', 'b'])).toEqual(['a', 'b'])
  })

  it('reads a number and a boolean as text, and 0 and false stay filters', () => {
    expect(readFilterValue(0)).toBe('0')
    expect(readFilterValue(false)).toBe('false')
  })

  it('drops what filters nothing', () => {
    expect(readFilterValue('')).toBeUndefined()
    expect(readFilterValue([])).toBeUndefined()
    expect(readFilterValue(['', 1, null])).toBeUndefined()
    expect(readFilterValue(null)).toBeUndefined()
    expect(readFilterValue({ a: 1 })).toBeUndefined()
  })
})

describe('draft helpers', () => {
  const keys = ['authors', 'status']

  it('reads only the panel keys from the search', () => {
    expect(draftFromSearch({ status: 'OPEN', page: 2 }, keys)).toEqual({
      authors: undefined,
      status: 'OPEN',
    })
  })

  it('tells a changed list apart in the signature', () => {
    const one = draftSignature({ authors: ['a'] }, keys)
    const two = draftSignature({ authors: ['a', 'b'] }, keys)

    expect(one).not.toBe(two)
    expect(draftSignature({}, keys)).toBe(
      draftSignature({ status: undefined }, keys),
    )
  })

  it('counts the keys filled', () => {
    expect(filledFilterCount({ authors: ['a'], status: undefined }, keys)).toBe(
      1,
    )
  })
})
