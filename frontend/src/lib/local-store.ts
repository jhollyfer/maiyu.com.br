/**
 * A browser value stored in `localStorage` and read by
 * `useSyncExternalStore` (`hooks/use-local-store.ts`).
 *
 * A module store, and not a context: a provider would have to live in `__root` to
 * reach the storefront and the panel, and each write would re-render the whole
 * tree below it. Here only whoever reads re-renders.
 *
 * What holds for every use:
 *
 * - **On the server and before hydration** the value is `fallback`. `localStorage`
 *   does not exist in SSR, and any other answer would be a guaranteed hydration
 *   mismatch. The first subscription, which happens in an effect on the
 *   client, reads what is stored and re-renders.
 * - **Unreadable content** (a hand in the console, an old format) becomes `fallback` instead
 *   of bringing down the screen.
 * - **A write that fails** (private mode with zero quota) still holds in this
 *   tab and only does not survive F5.
 * - **Another tab** that writes the same key updates this one, otherwise both diverge
 *   silently.
 */
export type LocalStoreOptions<TValue> = {
  readonly key: string
  /**
   * The SSR value and the value of what cannot be read. It must always be the same reference:
   * `useSyncExternalStore` compares snapshots by identity.
   */
  readonly fallback: TValue
  /** Converts the stored text. Throwing is the same as returning `fallback`. */
  readonly parse: (raw: string) => TValue
  /** The text to store, or `null` to delete the key. */
  readonly serialize: (value: TValue) => string | null
  /**
   * Adjusts the value before storing. The lists use it to go back to the same
   * empty reference: a new `[]` on each emptying is new state for
   * React, which compares snapshots by identity.
   */
  readonly normalize?: (value: TValue) => TValue
}

/**
 * The raw `localStorage` calls, guarded. This file is the only one that touches
 * `localStorage` (`_standards/frontend.md` §2): the stores below and the modules
 * that keep their own key format (upload resume, table layout) go through here.
 *
 * `try/catch` and not an existence check: the DOM types declare
 * `localStorage` as always present, and the two failures that matter (absent
 * on the server, quota or privacy mode in the browser) arrive as exceptions.
 * Reading fails to `null`, writing and removing fail silently: losing a
 * preference is acceptable, breaking the screen over it is not.
 */
export function readLocalItem(key: string): string | null {
  try {
    return globalThis.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeLocalItem(key: string, value: string): void {
  try {
    globalThis.localStorage.setItem(key, value)
  } catch {
    // Quota or privacy mode: the value lives in this tab and not past a reload.
  }
}

export function removeLocalItem(key: string): void {
  try {
    globalThis.localStorage.removeItem(key)
  } catch {
    // Same as above.
  }
}

/** Every stored key that starts with `prefix`; empty when storage is unavailable. */
export function localKeys(prefix: string): ReadonlyArray<string> {
  try {
    const keys: Array<string> = []

    for (let index = 0; index < globalThis.localStorage.length; index += 1) {
      const key = globalThis.localStorage.key(index)

      if (key?.startsWith(prefix)) keys.push(key)
    }

    return keys
  } catch {
    return []
  }
}

export class LocalStore<TValue> {
  readonly #options: LocalStoreOptions<TValue>
  readonly #listeners = new Set<() => void>()
  #snapshot: TValue

  constructor(options: LocalStoreOptions<TValue>) {
    this.#options = options
    this.#snapshot = options.fallback
  }

  /** Arrow, and not method: React receives the loose function and it cannot lose `this`. */
  readonly subscribe = (listener: () => void): (() => void) => {
    if (this.#listeners.size === 0) {
      this.#snapshot = this.#read()
      window.addEventListener('storage', this.#onStorage)
    }

    this.#listeners.add(listener)

    return () => {
      this.#listeners.delete(listener)

      if (this.#listeners.size === 0)
        window.removeEventListener('storage', this.#onStorage)
    }
  }

  readonly getSnapshot = (): TValue => this.#snapshot

  readonly getServerSnapshot = (): TValue => this.#options.fallback

  /** The value outside React, for handler and test. */
  get(): TValue {
    return this.#snapshot
  }

  set(value: TValue): void {
    this.#snapshot = this.#options.normalize?.(value) ?? value

    // Zero quota or a value that does not serialize: the value holds in this tab and does not
    // survive F5.
    try {
      const raw = this.#options.serialize(this.#snapshot)

      if (raw === null) removeLocalItem(this.#options.key)
      if (raw !== null) writeLocalItem(this.#options.key, raw)
    } catch {
      // Idem.
    }

    this.#emit()
  }

  #read(): TValue {
    const raw = readLocalItem(this.#options.key)
    if (raw === null) return this.#options.fallback

    try {
      return this.#options.parse(raw)
    } catch {
      return this.#options.fallback
    }
  }

  #emit(): void {
    for (const listener of this.#listeners) listener()
  }

  readonly #onStorage = (event: StorageEvent): void => {
    if (event.key !== this.#options.key && event.key !== null) return

    this.#snapshot = this.#read()
    this.#emit()
  }
}

/**
 * The options of a list store stored as JSON.
 *
 * An item that does not pass the guard vanishes and the rest of the list survives: one
 * broken row in the middle of good ones does not take the whole list along. An empty list
 * deletes the key and always goes back to the same reference.
 */
export function listStoreOptions<TItem>(
  key: string,
  isItem: (value: unknown) => value is TItem,
): LocalStoreOptions<ReadonlyArray<TItem>> {
  const empty: ReadonlyArray<TItem> = []

  function normalize(list: ReadonlyArray<TItem>): ReadonlyArray<TItem> {
    if (list.length === 0) return empty

    return list
  }

  return {
    key,
    fallback: empty,
    parse: (raw) => {
      const parsed: unknown = JSON.parse(raw)
      if (!Array.isArray(parsed)) return empty

      return normalize(parsed.filter(isItem))
    },
    serialize: (list) => {
      if (list.length === 0) return null

      return JSON.stringify(list)
    },
    normalize,
  }
}

/** The guard of the slug and key lists: non-empty text. */
export function isFilledString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}
