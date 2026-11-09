import { isDeepStrictEqual } from 'node:util'

import { DateTime } from 'luxon'

import {
  SORT_DIRECTION,
  TRASHED_MODE,
  type Paginated,
  type PaginationMeta,
  type TrashedMode,
} from '@maiyu/shared'

import type { PageCriteria } from '#core/page-criteria'

/** An instant as an entity holds it: Luxon's `DateTime` or a native `Date`. */
export type Instant = Date | DateTime

/** What the ordering compares: text, number or instant. */
export type SortValue = string | number | Instant | null

/** The minimum of every stored row: the key and the trash. */
type Trashable = { readonly id: string; deletedAt: Instant | null }

/** The "row": the entity state and the stamps persistence adds. */
// & keeps `Props` open: Merge over a type parameter stays deferred and rejects the stamps
export type StoredRow<
  Props extends Trashable,
  Time extends Instant = Date,
> = Props & {
  createdAt: Time
  updatedAt: Time | null
}

/**
 * What every in-memory implementation imitates from Lucid the same way: the
 * copy that keeps the class, the time stamps, the trash cut, the search
 * `ILIKE` and the `SimplePaginator` meta (`_standards/domain.md` §5.3).
 *
 * It lives here for the same reason as `lucid-mapping.ts`: a copy per resource
 * would be where an in-memory implementation stops imitating Lucid and the
 * contract test only catches it in one of them (`docs/DECISIONS.md` #22). A class with only
 * `static`: the state (the `Map`) belongs to each repository.
 */
export default class MemoryRows {
  /**
   * The copy the repository stores and hands back, so the test cannot change
   * the "database" by reference. Field by field, because `structuredClone`
   * drops the prototype of Luxon's `DateTime` (`DECISIONS.md` #332): a class
   * instance is kept as is (Luxon's is immutable), a `Date` gets a new one
   * (it is mutable), and only a structure without a class (array, plain
   * object such as rich text) is copied deep.
   */
  static copy<Props extends object>(snapshot: Props): Props {
    const next = { ...snapshot }
    for (const key of Object.keys(next)) {
      Reflect.set(next, key, MemoryRows.copyValue(Reflect.get(next, key)))
    }
    return next
  }

  /**
   * The row that `save` writes: creation stamp on insert, `updatedAt` only
   * when some column changed, which is when Lucid touches `updated_at`.
   * `outsideRow` are the props that live outside the row (the gallery, in a pivot):
   * changing only them does not touch `updated_at`, as in Lucid.
   */
  static stamp<Props extends Trashable, Time extends Instant = Date>(
    snapshot: Props,
    stored: StoredRow<Props, Time> | undefined,
    now: Time,
    outsideRow: ReadonlyArray<keyof Props> = [],
  ): StoredRow<Props, Time> {
    const next = MemoryRows.copy(snapshot)
    if (!stored) return { ...next, createdAt: now, updatedAt: now }

    const { createdAt, updatedAt, ...previous } = stored
    const changed = Object.keys(next).some(
      (key) =>
        !outsideRow.some((outside) => outside === key) &&
        !MemoryRows.same(Reflect.get(previous, key), Reflect.get(next, key)),
    )
    let touched = updatedAt
    if (changed) touched = now

    return { ...next, createdAt, updatedAt: touched }
  }

  /** The trash side the mode asks for, like the model's `trashed` scope. */
  static inTrash(row: Trashable, trashed?: TrashedMode): boolean {
    if (trashed === TRASHED_MODE.WITH) return true
    if (trashed === TRASHED_MODE.ONLY) return row.deletedAt !== null
    return row.deletedAt === null
  }

  /** Postgres `ILIKE '%term%'` on any of the columns: contains, case-insensitive. */
  static contains(
    values: ReadonlyArray<string>,
    search: string | undefined,
  ): boolean {
    if (!search) return true
    const term = search.toLowerCase()
    return values.some((value) => value.toLowerCase().includes(term))
  }

  /** Orders by the criterion's column, cuts the page and builds Lucid's meta. */
  static page<Row, Item>(
    rows: ReadonlyArray<Row>,
    criteria: PageCriteria<string>,
    read: {
      readonly sortValue: (row: Row) => SortValue
      readonly toItem: (row: Row) => Item
    },
  ): Paginated<Item> {
    let direction = 1
    if (criteria.direction === SORT_DIRECTION.DESC) direction = -1

    const sorted = rows.toSorted(
      (left, right) =>
        direction *
        MemoryRows.compare(read.sortValue(left), read.sortValue(right)),
    )
    const page = MemoryRows.slice(sorted, criteria.page, criteria.perPage)

    return { meta: page.meta, data: page.data.map((row) => read.toItem(row)) }
  }

  /**
   * Cuts the page of rows already filtered and ordered, with Lucid's meta: for
   * the listing whose order is not one column (`page` covers the one-column case).
   */
  static slice<Row>(
    rows: ReadonlyArray<Row>,
    page: number,
    perPage: number,
  ): Paginated<Row> {
    const start = (page - 1) * perPage

    return {
      meta: MemoryRows.meta(rows.length, page, perPage),
      data: rows.slice(start, start + perPage),
    }
  }

  private static copyValue(value: unknown): unknown {
    if (value instanceof Date) return new Date(value.getTime())
    if (Array.isArray(value))
      return value.map((item) => MemoryRows.copyValue(item))
    if (typeof value !== 'object' || value === null) return value
    // recursion instead of structuredClone: a DateTime nested in rich text keeps its class too
    if (Object.getPrototypeOf(value) === Object.prototype)
      return MemoryRows.copy(value)
    return value
  }

  /** Column equality as Postgres sees it: an instant compares by its value. */
  private static same(left: unknown, right: unknown): boolean {
    if (DateTime.isDateTime(left) && DateTime.isDateTime(right))
      return left.toMillis() === right.toMillis()
    return isDeepStrictEqual(left, right)
  }

  private static compare(left: SortValue, right: SortValue): number {
    if (MemoryRows.isInstant(left) && MemoryRows.isInstant(right))
      return left.valueOf() - right.valueOf()
    if (typeof left === 'number' && typeof right === 'number')
      return left - right
    return String(left).localeCompare(String(right))
  }

  private static isInstant(value: SortValue): value is Instant {
    return value instanceof Date || DateTime.isDateTime(value)
  }

  /** The same meta as Lucid's `SimplePaginator`, with the default base URL `/`. */
  private static meta(
    total: number,
    page: number,
    perPage: number,
  ): PaginationMeta {
    const lastPage = Math.max(Math.ceil(total / perPage), 1)
    let nextPageUrl: string | null = null
    let previousPageUrl: string | null = null
    if (lastPage > page) nextPageUrl = `/?page=${page + 1}`
    if (page > 1) previousPageUrl = `/?page=${page - 1}`

    return {
      total,
      perPage,
      currentPage: page,
      lastPage,
      firstPage: 1,
      firstPageUrl: '/?page=1',
      lastPageUrl: `/?page=${lastPage}`,
      nextPageUrl,
      previousPageUrl,
    }
  }
}
