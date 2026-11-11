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

/** What `recordQueries` uses of the application emitter: subscribe, and get the way out. */
export type QueryEmitter = {
  on(event: 'db:query', listener: (query: RecordedQuery) => void): () => void
}

/**
 * Runs the action and returns every query the framework executed meanwhile, in order.
 *
 * The subscription ends in `finally`: a failing action must not leave a listener
 * behind counting the next test's queries.
 */
export async function recordQueries(
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
export function describeQueries(
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
 */
export async function assertQueryCount(
  assert: Assert,
  emitter: QueryEmitter,
  action: () => Promise<unknown>,
  expected: number,
): Promise<void> {
  const queries = await recordQueries(emitter, action)

  assert.lengthOf(queries, expected, describeQueries(expected, queries))
}
