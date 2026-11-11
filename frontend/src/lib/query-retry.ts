import { HTTPError } from '#/integrations/tanstack-query/http'

/** How many times a query that failed because of server or network is retried. */
const MAX_RETRIES = 3

/**
 * The default `retry` of queries (frontend.md §2).
 *
 * 401, 403, 404 and 422 do not change their answer on the third attempt: retrying only
 * delays the error message on screen. 5xx and network failure, which is what
 * `isServerError` covers, still deserve another chance. An error that did not come from
 * `request` (a `TypeError`, a bug) is also retried, as in the library
 * default, because there is no status saying it is final.
 */
export function shouldRetryQuery(failures: number, error: unknown): boolean {
  const httpError = HTTPError.from(error)
  if (httpError && !httpError.isServerError) return false

  return failures < MAX_RETRIES
}
