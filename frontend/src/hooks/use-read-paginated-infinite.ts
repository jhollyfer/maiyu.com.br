import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query'
import type {
  InfiniteData,
  QueryKey,
  UseInfiniteQueryOptions,
} from '@tanstack/react-query'
import * as React from 'react'

import type { OptionComboboxItem } from '#/components/common/option-combobox/option-combobox-context'
import type { HTTPError } from '#/integrations/tanstack-query/http'
import { fireAndForget } from '#/lib/fire-and-forget'

import { useDebouncedValue } from './use-debounced-value'

/**
 * A espera entre a última tecla e a consulta. Sem ela, digitar "robótica"
 * dispararia oito consultas para usar a última.
 */
const SEARCH_DELAY = 300

/**
 * Uma página do envelope paginado de `shared/` (`{ data, meta }`); aqui só `data` importa.
 * `Array` e não `ReadonlyArray`: é o que o `z.infer` do envelope devolve, e o tipo da página
 * entra invariante nos callbacks das opções (`enabled`, `select`), então uma página `readonly`
 * recusaria a `queryFn` de toda entidade.
 */
type Page<TItem> = { data: Array<TItem> }

/** As `infiniteQueryOptions` da entidade, com a página do envelope e `page` como cursor. */
export type PaginatedInfiniteQueryOptions<
  TItem,
  TQueryKey extends QueryKey = QueryKey,
> = UseInfiniteQueryOptions<
  Page<TItem>,
  HTTPError,
  InfiniteData<Page<TItem>, number>,
  TQueryKey,
  number
>

/**
 * A leitura paginada de uma entidade para o combobox com busca no servidor.
 *
 * Genérica de propósito: cada entidade só declara a consulta e como o registro
 * vira opção, num hook fino `use<Entidade>ReadPaginatedInfinite`
 * (`_standards/frontend.md` §2.1 e §7). É a mesma forma do `useJobSocket`: o
 * mecanismo uma vez, a entidade por cima. O `useInfiniteQuery` nunca fica solto
 * no componente do combobox.
 *
 * `keepPreviousData` (antes das opções da entidade, que podem trocá-lo): a lista
 * antiga fica na tela enquanto a busca nova chega, em vez de piscar o esqueleto a
 * cada tecla (_doc-lib/tanstack-query.md#guides/placeholder-query-data,
 * https://tanstack.com/query/latest/docs/framework/react/guides/placeholder-query-data).
 *
 * **A `queryFn` da entidade não consome o `signal`.** Uma página de "carregar mais" em
 * voo quando a busca muda não pode ser abortada: ela termina e fica no cache, e a volta à
 * busca anterior a encontra pronta; abortar pedia a mesma página de novo
 * (_doc-lib/tanstack-query.md#guides/query-cancellation,
 * https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).
 *
 * Devolve três coisas: `combobox`, pronto para o `useAsyncComboboxSource` ou para
 * espalhar no `OptionCombobox`; `items`, os registros carregados (com a mesma
 * identidade enquanto a query não muda), para quem precisa de mais que o rótulo; e
 * `query`, para estado de carga.
 */
export function useReadPaginatedInfinite<
  TItem,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: (search: string) => PaginatedInfiniteQueryOptions<TItem, TQueryKey>,
  toOption: (item: TItem) => OptionComboboxItem,
  /** Desliga a leitura enquanto falta o recorte - a aula sem curso escolhido. */
  enabled = true,
) {
  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search, SEARCH_DELAY)
  const query = useInfiniteQuery({
    placeholderData: keepPreviousData,
    ...options(debounced),
    enabled,
  })

  const items = React.useMemo(
    () => query.data?.pages.flatMap((page) => page.data) ?? [],
    [query.data],
  )

  return {
    items,
    query,
    combobox: {
      options: items.map(toOption),
      onSearchChange: setSearch,
      onLoadMore: fireAndForget(() => query.fetchNextPage()),
      hasMore: query.hasNextPage,
      isFetchingNextPage: query.isFetchingNextPage,
      /** A lista na tela é a da busca anterior; a nova ainda não chegou. */
      isRefreshing: query.isPlaceholderData,
      status: query.status,
    },
  }
}
