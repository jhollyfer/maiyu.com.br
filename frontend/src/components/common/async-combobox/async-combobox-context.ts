import { createContext, use } from 'react'

import type { OptionComboboxItem } from '#/components/common/option-combobox/option-combobox-context'

/**
 * What the combobox reads from the entity's query. It is data and callbacks, never an entity
 * type: `useAsyncComboboxSource` builds it from the project's `queries/` file, and a test builds
 * it by hand.
 */
export type AsyncComboboxSource = {
  /** The options of the pages loaded for the current search. */
  readonly options: ReadonlyArray<OptionComboboxItem>
  /** The chosen ids as options, labelled (cache, fetch by id, or the id itself). */
  readonly selected: ReadonlyArray<OptionComboboxItem>
  /** The chosen ids whose label is still being fetched: the chip shows a skeleton. */
  readonly pendingIds: ReadonlySet<string>
  readonly status: 'pending' | 'error' | 'success'
  readonly hasMore: boolean
  readonly isFetchingMore: boolean
  /** The list on screen is the previous search's while the new one loads. */
  readonly isRefreshing: boolean
  /** The typed text; the debounce lives behind it, in the read hook. */
  readonly onSearchChange: (search: string) => void
  readonly onLoadMore: () => void
}

/** The value in and out: one id, or a list of ids (`multiple`). */
export type AsyncComboboxSelection =
  | {
      readonly multiple?: false
      /** `''` or `null` mean nothing chosen, as in the rest of the forms. */
      readonly value: string | null | undefined
      readonly onValueChange: (value: string) => void
    }
  | {
      readonly multiple: true
      readonly value: ReadonlyArray<string>
      readonly onValueChange: (value: Array<string>) => void
    }

export type AsyncComboboxContextValue = {
  readonly multiple: boolean
  readonly disabled: boolean | undefined
  /** The sheet title on mobile and the group name for assistive technology. */
  readonly label: string
  readonly source: AsyncComboboxSource
  /** The chosen options, in the order of the value. */
  readonly selected: ReadonlyArray<OptionComboboxItem>
  /** The loaded options plus the chosen ones the pages do not bring. */
  readonly items: ReadonlyArray<OptionComboboxItem>
  readonly isMobile: boolean
  readonly sheetOpen: boolean
  readonly setSheetOpen: (open: boolean) => void
  /** The chips box element: the popup anchors to it in `multiple`. */
  readonly anchor: HTMLDivElement | null
  readonly setAnchor: (element: HTMLDivElement | null) => void
  /** The text of the input in `multiple` (controlled); the single one keeps its own. */
  readonly search: string
  readonly setSearch: (search: string) => void
  readonly select: (options: ReadonlyArray<OptionComboboxItem>) => void
  readonly clear: () => void
  readonly remove: (value: string) => void
}

export const AsyncComboboxContext =
  createContext<AsyncComboboxContextValue | null>(null)

export function useAsyncComboboxContext(
  consumer: string,
): AsyncComboboxContextValue {
  const context = use(AsyncComboboxContext)
  if (!context)
    throw new Error(`<${consumer}> must be used inside <AsyncCombobox>`)

  return context
}
