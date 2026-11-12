import type { QueryClient } from '@tanstack/react-query'
import { redirect } from '@tanstack/react-router'

import { HTTPError, HTTPStatus } from '#/integrations/tanstack-query/http'
import { accountQueryOptions } from '#/integrations/tanstack-query/queries/account'
import { homeOf } from '#/lib/areas'
import type { RedirectSearch } from '#/lib/redirect-search'
import type { AccountProfileShowResponse } from '@maiyu/shared'

type GuardContext = {
  readonly context: { readonly queryClient: QueryClient }
}

type RequireOptions = GuardContext & {
  /**
   * `publicHref`, nunca `href`: com a reescrita de idioma `href` é o caminho interno, sem o
   * `/pt-br`, e o destino guardado perderia o idioma de quem estava na tela (relato do manganga).
   * É também o que `router.history.push` espera depois do login.
   */
  readonly location: { readonly publicHref: string }
}

type LeaveOptions = GuardContext & {
  readonly search: RedirectSearch
}

/**
 * As duas guardas de sessão das rotas, no layout e não na tela, para que rota nova nasça coberta
 * por estar no lugar certo (`frontend.md` §1.1, §1.3;
 * _doc-lib/tanstack-router.md#guide/authenticated-routes,
 * https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes).
 *
 * Os dois usam `context.queryClient.query()` com `staleTime: 'static'` (o antigo `ensureQueryData`):
 * devolve o dado e propaga o erro. Engolir o erro faria a guarda nunca recusar.
 *
 * Classe e não funções: a casa da regra fica no nome (`typescript.md` §6).
 */
export class SessionGuard {
  /**
   * O portão do `_private`: devolve `{ account }` para o `beforeLoad` pôr no contexto da rota. Sem
   * sessão (401, ou 403 de conta que perdeu o acesso) vai à entrada com `?redirect=` da tela; o
   * `request` já tentou renovar pelo refresh antes de deixar o 401 subir. Falha de servidor ou de
   * rede **não** é falta de sessão: sobe ao `defaultErrorComponent`, senão o painel
   * deslogaria todo mundo a cada queda da API.
   */
  static async require({
    context,
    location,
  }: RequireOptions): Promise<{ account: AccountProfileShowResponse }> {
    try {
      const account = await context.queryClient.query({
        ...accountQueryOptions(),
        staleTime: 'static',
      })

      return { account }
    } catch (error) {
      const failure = HTTPError.from(error)
      const refused =
        failure.status === HTTPStatus.UNAUTHORIZED ||
        failure.status === HTTPStatus.FORBIDDEN
      if (!refused) throw failure

      // `redirect` fora do `try` do portão: lançado de dentro dele, o `catch` o engoliria.
      throw redirect({
        to: '/sign-in',
        search: { redirect: location.publicHref },
      })
    }
  }

  /**
   * A guarda inversa da entrada: quem já tem sessão não vê o formulário. Vai ao destino do
   * `?redirect=` validado, ou à casa da conta (`homeOf`). Sem sessão é o caso normal da tela:
   * segue para o formulário, qualquer que seja o erro.
   */
  static async leaveIfSignedIn({
    context,
    search,
  }: LeaveOptions): Promise<void> {
    let account: AccountProfileShowResponse
    try {
      account = await context.queryClient.query({
        ...accountQueryOptions(),
        staleTime: 'static',
      })
    } catch {
      return
    }

    // Fora do `try`: o `redirect` é lançado, e dentro dele o `catch` o engoliria e o sintoma seria
    // um login que aceita a senha e não sai da tela.
    if (search.redirect) redirect({ href: search.redirect, throw: true })

    redirect({ ...homeOf(account), throw: true })
  }
}
