import * as React from 'react'

import type { DialogHandle } from '#/lib/dialog-handle'

/** What the trigger, the shortcut and the panel share: the handle that opens the overlay. */
export type GlobalSearchContextValue = {
  readonly handle: DialogHandle
  /** Below `md` the panel is a full-screen `Sheet`; from `md` up, a `Dialog`. */
  readonly isMobile: boolean
}

const GlobalSearchContext =
  React.createContext<GlobalSearchContextValue | null>(null)

export const GlobalSearchProvider = GlobalSearchContext.Provider

export function useGlobalSearchContext(
  consumer: string,
): GlobalSearchContextValue {
  const context = React.use(GlobalSearchContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used inside \`GlobalSearch\``)
  }

  return context
}

/**
 * How many results each group drew, so the panel can announce the total once. A store outside React
 * state (the groups write to it from an effect, the list reads it with `useSyncExternalStore`):
 * there is no effect that sets state, and a group that draws again does not re-render the others.
 */
export class GlobalSearchCounts {
  private readonly byGroup = new Map<string, number>()
  private readonly listeners = new Set<() => void>()
  private total = 0

  set(group: string, count: number): void {
    this.byGroup.set(group, count)
    this.update()
  }

  delete(group: string): void {
    this.byGroup.delete(group)
    this.update()
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)

    return () => this.listeners.delete(listener)
  }

  readonly getTotal = (): number => this.total

  private update(): void {
    let total = 0
    for (const count of this.byGroup.values()) total += count
    if (total === this.total) return
    this.total = total
    for (const listener of this.listeners) listener()
  }
}

/** What the sources and results read from the open panel. It exists only while it is open. */
export type GlobalSearchPanelContextValue = {
  /** What is in the text field, key by key. */
  readonly typed: string
  readonly setTyped: (typed: string) => void
  /** The typed text, trimmed, after the debounce: what a source puts in its query. */
  readonly term: string
  /** What the groups drew, for the announcement of the total. */
  readonly counts: GlobalSearchCounts
  /** Closes the panel, after a result is chosen. */
  readonly close: () => void
}

const GlobalSearchPanelContext =
  React.createContext<GlobalSearchPanelContextValue | null>(null)

export const GlobalSearchPanelProvider = GlobalSearchPanelContext.Provider

export function useGlobalSearchPanelContext(
  consumer: string,
): GlobalSearchPanelContextValue {
  const context = React.use(GlobalSearchPanelContext)

  if (!context) {
    throw new Error(`\`${consumer}\` must be used inside \`GlobalSearchPanel\``)
  }

  return context
}

/**
 * The debounced term, for a source the project writes itself (the menu, which filters in memory
 * and has no query). A source that does have a query is `GlobalSearchSource`.
 */
export function useGlobalSearchTerm(): string {
  return useGlobalSearchPanelContext('useGlobalSearchTerm').term
}
