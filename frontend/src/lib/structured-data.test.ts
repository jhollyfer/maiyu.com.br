import { describe, expect, it } from 'vitest'

import {
  blogPostingJsonLd,
  breadcrumbListJsonLd,
  jsonLdScript,
  organizationJsonLd,
} from './structured-data'

const HOME = { name: 'Início', url: 'https://maiyu.com.br' }

describe('organizationJsonLd', () => {
  it('publica o telefone sem o prefixo do link', () => {
    const data = organizationJsonLd('Consultoria')

    expect(data.telephone).toBe('+5597984317149')
  })
})

describe('breadcrumbListJsonLd', () => {
  it('não publica trilha de um degrau só', () => {
    expect(breadcrumbListJsonLd(HOME, [])).toEqual([])
  })

  it('numera a partir de um, com a home no primeiro degrau', () => {
    const [list] = breadcrumbListJsonLd(HOME, [
      { name: 'Diário', url: 'https://maiyu.com.br/blog' },
    ])

    expect(list.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Início', item: HOME.url },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Diário',
        item: 'https://maiyu.com.br/blog',
      },
    ])
  })
})

describe('blogPostingJsonLd', () => {
  it('carrega a data de publicação', () => {
    const data = blogPostingJsonLd({
      title: 'Título',
      description: 'Resumo',
      url: 'https://maiyu.com.br/blog/x',
      image: 'https://maiyu.com.br/x.png',
      author: 'Maiyu',
      publishedAt: '2024-05-15',
    })

    expect(data.datePublished).toBe('2024-05-15')
  })
})

describe('jsonLdScript', () => {
  it('serializa com o tipo que o buscador lê', () => {
    expect(jsonLdScript({ '@type': 'Thing' })).toEqual({
      type: 'application/ld+json',
      children: '{"@type":"Thing"}',
    })
  })
})
