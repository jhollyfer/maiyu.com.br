import { baseLocale } from '#/paraglide/runtime'

import { localizedUrl } from './page-head'
import { CONTACT, SITE_IMAGE, SITE_TITLE, SOCIALS } from './site'

/**
 * O JSON-LD que o site publica, montado num lugar só.
 *
 * O mesmo desenho do academy: uma função por tipo, testada, e a rota só decide
 * quando injetar. Nenhuma função devolve string; quem serializa é o
 * `jsonLd` do kit (`lib/page-head.ts`, que escapa o `<`), porque um objeto é o que dá para inspecionar num teste sem
 * reparsear.
 */

/**
 * Um nó de JSON-LD. `unknown` no valor, e não um tipo por schema: o
 * vocabulário do schema.org não é nosso, e redeclará-lo aqui seria uma segunda
 * definição para manter em dia.
 */
export type JsonLd = Record<string, unknown>

/**
 * O endereço da Maiyu como entidade: a home no idioma base (`/pt-br`).
 *
 * Não é a raiz do domínio, que responde 307 (`DECISIONS.md` #384): um `url` que
 * redireciona obriga o buscador a seguir o salto para reconhecer a entidade.
 * Também não é a home do idioma da requisição: a organização é uma só, e três
 * `url` diferentes, um por língua, a partiriam em três para quem lê o grafo.
 * O idioma base é o mesmo do `x-default` do `hreflang`
 * (_doc-lib/paraglide.md#/i18n-routing, https://paraglidejs.com/i18n-routing).
 */
function organizationUrl(): string {
  return localizedUrl('/', baseLocale)
}

/**
 * A Maiyu como empresa.
 *
 * `ProfessionalService` e não `Organization`: é o tipo que o buscador usa para
 * serviço prestado a partir de um endereço, e a busca que traz cliente para uma
 * consultoria do interior do Amazonas é local.
 *
 * Mora na **raiz**, e não na home: é a identidade do site inteiro, e quem
 * chega por um artigo compartilhado precisa que o rastreador saiba de quem é a
 * página.
 */
export function organizationJsonLd(description: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: SITE_TITLE,
    description,
    url: organizationUrl(),
    logo: SITE_IMAGE,
    image: SITE_IMAGE,
    email: CONTACT.email,
    telephone: CONTACT.phoneHref.replace('tel:', ''),
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.street,
      addressLocality: 'Benjamin Constant',
      addressRegion: 'AM',
      addressCountry: 'BR',
    },
    // A sede é em Benjamin Constant, mas quem contrata está dos três lados da
    // fronteira: sem isto o buscador lê a Maiyu como empresa só do Brasil.
    areaServed: [
      { '@type': 'Country', name: 'Brasil' },
      { '@type': 'Country', name: 'Peru' },
      { '@type': 'Country', name: 'Colombia' },
    ],
    sameAs: SOCIALS.map((social) => social.href),
  }
}

/** Os campos de um artigo do diário que o `BlogPosting` publica. */
export type ArticleEntry = {
  title: string
  description: string
  url: string
  image: string
  author: string
  publishedAt: string
}

/**
 * Um artigo do diário.
 *
 * `BlogPosting` é o que faz o buscador mostrar data e autor no resultado, e é
 * a data que diz a quem procura se o texto ainda vale.
 */
export function blogPostingJsonLd(article: ArticleEntry): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    url: article.url,
    image: article.image,
    datePublished: article.publishedAt,
    // A autoria é da Maiyu como organização: os textos saem da equipe, e
    // `Person` anunciaria ao buscador uma pessoa que não assina nada.
    author: {
      '@type': 'Organization',
      name: article.author,
      url: organizationUrl(),
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_TITLE,
      logo: { '@type': 'ImageObject', url: SITE_IMAGE },
    },
  }
}

/** Os campos de um projeto do portfólio que o `CreativeWork` publica. */
export type ProjectEntry = {
  name: string
  description: string
  url: string
  image: string
  dateCreated: string
}

/**
 * A lista do portfólio: um `ItemList` de `CreativeWork`, na ordem da página.
 *
 * Cada item aponta para o site no ar do projeto, e não para uma página daqui:
 * o portfólio não tem página de detalhe, e o que prova o trabalho é o produto.
 */
export function projectListJsonLd(
  projects: ReadonlyArray<ProjectEntry>,
): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: projects.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: project.name,
        description: project.description,
        url: project.url,
        image: project.image,
        dateCreated: project.dateCreated,
        creator: {
          '@type': 'Organization',
          name: SITE_TITLE,
          url: organizationUrl(),
        },
      },
    })),
  }
}
