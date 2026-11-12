import * as React from 'react'

/**
 * Whether the page has already scrolled past `offset`.
 *
 * The same hook as simple-hub's, and for the same reason: the header only gains a background,
 * ring and shadow once there is content passing underneath it. At the top it is
 * transparent and leaves the hero's sky fully in view.
 *
 * `useSyncExternalStore` and not `useState` + `useEffect`: the server snapshot is
 * explicitly `false`, and that is what avoids the first frame with the
 * background drawn before the browser knows where the page is.
 */
export function useScrolled(offset: number): boolean {
  const subscribe = React.useCallback((listener: () => void) => {
    window.addEventListener('scroll', listener, { passive: true })

    return () => window.removeEventListener('scroll', listener)
  }, [])

  const getSnapshot = React.useCallback(() => window.scrollY > offset, [offset])

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}
