import type { Assert } from '@japa/assert'

/**
 * What a listing route costs in queries, counted over `db:query`
 * (_doc-lib/lucid.md#debugging, https://lucid.adonisjs.com/docs/debugging).
 *
 * The event only fires when the connection has `debug: true` and at least one
 * listener is subscribed, so the project turns the flag on for the test
 * environment and the test subscribes here, for the length of one action only.
 *
 * Kit file: nothing in it knows a table, a route or a model. What belongs to
 * the project (the emitter, the action that makes the request) enters by parameter.
 */

/** The part of the `db:query` payload a count and a failure message read. */
export type RecordedQuery = {
  readonly sql: string
  readonly bindings?: ReadonlyArray<unknown>
}

/** What `QueryCount.record` uses of the application emitter: subscribe, and get the way out. */
export type QueryEmitter = {
  on(event: 'db:query', listener: (query: RecordedQuery) => void): () => void
}

/**
 * Records and locks what one action costs in queries. A class with statics because a
 * kit fixture has a home like any other function (`_standards/typescript.md` §6).
 */
export class QueryCount {
  /**
   * Runs the action and returns every query the framework executed meanwhile, in order.
   *
   * The subscription ends in `finally`: a failing action must not leave a listener
   * behind counting the next test's queries.
   */
  static async record(
    emitter: QueryEmitter,
    action: () => Promise<unknown>,
  ): Promise<RecordedQuery[]> {
    const queries: RecordedQuery[] = []
    const unsubscribe = emitter.on('db:query', (query) => queries.push(query))

    try {
      await action()
    } finally {
      unsubscribe()
    }

    return queries
  }

  /**
   * The failure message of a count that moved: the number expected, the number found and
   * the SQL of each query, so the reader sees which one was added instead of
   * only that "4 became 5".
   */
  static describe(
    expected: number,
    queries: ReadonlyArray<RecordedQuery>,
  ): string {
    const lines = queries.map((query, index) => `${index + 1}. ${query.sql}`)

    return `expected ${expected} queries, ran ${queries.length}:\n${lines.join('\n')}`
  }

  /**
   * Locks the number of queries one action runs. The count is exact on purpose: a
   * preload added or an N+1 introduced moves it, and the message lists the SQL so the
   * author sees which query appeared.
   *
   * Zero recorded queries fails on its own: a route worth counting runs at least one, so
   * zero means `db:query` never fired (`debug` off on the test connection), and a count
   * that passes with 0 would lock nothing.
   */
  static async assert(
    assert: Assert,
    emitter: QueryEmitter,
    action: () => Promise<unknown>,
    expected: number,
  ): Promise<void> {
    const queries = await QueryCount.record(emitter, action)

    assert.isAbove(
      queries.length,
      0,
      'no db:query event was recorded: turn on `debug` for the test connection in config/database.ts (_doc-lib/lucid.md#debugging)',
    )
    assert.lengthOf(queries, expected, QueryCount.describe(expected, queries))
  }
}
