import * as React from 'react'

import { Button } from '#/components/ui/button'
import { Skeleton } from '#/components/ui/skeleton'
import { m } from '#/paraglide/messages'

import { useAsyncComboboxContext } from './async-combobox-context'

/**
 * The "more" at the end of the list: the next page arrives by itself when the end shows up, and
 * the button is the fallback for whoever has no `IntersectionObserver` or navigates by keyboard
 * without scrolling.
 *
 * **One shot per page.** The observer can fire again before the render that turns
 * `isFetchingMore` on, and a repeated `fetchNextPage` cancels the page in flight and asks for it
 * again (`cancelRefetch` defaults to true): the next page went out twice. So the observer
 * disconnects on the first hit and the effect observes again only when the page has arrived
 * (_doc-lib/tanstack-query.md#guides/infinite-queries,
 * https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries).
 *
 * The sentinel lives inside the scrolling box, after the options, so it only shows when the end
 * does; outside the scroller it was always visible and loaded every page in a row.
 */
export function AsyncComboboxLoadMore(): React.JSX.Element | null {
  const { source } = useAsyncComboboxContext('AsyncComboboxLoadMore')
  const { hasMore, isFetchingMore, isRefreshing, onLoadMore } = source
  const sentinelRef = React.useRef<HTMLDivElement | null>(null)
  const loadMoreRef = React.useRef(onLoadMore)
  // The latest callback, written after the commit: the React Compiler rejects a ref written in render.
  React.useLayoutEffect(() => {
    loadMoreRef.current = onLoadMore
  })
  const idle = hasMore && !isFetchingMore && !isRefreshing

  React.useEffect((): (() => void) | undefined => {
    const node = sentinelRef.current
    if (!node || !idle || typeof IntersectionObserver === 'undefined')
      return undefined

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      observer.disconnect()
      loadMoreRef.current()
    })
    observer.observe(node)

    return (): void => observer.disconnect()
  }, [idle])

  if (!hasMore) return null

  return (
    <div
      ref={sentinelRef}
      data-slot="async-combobox-load-more"
      className="flex flex-col gap-1 p-1"
    >
      {isFetchingMore && (
        <div aria-hidden className="flex flex-col gap-1">
          <Skeleton className="h-7 w-full" />
          <Skeleton className="h-7 w-full" />
        </div>
      )}
      {/* The state is announced once, politely; the button below keeps the visible label. */}
      <span role="status" className="sr-only">
        {isFetchingMore && m.kit_async_combobox_loading_more()}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        // Without this the click takes focus off the input and the popup closes before the page arrives.
        onMouseDown={(event) => event.preventDefault()}
        onClick={onLoadMore}
        disabled={isFetchingMore || isRefreshing}
      >
        {isFetchingMore && m.kit_async_combobox_loading_more()}
        {!isFetchingMore && m.kit_async_combobox_load_more()}
      </Button>
    </div>
  )
}
