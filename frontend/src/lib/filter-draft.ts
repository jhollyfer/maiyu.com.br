/**
 * What a listing filter carries in the URL: one text or a list of texts (ids, enum values).
 * Numbers and booleans a route keeps in its search come back as text; the route's
 * `validateSearch` turns them into its own types again.
 */
export type FilterDraftValue = string | ReadonlyArray<string>

/** The filters of a listing by search key; an absent key is a filter not filled. */
export type FilterDraftValues = Readonly<
  Record<string, FilterDraftValue | undefined>
>

/**
 * A raw search value as a filter value, or `undefined` when it filters nothing: `''`, `[]`,
 * and anything that is not text, number, boolean or a list of text. Every value that goes
 * into the draft or out to the URL passes here, so "empty" has one meaning
 * (`lib/list-search.ts`, `filled`).
 */
export function readFilterValue(raw: unknown): FilterDraftValue | undefined {
  if (typeof raw === 'string') {
    if (raw.length === 0) return undefined
    return raw
  }

  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw)

  if (Array.isArray(raw)) {
    const list: Array<string> = []
    for (const item of raw) {
      if (typeof item === 'string' && item.length > 0) list.push(item)
    }
    if (list.length === 0) return undefined
    return list
  }

  return undefined
}

/** The draft's starting point: the applied filters, read from the URL search by key. */
export function draftFromSearch(
  search: Readonly<Record<string, unknown>>,
  keys: ReadonlyArray<string>,
): FilterDraftValues {
  const values: Record<string, FilterDraftValue | undefined> = {}

  for (const key of keys) values[key] = readFilterValue(search[key])

  return values
}

/**
 * A comparable text of the filters by key, in the order of `keys`. It is what tells "the
 * URL changed under the draft" and "the draft differs from the URL" apart without comparing
 * arrays element by element.
 */
export function draftSignature(
  values: FilterDraftValues,
  keys: ReadonlyArray<string>,
): string {
  return JSON.stringify(keys.map((key) => values[key] ?? null))
}

/** How many keys are filled, for the badge of the filter button. */
export function filledFilterCount(
  values: FilterDraftValues,
  keys: ReadonlyArray<string>,
): number {
  return keys.filter((key) => values[key] !== undefined).length
}
