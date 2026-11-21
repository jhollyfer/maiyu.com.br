import { fromPartial } from '@total-typescript/shoehorn'
import { beforeEach, expect, test, vi } from 'vitest'

import type { Api, ApiCall } from '#/integrations/tanstack-query/http'
import { CitiesListResponse } from '@maiyu/shared'
import type { CityResponse } from '@maiyu/shared'

import { cityBySlugQueryOptions, cityKeys, citiesQueryOptions } from './cities'

const request =
  vi.fn<(schema: unknown, call: ApiCall, options?: unknown) => unknown>()

vi.mock('#/integrations/tanstack-query/http', () => ({
  request: (schema: unknown, call: ApiCall, options?: unknown) =>
    request(schema, call, options),
}))

beforeEach(() => {
  request.mockReset()
})

const city = fromPartial<CityResponse>({
  id: '3f1c2b4a-5d6e-4f70-8a9b-0c1d2e3f4a5b',
  slug: 'benjamin-constant',
})

/** O `ApiCall` que a query passou ao `request`, rodado contra um cliente que só anota a chamada. */
async function pathOf(): Promise<unknown> {
  const call = request.mock.calls[0]?.[1]
  const get = vi.fn()
  await call?.(fromPartial<Api>({ get }))

  return get.mock.calls[0]?.[0]
}

test('toda chave sai do prefixo `cities`, e a de uma cidade tem o slug no fim', () => {
  expect(cityKeys.list().slice(0, 1)).toEqual(cityKeys.all)
  expect(cityKeys.bySlug('tabatinga').slice(0, 1)).toEqual(cityKeys.all)
  expect(cityKeys.scoped('tabatinga').slice(0, 1)).toEqual(cityKeys.all)
  expect(cityKeys.bySlug('tabatinga').at(-1)).toBe('tabatinga')
})

test('as chaves de cidades diferentes não se encontram', () => {
  expect(cityKeys.scoped('tabatinga')).not.toEqual(cityKeys.scoped('letícia'))
  expect(cityKeys.bySlug('tabatinga')).not.toEqual(cityKeys.list())
})

test('o catálogo lê `GET /storefront/cities` e valida pelo schema do shared', async () => {
  request.mockResolvedValue([city])
  const options = citiesQueryOptions()

  await options.queryFn?.(fromPartial({ signal: new AbortController().signal }))

  expect(request.mock.calls[0]?.[0]).toBe(CitiesListResponse)
  expect(await pathOf()).toBe('/storefront/cities')
})

test('a cidade do slug sai do catálogo', async () => {
  request.mockResolvedValue([city])
  const options = cityBySlugQueryOptions('benjamin-constant')

  const found = await options.queryFn?.(
    fromPartial({ signal: new AbortController().signal }),
  )

  expect(found).toEqual(city)
})

test('um slug que nenhuma cidade tem é `null`, não erro', async () => {
  request.mockResolvedValue([city])
  const options = cityBySlugQueryOptions('tabatinga')

  const found = await options.queryFn?.(
    fromPartial({ signal: new AbortController().signal }),
  )

  expect(found).toBeNull()
})
