import type { Icon } from '@phosphor-icons/react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { QueryKey, UseQueryOptions } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import type { LinkProps } from '@tanstack/react-router'
import * as React from 'react'

import { CommandGroup, CommandItem } from '#/components/ui/command'
import { Spinner } from '#/components/ui/spinner'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import { useGlobalSearchPanelContext } from './global-search-context'

/** One thing a source found: where it leads and how it reads in the list. */
export type GlobalSearchResult = {
  /** Unique across all the sources of the panel. */
  readonly id: string
  readonly title: string
  /** The short line to the right: the kind of thing, or the path to it. */
  readonly hint?: string
  readonly icon?: Icon
  readonly to: LinkProps['to']
  readonly params?: LinkProps['params']
}

/**
 * The group of results of one source, with its heading. It tells the panel how many results it
 * drew (the panel announces the total once), and it is drawn only when it has something to show:
 * a source with nothing found leaves no empty heading behind.
 */
export function GlobalSearchGroup({
  heading,
  count,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CommandGroup>, 'heading'> & {
  readonly heading: string
  /** How many results the children draw. */
  readonly count: number
}): React.JSX.Element | null {
  const { counts } = useGlobalSearchPanelContext('GlobalSearchGroup')
  const groupId = React.useId()

  React.useEffect(() => {
    counts.set(groupId, count)

    return () => counts.delete(groupId)
  }, [counts, groupId, count])

  if (count === 0) return null

  return (
    <CommandGroup data-slot="global-search-group" heading={heading} {...props}>
      {children}
    </CommandGroup>
  )
}

/**
 * A result. Enter or a click fires cmdk's `onSelect`, which navigates through the router and closes
 * the panel. It is not a link inside the item: the option role has presentational children, and a
 * focusable anchor inside it is the nested interactive control axe reports. Focus stays on the text
 * field, and the list is walked with the arrows.
 */
export function GlobalSearchItem({
  result,
  className,
}: Readonly<{
  result: GlobalSearchResult
  className?: string
}>): React.JSX.Element {
  const { close } = useGlobalSearchPanelContext('GlobalSearchItem')
  const navigate = useNavigate()
  const ResultIcon = result.icon

  return (
    <CommandItem
      value={result.id}
      data-slot="global-search-item"
      onSelect={() => {
        close()
        void navigate({ to: result.to, params: result.params })
      }}
      // The check mark the registry adds to every item means "chosen", which a result is not.
      className={cn('gap-3 [&>svg:last-child]:hidden', className)}
    >
      {ResultIcon && (
        <ResultIcon aria-hidden="true" className="text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1 truncate">{result.title}</span>
      {result.hint && (
        <span className="max-w-40 shrink-0 truncate text-xs text-muted-foreground">
          {result.hint}
        </span>
      )}
    </CommandItem>
  )
}

type GlobalSearchSourceProps<TItem> = {
  readonly heading: string
  /**
   * The project's query for a term (`queries/<entity>.ts`, a `queryOptions` that already limits the
   * page and takes no `signal` it does not need). I/O is the project's; the kit only runs it.
   */
  readonly query: (
    term: string,
  ) => UseQueryOptions<
    ReadonlyArray<TItem>,
    Error,
    ReadonlyArray<TItem>,
    QueryKey
  >
  /** How a record becomes a result. */
  readonly toResult: (item: TItem) => GlobalSearchResult
}

/**
 * A place to look that is a query: runs the project's `query` for the typed term and draws the
 * result group. `keepPreviousData` keeps the last results on screen while the next term loads, so
 * the list does not flash empty on every letter (_doc-lib/tanstack-query.md#guides/paginated-queries,
 * https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries). While the first
 * answer is pending it draws a "searching" item (which also keeps the empty message away); a failure
 * draws one error item, so a down source does not look like "nothing found".
 */
export function GlobalSearchSource<TItem>({
  heading,
  query,
  toResult,
}: GlobalSearchSourceProps<TItem>): React.JSX.Element | null {
  const { term } = useGlobalSearchPanelContext('GlobalSearchSource')
  const { data, status } = useQuery({
    ...query(term),
    placeholderData: keepPreviousData,
  })

  if (status === 'pending') {
    return (
      <CommandItem disabled value={`${heading}-pending`}>
        <Spinner aria-label={m.kit_loading()} />
        {m.kit_global_search_pending({ heading })}
      </CommandItem>
    )
  }

  if (status === 'error') {
    return (
      <CommandItem disabled value={`${heading}-error`}>
        {m.kit_global_search_error({ heading })}
      </CommandItem>
    )
  }

  return (
    <GlobalSearchGroup heading={heading} count={data.length}>
      {data.map((item) => {
        const result = toResult(item)
        return <GlobalSearchItem key={result.id} result={result} />
      })}
    </GlobalSearchGroup>
  )
}
