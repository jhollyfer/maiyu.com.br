import * as React from 'react'

import type { LocalStore } from '#/lib/local-store'

/** The current value of a `LocalStore`, re-rendering when it changes. */
export function useLocalStore<TValue>(store: LocalStore<TValue>): TValue {
  return React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )
}
