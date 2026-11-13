import type { RegisteredRouter } from '@tanstack/react-router'

import type {
  Merge,
  SortDirection,
  TrashablePaginationPayload,
  z,
} from '@maiyu/shared'

/**
 * The filters of any dashboard listing, in the URL.
 *
 * In the URL, and not in `useState`, because it is what survives F5 and the shared
 * link - the table on page 2 with a filter applied has to come back
 * the same.
 *
 * Every import from `@maiyu/shared` here is `import type`. It is not an oversight:
 * this file is imported by every route that declares `validateSearch`, so it falls into
 * the router chunk, and a value read at module scope creates an edge to the vocabulary
 * chunk. Rolldown does not guarantee that the chunk graph is acyclic, and in a cycle the
 * value is `undefined` on the first SSR. `import type` vanishes in the build and the edge
 * with it. The schema each route passes to `listValidateSearch` comes from the route's
 * own `-search.ts`.
 *
 * Lives outside `routes/` so it can be tested without the tree generator
 * treating the test file as a route.
 */

/**
 * What the URL does not need to carry: page 1 is the page without `?page`.
 * `stripSearchParams` removes the parameter equal to the default from the generated URL.
 * The literal, and not `PAGINATION.PAGE`, for the chunk edge above; `list-search.test.ts`
 * checks it against the shared record.
 * _doc-lib/tanstack-router.md#how-to/validate-search-params.
 */
export const LIST_SEARCH_DEFAULTS = { page: 1 }

/**
 * The shape every dashboard listing shares, for the kit pieces that read the search
 * without knowing the resource (`components/common/table/`). The resource's own type,
 * with its filters as the domain enum, is `z.output` of its validator in `@maiyu/shared`
 * and lives in the route's `-search.ts`.
 *
 * `sort` is `string` here because each resource closes its own column list in
 * `Rule.sortFields()`; the resource type narrows it and stays assignable to this one.
 */
export type ListSearch = Merge<
  TrashablePaginationPayload,
  { sort?: string; direction?: SortDirection }
>

/**
 * The Standard Schema shape the router accepts in `validateSearch` (`router-core` declares it
 * but `react-router` does not re-export it). `types` carries the input and the output of the
 * search; it is phantom, so it is optional and never filled at runtime.
 */
export type ListSearchValidator<TInput, TOutput> = {
  readonly '~standard': {
    readonly types?: { readonly input: TInput; readonly output: TOutput }
    readonly validate: (
      value: unknown,
    ) =>
      | { readonly value: TOutput }
      | { readonly issues: ReadonlyArray<{ readonly message: string }> }
  }
}

type RoutesByPath = RegisteredRouter['routesByPath']

/**
 * A route whose search a listing can write. The table writes `page`, `perPage`, `search`, `sort`,
 * `direction` and `trashed`, so the route's search must be assignable to `ListSearch` (a `sort`
 * that is a closed list passes, `sort: number` does not) and must not require a key the table
 * never sends (`{} extends` its input: a required `?q` fails; a `.default()` does not).
 */
export type ListRouteFits<TOutput, TInput> = TOutput extends ListSearch
  ? Record<never, never> extends TInput
    ? true
    : false
  : false

type ListRouteKey<TPath extends keyof RoutesByPath> =
  ListRouteFits<
    RoutesByPath[TPath]['types']['fullSearchSchema'],
    RoutesByPath[TPath]['types']['fullSearchSchemaInput']
  > extends true
    ? TPath
    : never

/**
 * The route of a listing: a path of the generated route tree whose search the table can write
 * (`ListRouteKey`). With `from` a registered path the router types the navigation, and a bare
 * `string` would make `navigate` demand the search of **every** route of the project. A route
 * the table cannot write to is a type error at `<Table to=...>`, not a broken URL.
 * _doc-lib/tanstack-router.md#guide/navigation,
 * https://tanstack.com/router/latest/docs/guide/navigation.
 */
export type ListRoute = {
  [TPath in keyof RoutesByPath]: ListRouteKey<TPath>
}[keyof RoutesByPath]

/**
 * The public storefront's filters: `ListSearch` **without `trashed`**. `/storefront` never
 * sees an archived record, and the `trashedField()` stays out of the validators there.
 * Leaving the key in the typing would be promising a filter that the backend refuses with 422.
 */
export type StorefrontSearch = Omit<ListSearch, 'trashed'>

/**
 * The `validateSearch` of a listing, from the resource's validator in `@maiyu/shared`
 * (the pagination fields extended with the resource's filters). The result is the schema's
 * output, so a filter is the domain enum and not `string`, and the API client accepts it
 * as it is.
 *
 * It returns a Standard Schema entry, not a bare function: the router reads the search type
 * from `types.input` and `types.output`, and a plain function makes input equal output, so a
 * field with `.default()` becomes required in the link and `ListRoute` refuses the route. The
 * `types` bag is phantom (absent at runtime), as the router declares it optional.
 * _doc-lib/tanstack-router.md#guide/search-params ("Zod": input and output types),
 * https://tanstack.com/router/latest/docs/framework/react/guide/search-params.
 *
 * An invalid value is **dropped**, not thrown: the URL is something anyone can edit, and a
 * `?status=lixo` falls back to the default instead of halting the screen. The schema is parsed
 * whole, and on failure the keys the issues point at leave the input and it is parsed again,
 * which is the per-field `.catch()` of the router doc without rewriting every field of the
 * shared schema. An issue that points at no key of the input (an object-level refinement)
 * cannot be fixed by dropping a field, and is reported as `issues`, which the router throws for the route's `errorComponent`.
 * _doc-lib/tanstack-router.md#guide/search-params,
 * https://tanstack.com/router/latest/docs/guide/search-params.
 */
export function listValidateSearch<TSchema extends z.ZodObject>(
  schema: TSchema,
): ListSearchValidator<z.input<TSchema>, z.output<TSchema>> {
  return {
    '~standard': {
      validate(search) {
        let input: Record<string, unknown> = {}
        if (isRecord(search)) input = search

        for (;;) {
          const result = schema.safeParse(input)
          if (result.success) return { value: result.data }

          const invalid = new Set(
            result.error.issues.map((issue) => issue.path[0]),
          )
          const kept = Object.entries(input).filter(
            ([key]) => !invalid.has(key),
          )

          if (kept.length === Object.keys(input).length)
            return { issues: result.error.issues }

          input = Object.fromEntries(kept)
        }
      },
    },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * What a filter left blank looks like: `''`, `false`, `null` and `undefined`. `0` and `true`
 * are filters of their own (a numeric filter that accepts `0`, `?pending=true`), so the test
 * is by value and not by falsiness. `String(null)` would become the text "null" in the filter.
 */
function filled(value: unknown): boolean {
  return (
    value !== '' && value !== false && value !== null && value !== undefined
  )
}

/**
 * The keys of a listing's search that are **not** a filter: they say where in the result the
 * person is (`page`, `perPage`), how it is ordered (`sort`, `direction`) or which of the two
 * lists it is (`trashed`, which the table reads as its own state). Everything else the route
 * declares (`search`, `?status`, `?category`...) narrows the result.
 */
const NOT_A_FILTER: ReadonlySet<string> = new Set([
  'page',
  'perPage',
  'sort',
  'direction',
  'trashed',
])

/**
 * Whether the search narrows the result: any key that is not in `NOT_A_FILTER` with a filled
 * value. By key and not by a list of filters because the kit does not know the resource's
 * filters; `?status=PENDING` with zero rows is "nothing matches", not "nothing registered".
 */
export function hasActiveFilter(
  search: Readonly<Record<string, unknown>>,
): boolean {
  return Object.entries(search).some(
    ([key, value]) => !NOT_A_FILTER.has(key) && filled(value),
  )
}

/**
 * The search with every filter cleared (`undefined`) and the page back to the first, keeping
 * what is not a filter (`perPage`, `sort`, `direction`, `trashed`). For the "clear filter"
 * button of an empty result.
 */
export function withoutFilters(
  search: Readonly<Record<string, unknown>>,
): Record<string, unknown> {
  const cleared: Record<string, unknown> = {}

  for (const key of Object.keys(search)) {
    if (!NOT_A_FILTER.has(key) || key === 'page') cleared[key] = undefined
  }

  return { ...search, ...cleared }
}

/**
 * The search without the blank filters, for the API client's `query`. The Tuyau client
 * drops only `null` and `undefined`, and `?search=` or `?pending=false` would reach the
 * backend as a filter. Same rule as `queryString`, through `filled`.
 */
export function compactQuery<TParams extends Record<string, unknown>>(
  params: TParams,
): Partial<TParams> {
  const result: Partial<TParams> = {}

  for (const key in params) {
    if (Object.hasOwn(params, key) && filled(params[key]))
      result[key] = params[key]
  }

  return result
}

/** Builds the query string of a link ignoring what was not filled in (`filled`). */
export function queryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, value]) => filled(value))

  if (entries.length === 0) return ''

  return '?'.concat(
    new URLSearchParams(
      entries.map(([key, value]) => [key, String(value)]),
    ).toString(),
  )
}
