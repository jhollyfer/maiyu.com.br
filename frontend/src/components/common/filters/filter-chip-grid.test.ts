import { describe, expect, it } from 'vitest'

import { resolveToggleTarget } from './filter-chip-grid'
import type { FilterChipItem } from './filter-chip-grid'

function chip(key: string, active: boolean = false): FilterChipItem {
  return { key, label: key, active, onSelect: () => {} }
}

describe('resolveToggleTarget', () => {
  it('liga o chip que o grupo devolveu', () => {
    const items = [chip('cestaria'), chip('ceramica')]

    expect(resolveToggleTarget(items, ['ceramica'])?.key).toBe('ceramica')
  })

  it('desliga o chip aceso quando o grupo devolve vazio', () => {
    const items = [chip('cestaria', true), chip('ceramica')]

    expect(resolveToggleTarget(items, [])?.key).toBe('cestaria')
  })

  // A regressão: com a categoria mãe e a subcategoria acesas ao mesmo tempo, o
  // vazio caía sempre na primeira ativa, a mãe, e limpar `categorySlug`
  // deixava `subcategorySlug` sozinho na URL. Quem monta os itens mantém um
  // aceso só, e é este teste que cobra a invariante.
  it('devolve a subcategoria quando ela é a única acesa', () => {
    const items = [chip('cestaria'), chip('cestos', true), chip('ceramica')]

    expect(resolveToggleTarget(items, [])?.key).toBe('cestos')
  })

  it('não devolve nada quando não há aceso nem valor novo', () => {
    expect(resolveToggleTarget([chip('cestaria')], [])).toBeUndefined()
  })
})
