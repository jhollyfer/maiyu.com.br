import { createFileRoute } from '@tanstack/react-router'

import { articles } from '#/lib/articles'
import { sitemapXml } from '#/lib/sitemap'
import type { SitemapEntry } from '#/lib/sitemap'

/**
 * As páginas fixas do site, sem prefixo de idioma. O kit escreve cada uma nas três línguas, com
 * o `hreflang` das irmãs e o `x-default` em pt-BR (`lib/sitemap.ts`).
 */
const STATIC_PATHNAMES = [
  '/',
  '/portfolio',
  '/blog',
  '/career',
  '/contact',
] as const

/**
 * O sitemap, servido em `/sitemap.xml`.
 *
 * Rota de servidor e não página: quem consome é o rastreador do buscador, que precisa de
 * `Content-Type` e status próprios. Os artigos saem de `lib/articles.ts`, e não de uma lista
 * escrita aqui: um artigo novo entra no sitemap no mesmo commit que o publica. A raiz do domínio
 * responde 307 para `/pt-br` (`DECISIONS.md` #384), e o kit nunca a lista sem prefixo.
 * _doc-lib/tanstack-start.md#guide/server-routes.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const entries: Array<SitemapEntry> = [
          ...STATIC_PATHNAMES.map((pathname) => ({ pathname })),
          ...articles.map((article) => ({
            pathname: '/blog/'.concat(article.slug),
            lastModified: article.date,
          })),
        ]

        return new Response(sitemapXml(entries), {
          status: 200,
          headers: {
            'content-type': 'application/xml; charset=utf-8',
            'cache-control': 'public, max-age=3600',
          },
        })
      },
    },
  },
})
