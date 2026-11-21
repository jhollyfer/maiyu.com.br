import type { QueryKey } from '@tanstack/react-query'
import * as React from 'react'

import type { OptionComboboxItem } from '#/components/common/option-combobox/option-combobox-context'

import { useItemsById } from './use-items-by-id'
import type { FetchOneOptions } from './use-items-by-id'

type UseSelectedOptionsParams<TItem, TOneKey extends QueryKey> = {
  /** The chosen ids: the form value, or the ones the URL carries. */
  readonly ids: ReadonlyArray<string>
  /** The records of the pages loaded so far (`useReadPaginatedInfinite().items`). */
  readonly loaded: ReadonlyArray<TItem>
  readonly toOption: (item: TItem) => OptionComboboxItem
  /** The `queryOptions` of one record by id, to label what no loaded page has. */
  readonly fetchOne: (id: string) => FetchOneOptions<TItem, TOneKey>
}

/**
 * The label of every chosen id, in the order of `ids`.
 *
 * Three sources, in this order: the cache of every page the search has shown (a search swaps the
 * pages, and without the cache the chip of the chosen one would vanish with its row), the record
 * fetched by id (`useItemsById`: the id from the URL no page has loaded yet) and, last, the id as
 * its own label. An id is never dropped from the value: the value is the source of truth, the
 * label is hydration (`DECISIONS.md` #810).
 *
 * The cache is filled **in render**, "adjusting state when a prop changes", and not in an effect:
 * the effect painted one frame with the old chips (https://react.dev/learn/you-might-not-need-an-effect).
 * The key is `loaded`, whose identity only changes when the query data does.
 */
export function useSelectedOptions<TItem, TOneKey extends QueryKey = QueryKey>({
  ids,
  loaded,
  toOption,
  fetchOne,
}: UseSelectedOptionsParams<TItem, TOneKey>): {
  readonly selected: ReadonlyArray<OptionComboboxItem>
  readonly pendingIds: ReadonlySet<string>
} {
  const [cache, setCache] = React.useState<
    ReadonlyMap<string, OptionComboboxItem>
  >(() => new Map(loaded.map((item) => [toOption(item).value, toOption(item)])))
  const [seen, setSeen] = React.useState(loaded)
  if (loaded !== seen) {
    setSeen(loaded)
    if (loaded.length > 0) {
      setCache((previous) => {
        const next = new Map(previous)
        loaded.forEach((item) => {
          const option = toOption(item)
          next.set(option.value, option)
        })

        return next
      })
    }
  }

  const missing = ids.filter((id) => id !== '' && !cache.has(id))
  const { items: fetched, pendingIds } = useItemsById(missing, fetchOne)

  const selected = ids.map((id): OptionComboboxItem => {
    const known = cache.get(id)
    if (known) return known
    const record = fetched.get(id)
    if (record !== undefined) return toOption(record)

    return { value: id, label: id }
  })

  return { selected, pendingIds }
}
