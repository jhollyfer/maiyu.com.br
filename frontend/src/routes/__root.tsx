import { IconContext } from '@phosphor-icons/react'
import type { QueryClient } from '@tanstack/react-query'
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'

import { ThemeProvider } from '#/components/common/theme/theme-provider'
import { ThemeProviderToaster } from '#/components/common/theme/theme-provider-toaster'
import { TooltipProvider } from '#/components/ui/tooltip'
import { env } from '#/env'
import { AppDevtools } from '#/integrations/tanstack-query/devtools'
import { organizationJsonLd } from '#/lib/page-head'
import { SITE_TITLE } from '#/lib/site'
import { THEME_CLASS, readTheme } from '#/lib/theme'
import { m } from '#/paraglide/messages'
import { getLocale } from '#/paraglide/runtime'

import appCss from '../styles.css?url'

/**
 * The body text's woff2, with the hashed address the build generates.
 *
 * `?url` and not a hand-written path: a literal would break on the next build that changed the
 * hash, and would break silently, since a `preload` that points to a 404 does not ruin the page,
 * it just stops speeding up the download.
 */

/**
 * What every route sees in `context`.
 *
 * `type` and not `interface`: it is a local declaration, not a module augmentation.
 */
type RouterContext = {
  queryClient: QueryClient
}

/** The house's default icon: decorative, text-sized, regular stroke (`frontend.md` §10.2). */
const ICON_DEFAULTS = {
  size: '1em',
  weight: 'regular',
  'aria-hidden': true,
} as const

export const Route = createRootRouteWithContext<RouterContext>()({
  // The theme comes from the cookie, read on the server: the first HTML already goes out with the
  // right class and without flashing (`frontend.md` §6, _doc-lib/shadcn.md#docs/dark-mode/tanstack-start).
  loader: () => ({ theme: readTheme() }),
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: m.site_title() },
      /*
       * Without `description` the search engine builds the summary from whatever it finds on the
       * page, and the link card in a messaging app comes out with the title only. A route that
       * wants its own writes it in its own `head`: the deepest one wins in the merge by
       * name.
       */
      { name: 'description', content: m.site_description() },
      /*
       * No `og:url`, `canonical`, `og:title` or `og:image` here, on purpose: the domain root
       * answers 307 to `/pt-br` (`DECISIONS.md` #384), so a global value would declare as
       * canonical a URL that redirects and would be inherited by every route that forgot its own.
       * Each page brings them through the kit's `pageHead`, already prefixed and in its
       * language.
       */
      { property: 'og:site_name', content: SITE_TITLE },
      { property: 'og:type', content: 'website' },
      { name: 'twitter:card', content: 'summary' },
    ],
    links: [
      /*
       * `maiyu-symbol.svg` and not `favicon.svg`. The symbol was redesigned, and
       * `favicon.svg` stays four hours in cache in the browser and in
       * Cloudflare: with the same name, whoever had already visited kept seeing
       * the old icon. `favicon.svg` stays in `public/` for whoever requests it
       * directly.
       */
      /*
       * The `.ico` comes before the SVG: a browser that reads vectors keeps the SVG, and one that
       * does not falls back to the `.ico`, which declares the real 32px size. The
       * `apple-touch-icon` is the iOS shortcut. Official page not checked.
       */
      // The connection to the API opens together with the HTML (`frontend.md` §9.5).
      {
        rel: 'preconnect',
        href: env.VITE_API_URL,
        crossOrigin: 'use-credentials',
      },
      // The app icons `scripts/generate-icons.mjs` writes to `public/` (`frontend.md` §6, "A marca").
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      { rel: 'stylesheet', href: appCss },
    ],
    // The site's identity on every route, and not only on the home: whoever arrives through a
    // shared article needs the crawler to know whose page it is.
    scripts: [
      {
        type: 'application/ld+json',
        children: organizationJsonLd(),
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const { theme } = Route.useLoaderData()

  return (
    // paraglide's `lang`, and not a literal as in the siblings: here the site speaks
    // three languages for real, and the screen reader and the search engine need to know
    // which one this response is in.
    //
    // `suppressHydrationWarning` only here: with `system`, the script that runs before
    // hydration writes the class on `<html>`, a node that diverges by nature
    // (`frontend.md` §3.2).
    <html
      lang={getLocale()}
      className={THEME_CLASS[theme]}
      suppressHydrationWarning
    >
      <head>
        {/*
          The system bar color on mobile, one per theme. Here and not in the route's
          `head`: the `meta` merge deduplicates by `name`, and the light/dark pair has the
          same `name`, so there the second would erase the first.
          The values are the `--background` of `styles.css`.
        */}
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#fafafa"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: dark)"
          content="#080c14"
        />
        <HeadContent />
      </head>
      <body>
        <ThemeProvider theme={theme}>
          <IconContext.Provider value={ICON_DEFAULTS}>
            <TooltipProvider delay={300}>{children}</TooltipProvider>
          </IconContext.Provider>
          <ThemeProviderToaster />
        </ThemeProvider>
        <AppDevtools />
        <Scripts />
      </body>
    </html>
  )
}
