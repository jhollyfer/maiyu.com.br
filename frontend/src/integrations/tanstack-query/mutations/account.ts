import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'

import type { HTTPError } from '#/integrations/tanstack-query/http'
import { request, send } from '#/integrations/tanstack-query/http'
import { accountKeys } from '#/integrations/tanstack-query/queries/account'
import {
  AccountProfileUpdateResponse,
  type AccountProfileUpdatePayload,
  type AuthenticationSessionSignInPayload,
  type AuthenticationTenantSelectPayload,
} from '@maiyu/shared'

type Options<TRecord, TPayload> = Omit<
  UseMutationOptions<TRecord, HTTPError, TPayload>,
  'mutationFn'
>

/**
 * Entrar (`POST /authentication/sign-in`, 204 e cookies `httpOnly`). A conta que o guard inverso
 * leu antes do login (ou a falha dele) não vale mais: sai do cache antes de a tela navegar, ou o
 * painel abriria com a leitura anterior. A credencial errada é `401 INVALID_CREDENTIALS`, que o
 * `request` não confunde com sessão vencida (sem refresh).
 */
export function useSignIn(
  options?: Options<void, AuthenticationSessionSignInPayload>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: async (body: AuthenticationSessionSignInPayload) => {
      await send((api) => api.post('/authentication/sign-in', { body }))
      queryClient.removeQueries({ queryKey: accountKeys.all })
    },
  })
}

type SignOutOptions = {
  /**
   * Para onde ir depois: a tela dá o destino, porque o kit não digita rota que não é dele. Roda
   * com o cache da conta já limpo, senão o guard inverso da tela de entrada leria a sessão que
   * acabou e devolveria ao painel.
   */
  readonly leave: () => Promise<void> | void
}

/**
 * Sair (`POST /authentication/sign-out`). Quem clica quer sair mesmo que o servidor responda erro
 * (sessão que já venceu devolve 401): o `onSettled` limpa a conta e leva para fora nos dois casos.
 */
export function useSignOut({ leave }: SignOutOptions) {
  const queryClient = useQueryClient()

  return useMutation<void, HTTPError, void>({
    mutationFn: () => send((api) => api.post('/authentication/sign-out', {})),
    onSettled: async () => {
      queryClient.removeQueries({ queryKey: accountKeys.all })
      await leave()
      // Dado de outra conta não pode sobrar para a próxima pessoa do computador.
      queryClient.clear()
    },
  })
}

/**
 * Trocar nome, celular ou senha da própria conta (`PUT /account/profile`). A conta sai do cache em
 * vez de ser invalidada: a guarda lê com `staleTime: 'static'`, e invalidação não vence 'static'
 * (`isStaleByTime`), então só a remoção faz o `router.invalidate()` da tela reler a conta. Trocar
 * senha ou celular derruba as sessões: essa releitura devolve 401 e a guarda leva à entrada.
 */
export function useAccountProfileUpdate(
  options?: Options<AccountProfileUpdateResponse, AccountProfileUpdatePayload>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: async (body: AccountProfileUpdatePayload) => {
      const profile = await request(AccountProfileUpdateResponse, (api) =>
        api.put('/account/profile', { body }),
      )
      queryClient.removeQueries({ queryKey: accountKeys.all })

      return profile
    },
  })
}

/**
 * Trocar o vínculo ativo (`PUT /authentication/tenants/active`). O tenant escopa todo dado do
 * painel: a conta sai do cache (a guarda a relê pelo `router.invalidate()` da tela, ver
 * `useAccountProfileUpdate`) e o resto é invalidado.
 */
export function useSelectTenant(
  options?: Options<void, AuthenticationTenantSelectPayload>,
) {
  const queryClient = useQueryClient()

  return useMutation({
    ...options,
    mutationFn: async (body: AuthenticationTenantSelectPayload) => {
      await send((api) => api.put('/authentication/tenants/active', { body }))
      queryClient.removeQueries({ queryKey: accountKeys.all })
      await queryClient.invalidateQueries()
    },
  })
}
