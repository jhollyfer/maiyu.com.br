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

describe('listValidateSearch, type', () => {
  it('infers the filter as the schema enum, not as string', () => {
    const search = validateSearch({})

    expectTypeOf(search.status).toEqualTypeOf<'PENDING' | 'DONE' | undefined>()
    expectTypeOf(search.sort).toEqualTypeOf<'name' | 'createdAt' | undefined>()
  })

  // The kit table reads any resource search through `ListSearch`.
  it('stays assignable to the kit shape', () => {
    expectTypeOf(validateSearch({})).toExtend<ListSearch>()
  })
})

describe('listValidateSearch, values', () => {
  it('keeps what the schema accepts', () => {
    expect(
      validateSearch({
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
      validateSearch({
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
    expect(validateSearch({ mimetype: 'image/png' })).toEqual({})
  })

  it('turns an empty value into absence, as the backend does', () => {
    expect(validateSearch({ status: '', search: '' })).toEqual({})
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
    expectTypeOf(compactQuery(validateSearch({}))).toEqualTypeOf<
      Partial<ReturnType<typeof validateSearch>>
    >()
  })
})

describe('queryString', () => {
  it('builds the query with the filled values only', () => {
    expect(queryString({ search: '', size: 0, page: 2 })).toBe('?size=0&page=2')
    expect(queryString({ search: '' })).toBe('')
  })
})
