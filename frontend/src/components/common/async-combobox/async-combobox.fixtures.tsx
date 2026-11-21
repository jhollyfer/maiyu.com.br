import {
  infiniteQueryOptions,
  QueryClient,
  QueryClientProvider,
  queryOptions,
} from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { vi } from 'vitest'

import type { AsyncComboboxQuery } from '#/hooks/use-async-combobox-source'

export type FixtureUser = { readonly id: string; readonly name: string }

export const FIXTURE_PAGE_SIZE = 10

/**
 * The server of the combobox tests: 25 users in pages of 10 (three pages), searched by name, and a
 * read by id. The calls are spies, so a test can count the requests the piece makes.
 */
/** A promise the test settles by hand: the server answers when the test says so, never by a timer. */
export class Deferred<TValue> {
  readonly promise: Promise<TValue>
  resolve: (value: TValue) => void = () => undefined
  reject: (reason: Error) => void = () => undefined

  constructor() {
    this.promise = new Promise<TValue>((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject
    })
  }
}

type FixturePage = { data: Array<FixtureUser> }

export class UsersFixture {
  readonly users: ReadonlyArray<FixtureUser>
  /** Calls held back by `hold`: the first call that matches waits for the test to settle it. */
  private readonly held: Array<{
    readonly search: string
    readonly page: number
    readonly deferred: Deferred<FixturePage>
  }> = []
  readonly list = vi.fn((search: string, page: number) => {
    const index = this.held.findIndex(
      (hold) => hold.search === search && hold.page === page,
    )
    if (index !== -1) {
      const [hold] = this.held.splice(index, 1)
      if (hold) return hold.deferred.promise
    }

    return Promise.resolve(this.page(search, page))
  })
  readonly one = vi.fn((id: string) => {
    const found = this.users.find((user) => user.id === id)
    if (!found) return Promise.reject(new Error('not found'))

    return Promise.resolve(found)
  })

  constructor(count = 25) {
    this.users = Array.from({ length: count }, (_, index) => {
      const number = String(index + 1).padStart(2, '0')

      return { id: `u${number}`, name: `Pessoa ${number}` }
    })
  }

  /** The next request for `search` and `page` waits for `resolve` on the returned deferred. */
  hold(search: string, page = 1): Deferred<FixturePage> {
    const deferred = new Deferred<FixturePage>()
    this.held.push({ search, page, deferred })

    return deferred
  }

  /** One page of the search, by name: what the server answers. */
  page(search: string, page: number): FixturePage {
    const term = search.toLowerCase()
    const matches = this.users.filter((user) =>
      user.name.toLowerCase().includes(term),
    )
    const start = (page - 1) * FIXTURE_PAGE_SIZE

    return { data: matches.slice(start, start + FIXTURE_PAGE_SIZE) }
  }

  query(): AsyncComboboxQuery<FixtureUser, Array<string>, Array<string>> {
    return {
      options: (search) =>
        infiniteQueryOptions({
          queryKey: ['fixture-users', search],
          // No `signal`: a load-more in flight must finish (frontend.md §2.1).
          queryFn: ({ pageParam }) => this.list(search, pageParam),
          initialPageParam: 1,
          getNextPageParam: (last, all) => {
            if (last.data.length < FIXTURE_PAGE_SIZE) return undefined

            return all.length + 1
          },
        }),
      fetchOne: (id) =>
        queryOptions({
          queryKey: ['fixture-user', id],
          queryFn: () => this.one(id),
        }),
      toOption: (user) => ({ value: user.id, label: user.name }),
    }
  }
}

/** Renders inside a fresh `QueryClient` that never retries, so a failure shows at once. */
export function renderWithQuery(
  ui: React.ReactNode,
): ReturnType<typeof render> {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })

  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

/** The `IntersectionObserver` jsdom lacks: `fireLive()` reports every live sentinel as visible. */
export class FakeIntersectionObserver implements IntersectionObserver {
  static instances: Array<FakeIntersectionObserver> = []
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  disconnected = false

  constructor(private readonly callback: IntersectionObserverCallback) {
    FakeIntersectionObserver.instances.push(this)
  }

  observe(): void {}
  unobserve(): void {}
  takeRecords(): Array<IntersectionObserverEntry> {
    return []
  }
  disconnect(): void {
    this.disconnected = true
  }

  /** How many live observers answered; a disconnected one is the "once per page" proof. */
  static fireLive(): number {
    const live = FakeIntersectionObserver.instances.filter(
      (observer) => !observer.disconnected,
    )
    const rect = document.body.getBoundingClientRect()
    live.forEach((observer) =>
      observer.callback(
        [
          {
            isIntersecting: true,
            intersectionRatio: 1,
            time: 0,
            target: document.body,
            boundingClientRect: rect,
            intersectionRect: rect,
            rootBounds: null,
          },
        ],
        observer,
      ),
    )

    return live.length
  }
}
