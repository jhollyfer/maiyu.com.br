import { describe, expect, it } from 'vitest'

import { alternateLinks, localizedUrl, localizedDate } from './i18n'

describe('localizedDate', () => {
  it('escreve a data por extenso no idioma pedido, sem andar de dia por fuso', () => {
    expect(localizedDate('2026-09-08', 'pt-BR')).toBe('8 de setembro de 2026')
    expect(localizedDate('2026-09-08', 'en')).toBe('September 8, 2026')
    expect(localizedDate('2026-09-08', 'es')).toBe('8 de septiembre de 2026')
  })
})

describe('localizedUrl', () => {
  it('não prefixa o idioma base', () => {
    expect(localizedUrl('/portfolio', 'pt-BR')).toBe(
      'https://maiyu.com.br/portfolio',
    )
  })

  it('prefixa os outros idiomas', () => {
    expect(localizedUrl('/portfolio', 'en')).toBe(
      'https://maiyu.com.br/en/portfolio',
    )
  })
})

describe('alternateLinks', () => {
  it('publica um idioma por link, mais o x-default no base', () => {
    const links = alternateLinks('/blog')

    expect(links.map((link) => link.hrefLang)).toEqual([
      'pt-BR',
      'en',
      'es',
      'x-default',
    ])
    expect(links.at(-1)?.href).toBe('https://maiyu.com.br/blog')
  })
})
