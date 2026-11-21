import { useQueries } from '@tanstack/react-query'
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query'

import type { HTTPError } from '#/integrations/tanstack-query/http'

/** The `queryOptions` of one record by id, from the entity's own `queries/` file. */
export type FetchOneOptions<
  TItem,
  TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<TItem, HTTPError, TItem, TQueryKey>

/**
 * The records of `ids` fetched one by one, so a selected value has a label even when no loaded
 * page brought it (the id that came from the URL, the saved link on an edit form).
 *
 * `useQueries` and not a `map` of `useQuery`: the count changes between renders
 * (_doc-lib/tanstack-query.md#guides/parallel-queries). An id that fails (deleted record, no
 * permission) is left out of `items` and out of `pendingIds`: the caller falls back to the id,
 * and the id is never dropped from the value.
 *
 * Fetch only what is missing: the caller passes `ids` already without the ones it knows.
 */
export function useItemsById<TItem, TQueryKey extends QueryKey = QueryKey>(
  ids: ReadonlyArray<string>,
  fetchOne: (id: string) => FetchOneOptions<TItem, TQueryKey>,
): {
  readonly items: ReadonlyMap<string, TItem>
  readonly pendingIds: ReadonlySet<string>
} {
  const results = useQueries({ queries: ids.map((id) => fetchOne(id)) })

  const items = new Map<string, TItem>()
  const pendingIds = new Set<string>()
  results.forEach((result, index) => {
    const id = ids[index]
    if (id === undefined) return
    if (result.data !== undefined) items.set(id, result.data)
    else if (result.isPending) pendingIds.add(id)
  })

  return { items, pendingIds }
}
