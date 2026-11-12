/**
 * The Start configuration of the whole server, detected by name. With this file in place Start no
 * longer installs its CSRF middleware on its own, so the protection exists only because it is
 * declared here (_doc-lib/tanstack-start.md#guide/middleware,
 * https://raw.githubusercontent.com/tanstack/router/main/docs/start/framework/react/guide/middleware.md,
 * "CSRF Middleware"). Order `[csrf, requestScope]`: the refusal comes before any scope work
 * (`_standards/frontend.md` §3.1, `DECISIONS.md` #336).
 */
import {
  createCsrfMiddleware,
  createMiddleware,
  createStart,
} from '@tanstack/react-start'

import { env } from '#/env'
import { runInRequestScope } from '#/integrations/tanstack-query/http.server'
import { isTrustedOrigin } from '#/lib/server-env'

/**
 * A server function is a same-origin RPC endpoint: without this, any page of another site could
 * call it with the visitor's cookie along. `filter` limits the check to it; SSR and the public
 * server routes (`/robots.txt`, `/health-check`) are not a request another origin can forge with
 * effect. The defaults stay: `Sec-Fetch-Site: same-origin`, `Referer` as fallback, and a request
 * with none of the three refused. Only `origin` changes, because behind the TLS proxy the request
 * URL is `http://` and the browser writes `https://` (`lib/server-env.ts`).
 */
const csrf = createCsrfMiddleware({
  filter: ({ handlerType }) => handlerType === 'serverFn',
  origin: (origin, { request }) =>
    isTrustedOrigin(origin, {
      requestUrl: request.url,
      siteUrl: env.VITE_SITE_URL,
    }),
})

/**
 * The per-request scope (`http.server.ts`). `src/server.ts` already opened it with the nonce, and
 * this call joins it; it stays because request middleware is the boundary the doc names for every
 * SSR, server route and server function. `http.server.ts` never reaches the browser bundle: the
 * Start compiler removes `.server()` and the import it leaves unused from the client build
 * (_doc-lib/tanstack-start.md#guide/import-protection).
 */
const requestScope = createMiddleware({ type: 'request' }).server(({ next }) =>
  runInRequestScope(next),
)

export const startInstance = createStart(() => ({
  requestMiddleware: [csrf, requestScope],
}))
