import { createRootRoute, createRoute } from '@tanstack/react-router'
import { describe, expect, expectTypeOf, it } from 'vitest'

import {
  PAGINATION,
  Rule,
  TRASHED_MODE,
  TrashablePaginationValidator,
  z,
} from '@maiyu/shared'

import {
  compactQuery,
  LIST_SEARCH_DEFAULTS,
  listValidateSearch,
  queryString,
  type ListRouteFits,
  type ListSearch,
} from './list-search'

/**
 * A resource validator as a project's `shared/` writes it: the pagination fields plus a
 * filter that is an enum and a sort closed on the resource's columns.
 */
const FixtureValidator = TrashablePaginationValidator.extend({
  status: Rule.optional(z.enum(['PENDING', 'DONE'])),
  ...Rule.sortFields(['name', 'createdAt']),
})

const validateSearch = listValidateSearch(FixtureValidator)
type FixtureSearch = z.output<typeof FixtureValidator>

/** The router calls the Standard Schema entry; so do the value tests. */
function parse(search: Record<string, unknown>): unknown {
  const result = validateSearch['~standard'].validate(search)
  if ('value' in result) return result.value

  return undefined
}

describe('listValidateSearch, type', () => {
  it('infers the filter as the schema enum, not as string', () => {
    expectTypeOf<FixtureSearch['status']>().toEqualTypeOf<
      'PENDING' | 'DONE' | undefined
    >()
    expectTypeOf<FixtureSearch['sort']>().toEqualTypeOf<
      'name' | 'createdAt' | undefined
    >()
  })

  // The kit table reads any resource search through `ListSearch`.
  it('stays assignable to the kit shape', () => {
    expectTypeOf<FixtureSearch>().toExtend<ListSearch>()
  })
})

describe('listValidateSearch, values', () => {
  it('keeps what the schema accepts', () => {
    expect(
      parse({
        page: 2,
        status: 'DONE',
        trashed: TRASHED_MODE.ONLY,
        sort: 'name',
        direction: 'asc',
      }),
    ).toEqual({
      page: 2,
      status: 'DONE',
      trashed: 'only',
      sort: 'name',
      direction: 'asc',
    })
  })

  // A URL is something anyone edits: the invalid key falls back to the default
  // and the valid ones stay, instead of the route throwing.
  it('drops only the invalid keys, without throwing', () => {
    expect(
      parse({
        page: 0,
        perPage: 101,
        status: 'lixo',
        trashed: 'ONLY',
        sort: 'coluna-inventada',
        search: 'tikuna',
      }),
    ).toEqual({ search: 'tikuna' })
  })

  it('drops the keys the schema does not declare', () => {
    expect(parse({ mimetype: 'image/png' })).toEqual({})
  })

  it('turns an empty value into absence, as the backend does', () => {
    expect(parse({ status: '', search: '' })).toEqual({})
  })
})

describe('LIST_SEARCH_DEFAULTS', () => {
  // The literal exists for the chunk edge; this is where it is held to the source.
  it('matches the shared pagination record', () => {
    expect(LIST_SEARCH_DEFAULTS.page).toBe(PAGINATION.PAGE)
  })
})

/**
 * `compactQuery` and `queryString` share one predicate, so its cases are covered here
 * once; `queryString` below only checks that it goes through it.
 */
describe('compactQuery', () => {
  it("drops '', false, null and undefined and keeps 0 and true", () => {
    expect(
      compactQuery({
        search: '',
        pending: false,
        status: null,
        sort: undefined,
        size: 0,
        active: true,
        page: 2,
      }),
    ).toStrictEqual({ size: 0, active: true, page: 2 })
  })

  it('keeps the input type', () => {
    const search: FixtureSearch = {}

    expectTypeOf(compactQuery(search)).toEqualTypeOf<Partial<FixtureSearch>>()
  })
})

describe('queryString', () => {
  it('builds the query with the filled values only', () => {
    expect(queryString({ search: '', size: 0, page: 2 })).toBe('?size=0&page=2')
    expect(queryString({ search: '' })).toBe('')
  })
})

describe('ListRouteFits', () => {
  it('accepts a route whose sort is a closed list and that declares no trashed', () => {
    type Items = { page?: number; search?: string; sort?: 'name' | 'createdAt' }

    expectTypeOf<ListRouteFits<Items, Items>>().toEqualTypeOf<true>()
  })

  it('accepts a route that has a default for page, since the input leaves it out', () => {
    expectTypeOf<
      ListRouteFits<{ page: number }, { page?: number }>
    >().toEqualTypeOf<true>()
  })

  it('refuses a route whose sort is not a string', () => {
    type Other = { sort?: number }

    expectTypeOf<ListRouteFits<Other, Other>>().toEqualTypeOf<false>()
  })

  it('refuses a route that requires a key the table never sends', () => {
    type Other = { q: string }

    expectTypeOf<ListRouteFits<Other, Other>>().toEqualTypeOf<false>()
  })
})

/**
 * The real pipeline: a route built by `createRoute` with the factory as `validateSearch`, read
 * the way `ListRoute` reads it (`types.fullSearchSchema` and `types.fullSearchSchemaInput`).
 * The hand-made types above cannot catch the factory losing the input type, which is what
 * makes `.default()` fail `ListRouteFits`.
 * _doc-lib/tanstack-router.md#guide/search-params (input and output of the validator).
 */
describe('listValidateSearch, in a real route', () => {
  const root = createRootRoute()

  function listRoute<TSchema extends z.ZodObject>(schema: TSchema) {
    return createRoute({
      getParentRoute: () => root,
      path: '/lista',
      validateSearch: listValidateSearch(schema),
    })
  }

  type Fits<TSchema extends z.ZodObject> = ListRouteFits<
    ReturnType<typeof listRoute<TSchema>>['types']['fullSearchSchema'],
    ReturnType<typeof listRoute<TSchema>>['types']['fullSearchSchemaInput']
  >

  const WithDefault = TrashablePaginationValidator.extend({
    sort: z.enum(['name', 'createdAt']).default('name'),
  })
  const Required = TrashablePaginationValidator.extend({ q: z.string() })

  it('keeps the input optional when the field has a default', () => {
    type Route = ReturnType<typeof listRoute<typeof WithDefault>>

    expectTypeOf<
      Route['types']['fullSearchSchemaInput']['sort']
    >().toEqualTypeOf<'name' | 'createdAt' | undefined>()
    expectTypeOf<Route['types']['fullSearchSchema']['sort']>().toEqualTypeOf<
      'name' | 'createdAt'
    >()
  })

  it('accepts a route with a default, as the router documents', () => {
    expectTypeOf<Fits<typeof WithDefault>>().toEqualTypeOf<true>()
  })

  it('refuses a route that requires a key the table never sends', () => {
    const route = listRoute(Required)

    expect(route.options.validateSearch).toBeDefined()
    expectTypeOf<Fits<typeof Required>>().toEqualTypeOf<false>()
  })

  it('still parses at runtime through the Standard Schema entry', () => {
    const entry = listValidateSearch(WithDefault)['~standard']

    expect(entry.validate({ page: 0, sort: 'x' })).toEqual({
      value: { sort: 'name' },
    })
    expect(entry.validate({ page: 3, sort: 'createdAt' })).toEqual({
      value: { page: 3, sort: 'createdAt' },
    })
  })
})
