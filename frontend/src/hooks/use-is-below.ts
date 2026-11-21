import * as React from 'react'

/** Tailwind's `md`: below it the screen is a phone, and a popup gives way to a sheet. */
export const MD_BREAKPOINT = 768

/**
 * Whether the window is narrower than `breakpoint` (px), by `innerWidth` and the `resize` event
 * (`useSyncExternalStore`: the value is an external store, https://react.dev/reference/react/useSyncExternalStore).
 * On the server and in the hydration render it answers `false` (desktop), so the markup matches
 * and the phone layout comes right after.
 *
 * Kit-owned: `hooks/use-mobile.ts` is the shadcn sidebar's file, and each project's copy of it
 * differs by registry version.
 */
export function useIsBelow(breakpoint: number): boolean {
  return React.useSyncExternalStore(
    (onChange) => {
      window.addEventListener('resize', onChange)

      return () => window.removeEventListener('resize', onChange)
    },
    () => window.innerWidth < breakpoint,
    () => false,
  )
}
