import { defineConfig } from '@inlang/paraglide-js'

/**
 * Paraglide compiler options, read by the Vite plugin and by the CLI: one config so the two never
 * diverge (_doc-lib/paraglide.md#/vite, https://paraglidejs.com/vite).
 *
 * The strategy is declared: the compiler default includes `globalVariable`, which leaks the locale
 * between requests on the server (_doc-lib/paraglide.md#/strategy). Every locale has a lowercase
 * prefix, `/pt-br`, `/en` and `/es`, with the exact root before the wildcard (`DECISIONS.md` #384,
 * _doc-lib/paraglide.md#/i18n-routing, "Prefixing all locales"). The wildcard also catches a
 * prefix in another case: `/pt-BR/about` redirects to `/pt-br/pt-BR/about`, which is a 404.
 *
 * `routeStrategies` keeps the machine routes out of the middleware: no prefix, no 307, the base
 * locale (compiler-options.d.ts `routeStrategies`, `exclude: true`; _doc-lib/paraglide.md#/middleware).
 */
export default defineConfig({
  outdir: './src/paraglide',
  strategy: ['url', 'baseLocale'],
  // No public URL ends in a slash (`_standards/frontend.md`, "barra no fim"): `/about/` comes
  // out as `/en/about` (compiler-options.d.ts `trailingSlash`).
  trailingSlash: 'never',
  // The URLPattern polyfill only loads where the runtime lacks URLPattern: modern browsers skip it
  // in the initial JS (compiler-options.d.ts `lazyUrlPatternPolyfill`, needs Vite 7+ top-level await).
  lazyUrlPatternPolyfill: true,
  urlPatterns: [
    {
      pattern: '/',
      localized: [
        ['pt-BR', '/pt-br'],
        ['en', '/en'],
        ['es', '/es'],
      ],
    },
    {
      pattern: '/:path(.*)?',
      localized: [
        ['pt-BR', '/pt-br/:path(.*)?'],
        ['en', '/en/:path(.*)?'],
        ['es', '/es/:path(.*)?'],
      ],
    },
  ],
  routeStrategies: [
    { match: '/health-check', exclude: true },
    { match: '/robots.txt', exclude: true },
    { match: '/sitemap.xml', exclude: true },
    { match: '/.well-known/:path(.*)?', exclude: true },
  ],
})
