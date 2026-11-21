import { useNavigate } from '@tanstack/react-router'
import * as React from 'react'

import {
  draftFromSearch,
  draftSignature,
  filledFilterCount,
  readFilterValue,
} from '#/lib/filter-draft'
import type { FilterDraftValue, FilterDraftValues } from '#/lib/filter-draft'
import type { ListRoute } from '#/lib/list-search'

type UseFilterDraftOptions = {
  /** The listing's route, the same `to` the `Table` receives. */
  readonly to: ListRoute
  /** The applied search, as the route validated it. */
  readonly search: Readonly<Record<string, unknown>>
  /** The search keys this panel fills. Everything else in the URL is left alone. */
  readonly keys: ReadonlyArray<string>
}

export type FilterDraft = {
  /** What the controls show: the applied filters plus whatever was edited since. */
  readonly values: FilterDraftValues
  /** How many filters are applied in the URL (not the draft). */
  readonly appliedCount: number
  /** Whether the draft differs from the URL. */
  readonly dirty: boolean
  readonly text: (key: string) => string | undefined
  readonly list: (key: string) => ReadonlyArray<string>
  /** Edits the draft only; the URL does not move until `apply`. */
  readonly set: (key: string, value: FilterDraftValue | undefined) => void
  /** Edits and writes that key now, replacing the history entry (a removed chip, a toggle). */
  readonly commit: (key: string, value: FilterDraftValue | undefined) => void
  /** Writes every filled key and clears the rest: one history entry per apply. */
  readonly apply: () => void
  /** Clears every key of the panel from the URL and the draft. */
  readonly clear: () => void
}

/**
 * The draft of a listing's filter panel against the filters applied in the URL
 * (`_standards/frontend.md` §2: the filter lives in the search params; the draft is only what
 * is being edited before "Aplicar").
 *
 * **Edit in the draft, apply in the URL.** A filter that navigates on every pick refetches
 * the list under the person's hands and fills the history with half-built filters; the draft
 * holds the edit until `apply`, which is one request and one history entry. What is removed
 * from something already applied (`commit`) has nothing to confirm, and goes straight to
 * the URL with `replace`, since undoing a narrowing is not a step to come back to.
 *
 * **The URL wins.** When the search changes from outside - the back button, "limpar
 * filtros" of an empty result, a link - the draft goes back to it, and an unapplied edit is
 * discarded with it (by design: the person left that state). A `commit` of one key is not
 * outside: the edits of the other keys survive it, on render and not in an
 * effect ("reset state on render", `frontend.md` §2), so no effect erases what was typed
 * between the navigation and the next render. An id that is in the URL and that no page has
 * loaded yet is in the draft all the same, and goes back out on `apply`: the label is the
 * combobox's job (`useAsyncComboboxSource`), never a reason to drop the value.
 *
 * Whoever navigates is the hook, with `from: to` and `search: (prev) => ...`, the same as
 * every piece of the table, so a filter only the route knows survives; `page` goes away
 * because page 3 of the previous filter almost never exists in the new one.
 * _doc-lib/tanstack-router.md#guide/navigation (`replace`, `search`),
 * https://tanstack.com/router/latest/docs/guide/navigation.
 */
export function useFilterDraft({
  to,
  search,
  keys,
}: UseFilterDraftOptions): FilterDraft {
  const navigate = useNavigate()

  const applied = draftFromSearch(search, keys)
  const appliedSignature = draftSignature(applied, keys)

  const [values, setValues] = React.useState(applied)
  const [seen, setSeen] = React.useState(appliedSignature)

  // The URL the hook itself is about to write with `commit`: when it lands, the other keys'
  // unapplied edits are not "a change from outside" and stay.
  const [expected, setExpected] = React.useState<string | null>(null)

  if (seen !== appliedSignature) {
    setSeen(appliedSignature)
    setExpected(null)
    if (expected !== appliedSignature) setValues(applied)
  }

  function write(
    patch: Record<string, FilterDraftValue | undefined>,
    replace: boolean,
  ): void {
    void navigate({
      from: to,
      to: '.',
      replace,
      search: (prev) => ({ ...prev, ...patch, page: undefined }),
    })
  }

  function set(key: string, value: FilterDraftValue | undefined): void {
    setValues((current) => ({ ...current, [key]: readFilterValue(value) }))
  }

  function commit(key: string, value: FilterDraftValue | undefined): void {
    const next = readFilterValue(value)

    setValues((current) => ({ ...current, [key]: next }))
    setExpected(draftSignature({ ...applied, [key]: next }, keys))
    write({ [key]: next }, true)
  }

  const dirty = draftSignature(values, keys) !== appliedSignature

  function apply(): void {
    if (!dirty) return

    const patch: Record<string, FilterDraftValue | undefined> = {}
    for (const key of keys) patch[key] = values[key]

    write(patch, false)
  }

  function clear(): void {
    setValues({})

    // Nothing applied: there is no URL to clean, and a navigation would only add a history entry.
    if (filledFilterCount(applied, keys) === 0) return

    const patch: Record<string, FilterDraftValue | undefined> = {}
    for (const key of keys) patch[key] = undefined

    write(patch, false)
  }

  return {
    values,
    appliedCount: filledFilterCount(applied, keys),
    dirty,
    text(key) {
      const value = values[key]
      if (typeof value === 'string') return value
      return undefined
    },
    list(key) {
      const value = values[key]
      if (typeof value === 'string') return [value]
      return value ?? []
    },
    set,
    commit,
    apply,
    clear,
  }
}
