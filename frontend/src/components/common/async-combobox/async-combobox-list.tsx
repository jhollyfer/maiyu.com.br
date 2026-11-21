import * as React from 'react'

import type { OptionComboboxItem } from '#/components/common/option-combobox/option-combobox-context'
import { Alert, AlertDescription } from '#/components/ui/alert'
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#/components/ui/combobox'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { Skeleton } from '#/components/ui/skeleton'
import { cn } from '#/lib/cn'
import { preventSubmitOnEnter } from '#/lib/combobox-search'
import { m } from '#/paraglide/messages'

import { AsyncComboboxBase } from './async-combobox'
import { useAsyncComboboxContext } from './async-combobox-context'
import { AsyncComboboxLoadMore } from './async-combobox-load-more'

const PENDING_ROWS = 4

type AsyncComboboxListProps = {
  /** The text of the empty search; defaults to the kit message. */
  readonly empty?: string
  /** The row of an option; defaults to its label, with the state dot when it has one. */
  readonly renderItem?: (option: OptionComboboxItem) => React.ReactNode
}

/** The loading state before the first page: rows of skeleton, not a spinner (`frontend.md` §10.1). */
export function AsyncComboboxPending(): React.JSX.Element {
  return (
    <div data-slot="async-combobox-pending" className="flex flex-col gap-1 p-1">
      <span role="status" className="sr-only">
        {m.kit_loading()}
      </span>
      {Array.from({ length: PENDING_ROWS }, (_, index) => (
        <Skeleton key={index} aria-hidden className="h-7 w-full" />
      ))}
    </div>
  )
}

/** One option of the list. */
export function AsyncComboboxItem({
  option,
  renderItem,
}: {
  readonly option: OptionComboboxItem
  readonly renderItem?: AsyncComboboxListProps['renderItem']
}): React.JSX.Element {
  return (
    <ComboboxItem data-slot="async-combobox-item" value={option}>
      {renderItem?.(option)}
      {!renderItem && option.dot && (
        <span
          aria-hidden="true"
          className={cn('size-2 shrink-0 rounded-full', option.dot)}
        />
      )}
      {!renderItem && option.label}
    </ComboboxItem>
  )
}

/**
 * What goes inside the popup or the sheet: the loading rows, the error, the empty text, the
 * options and the "more". The options sit in a wrapper that scrolls, with the "more" after them,
 * so the end of the list is where the next page is asked for.
 */
function AsyncComboboxBody({
  empty = m.kit_combobox_empty(),
  renderItem,
  scrollClassName,
}: AsyncComboboxListProps & {
  readonly scrollClassName?: string
}): React.JSX.Element {
  const { source } = useAsyncComboboxContext('AsyncComboboxList')

  if (source.status === 'pending') return <AsyncComboboxPending />
  if (source.status === 'error')
    return (
      <Alert variant="destructive" data-slot="async-combobox-error">
        <AlertDescription>{m.kit_async_combobox_error()}</AlertDescription>
      </Alert>
    )

  return (
    <div
      data-slot="async-combobox-scroll"
      aria-busy={source.isRefreshing}
      className={cn(
        'max-h-[min(calc(--spacing(72)---spacing(9)),calc(var(--available-height)---spacing(9)))] overflow-y-auto overscroll-contain',
        source.isRefreshing && 'opacity-60 transition-opacity',
        scrollClassName,
      )}
    >
      {source.options.length === 0 && (
        <ComboboxEmpty className="flex">{empty}</ComboboxEmpty>
      )}
      <ComboboxList className="max-h-none overflow-visible">
        {source.options.map((option) => (
          <AsyncComboboxItem
            key={option.value}
            option={option}
            renderItem={renderItem}
          />
        ))}
      </ComboboxList>
      <AsyncComboboxLoadMore />
    </div>
  )
}

/**
 * The mobile list: a bottom `Sheet` with the search on top. The search takes the focus on open
 * through the popup's `initialFocus` (the `autoFocus` attribute is forbidden by the lint), so the
 * keyboard opens ready to type.
 */
function AsyncComboboxSheet(props: AsyncComboboxListProps): React.JSX.Element {
  const ctx = useAsyncComboboxContext('AsyncComboboxList')
  const searchRef = React.useRef<HTMLInputElement>(null)

  return (
    <Sheet open={ctx.sheetOpen} onOpenChange={ctx.setSheetOpen}>
      <SheetContent
        side="bottom"
        data-slot="async-combobox-sheet"
        initialFocus={searchRef}
        className="h-[85dvh] gap-0"
      >
        <SheetHeader>
          <SheetTitle>{ctx.label}</SheetTitle>
          <SheetDescription className="sr-only">
            {m.kit_async_combobox_search()}
          </SheetDescription>
        </SheetHeader>
        <AsyncComboboxBase inline>
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
            <ComboboxInput
              ref={searchRef}
              showTrigger={false}
              aria-label={ctx.label}
              placeholder={m.kit_async_combobox_search()}
              className="mb-2 w-full"
              onKeyDown={preventSubmitOnEnter}
            />
            <AsyncComboboxBody {...props} scrollClassName="max-h-none flex-1" />
          </div>
        </AsyncComboboxBase>
      </SheetContent>
    </Sheet>
  )
}

/**
 * The list: a popup anchored to the field on desktop and, below `md`, a bottom `Sheet` with the
 * search on top and the same body inside (`inline` list: no popup, _doc-lib/base-ui.md#react/components/combobox).
 * The sheet closes on pick in a single field and stays open in `multiple`; closing it clears the search.
 */
export function AsyncComboboxList(
  props: AsyncComboboxListProps,
): React.JSX.Element {
  const ctx = useAsyncComboboxContext('AsyncComboboxList')

  if (!ctx.isMobile) {
    return (
      <ComboboxContent data-slot="async-combobox-list" anchor={ctx.anchor}>
        <AsyncComboboxBody {...props} />
      </ComboboxContent>
    )
  }

  return <AsyncComboboxSheet {...props} />
}
