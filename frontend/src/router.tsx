import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { getContext } from './integrations/tanstack-query/query-context'
import {
  NotFoundPage,
  NotFoundPageActions,
  NotFoundPageDescription,
  NotFoundPageHomeLink,
  NotFoundPageTitle,
} from '#/components/common/not-found-page'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: () => <NotFoundPage />,

    /*
     * A saída de tudo que falha e não foi tratado.
     *
     * Sem ela, rota sem `errorComponent` cai na tela embutida do TanStack, que
     * em produção é um bloco de texto sem estilo. `reset` vem antes de "voltar
     * ao início": refazer a tentativa costuma resolver sem perder o lugar.
     */
    defaultErrorComponent: ({ reset }) => (
      <NotFoundPage code="500">
        <NotFoundPageTitle>{m.error_title()}</NotFoundPageTitle>
        <NotFoundPageDescription>
          {m.error_subtitle()}. {m.error_description()}
        </NotFoundPageDescription>
        <NotFoundPageActions>
          <Button size="lg" className="rounded-full px-5" onClick={reset}>
            {m.error_retry()}
          </Button>
          <NotFoundPageHomeLink />
        </NotFoundPageActions>
      </NotFoundPage>
    ),
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
