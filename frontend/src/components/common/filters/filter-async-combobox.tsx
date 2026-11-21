import type { QueryKey } from '@tanstack/react-query'

import {
  AsyncCombobox,
  AsyncComboboxChips,
  AsyncComboboxClear,
  AsyncComboboxInput,
} from '#/components/common/async-combobox/async-combobox'
import { AsyncComboboxList } from '#/components/common/async-combobox/async-combobox-list'
import { useAsyncComboboxSource } from '#/hooks/use-async-combobox-source'
import type { AsyncComboboxQuery } from '#/hooks/use-async-combobox-source'

import { FilterSection } from './filter-section'

type FilterAsyncComboboxProps<
  TItem,
  TListKey extends QueryKey,
  TOneKey extends QueryKey,
> = {
  /** The storage key of the open section and the `data-slot` suffix: one axis, one stable value. */
  readonly axis: string
  readonly title: string
  readonly query: AsyncComboboxQuery<TItem, TListKey, TOneKey>
  /**
   * The ids the URL carries (`?authors=a,b`). The URL is the source of truth: an id no page has
   * loaded yet is hydrated by `query.fetchOne` and is never dropped from this list.
   */
  readonly value: ReadonlyArray<string>
  /**
   * The screen binds the new ids to the `ListShell` draft (`set`, applied by "Aplicar") or, outside
   * the shell, writes them to the route search (`navigate({ search, replace: true })`).
   */
  readonly onValueChange: (value: Array<string>) => void
  /** One id at most: the route's search has a scalar, not a list. */
  readonly single?: boolean
  readonly placeholder?: string
  readonly visibleChips?: number
}

/**
 * A listing filter by entity (author, category, owner) that searches the server as you type, in
 * the filters panel: `FilterSection` around the `AsyncCombobox`. It does not know the route: the
 * ids come in and go out by prop, like every filter of the kit, and the screen binds them to the
 * draft of the panel or the URL search (`_standards/frontend.md` §2.1 and §8; the applied state
 * lives in the URL, `lib/list-search.ts`).
 */
export function FilterAsyncCombobox<
  TItem,
  TListKey extends QueryKey = QueryKey,
  TOneKey extends QueryKey = QueryKey,
>({
  axis,
  title,
  query,
  value,
  onValueChange,
  single = false,
  placeholder,
  visibleChips,
}: FilterAsyncComboboxProps<TItem, TListKey, TOneKey>): React.JSX.Element {
  const source = useAsyncComboboxSource(query, value)

  return (
    <FilterSection axis={axis} title={title} data-slot={`filter-${axis}`}>
      {single && (
        <AsyncCombobox
          source={source}
          label={title}
          value={value[0] ?? null}
          onValueChange={(next) => {
            if (next === '') onValueChange([])
            else onValueChange([next])
          }}
        >
          <AsyncComboboxInput aria-label={title} placeholder={placeholder}>
            <AsyncComboboxClear />
          </AsyncComboboxInput>
          <AsyncComboboxList />
        </AsyncCombobox>
      )}
      {!single && (
        <AsyncCombobox
          multiple
          source={source}
          label={title}
          value={value}
          onValueChange={onValueChange}
        >
          <AsyncComboboxChips
            aria-label={title}
            placeholder={placeholder}
            visibleChips={visibleChips}
          />
          <AsyncComboboxList />
        </AsyncCombobox>
      )}
    </FilterSection>
  )
}
