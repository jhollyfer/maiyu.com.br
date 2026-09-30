import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

import { routeTree } from './routeTree.gen'
import { getContext } from './integrations/tanstack-query/query-context'
import {
  NotFoundPage,
  NotFoundPageActions,
  NotFoundPageDescription,
  NotFoundPageHomeButton,
  NotFoundPageSubtitle,
  NotFoundPageTitle,
} from '#/components/common/not-found-page'
import { Button } from '#/components/ui/button'
import { m } from '#/paraglide/messages'
import { deLocalizeUrl, localizeUrl } from '#/paraglide/runtime'

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    context,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,

    /*
     * O idioma mora no prefixo do endereço (`/en/portfolio`), e as rotas não
     * sabem disso: `routes/` declara `/portfolio` uma vez só. A entrada tira o
     * prefixo antes de casar a rota, e a saída o devolve em todo `Link`, então
     * quem navega em inglês continua em inglês sem que tela nenhuma monte URL
     * com idioma à mão.
     */
    rewrite: {
      input: ({ url }) => deLocalizeUrl(url),
      output: ({ url }) => localizeUrl(url),
    },
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
        <NotFoundPageSubtitle>{m.error_subtitle()}</NotFoundPageSubtitle>
        <NotFoundPageDescription>
          {m.error_description()}
        </NotFoundPageDescription>
        <NotFoundPageActions>
          <Button size="lg" className="w-fit rounded-full px-6" onClick={reset}>
            {m.error_retry()}
          </Button>
          <NotFoundPageHomeButton />
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
