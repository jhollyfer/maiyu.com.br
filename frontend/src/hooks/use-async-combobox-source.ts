import type { QueryKey } from '@tanstack/react-query'

import type { AsyncComboboxSource } from '#/components/common/async-combobox/async-combobox-context'
import type { OptionComboboxItem } from '#/components/common/option-combobox/option-combobox-context'

import type { FetchOneOptions } from './use-items-by-id'
import { useReadPaginatedInfinite } from './use-read-paginated-infinite'
import type { PaginatedInfiniteQueryOptions } from './use-read-paginated-infinite'
import { useSelectedOptions } from './use-selected-options'

export type AsyncComboboxQuery<
  TItem,
  TListKey extends QueryKey = QueryKey,
  TOneKey extends QueryKey = QueryKey,
> = {
  /** The entity's infinite query for a search term (`queries/<entity>.ts`, no `signal`). */
  readonly options: (
    search: string,
  ) => PaginatedInfiniteQueryOptions<TItem, TListKey>
  /** One record by id, to label the chosen value that no loaded page has. */
  readonly fetchOne: (id: string) => FetchOneOptions<TItem, TOneKey>
  /** How a record becomes `{ value, label }`; the `value` is the record id. */
  readonly toOption: (item: TItem) => OptionComboboxItem
  /** Off while the cut is missing (the class without a chosen course). */
  readonly enabled?: boolean
}

/**
 * Everything the `AsyncCombobox` needs, from the entity's query: the paginated read with search
 * (debounced there), the label of the chosen ids (cache of the seen pages, then fetch by id) and
 * the load-more state. The only thing that differs between two entities is the `query` object;
 * the entity types stay in the project, the kit knows `{ value, label }` only
 * (_standards/frontend.md §8, `DECISIONS.md` #810).
 */
export function useAsyncComboboxSource<
  TItem,
  TListKey extends QueryKey = QueryKey,
  TOneKey extends QueryKey = QueryKey,
>(
  query: AsyncComboboxQuery<TItem, TListKey, TOneKey>,
  ids: ReadonlyArray<string>,
): AsyncComboboxSource {
  const { items, combobox } = useReadPaginatedInfinite(
    query.options,
    query.toOption,
    query.enabled,
  )
  const { selected, pendingIds } = useSelectedOptions({
    ids,
    loaded: items,
    toOption: query.toOption,
    fetchOne: query.fetchOne,
  })

  return {
    options: combobox.options,
    selected,
    pendingIds,
    status: combobox.status,
    hasMore: combobox.hasMore,
    isFetchingMore: combobox.isFetchingNextPage,
    isRefreshing: combobox.isRefreshing,
    onSearchChange: combobox.onSearchChange,
    onLoadMore: combobox.onLoadMore,
  }
}
