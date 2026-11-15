import { queryOptions } from '@tanstack/react-query'

import { request } from '#/integrations/tanstack-query/http'
import {
  AccountProfileShowResponse,
  AuthenticationTenantsResponse,
} from '@maiyu/shared'

/**
 * As chaves da conta da sessão, do kit (bloco `painel`, DECISIONS.md #491). A fábrica única do
 * projeto (`hooks/tanstack-query/_query-keys.ts`, `frontend.md` §2.1) as reexporta como
 * `queryKeys.account = accountKeys`: `all` é o prefixo que o `useSessionExpiryRedirect`, o sign-out e
 * a troca de tenant limpam de uma vez.
 */
export const accountKeys = {
  all: ['account'] as const,
  profile: () => [...accountKeys.all, 'profile'] as const,
  tenants: () => [...accountKeys.all, 'tenants'] as const,
} as const

/**
 * A conta da sessão com o vínculo ativo (`GET /account/profile`): o que o portão do `_private`
 * põe em `context.account`, o que a guarda de área lê e o que o menu de conta mostra. A mesma
 * `queryOptions` serve ao `beforeLoad` (`query()` com `staleTime: 'static'`) e ao
 * `useQuery` das telas, então os dois leem o mesmo cache (`frontend.md` §3.2).
 *
 * Cinco minutos de `staleTime` para a leitura de tela, o valor que `query-context.ts` cita.
 */
export function accountQueryOptions() {
  return queryOptions({
    queryKey: accountKeys.profile(),
    queryFn: ({ signal }) =>
      request(
        AccountProfileShowResponse,
        (api) => api.get('/account/profile', {}),
        { signal },
      ),
    staleTime: 5 * 60 * 1000,
  })
}

/** Os vínculos da conta e qual está ativo (`GET /authentication/tenants`), para o seletor de tenant. */
export function accountTenantsQueryOptions() {
  return queryOptions({
    queryKey: accountKeys.tenants(),
    queryFn: ({ signal }) =>
      request(
        AuthenticationTenantsResponse,
        (api) => api.get('/authentication/tenants', {}),
        { signal },
      ),
  })
}
