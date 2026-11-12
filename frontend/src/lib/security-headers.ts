/**
 * The frontend server's security headers, in one source for the two places that send them
 * (`_standards/frontend.md` §3.3). Nitro sends none by default, and without `frame-ancestors` the
 * sign-in screen can be embedded in an `iframe` by another site.
 *
 * - `STATIC_SECURITY_HEADERS` goes to Nitro's `routeRules` (`vite.config.ts`) **and** to
 *   `src/server.ts`. The route rule is what reaches the files of `.output/public`: Nitro serves them
 *   from its static handler, which answers before the server entry runs, so `server.ts` never sees
 *   them. `server.ts` repeats them because Nitro drops the route rule headers on a response of
 *   status 400 or more, and the 404 page is one (_doc-lib/nitro.md#docs/lifecycle,
 *   https://nitro.build/raw/docs/lifecycle.md; #docs/routing, https://nitro.build/raw/docs/routing.md).
 * - `documentHeaders` is what changes per request, so only `server.ts` sends it: the CSP with this
 *   request's nonce and the storage origin read at runtime, and `X-Robots-Tag` outside production.
 *
 * Pure and free of `#/` imports: `vite.config.ts` loads this file before the alias exists.
 */

/**
 * The same on every response and in every environment. No `preload` in HSTS: joining the list is a
 * commitment that cannot be undone. Over plain `http` (dev) the browser ignores HSTS by spec.
 */
export const STATIC_SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
} as const

type DocumentHeadersInput = Readonly<{
  /**
   * This request's nonce, or `undefined` in `vite dev`, whose inline scripts (the React refresh
   * preamble) carry none.
   */
  nonce: string | undefined
  /** Origin of the API, the one the browser calls (`VITE_API_URL`). */
  apiOrigin: string
  /** Origin of the bucket (`STORAGE_PUBLIC_URL`); absent, only the API is open. */
  storageOrigin: string | undefined
  /** `SITE_ENV` is `production` (`lib/server-env.ts`). */
  indexable: boolean
}>

/**
 * The scope of the nonce is `script-src` and nothing else. Start writes it on every inline script
 * it renders (hydration, `ScriptOnce`) from `router.options.ssr.nonce`, and the browser reads it
 * back from `<meta property="csp-nonce">` when it hydrates. `style-src` keeps `'unsafe-inline'`:
 * Start inlines route CSS in production, and a strict style policy would drop it
 * (_doc-lib/tanstack-start.md#guide/css-styling,
 * https://raw.githubusercontent.com/tanstack/router/main/docs/start/framework/react/guide/css-styling.md).
 * With a nonce in the list the browser ignores `'unsafe-inline'`, so dev gets the keyword only
 * when there is no nonce.
 */
function scriptSource(nonce: string | undefined): string {
  if (nonce === undefined) return "script-src 'self' 'unsafe-inline'"

  return `script-src 'self' 'nonce-${nonce}'`
}

function contentSecurityPolicy(input: DocumentHeadersInput): string {
  const origins = ["'self'", input.apiOrigin, input.storageOrigin]
    .filter((origin) => origin !== undefined)
    .join(' ')

  return [
    "default-src 'self'",
    scriptSource(input.nonce),
    "style-src 'self' 'unsafe-inline'",
    `img-src ${origins} data: blob:`,
    "font-src 'self' data:",
    `connect-src ${origins}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
}

/**
 * The headers of one response of the server entry: the static ones plus what depends on the
 * request. `X-Robots-Tag` covers what has no `<head>` (sitemap, server route), and who decides is
 * `SITE_ENV`, never `import.meta.env.PROD`, which is the same in staging and production
 * (`_standards/frontend.md` §9.7).
 */
export function documentHeaders(
  input: DocumentHeadersInput,
): Readonly<Record<string, string>> {
  const headers: Record<string, string> = {
    ...STATIC_SECURITY_HEADERS,
    'Content-Security-Policy': contentSecurityPolicy(input),
  }

  if (!input.indexable) headers['X-Robots-Tag'] = 'noindex, nofollow'

  return headers
}

/** 16 random bytes in base64, a new one per response: a nonce reused across visitors is no nonce. */
export function createNonce(): string {
  return btoa(
    String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16))),
  )
}
