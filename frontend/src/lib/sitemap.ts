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
    if (entry.lastModified)
      parts.push(`    <lastmod>${escapeXml(entry.lastModified)}</lastmod>`)
    if (entry.priority !== undefined)
      parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`)

    return `  <url>\n${parts.join('\n')}\n  </url>`
  })

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
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
