import * as React from 'react'

/** The modifier key a shortcut is written with: `⌘` on a Mac, `Ctrl` anywhere else. */
export type ShortcutModifier = 'Ctrl' | '⌘'

function subscribe(): () => void {
  return () => {}
}

function currentModifier(): ShortcutModifier {
  if (/mac|iphone|ipad/i.test(navigator.userAgent)) return '⌘'
  return 'Ctrl'
}

/**
 * The key to print beside a shortcut (`Ctrl K`, `⌘ K`). The browser decides it, so the server and
 * the hydration render answer `Ctrl` and the Mac swaps to `⌘` right after, through
 * `useSyncExternalStore` (https://react.dev/reference/react/useSyncExternalStore, "Adding support
 * for server rendering"): the HTML matches and no effect sets state.
 */
export function useShortcutModifier(): ShortcutModifier {
  return React.useSyncExternalStore(subscribe, currentModifier, () => 'Ctrl')
}
