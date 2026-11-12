import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type * as StructuredData from './structured-data'

// The site's address comes from `VITE_SITE_URL`, read when the module loads (`env.ts`). Vite does
// not overwrite a variable already exported in the shell, so the test pins its own through
// `vi.stubEnv` and imports the module afterwards, without depending on the environment of whoever
// runs it. The kit's `vitest.config.ts` does not turn on `unstubEnvs`, so the `afterEach` undoes it
// by hand (_doc-lib/vitest.md#mocking, https://vitest.dev/api/vi#vi-stubenv, opened).
const SITE_URL = 'https://maiyu.com.br'

beforeEach(() => {
  vi.stubEnv('VITE_SITE_URL', SITE_URL)
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

async function loadStructuredData(): Promise<typeof StructuredData> {
  return import('./structured-data')
}

describe('organizationJsonLd', () => {
  it('publishes the phone number without the link prefix', async () => {
    const { organizationJsonLd } = await loadStructuredData()
    const data = organizationJsonLd('Consulting')

    expect(data.telephone).toBe('+5597984317149')
  })

  it('declares the triple border as the area served', async () => {
    const { organizationJsonLd } = await loadStructuredData()
    const data = organizationJsonLd('Consulting')

    expect(data.areaServed).toEqual([
      { '@type': 'Country', name: 'Brasil' },
      { '@type': 'Country', name: 'Peru' },
      { '@type': 'Country', name: 'Colombia' },
    ])
  })
})

describe('organization url', () => {
  it('is the home prefixed with the base language, never the root that redirects', async () => {
    const { organizationJsonLd } = await loadStructuredData()

    expect(organizationJsonLd('Consulting').url).toBe(
      'https://maiyu.com.br/pt-br',
    )
  })
})

describe('blogPostingJsonLd', () => {
  it('carries the publication date', async () => {
    const { blogPostingJsonLd } = await loadStructuredData()
    const data = blogPostingJsonLd({
      title: 'Title',
      description: 'Summary',
      url: 'https://maiyu.com.br/pt-br/blog/x',
      image: 'https://maiyu.com.br/x.png',
      author: 'Maiyu',
      publishedAt: '2024-05-15',
    })

    expect(data.datePublished).toBe('2024-05-15')
  })
})
