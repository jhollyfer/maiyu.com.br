import type { QueryClient } from '@tanstack/react-query'
import { isRedirect } from '@tanstack/react-router'
import { fromPartial } from '@total-typescript/shoehorn'
import { expect, test, vi } from 'vitest'

import {
  HTTPError,
  HTTPErrorCode,
  HTTPStatus,
} from '#/integrations/tanstack-query/http'
import { PLATFORM_ROLE } from '@maiyu/shared'
import type { AccountProfileShowResponse } from '@maiyu/shared'

import { SessionGuard } from './session-guard'

vi.mock('#/lib/areas', () => ({
  homeOf: () => ({ to: '/home' }),
}))

const ACCOUNT: AccountProfileShowResponse = {
  id: '0f1e2d3c-4b5a-4987-8a6b-5c4d3e2f1a01',
  name: 'Ana',
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  avatar: null,
  tenant: null,
}

const LOCATION = { publicHref: '/pt-br/orders?page=2' }

function httpError(status: number, code: string): HTTPError {
  return new HTTPError({ message: 'falha', status, code })
}

/** Só o `query` que as guardas chamam: o resto do `QueryClient` não entra na conversa. */
function clientThat(query: () => Promise<unknown>): {
  readonly queryClient: QueryClient
  readonly query: ReturnType<typeof vi.fn>
} {
  const spy = vi.fn(query)

  return { queryClient: fromPartial<QueryClient>({ query: spy }), query: spy }
}

async function thrownBy(run: () => Promise<unknown>): Promise<unknown> {
  try {
    await run()
  } catch (error) {
    return error
  }
  return undefined
}

test('require devolve a conta para o contexto da rota, lida como estática', async () => {
  const { queryClient, query } = clientThat(() => Promise.resolve(ACCOUNT))

  const result = await SessionGuard.require({
    context: { queryClient },
    location: LOCATION,
  })

  expect(result).toEqual({ account: ACCOUNT })
  expect(query).toHaveBeenCalledWith(
    expect.objectContaining({ staleTime: 'static' }),
  )
})

test.each([HTTPStatus.UNAUTHORIZED, HTTPStatus.FORBIDDEN])(
  'require manda %i para a entrada com o destino atual em ?redirect=',
  async (status) => {
    const { queryClient } = clientThat(() =>
      Promise.reject(httpError(status, HTTPErrorCode.AUTHENTICATION_REQUIRED)),
    )

    const thrown = await thrownBy(() =>
      SessionGuard.require({ context: { queryClient }, location: LOCATION }),
    )

    expect(isRedirect(thrown)).toBe(true)
    if (isRedirect(thrown)) {
      expect(thrown.options.to).toBe('/sign-in')
      expect(thrown.options.search).toEqual({ redirect: LOCATION.publicHref })
    }
  },
)

test('require relança a queda do servidor: não é falta de sessão', async () => {
  const failure = httpError(HTTPStatus.BAD_GATEWAY, HTTPErrorCode.UNKNOWN_ERROR)
  const { queryClient } = clientThat(() => Promise.reject(failure))

  const thrown = await thrownBy(() =>
    SessionGuard.require({ context: { queryClient }, location: LOCATION }),
  )

  expect(thrown).toBe(failure)
})

test('require trata a rede fora como erro, não como sessão vencida', async () => {
  const { queryClient } = clientThat(() => Promise.reject(new TypeError('x')))

  const thrown = await thrownBy(() =>
    SessionGuard.require({ context: { queryClient }, location: LOCATION }),
  )

  expect(isRedirect(thrown)).toBe(false)
  expect(thrown).toBeInstanceOf(HTTPError)
})

test('leaveIfSignedIn deixa passar quem não tem sessão, qualquer que seja o erro', async () => {
  const { queryClient } = clientThat(() =>
    Promise.reject(httpError(HTTPStatus.INTERNAL_SERVER_ERROR, 'X')),
  )

  await expect(
    SessionGuard.leaveIfSignedIn({ context: { queryClient }, search: {} }),
  ).resolves.toBeUndefined()
})

test('leaveIfSignedIn leva quem já entrou ao ?redirect= validado', async () => {
  const { queryClient } = clientThat(() => Promise.resolve(ACCOUNT))

  const thrown = await thrownBy(() =>
    SessionGuard.leaveIfSignedIn({
      context: { queryClient },
      search: { redirect: '/pt-br/orders' },
    }),
  )

  expect(isRedirect(thrown)).toBe(true)
  if (isRedirect(thrown)) expect(thrown.options.href).toBe('/pt-br/orders')
})

test('leaveIfSignedIn sem destino leva à casa da conta', async () => {
  const { queryClient } = clientThat(() => Promise.resolve(ACCOUNT))

  const thrown = await thrownBy(() =>
    SessionGuard.leaveIfSignedIn({ context: { queryClient }, search: {} }),
  )

  expect(isRedirect(thrown)).toBe(true)
  if (isRedirect(thrown)) expect(thrown.options.to).toBe('/home')
})
