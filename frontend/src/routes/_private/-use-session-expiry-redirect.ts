import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import * as React from 'react'

import { HTTPError, HTTPStatus } from '#/integrations/tanstack-query/http'

type SessionExpiryRedirectOptions = {
  /** The account's cache key (`queryKeys.account.all` of the project). */
  readonly accountKey: QueryKey
  /**
   * The way to the sign-in screen with the current screen as `redirect`: the route is the
   * project's, so it comes in here instead of a `to` the kit would type against routes it does
   * not have (`KIT.md`, I/O of the project by prop).
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
 *   accountKey: queryKeys.account.all,
 *   signIn: (redirect) => router.navigate({ to: '/sign-in', search: { redirect } }),
 * })
 * ```
 */
export function useSessionExpiryRedirect({
  accountKey,
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

      leaving = true
      // Sem tirar a conta do cache, o guard inverso de `/sign-in` leria
      // a sessão antiga e devolveria para o painel.
      queryClient.removeQueries({ queryKey: accountKey })
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
  }, [queryClient, router, accountKey, signIn])
}
