// @vitest-environment jsdom

import {
  QueryClient,
  QueryClientProvider,
  queryOptions,
} from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { fromPartial } from '@total-typescript/shoehorn'
import { createElement } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

import type { Api, ApiCall } from '#/integrations/tanstack-query/http'
import { accountKeys } from '#/integrations/tanstack-query/queries/account'

import {
  useAccountProfileUpdate,
  useSelectTenant,
  useSignIn,
  useSignOut,
} from './account'

const request = vi.fn<(schema: unknown, call: ApiCall) => unknown>()
const send = vi.fn<(call: ApiCall) => unknown>()

vi.mock('#/integrations/tanstack-query/http', () => ({
  request: (schema: unknown, call: ApiCall) => request(schema, call),
  send: (call: ApiCall) => send(call),
}))

/** Um dado qualquer do painel, ao lado da conta: o que cada mutation limpa ou deixa. */
const ORDERS = queryOptions({
  queryKey: ['orders'],
  queryFn: () => ['pedido'],
})

beforeEach(() => {
  request.mockReset()
  send.mockReset()
})

/** Um cache com a conta e um dado qualquer do painel, para ver o que cada mutation limpa. */
function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  client.setQueryData(accountKeys.profile(), { name: 'Ana' })
  client.setQueryData(ORDERS.queryKey, ['pedido'])
  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client }, children)

  return { client, wrapper }
}

/** O caminho que a mutation pediu ao Tuyau: roda o `ApiCall` contra um cliente que só anota. */
async function calledWith(call: ApiCall | undefined, method: 'post' | 'put') {
  const verb = vi.fn()
  await call?.(fromPartial<Api>({ [method]: verb }))

  return verb.mock.calls[0]
}

test('entrar posta a credencial e tira a conta do cache antes de a tela navegar', async () => {
  send.mockResolvedValue(undefined)
  const { client, wrapper } = setup()
  const { result } = renderHook(() => useSignIn(), { wrapper })

  result.current.mutate({ login: 'ana@mail.com', password: 'segredo' })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(await calledWith(send.mock.calls[0]?.[0], 'post')).toEqual([
    '/authentication/sign-in',
    { body: { login: 'ana@mail.com', password: 'segredo' } },
  ])
  expect(client.getQueryData(accountKeys.profile())).toBeUndefined()
  expect(client.getQueryData(ORDERS.queryKey)).toEqual(['pedido'])
})

test('sair limpa a conta e leva para fora, com o cache já limpo', async () => {
  send.mockResolvedValue(undefined)
  const { client, wrapper } = setup()
  let accountOnLeave: unknown = 'não rodou'
  const leave = vi.fn(() => {
    accountOnLeave = client.getQueryData(accountKeys.profile())
  })
  const { result } = renderHook(() => useSignOut({ leave }), { wrapper })

  result.current.mutate()
  await waitFor(() => expect(leave).toHaveBeenCalled())

  expect(accountOnLeave).toBeUndefined()
  // O resto do cache também sai: dado de outra conta não fica para a próxima pessoa.
  await waitFor(() =>
    expect(client.getQueryData(ORDERS.queryKey)).toBeUndefined(),
  )
})

test('sair leva para fora mesmo quando o servidor recusa (sessão que já venceu)', async () => {
  send.mockRejectedValue(new Error('401'))
  const { wrapper } = setup()
  const leave = vi.fn()
  const { result } = renderHook(() => useSignOut({ leave }), { wrapper })

  result.current.mutate()

  await waitFor(() => expect(leave).toHaveBeenCalledTimes(1))
})

test('trocar o perfil tira a conta do cache: a guarda a lê como estática e só a remoção a relê', async () => {
  const profile = { id: 'x', name: 'Ana Maria' }
  request.mockResolvedValue(profile)
  const { client, wrapper } = setup()
  const { result } = renderHook(() => useAccountProfileUpdate(), { wrapper })

  result.current.mutate({ name: 'Ana Maria', currentPassword: 'segredo' })
  await waitFor(() => expect(result.current.data).toEqual(profile))

  expect(await calledWith(request.mock.calls[0]?.[1], 'put')).toEqual([
    '/account/profile',
    { body: { name: 'Ana Maria', currentPassword: 'segredo' } },
  ])
  expect(client.getQueryData(accountKeys.profile())).toBeUndefined()
})

test('trocar o vínculo tira a conta e invalida o resto do painel', async () => {
  send.mockResolvedValue(undefined)
  const { client, wrapper } = setup()
  const { result } = renderHook(() => useSelectTenant(), { wrapper })

  result.current.mutate({ tenantId: '0f1e2d3c-4b5a-4987-8a6b-5c4d3e2f1a01' })
  await waitFor(() => expect(result.current.isSuccess).toBe(true))

  expect(await calledWith(send.mock.calls[0]?.[0], 'put')).toEqual([
    '/authentication/tenants/active',
    { body: { tenantId: '0f1e2d3c-4b5a-4987-8a6b-5c4d3e2f1a01' } },
  ])
  expect(client.getQueryData(accountKeys.profile())).toBeUndefined()
  expect(client.getQueryState(ORDERS.queryKey)?.isInvalidated).toBe(true)
})
