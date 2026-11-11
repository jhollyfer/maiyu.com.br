import { baseLocale, locales, localizeHref } from '#/paraglide/runtime'

/**
 * O XML do sitemap, montado a partir de uma lista de caminhos.
 *
 * Função pura e separada da rota: o que quebra num sitemap é o escape e a
 * montagem da URL absoluta, e os dois são testáveis sem servidor.
 */

export type SitemapEntry = {
  /** Caminho absoluto dentro do site, começando por `/`. */
  path: string
  /** Data da última alteração, `YYYY-MM-DD`. Omitida quando não se sabe. */
  lastModified?: string
  /** Peso relativo entre as páginas do próprio site, de 0 a 1. */
  priority?: number
  /**
   * As versões da mesma página em cada idioma, mais o `x-default`. O Google
   * lê o `hreflang` do sitemap como o da própria página, e cada URL listada
   * precisa carregar o conjunto inteiro, ela mesma incluída
   * (https://developers.google.com/search/docs/specialty/international/localized-versions#sitemap).
   */
  alternates?: Array<SitemapAlternate>
}

export type SitemapAlternate = {
  hrefLang: string
  /** Caminho já com o prefixo de idioma, como `/en/blog`. */
  path: string
}

/**
 * Escapa os cinco caracteres que o XML reserva. Um `&` cru quebra o documento
 * inteiro, e o buscador descarta o arquivo sem avisar.
 */
function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/**
 * Junta a origem ao caminho sem duplicar nem comer a barra: concatenar direto
 * daria `//portfolio`, que é outra URL para o rastreador.
 */
function absolute(origin: string, path: string): string {
  const joined = `${origin.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  const trimmed = joined.replace(/\/$/, '')

  if (!trimmed) return origin

  return trimmed
}

export function buildSitemap(
  origin: string,
  entries: Array<SitemapEntry>,
): string {
  const urls = entries.map(function (entry) {
    const parts = [`    <loc>${escapeXml(absolute(origin, entry.path))}</loc>`]
    for (const alternate of entry.alternates ?? [])
      parts.push(
        `    <xhtml:link rel="alternate" hreflang="${escapeXml(alternate.hrefLang)}" href="${escapeXml(absolute(origin, alternate.path))}"/>`,
      )
    if (entry.lastModified)
      parts.push(`    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`)
    if (entry.priority !== undefined)
      parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)

    return `  <url>\n${parts.join('\n')}\n  </url>`
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n')
}

/** As páginas fixas do site. Os artigos entram pela rota, a partir de `articles`. */
export const STATIC_ENTRIES: Array<SitemapEntry> = [
  { path: '/', priority: 1 },
  { path: '/portfolio', priority: 0.8 },
  { path: '/blog', priority: 0.7 },
  { path: '/career', priority: 0.6 },
  { path: '/contact', priority: 0.6 },
]

/**
 * Cada entrada sem prefixo vira uma por idioma, já prefixada, com o conjunto
 * de `hreflang` das três versões e o `x-default` no idioma base.
 *
 * `localizeHref` e não concatenação: o prefixo mora nos `urlPatterns` de
 * `project.inlang/paraglide.config.ts` (`DECISIONS.md` #384,
 * _doc-lib/paraglide.md#/i18n-routing, https://paraglidejs.com/i18n-routing).
 */
export function localizeEntries(
  entries: ReadonlyArray<SitemapEntry>,
): Array<SitemapEntry> {
  return locales.flatMap((locale) =>
    entries.map((entry) => ({
      ...entry,
      path: localizeHref(entry.path, { locale }),
      alternates: [
        ...locales.map((hrefLang) => ({
          hrefLang,
          path: localizeHref(entry.path, { locale: hrefLang }),
        })),
        {
          hrefLang: 'x-default',
          path: localizeHref(entry.path, { locale: baseLocale }),
        },
      ],
    })),
  )
}
