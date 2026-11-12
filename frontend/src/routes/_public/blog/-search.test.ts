import { describe, expect, it } from 'vitest'

import { validateSearch } from './-search'

describe('validateSearch do diário', () => {
  it('aceita uma categoria da lista', () => {
    expect(validateSearch({ category: 'design' })).toEqual({
      category: 'design',
    })
  })

  it('cai para "tudo" com categoria desconhecida', () => {
    expect(validateSearch({ category: 'culinaria' })).toEqual({})
  })

  it('cai para "tudo" sem parâmetro', () => {
    expect(validateSearch({})).toEqual({})
  })
})
