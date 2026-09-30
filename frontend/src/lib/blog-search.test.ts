import { describe, expect, it } from 'vitest'

import { validateBlogSearch } from './blog-search'

describe('validateBlogSearch', () => {
  it('aceita uma categoria da lista', () => {
    expect(validateBlogSearch({ category: 'design' })).toEqual({
      category: 'design',
    })
  })

  it('cai para "tudo" com categoria desconhecida', () => {
    expect(validateBlogSearch({ category: 'culinaria' })).toEqual({})
  })

  it('cai para "tudo" sem parâmetro', () => {
    expect(validateBlogSearch({})).toEqual({})
  })
})
