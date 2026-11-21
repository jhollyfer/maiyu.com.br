import { queryOptions } from '@tanstack/react-query'

import { request } from '#/integrations/tanstack-query/http'
import { CitiesListResponse } from '@maiyu/shared'
import type { CityResponse } from '@maiyu/shared'

/**
 * As chaves das cidades, do kit (bloco `city`, DECISIONS.md #794). A fábrica única do projeto
 * (`hooks/tanstack-query/_query-keys.ts`, `frontend.md` §2.1) as reexporta como
 * `queryKeys.cities = cityKeys`. `scoped(slug)` é o prefixo de tudo que o projeto lê de uma cidade
 * (`[...cityKeys.scoped(slug), 'properties']`): trocar de cidade ou sair dela limpa o prefixo de uma
 * vez, sem tocar o catálogo (`all`).
 */
export const cityKeys = {
  all: ['cities'] as const,
  list: () => [...cityKeys.all, 'list'] as const,
  bySlug: (slug: string) => [...cityKeys.all, 'by-slug', slug] as const,
  scoped: (slug: string) => [...cityKeys.all, 'scoped', slug] as const,
} as const

/** O catálogo público de cidades (`GET /storefront/cities`), o que o seletor de cidade mostra. */
export function citiesQueryOptions() {
  return queryOptions({
    queryKey: cityKeys.list(),
    queryFn: ({ signal }) =>
      request(CitiesListResponse, (api) => api.get('/storefront/cities', {}), {
        signal,
      }),
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * A cidade do segmento da URL, ou `null` quando nenhuma tem o slug (quem lê responde com o 404 da
 * rota, `CityGuard`). O catálogo é pequeno e o seletor já o carrega, então não há rota por slug no
 * backend: a busca é no catálogo, e `null` é resposta, não erro.
 */
export function cityBySlugQueryOptions(slug: string) {
  return queryOptions({
    queryKey: cityKeys.bySlug(slug),
    queryFn: async ({ signal }): Promise<CityResponse | null> => {
      const cities = await request(
        CitiesListResponse,
        (api) => api.get('/storefront/cities', {}),
        { signal },
      )

      return cities.find((city) => city.slug === slug) ?? null
    },
    staleTime: 5 * 60 * 1000,
  })
}
