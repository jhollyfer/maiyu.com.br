import { describe, expect, it } from 'vitest'

import { buildSitemap, localizeEntries } from './sitemap'

describe('buildSitemap', () => {
  it('monta a URL absoluta sem barra dupla', () => {
    const xml = buildSitemap('https://maiyu.com.br/', [{ path: '/portfolio' }])

    expect(xml).toContain('<loc>https://maiyu.com.br/portfolio</loc>')
  })

  it('a home fica sem barra no fim', () => {
    const xml = buildSitemap('https://maiyu.com.br', [{ path: '/' }])

    expect(xml).toContain('<loc>https://maiyu.com.br</loc>')
  })

  it('escapa o & de uma query string', () => {
    const xml = buildSitemap('https://maiyu.com.br', [
      { path: '/blog?a=1&b=2' },
    ])

    expect(xml).toContain('a=1&amp;b=2')
    expect(xml).not.toContain('a=1&b=2')
  })

  it('escreve lastmod e prioridade só quando existem', () => {
    const xml = buildSitemap('https://maiyu.com.br', [
      { path: '/blog/x', lastModified: '2024-05-15', priority: 0.5 },
      { path: '/contact' },
    ])

    expect(xml).toContain('<lastmod>2024-05-15</lastmod>')
    expect(xml).toContain('<priority>0.5</priority>')
    expect(xml.match(/<lastmod>/g)).toHaveLength(1)
  })
})

describe('buildSitemap com alternates', () => {
  it('escreve um xhtml:link por versão, com a URL absoluta', () => {
    const xml = buildSitemap('https://maiyu.com.br', [
      {
        path: '/en/blog',
        alternates: [
          { hrefLang: 'en', path: '/en/blog' },
          { hrefLang: 'x-default', path: '/pt-br/blog' },
        ],
      },
    ])

    expect(xml).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="en" href="https://maiyu.com.br/en/blog"/>',
    )
    expect(xml).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://maiyu.com.br/pt-br/blog"/>',
    )
  })
})

describe('localizeEntries', () => {
  it('gera uma entrada por idioma, todas prefixadas', () => {
    const entries = localizeEntries([{ path: '/blog' }, { path: '/' }])

    expect(entries.map((entry) => entry.path)).toEqual([
      '/pt-br/blog',
      '/pt-br',
      '/en/blog',
      '/en',
      '/es/blog',
      '/es',
    ])
  })

  it('cada entrada carrega as três versões e o x-default no idioma base', () => {
    const [first] = localizeEntries([{ path: '/blog' }])

    expect(first?.alternates).toEqual([
      { hrefLang: 'pt-BR', path: '/pt-br/blog' },
      { hrefLang: 'en', path: '/en/blog' },
      { hrefLang: 'es', path: '/es/blog' },
      { hrefLang: 'x-default', path: '/pt-br/blog' },
    ])
  })

  it('nenhuma URL do sitemap fica sem prefixo', () => {
    const xml = buildSitemap(
      'https://maiyu.com.br',
      localizeEntries([{ path: '/' }, { path: '/blog' }]),
    )

    expect(xml).not.toMatch(/<loc>https:\/\/maiyu\.com\.br(\/blog)?<\/loc>/)
    expect(xml).toContain('<loc>https://maiyu.com.br/pt-br</loc>')
  })
})
