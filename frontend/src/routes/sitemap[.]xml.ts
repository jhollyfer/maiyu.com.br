import { createFileRoute } from '@tanstack/react-router'

import { articles } from '#/lib/articles'
import { STATIC_ENTRIES, buildSitemap } from '#/lib/sitemap'
import type { SitemapEntry } from '#/lib/sitemap'
import { SITE_URL } from '#/lib/site'
import { locales, localizeHref } from '#/paraglide/runtime'

/**
 * O sitemap, servido em `/sitemap.xml`.
 *
 * Rota de servidor e não página: quem consome é o rastreador do buscador, que
 * precisa de `Content-Type` e status próprios.
 *
 * Os artigos saem de `lib/articles.ts`, e não de uma lista escrita aqui: um
 * artigo novo entra no sitemap no mesmo commit que o publica.
 *
 * Cada página entra uma vez por idioma (`/portfolio`, `/en/portfolio`,
 * `/es/portfolio`): são endereços diferentes para o rastreador, e o que não
 * está no sitemap demora a ser descoberto.
 */
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: () => {
        const entries: Array<SitemapEntry> = [
          ...STATIC_ENTRIES,
          ...articles.map((article) => ({
            path: '/blog/'.concat(article.slug),
            lastModified: article.date,
            priority: 0.5,
          })),
        ]

        const localized = locales.flatMap((locale) =>
          entries.map((entry) => ({
            ...entry,
            path: localizeHref(entry.path, { locale }),
          })),
        )

        return new Response(buildSitemap(SITE_URL, localized), {
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
