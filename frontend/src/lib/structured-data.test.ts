import { describe, expect, it } from 'vitest'

import { blogPostingJsonLd, organizationJsonLd } from './structured-data'

describe('organizationJsonLd', () => {
  it('publica o telefone sem o prefixo do link', () => {
    const data = organizationJsonLd('Consultoria')

    expect(data.telephone).toBe('+5597984317149')
  })

  it('declara a tríplice fronteira como área atendida', () => {
    const data = organizationJsonLd('Consultoria')

    expect(data.areaServed).toEqual([
      { '@type': 'Country', name: 'Brasil' },
      { '@type': 'Country', name: 'Peru' },
      { '@type': 'Country', name: 'Colombia' },
    ])
  })
})

describe('url da organização', () => {
  it('é a home prefixada no idioma base, nunca a raiz que redireciona', () => {
    expect(organizationJsonLd('Consultoria').url).toBe(
      'https://maiyu.com.br/pt-br',
    )
  })
})

describe('blogPostingJsonLd', () => {
  it('carrega a data de publicação', () => {
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
