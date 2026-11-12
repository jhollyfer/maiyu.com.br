import { baseLocale } from '#/paraglide/runtime'

import { localizedUrl } from './page-head'
import { CONTACT, SITE_IMAGE, SITE_TITLE, SOCIALS } from './site'

/**
 * The JSON-LD the site publishes, assembled in a single place.
 *
 * The same design as academy: one function per type, tested, and the route only decides when to
 * inject. No function returns a string; the one that serializes is the kit's `jsonLd`
 * (`lib/page-head.ts`, which escapes the `<`), because an object is what can be inspected in a
 * test without reparsing.
 */

/**
 * A JSON-LD node. `unknown` in the value, and not one type per schema: the schema.org vocabulary
 * is not ours, and redeclaring it here would be a second definition to keep up to date.
 */
export type JsonLd = Record<string, unknown>

/**
 * Maiyu's address as an entity: the home in the base language (`/pt-br`).
 *
 * It is not the domain root, which answers 307 (`DECISIONS.md` #384): a `url` that redirects forces
 * the search engine to follow the hop to recognize the entity. Nor is it the home of the request's
 * language: the organization is one, and three different `url`s, one per language, would split it
 * into three for whoever reads the graph. The base language is the same as the `hreflang`'s
 * `x-default` (_doc-lib/paraglide.md#/i18n-routing, https://paraglidejs.com/i18n-routing).
 */
function organizationUrl(): string {
  return localizedUrl('/', baseLocale)
}

/**
 * Maiyu as a company.
 *
 * `ProfessionalService` and not `Organization`: it is the type the search engine uses for a
 * service provided from an address, and the search that brings clients to a consultancy from the
 * interior of Amazonas is local.
 *
 * It lives at the **root**, not on the home: it is the identity of the whole site, and whoever
 * arrives through a shared article needs the crawler to know whose page it is.
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
    // The headquarters is in Benjamin Constant, but whoever hires is on all three sides of the
    // border: without this the search engine reads Maiyu as a company of Brazil only.
    areaServed: [
      { '@type': 'Country', name: 'Brasil' },
      { '@type': 'Country', name: 'Peru' },
      { '@type': 'Country', name: 'Colombia' },
    ],
    sameAs: SOCIALS.map((social) => social.href),
  }
}

/** The fields of a journal article that `BlogPosting` publishes. */
export type ArticleEntry = {
  title: string
  description: string
  url: string
  image: string
  author: string
  publishedAt: string
}

/**
 * A journal article.
 *
 * `BlogPosting` is what makes the search engine show date and author in the result, and the date
 * is what tells whoever searches whether the text is still valid.
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
    // Authorship belongs to Maiyu as an organization: the texts come from the team, and
    // `Person` would announce to the search engine a person who signs nothing.
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

/** The fields of a portfolio project that `CreativeWork` publishes. */
export type ProjectEntry = {
  name: string
  description: string
  url: string
  image: string
  dateCreated: string
}

/**
 * The portfolio list: an `ItemList` of `CreativeWork`, in the page's order.
 *
 * Each item points to the project's live site, and not to a page here: the portfolio has no
 * detail page, and what proves the work is the product.
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
