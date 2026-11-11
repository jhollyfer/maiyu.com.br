import { SORT_DIRECTION, type SortDirection } from '@maiyu/shared'

/** What a listing payload carries about its order, after the validator. */
type SortPayload<TColumn extends string> = {
  sort?: TColumn
  direction?: SortDirection
}

/**
 * The order a listing query will use, a pure function over the payload already at
 * hand, shared by every module (_standards/backend.md §4.9). A class with only
 * `static` because `_shared` never exports a loose function (typescript.md §6).
 */
export class Sort {
  /**
   * What the payload asked for, or the resource's default. Made to be spread:
   * `query.orderBy(...Sort.order(payload, 'createdAt'))`.
   *
   * The `fallback` is required because it is the order the listing already had before
   * accepting the parameter: whoever does not send `?sort` gets exactly the same
   * response as before.
   *
   * The column is not checked here: the validator's `Rule.sortFields()` closes
   * the list, before the payload reaches the use case.
   *
   * Only for listings whose default is **ascending** (catalogs, registries, anything
   * read in alphabetical order). A chronological feed uses `Sort.recentFirst()`.
   */
  static order<TColumn extends string>(
    payload: SortPayload<TColumn>,
    fallback: TColumn,
  ): [TColumn, SortDirection] {
    return [payload.sort ?? fallback, payload.direction ?? SORT_DIRECTION.ASC]
  }

  /**
   * The order of a chronological listing: `createdAt` **descending**, unlike
   * all the others. Spread like its sibling:
   * `query.orderBy(...Sort.recentFirst(payload))`.
   *
   * A method with its own name, and not a direction parameter on `order()`: the
   * exception stays visible at the call site, instead of hidden behind an argument
   * nobody reads when skimming the query.
   */
  static recentFirst<TColumn extends string>(
    payload: SortPayload<TColumn>,
  ): [TColumn | 'createdAt', SortDirection] {
    return [
      payload.sort ?? 'createdAt',
      payload.direction ?? SORT_DIRECTION.DESC,
    ]
  }
}
