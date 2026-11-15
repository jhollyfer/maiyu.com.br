import { describe, expect, it } from 'vitest'

import { env } from '#/env'

import { robotsTxt, sitemapXml } from './sitemap'

describe('sitemapXml', () => {
  const xml = sitemapXml([
    { pathname: '/about' },
    { pathname: '/items/abc', lastModified: '2026-10-01T10:00:00Z' },
  ])

  it('when given two pages, writes one url per language for each', () => {
    expect(xml.match(/<url>/g)).toHaveLength(6)
  })

  it('when writing the loc, prefixes every language, pt-BR included', () => {
    expect(xml).toContain(`<loc>${env.VITE_SITE_URL}/pt-br/about</loc>`)
    expect(xml).toContain(`<loc>${env.VITE_SITE_URL}/es/about</loc>`)
    expect(xml).toContain(`<loc>${env.VITE_SITE_URL}/en/about</loc>`)
  })

  it('when writing a url, links the sibling hreflangs and x-default', () => {
    expect(xml).toContain(`hreflang="es" href="${env.VITE_SITE_URL}/es/about"`)
    expect(xml).toContain(
      `hreflang="x-default" href="${env.VITE_SITE_URL}/pt-br/about"`,
    )
  })

  it('when an entry has priority, writes it after lastmod; the others have none', () => {
    const withPriority = sitemapXml([
      { pathname: '/', lastModified: '2026-10-01', priority: 1 },
      { pathname: '/about' },
    ])

    expect(withPriority).toContain(
      '<lastmod>2026-10-01</lastmod><priority>1.0</priority>',
    )
    expect(withPriority.match(/<priority>/g)).toHaveLength(3)
  })

  it('when only one page has updatedAt, writes lastmod only for it', () => {
    expect(xml.match(/<lastmod>/g)).toHaveLength(3)
  })
})

describe('robotsTxt', () => {
  it('when indexable, allows everything and points at the absolute sitemap', () => {
    const text = robotsTxt({ indexable: true })

    expect(text).toContain('Disallow:\n')
    expect(text).toContain(`Sitemap: ${env.VITE_SITE_URL}/sitemap.xml`)
  })

  it('when not indexable, forbids everything', () => {
    expect(robotsTxt({ indexable: false })).toBe('User-agent: *\nDisallow: /\n')
  })
})
