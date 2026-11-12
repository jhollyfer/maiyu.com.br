import { useInfiniteQuery } from '@tanstack/react-query'
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

/** Uma página do envelope paginado de `shared/` (`{ data, meta }`); aqui só `data` importa. */
type Page<TItem> = { readonly data: ReadonlyArray<TItem> }

/** As `infiniteQueryOptions` da entidade, com a página do envelope e `page` como cursor. */
export type PaginatedInfiniteQueryOptions<TItem> = UseInfiniteQueryOptions<
  Page<TItem>,
  HTTPError,
  InfiniteData<Page<TItem>, number>,
  QueryKey,
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
 * Devolve três coisas: `combobox`, pronto para espalhar no `OptionCombobox`;
 * `items`, os registros carregados, para quem precisa de mais que o rótulo; e
 * `query`, para estado de carga.
 */
export function useReadPaginatedInfinite<TItem>(
  options: (search: string) => PaginatedInfiniteQueryOptions<TItem>,
  toOption: (item: TItem) => OptionComboboxItem,
  /** Desliga a leitura enquanto falta o recorte - a aula sem curso escolhido. */
  enabled = true,
) {
  const [search, setSearch] = React.useState('')
  const debounced = useDebouncedValue(search, SEARCH_DELAY)
  const query = useInfiniteQuery({ ...options(debounced), enabled })

  const items = query.data?.pages.flatMap((page) => page.data) ?? []

  return {
    items,
    query,
    combobox: {
      options: items.map(toOption),
      onSearchChange: setSearch,
      onLoadMore: fireAndForget(() => query.fetchNextPage()),
      hasMore: query.hasNextPage,
      status: query.status,
    },
  }
}
