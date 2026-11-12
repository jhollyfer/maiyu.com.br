/**
 * The router, born per request (`_standards/frontend.md` §1.4). Start calls `getRouter` on every
 * SSR, so the `QueryClient` of `getContext` is never shared between visitors (`query-context.ts`).
 *
 * `ssr.nonce` is the other half of the CSP of `src/server.ts`: the policy carries `'nonce-...'`,
 * and with a nonce present the browser ignores `'unsafe-inline'` (`lib/security-headers.ts`). Every
 * inline script Start writes (hydration, `ScriptOnce`) needs this nonce, or the page opens as dead
 * HTML. The value comes from the request scope that `src/server.ts` opened, never from module scope
 * (`http.server.ts`); in the browser and in `vite dev` it is `undefined`
 * (_doc-lib/tanstack-start.md#guide/environment-functions,
 * https://raw.githubusercontent.com/tanstack/router/main/docs/start/framework/react/guide/environment-functions.md).
 */
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { createIsomorphicFn } from '@tanstack/react-start'

import { NotFoundPage } from '#/components/common/route-status/not-found-page'
import { RouteError } from '#/components/common/route-status/route-error'
import { requestScope } from '#/integrations/tanstack-query/http.server'
import { getContext } from '#/integrations/tanstack-query/query-context'
import {
  deLocalizeUrl,
  getLocale,
  isExcludedByRouteStrategy,
  isServer,
  localizeUrl,
} from '#/paraglide/runtime'
import { routeTree } from '#/routeTree.gen'
import { ValidationMessage } from '@maiyu/shared'

/** This response's nonce on the server; the client build strips the server branch and its import. */
const readNonce = createIsomorphicFn()
  .server(() => requestScope()?.nonce)
  .client(() => undefined)

export function getRouter() {
  // The validation language is module state: on the server it would be one value for parallel
  // requests in different languages, so only the browser switches it. A language switch is a
  // document navigation, which runs this again (_doc-lib/paraglide.md#/tanstack-start).
  if (!isServer) ValidationMessage.setLocale(getLocale())

  const context = getContext()

  const router = createRouter({
    routeTree,
    context,
    ssr: { nonce: readNonce() },
    // One route tree for every language: `/es/x` comes in as `/x` and every link goes out with the
    // current prefix (_doc-lib/tanstack-router.md#guide/url-rewrites). A route excluded in
    // `routeStrategies` (`/health-check`, `/.well-known/*`) keeps its URL both ways, or the output
    // rewrite would send it to `/pt-br/...` (`DECISIONS.md` #385; runtime `isExcludedByRouteStrategy`).
    rewrite: {
      input: ({ url }) => {
        if (isExcludedByRouteStrategy(url)) return url
        return deLocalizeUrl(url)
      },
      output: ({ url }) => {
        if (isExcludedByRouteStrategy(url)) return url
        return localizeUrl(url)
      },
    },
    // The router preloads, the Query cache decides what is fresh
    // (_doc-lib/tanstack-router.md#guide/preloading).
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultNotFoundComponent: () => <NotFoundPage />,
    // Without a default, an unhandled loader failure falls to the router's unstyled built-in
    // screen in production.
    defaultErrorComponent: ({ error, reset }) => (
      <RouteError error={error} resetErrorBoundary={reset} />
    ),
  })

  // The one `QueryClientProvider` of the app wraps the router here (`query-context.ts`).
  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- declaration merging requires `interface`
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
