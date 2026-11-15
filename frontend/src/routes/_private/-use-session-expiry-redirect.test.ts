// @vitest-environment jsdom

import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
} from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { expect, test, vi } from 'vitest'

import {
  HTTPError,
  HTTPErrorCode,
  HTTPStatus,
} from '#/integrations/tanstack-query/http'
import { accountKeys } from '#/integrations/tanstack-query/queries/account'

import { useSessionExpiryRedirect } from './-use-session-expiry-redirect'

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    // Getter: o router é lido na hora do erro, não na montagem do hook.
    state: {
      get status() {
        return status
      },
      location: { publicHref: '/pt-br/orders' },
    },
  }),
}))

let status: 'idle' | 'pending' = 'idle'

const failing = (status: number, key: string) =>
  queryOptions({
    queryKey: [key, status],
    queryFn: () =>
      Promise.reject(
        new HTTPError({
          message: 'falha',
          status,
          code: HTTPErrorCode.AUTHENTICATION_REQUIRED,
        }),
      ),
    retry: false,
  })

function setup() {
  status = 'idle'
  const client = new QueryClient()
  const signIn = vi.fn(() => Promise.resolve())
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)
  renderHook(() => useSessionExpiryRedirect({ signIn }), { wrapper })

  return { client, signIn }
}

test('um 401 que chega no meio do uso leva à entrada com a tela de agora, como o navegador a vê', async () => {
  const { client, signIn } = setup()

  await client.prefetchQuery(failing(HTTPStatus.UNAUTHORIZED, 'a'))

  await waitFor(() => expect(signIn).toHaveBeenCalledWith('/pt-br/orders'))
})

test('vários 401 juntos viram um redirecionamento só', async () => {
  const { client, signIn } = setup()

  await Promise.all([
    client.prefetchQuery(failing(HTTPStatus.UNAUTHORIZED, 'a')),
    client.prefetchQuery(failing(HTTPStatus.UNAUTHORIZED, 'b')),
  ])

  await waitFor(() => expect(signIn).toHaveBeenCalledTimes(1))
})

test('a conta sai do cache antes do redirecionamento, senão a guarda inversa da entrada a leria e voltaria ao painel', async () => {
  const { client, signIn } = setup()
  client.setQueryData(accountKeys.profile(), { name: 'Ana' })

  await client.prefetchQuery(failing(HTTPStatus.UNAUTHORIZED, 'a'))

  await waitFor(() => expect(signIn).toHaveBeenCalled())
  expect(client.getQueryData(accountKeys.profile())).toBeUndefined()
})

test('403 é falta de permissão para aquela ação, não sessão vencida: fica com a tela', async () => {
  const { client, signIn } = setup()

  await client.prefetchQuery(failing(HTTPStatus.FORBIDDEN, 'a'))

  expect(signIn).not.toHaveBeenCalled()
})

test('com uma navegação em curso o 401 fica com a guarda da rota: sair não manda a entrada para ela mesma', async () => {
  const { client, signIn } = setup()
  status = 'pending'

  await client.prefetchQuery(failing(HTTPStatus.UNAUTHORIZED, 'a'))

  expect(signIn).not.toHaveBeenCalled()
})
