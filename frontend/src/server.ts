/**
 * The server entry, detected by name. Three things per request, around everything Start does
 * (SSR, server route, server function):
 *
 * - the locale: `paraglideMiddleware` resolves it from the URL and keeps it in a per-request
 *   context, so one response never goes out in another's language. It receives the **original**
 *   request, because the router strips the prefix itself (`rewrite` in `router.tsx`) and an
 *   already stripped URL is the redirect loop the page warns about (_doc-lib/paraglide.md#/middleware,
 *   https://paraglidejs.com/middleware);
 * - the request scope with the nonce (`http.server.ts`), which `getRouter` reads for `ssr.nonce`;
 * - the security headers (`lib/security-headers.ts`): the static ones, which Nitro's route rule also
 *   sends for `.output/public` and drops on an error status, plus the CSP and `X-Robots-Tag`.
 *
 * `SITE_ENV` and `STORAGE_PUBLIC_URL` are read here, per request, never at module scope: the build
 * does not freeze them and the same image serves staging and production (`lib/server-env.ts`,
 * _doc-lib/tanstack-start.md#guide/environment-variables).
 *
 * `createServerEntry` keeps the whole callback inside Start's request context, and the default
 * `handler` called with the same `Request` reuses it (_doc-lib/tanstack-start.md#guide/server-entry-point,
 * https://raw.githubusercontent.com/tanstack/router/main/docs/start/framework/react/guide/server-entry-point.md).
 */
import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

import { env } from '#/env'
import { runInRequestScope } from '#/integrations/tanstack-query/http.server'
import { createNonce, documentHeaders } from '#/lib/security-headers'
import { readRuntimeEnv } from '#/lib/server-env'
import { paraglideMiddleware } from '#/paraglide/server'

const API_ORIGIN = new URL(env.VITE_API_URL).origin

/**
 * Production only: the inline scripts `vite dev` injects carry no nonce, and a nonce in the policy
 * would block them. `import.meta.env.PROD` is a build constant, the same in staging.
 */
function responseNonce(): string | undefined {
  if (!import.meta.env.PROD) return undefined

  return createNonce()
}

export default createServerEntry({
  async fetch(request, opts) {
    const runtime = readRuntimeEnv(process.env)
    const nonce = responseNonce()

    const response = await runInRequestScope(
      // `navigation`: a GET/HEAD that accepts HTML also gets the 307, not only `Sec-Fetch-Dest:
      // document`, so curl and crawlers never see a page without the prefix
      // (_doc-lib/paraglide.md#/middleware, server/middleware.d.ts `redirect`).
      () =>
        paraglideMiddleware(request, () => handler.fetch(request, opts), {
          redirect: 'navigation',
        }),
      nonce,
    )

    // A fresh `Response` over the same body: the handler's headers may be immutable, and
    // passing the body on unread keeps the SSR streaming.
    const headers = new Headers(response.headers)
    const secure = documentHeaders({
      nonce,
      apiOrigin: API_ORIGIN,
      storageOrigin: runtime.storageOrigin,
      indexable: runtime.indexable,
    })
    for (const [name, value] of Object.entries(secure)) headers.set(name, value)

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  },
})
