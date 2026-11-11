import { createFileRoute } from '@tanstack/react-router'

import { readRuntimeEnv } from '#/lib/server-env'
import { robotsTxt } from '#/lib/sitemap'

/**
 * A server route and not a `public/` file: the sitemap's absolute URL and the `Disallow: /`
 * outside production depend on the environment (frontend.md §9.7). `SITE_ENV` is read inside
 * the handler, so the same image serves staging and production
 * (_doc-lib/tanstack-start.md#guide/server-routes).
 */
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () =>
        new Response(
          robotsTxt({ indexable: readRuntimeEnv(process.env).indexable }),
          {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'Cache-Control': 'public, max-age=3600',
            },
          },
        ),
    },
  },
})
