import { describe, expect, it } from 'vitest'

import config from '../../project.inlang/paraglide.config'

/** Whether the Paraglide middleware skips this path: the first matching strategy is an exclusion. */
function isExcluded(pathname: string): boolean {
  const strategies = config.routeStrategies ?? []
  const hit = strategies.find((entry) =>
    new URLPattern({ pathname: entry.match }).test({ pathname }),
  )

  return hit !== undefined && 'exclude' in hit && hit.exclude === true
}

describe('Paraglide routeStrategies exclusions', () => {
  it.each([
    '/jhollyfer.pdf',
    '/robots.txt',
    '/sitemap.xml',
    '/favicon.ico',
    '/health-check',
    '/.well-known/security.txt',
    '/assets/app.9f3c.js',
    '/assets/chunks/a.b.js',
  ])(
    'when %s is a file or a machine route, it skips the locale redirect',
    (path) => {
      expect(isExcluded(path)).toBe(true)
    },
  )

  it.each([
    '/',
    '/about',
    '/tabatinga/agenda',
    '/pt-br',
    '/en/about',
    '/blog/v1.2',
    '/pt-br/blog/v1.2',
    '/es/produto/a.b.c',
    '/pasta/x.png',
  ])('when %s is a page, the middleware still handles it', (path) => {
    expect(isExcluded(path)).toBe(false)
  })
})
