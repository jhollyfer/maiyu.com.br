// @vitest-environment jsdom

import type * as Router from '@tanstack/react-router'
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useFilterDraft } from '#/hooks/use-filter-draft'

type Navigation = {
  readonly from: string
  readonly to: string
  readonly replace?: boolean
  readonly search: (prev: Record<string, unknown>) => unknown
}

const navigate = vi.fn<(options: Navigation) => void>()

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  useNavigate: () => navigate,
}))

afterEach(() => {
  vi.clearAllMocks()
})

const KEYS = ['authors', 'status']

type Props = { readonly search: Record<string, unknown> }

function draftOf(initial: Props) {
  return renderHook(
    ({ search }: Props) =>
      useFilterDraft({ to: '/health-check', search, keys: KEYS }),
    { initialProps: initial },
  )
}

/** The one navigation the hook made, with the reducer run over the URL it was written against. */
function written(prev: Record<string, unknown>): {
  readonly replace: boolean | undefined
  readonly search: unknown
} {
  const call = navigate.mock.calls[0]?.[0]
  if (!call) throw new Error('navigate was not called')
  expect({ from: call.from, to: call.to }).toEqual({
    from: '/health-check',
    to: '.',
  })

  return { replace: call.replace, search: call.search(prev) }
}

describe('useFilterDraft', () => {
  it('when mounted, the draft is the filters applied in the URL', () => {
    const { result } = draftOf({
      search: { authors: ['a', 'b'], status: 'OPEN', page: 2 },
    })

    expect(result.current.list('authors')).toEqual(['a', 'b'])
    expect(result.current.text('status')).toBe('OPEN')
    expect(result.current.appliedCount).toBe(2)
    expect(result.current.dirty).toBe(false)
  })

  it('when a control edits the draft, the URL does not move until apply', () => {
    const { result } = draftOf({ search: {} })

    act(() => result.current.set('status', 'OPEN'))

    expect(result.current.text('status')).toBe('OPEN')
    expect(result.current.dirty).toBe(true)
    expect(result.current.appliedCount).toBe(0)
    expect(navigate).not.toHaveBeenCalled()
  })

  it('when applied, it pushes one history entry, keeps what the route owns and goes back to page 1', () => {
    const { result } = draftOf({ search: { sort: 'name', page: 3 } })

    act(() => result.current.set('status', 'OPEN'))
    act(() => result.current.apply())

    expect(navigate).toHaveBeenCalledOnce()
    expect(written({ sort: 'name', page: 3, trashed: 'only' })).toEqual({
      replace: false,
      search: {
        sort: 'name',
        trashed: 'only',
        authors: undefined,
        status: 'OPEN',
        page: undefined,
      },
    })
  })

  it('when nothing was edited, apply writes nothing', () => {
    const { result } = draftOf({ search: { status: 'OPEN' } })

    act(() => result.current.apply())

    expect(navigate).not.toHaveBeenCalled()
  })

  it('when a chip is removed with commit, the key goes to the URL replacing the entry', () => {
    const { result } = draftOf({ search: { authors: ['a', 'b'] } })

    act(() => result.current.commit('authors', ['a']))

    expect(written({ authors: ['a', 'b'] })).toEqual({
      replace: true,
      search: { authors: ['a'], page: undefined },
    })
    expect(result.current.list('authors')).toEqual(['a'])
  })

  it('when a key is committed, the unapplied edit of another key survives the URL landing', () => {
    const { result, rerender } = draftOf({ search: { authors: ['a', 'b'] } })

    act(() => result.current.set('status', 'DRAFT'))
    act(() => result.current.commit('authors', ['a']))
    rerender({ search: { authors: ['a'] } })

    expect(result.current.text('status')).toBe('DRAFT')
    expect(result.current.list('authors')).toEqual(['a'])
    expect(result.current.dirty).toBe(true)
  })

  it('when a filter is emptied, an empty text and an empty list leave the URL as undefined', () => {
    const { result } = draftOf({ search: { status: 'OPEN', authors: ['a'] } })

    act(() => result.current.set('status', ''))
    act(() => result.current.set('authors', []))
    act(() => result.current.apply())

    expect(written({})).toEqual({
      replace: false,
      search: { authors: undefined, status: undefined, page: undefined },
    })
  })

  it('when the URL carries an id no page has loaded, it stays in the draft and goes back out on apply', () => {
    const { result } = draftOf({ search: { authors: ['not-loaded-yet'] } })

    act(() => result.current.set('status', 'OPEN'))
    act(() => result.current.apply())

    expect(result.current.list('authors')).toEqual(['not-loaded-yet'])
    expect(written({})).toEqual({
      replace: false,
      search: {
        authors: ['not-loaded-yet'],
        status: 'OPEN',
        page: undefined,
      },
    })
  })

  it('when the URL changes from outside, the draft goes back to it', () => {
    const { result, rerender } = draftOf({ search: { status: 'OPEN' } })

    act(() => result.current.set('status', 'CLOSED'))
    rerender({ search: {} })

    expect(result.current.text('status')).toBeUndefined()
    expect(result.current.dirty).toBe(false)
  })

  it('when the URL does not change, a re-render keeps the unapplied edit', () => {
    const { result, rerender } = draftOf({ search: { status: 'OPEN' } })

    act(() => result.current.set('status', 'CLOSED'))
    rerender({ search: { status: 'OPEN' } })

    expect(result.current.text('status')).toBe('CLOSED')
  })

  it('when cleared, every key of the panel leaves the URL and the draft empties', () => {
    const { result } = draftOf({ search: { status: 'OPEN', authors: ['a'] } })

    act(() => result.current.clear())

    expect(result.current.values).toEqual({})
    expect(written({ status: 'OPEN', authors: ['a'], sort: 'name' })).toEqual({
      replace: false,
      search: {
        status: undefined,
        authors: undefined,
        sort: 'name',
        page: undefined,
      },
    })
  })

  it('when cleared with nothing applied, no history entry is added', () => {
    const { result } = draftOf({ search: {} })

    act(() => result.current.set('status', 'OPEN'))
    act(() => result.current.clear())

    expect(result.current.dirty).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })
})
