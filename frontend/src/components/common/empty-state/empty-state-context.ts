import * as React from 'react'

/**
 * The size of the empty state, which the parts read to match the text to the frame.
 *
 * `default` is the panel's empty state (`ui/empty` text as it comes); `section` is the
 * public storefront's, in a section block, with larger title and description. It lives
 * in context because title and description are written by the screen and do not know
 * which frame they are in.
 */
export type EmptyStateSize = 'default' | 'section'

const EmptyStateContext = React.createContext<EmptyStateSize>('default')

export const EmptyStateProvider = EmptyStateContext.Provider

export function useEmptyStateSize(): EmptyStateSize {
  return React.use(EmptyStateContext)
}
