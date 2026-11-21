import * as React from 'react'

/**
 * What the alerts of a `RowActions` menu need from it: where focus goes when they close.
 *
 * An alert opened from a menu item has no trigger of its own to return focus to (the item that was
 * clicked left with the menu), so Base UI's default drops it on `body` and a keyboard user starts
 * over from the top of the page (WCAG 2.4.3, `frontend.md` §10.2). The menu's own button is the
 * right place.
 */
export type RowActionsContextValue = {
  /** The `finalFocus` of the alert: the menu button, or Base UI's default when it is gone. */
  readonly finalFocus: () => HTMLElement | true
}

const RowActionsContext = React.createContext<RowActionsContextValue | null>(
  null,
)

export const RowActionsProvider = RowActionsContext.Provider

/**
 * The `finalFocus` for an alert, `undefined` outside a `RowActions` (an alert with its own trigger,
 * which returns focus by itself).
 */
export function useRowActionsFinalFocus():
  RowActionsContextValue['finalFocus'] | undefined {
  return React.use(RowActionsContext)?.finalFocus
}
