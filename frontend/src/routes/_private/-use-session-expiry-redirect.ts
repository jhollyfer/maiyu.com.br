import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import * as React from 'react'

import { HTTPError, HTTPStatus } from '#/integrations/tanstack-query/http'
import { accountKeys } from '#/integrations/tanstack-query/queries/account'

type SessionExpiryRedirectOptions = {
  /**
   * The way to the sign-in screen with the current screen as `redirect`. It is a prop and not a
   * `navigate` inside the hook so the test hands it a double; the `_private` layout passes
   * `router.navigate({ to: '/sign-in', search: { redirect } })` (DECISIONS.md #491).
   */
  readonly signIn: (redirect: string) => Promise<void>
}

/**
 * Sessão que vence no meio do uso: o `beforeLoad` do `_private` só olha a
 * sessão na navegação, e um 401 que chega depois (refetch em segundo plano,
 * mutation) deixaria a tela parada num erro. O layout assina o `QueryCache` e o
 * `MutationCache` e manda para o login com `?redirect=` da tela atual
 * (`_standards/frontend.md` §3.2).
 *
 * Só 401: o `request` já tentou renovar a sessão antes de deixar o 401 subir.
 * 403 no meio do uso é falta de permissão para aquela ação, não sessão vencida,
 * e fica com a tela.
 *
 * O evento `updated` com `action.type === 'error'` é o que o cache emite quando
 * uma query ou mutation falha (tipos instalados de `@tanstack/query-core`,
 * `NotifyEventQueryUpdated` e `NotifyEventMutationUpdated`; a referência do
 * `QueryCache`/`MutationCache` não tem entrada em `_doc-lib/tanstack-query.md`:
 * página oficial não conferida). O redirect segue
 * _doc-lib/tanstack-router.md#guide/authenticated-routes
 * (https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes).
 *
 * ```ts
 * useSessionExpiryRedirect({
 *   signIn: (redirect) => router.navigate({ to: '/sign-in', search: { redirect } }),
 * })
 * ```
 */
export function useSessionExpiryRedirect({
  signIn,
}: SessionExpiryRedirectOptions): void {
  const queryClient = useQueryClient()
  const router = useRouter()

  React.useEffect(() => {
    // Vários 401 chegam juntos quando a sessão cai (cada query ativa falha):
    // um redirect basta. A flag vive na assinatura, nunca no módulo, que no SSR
    // é compartilhado entre requisições.
    let leaving = false

    function leaveOn(error: unknown): void {
      if (leaving) return
      if (HTTPError.from(error)?.status !== HTTPStatus.UNAUTHORIZED) return
      // Navegação em curso: quem decide é a guarda da rota (`SessionGuard`), que redireciona sozinha. Sem isto, sair
      // mandava a conta recém-removida do cache para a leitura da guarda inversa da entrada, o 401 dela chegava aqui
      // antes de o painel desmontar, e a entrada abria com `?redirect=` apontando para ela mesma.
      if (router.state.status === 'pending') return

      leaving = true
      // Sem tirar a conta do cache, o guard inverso de `/sign-in` leria
      // a sessão antiga e devolveria para o painel.
      queryClient.removeQueries({ queryKey: accountKeys.all })
      // `publicHref` and not `href`: with the language rewrite, `href` is the internal path
      // without `/pt-br`, and the saved destination would lose the language (relato do manganga).
      void signIn(router.state.location.publicHref)
    }

    const stopQueries = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        leaveOn(event.action.error)
      }
    })
    const stopMutations = queryClient.getMutationCache().subscribe((event) => {
      if (event.type === 'updated' && event.action.type === 'error') {
        leaveOn(event.action.error)
      }
    })

    return () => {
      stopQueries()
      stopMutations()
    }
  }, [queryClient, router, signIn])
}
