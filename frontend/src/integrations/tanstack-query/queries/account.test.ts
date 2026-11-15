import { QueryClient } from '@tanstack/react-query'
import { fromPartial } from '@total-typescript/shoehorn'
import { beforeEach, expect, test, vi } from 'vitest'

import type { Api, ApiCall } from '#/integrations/tanstack-query/http'
import {
  AccountProfileShowResponse,
  AuthenticationTenantsResponse,
} from '@maiyu/shared'

import {
  accountKeys,
  accountQueryOptions,
  accountTenantsQueryOptions,
} from './account'

const request =
  vi.fn<(schema: unknown, call: ApiCall, options?: unknown) => unknown>()

vi.mock('#/integrations/tanstack-query/http', () => ({
  request: (schema: unknown, call: ApiCall, options?: unknown) =>
    request(schema, call, options),
}))

beforeEach(() => {
  request.mockReset()
})

/** O `ApiCall` que a query passou ao `request`, rodado contra um cliente que só anota a chamada. */
async function pathOf(): Promise<unknown> {
  const call = request.mock.calls[0]?.[1]
  const get = vi.fn()
  await call?.(fromPartial<Api>({ get }))

  return get.mock.calls[0]?.[0]
}

test('todas as chaves da conta saem do prefixo `account`, o que a sessão vencida limpa de uma vez', () => {
  expect(accountKeys.profile().slice(0, 1)).toEqual(accountKeys.all)
  expect(accountKeys.tenants().slice(0, 1)).toEqual(accountKeys.all)
  expect(accountKeys.profile()).not.toEqual(accountKeys.tenants())
})

test('a conta é lida em GET /account/profile, pelo schema do shared', async () => {
  request.mockResolvedValue({ id: 'x' })

  await new QueryClient().fetchQuery(accountQueryOptions())

  expect(request.mock.calls[0]?.[0]).toBe(AccountProfileShowResponse)
  // O `signal` do Query segue até o fetch: desmontar a tela aborta a leitura.
  expect(request.mock.calls[0]?.[2]).toHaveProperty('signal')
  expect(await pathOf()).toBe('/account/profile')
})

test('os vínculos são lidos em GET /authentication/tenants, pelo schema do shared', async () => {
  request.mockResolvedValue({ activeId: null, data: [] })

  await new QueryClient().fetchQuery(accountTenantsQueryOptions())

  expect(request.mock.calls[0]?.[0]).toBe(AuthenticationTenantsResponse)
  expect(await pathOf()).toBe('/authentication/tenants')
})

test('a leitura de tela da conta vale cinco minutos; a guarda lê como estática por conta dela', () => {
  expect(accountQueryOptions().staleTime).toBe(5 * 60 * 1000)
})
