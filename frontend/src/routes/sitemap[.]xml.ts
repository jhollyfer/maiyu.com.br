import { createFileRoute } from '@tanstack/react-router'

import { articles } from '#/lib/articles'
import { STATIC_ENTRIES, buildSitemap, localizeEntries } from '#/lib/sitemap'
import type { SitemapEntry } from '#/lib/sitemap'
import { SITE_URL } from '#/lib/site'

/**
 * O sitemap, servido em `/sitemap.xml`.
 *
 * Rota de servidor e não página: quem consome é o rastreador do buscador, que
 * precisa de `Content-Type` e status próprios.
 *
 * Os artigos saem de `lib/articles.ts`, e não de uma lista escrita aqui: um
 * artigo novo entra no sitemap no mesmo commit que o publica.
 *
 * Cada página entra uma vez por idioma (`/pt-br/portfolio`, `/en/portfolio`,
 * `/es/portfolio`): são endereços diferentes para o rastreador, e o que não
 * está no sitemap demora a ser descoberto. Nenhuma entrada é a URL sem prefixo,
 * que responde 307 para `/pt-br` (`DECISIONS.md` #384): redirect no sitemap
 * é URL que o rastreador descarta. Cada entrada leva os `hreflang` das três
 * versões e o `x-default` no idioma base, os mesmos do `head` da página.
 * A rota fica fora do middleware por `routeStrategies`
 * (_doc-lib/paraglide.md#/i18n-routing, https://paraglidejs.com/i18n-routing).
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

        return new Response(buildSitemap(SITE_URL, localizeEntries(entries)), {
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
