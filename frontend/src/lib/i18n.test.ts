import { describe, expect, it } from 'vitest'

import { alternateLinks, localizedUrl } from './i18n'

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
