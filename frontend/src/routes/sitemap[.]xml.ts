import { createFileRoute } from '@tanstack/react-router'

import { articles } from '#/lib/articles'
import { sitemapXml } from '#/lib/sitemap'
import type { SitemapEntry } from '#/lib/sitemap'

/**
 * The site's fixed pages, without a language prefix. The kit writes each one in all three
 * languages, with the siblings' `hreflang` and the `x-default` in pt-BR (`lib/sitemap.ts`).
 */
const STATIC_PATHNAMES = [
  '/',
  '/portfolio',
  '/blog',
  '/career',
  '/contact',
] as const

/**
 * The sitemap, served at `/sitemap.xml`.
 *
 * A server route and not a page: whoever consumes it is the search engine's crawler, which needs
 * its own `Content-Type` and status. The articles come from `lib/articles.ts`, and not from a list
 * written here: a new article enters the sitemap in the same commit that publishes it. The domain
 * root answers 307 to `/pt-br` (`DECISIONS.md` #384), and the kit never lists it without a prefix.
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
