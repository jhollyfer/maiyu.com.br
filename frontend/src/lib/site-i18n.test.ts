import { describe, expect, it } from 'vitest'

import { localizedDate } from './site-i18n'

describe('localizedDate', () => {
  it('escreve a data por extenso no idioma pedido, sem andar de dia por fuso', () => {
    expect(localizedDate('2026-09-08', 'pt-BR')).toBe('8 de setembro de 2026')
    expect(localizedDate('2026-09-08', 'en')).toBe('September 8, 2026')
    expect(localizedDate('2026-09-08', 'es')).toBe('8 de septiembre de 2026')
  })

  it('não recua um dia no primeiro dia do ano, qualquer que seja o fuso do processo', () => {
    expect(localizedDate('2027-01-01', 'pt-BR')).toBe('1 de janeiro de 2027')
    expect(localizedDate('2027-01-01', 'en')).toBe('January 1, 2027')
    expect(localizedDate('2027-01-01', 'es')).toBe('1 de enero de 2027')
  })
})
