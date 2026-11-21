import * as React from 'react'

import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
} from '#/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '#/components/ui/sheet'
import { useDebouncedValue } from '#/hooks/use-debounced-value'
import { cn } from '#/lib/cn'
import { m } from '#/paraglide/messages'

import {
  GlobalSearchCounts,
  GlobalSearchPanelProvider,
  useGlobalSearchContext,
  useGlobalSearchPanelContext,
} from './global-search-context'

/** The wait between the last key and the query, long enough not to ask on every letter. */
const SEARCH_DEBOUNCE_MS = 250

/**
 * The text field and the list live in one `Command` (cmdk), which does the arrow keys, Enter and
 * the active item. `shouldFilter={false}` because every source filters by itself (the server, or the
 * project's list in memory), and `vimBindings={false}` so `Ctrl K` with the panel open does not
 * become "go up one item".
 */
function GlobalSearchSurface({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const { handle } = useGlobalSearchContext('GlobalSearchPanel')
  const [typed, setTyped] = React.useState('')
  const term = useDebouncedValue(typed.trim(), SEARCH_DEBOUNCE_MS)
  const [counts] = React.useState(() => new GlobalSearchCounts())

  return (
    <GlobalSearchPanelProvider
      value={{ typed, setTyped, term, counts, close: () => handle.close() }}
    >
      <Command
        shouldFilter={false}
        loop
        vimBindings={false}
        label={m.kit_global_search_title()}
        className="rounded-none! bg-transparent p-0"
      >
        {children}
      </Command>
    </GlobalSearchPanelProvider>
  )
}

/**
 * The overlay. From `md` up a `Dialog`; below it a full-screen `Sheet` from the bottom, because a
 * centred popup has no room for the keyboard on a phone (`_standards/frontend.md` §10.4). The
 * content mounts when it opens, so the text and the active item start empty every time, with no
 * effect to clear them.
 */
export function GlobalSearchPanel({
  children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
  const { handle, isMobile } = useGlobalSearchContext('GlobalSearchPanel')

  if (isMobile) {
    return (
      <Sheet handle={handle}>
        <SheetContent
          side="bottom"
          data-slot="global-search-panel"
          className="h-dvh gap-0"
        >
          <SheetHeader>
            <SheetTitle>{m.kit_global_search_title()}</SheetTitle>
            <SheetDescription className="sr-only">
              {m.kit_global_search_description()}
            </SheetDescription>
          </SheetHeader>
          <GlobalSearchSurface>{children}</GlobalSearchSurface>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Dialog handle={handle}>
      <DialogContent
        showCloseButton={false}
        data-slot="global-search-panel"
        className="gap-0 p-0 sm:max-w-lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{m.kit_global_search_title()}</DialogTitle>
          <DialogDescription>
            {m.kit_global_search_description()}
          </DialogDescription>
        </DialogHeader>
        <GlobalSearchSurface>{children}</GlobalSearchSurface>
      </DialogContent>
    </Dialog>
  )
}

/** The text field. It is the search term: typing here is what every source reads. */
export function GlobalSearchInput({
  className,
  ...props
}: Omit<
  React.ComponentProps<typeof CommandInput>,
  'value' | 'onValueChange'
>): React.JSX.Element {
  const { typed, setTyped } = useGlobalSearchPanelContext('GlobalSearchInput')

  return (
    <CommandInput
      data-slot="global-search-input"
      spellCheck={false}
      value={typed}
      onValueChange={setTyped}
      placeholder={m.kit_global_search_placeholder()}
      className={className}
      {...props}
    />
  )
}

/**
 * The list the sources go into. Empty is drawn by cmdk when no source rendered an item (a source
 * that is still loading renders a "searching" item, so "no results" never shows over a wait).
 */
export function GlobalSearchList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandList>): React.JSX.Element {
  const { term, counts } = useGlobalSearchPanelContext('GlobalSearchList')
  const total = React.useSyncExternalStore(
    counts.subscribe,
    counts.getTotal,
    counts.getTotal,
  )

  return (
    <>
      {/* Outside the listbox: a status is not a child an `option` list may have. */}
      <p role="status" className="sr-only">
        {m.kit_global_search_total({ count: total })}
      </p>
      <CommandList
        data-slot="global-search-list"
        aria-label={m.kit_global_search_title()}
        className={cn(
          'max-h-80 p-1 max-md:max-h-none max-md:flex-1',
          className,
        )}
        {...props}
      >
        <CommandEmpty>{m.kit_global_search_empty({ term })}</CommandEmpty>
        {children}
      </CommandList>
    </>
  )
}
