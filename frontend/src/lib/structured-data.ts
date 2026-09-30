import { CONTACT, SITE_IMAGE, SITE_TITLE, SITE_URL, SOCIALS } from './site'

/**
 * O JSON-LD que o site publica, montado num lugar só.
 *
 * O mesmo desenho do academy: uma função por tipo, testada, e a rota só decide
 * quando injetar. Nenhuma função devolve string; quem serializa é
 * `jsonLdScript`, porque um objeto é o que dá para inspecionar num teste sem
 * reparsear.
 */

/**
 * Um nó de JSON-LD. `unknown` no valor, e não um tipo por schema: o
 * vocabulário do schema.org não é nosso, e redeclará-lo aqui seria uma segunda
 * definição para manter em dia.
 */
export type JsonLd = Record<string, unknown>

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
    url: SITE_URL,
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
    sameAs: SOCIALS.map((social) => social.href),
  }
}

/** Um degrau da trilha: o nome que se lê e o caminho absoluto para onde leva. */
export type Crumb = {
  name: string
  url: string
}

/**
 * A trilha de navegação de uma rota de detalhe, com a home sempre no primeiro
 * degrau.
 *
 * Recebe URL já absoluta, e não caminho como no academy: aqui o endereço
 * depende do idioma (`/en/blog/...`), e quem sabe o idioma é a rota.
 *
 * Trilha vazia devolve lista vazia: um `BreadcrumbList` de um degrau só não
 * informa hierarquia nenhuma.
 */
export function breadcrumbListJsonLd(
  home: Crumb,
  trail: ReadonlyArray<Crumb>,
): Array<JsonLd> {
  if (trail.length === 0) return []

  const crumbs = [home, ...trail]

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    },
  ]
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
    author: { '@type': 'Person', name: article.author },
    publisher: {
      '@type': 'Organization',
      name: SITE_TITLE,
      logo: { '@type': 'ImageObject', url: SITE_IMAGE },
    },
  }
}

/**
 * Um objeto de JSON-LD na forma que o `scripts` do `head` recebe.
 *
 * Existe para que nenhuma rota escreva o `type` à mão: um `application/json`
 * digitado por engano é ignorado pelo buscador sem erro nenhum.
 */
export function jsonLdScript(data: JsonLd): {
  type: string
  children: string
} {
  return {
    type: 'application/ld+json',
    children: JSON.stringify(data),
  }
}
