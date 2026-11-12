import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type * as StructuredData from './structured-data'

// O endereço do site vem de `VITE_SITE_URL`, lido quando o módulo carrega (`env.ts`). O Vite não
// sobrescreve variável já exportada no shell, então o teste fixa a sua por `vi.stubEnv` e importa
// o módulo depois, sem depender do ambiente de quem roda. O `vitest.config.ts` do kit não liga
// `unstubEnvs`, por isso o `afterEach` desfaz à mão (_doc-lib/vitest.md#mocking,
// https://vitest.dev/api/vi#vi-stubenv, aberta).
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
  it('publica o telefone sem o prefixo do link', async () => {
    const { organizationJsonLd } = await loadStructuredData()
    const data = organizationJsonLd('Consultoria')

    expect(data.telephone).toBe('+5597984317149')
  })

  it('declara a tríplice fronteira como área atendida', async () => {
    const { organizationJsonLd } = await loadStructuredData()
    const data = organizationJsonLd('Consultoria')

    expect(data.areaServed).toEqual([
      { '@type': 'Country', name: 'Brasil' },
      { '@type': 'Country', name: 'Peru' },
      { '@type': 'Country', name: 'Colombia' },
    ])
  })
})

describe('url da organização', () => {
  it('é a home prefixada no idioma base, nunca a raiz que redireciona', async () => {
    const { organizationJsonLd } = await loadStructuredData()

    expect(organizationJsonLd('Consultoria').url).toBe(
      'https://maiyu.com.br/pt-br',
    )
  })
})

describe('blogPostingJsonLd', () => {
  it('carrega a data de publicação', async () => {
    const { blogPostingJsonLd } = await loadStructuredData()
    const data = blogPostingJsonLd({
      title: 'Título',
      description: 'Resumo',
      url: 'https://maiyu.com.br/pt-br/blog/x',
      image: 'https://maiyu.com.br/x.png',
      author: 'Maiyu',
      publishedAt: '2024-05-15',
    })

    expect(data.datePublished).toBe('2024-05-15')
  })
})
