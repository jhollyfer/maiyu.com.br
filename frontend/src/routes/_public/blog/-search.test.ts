import { describe, expect, it } from 'vitest'

import { validateSearch } from './-search'

/** The router calls the Standard Schema entry; so do the value tests (`list-search.test.ts`). */
function parse(search: Record<string, unknown>): unknown {
  const result = validateSearch['~standard'].validate(search)
  if ('value' in result) return result.value

  return undefined
}

describe('validateSearch of the journal', () => {
  it('accepts a category from the list', () => {
    expect(parse({ category: 'design' })).toEqual({ category: 'design' })
  })

  it('falls back to "all" with an unknown category', () => {
    expect(parse({ category: 'cooking' })).toEqual({})
  })

  it('falls back to "all" without a parameter', () => {
    expect(parse({})).toEqual({})
  })
})
