import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient, ApiResponse } from '@japa/api-client'

import type { z } from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'

/**
 * The body as the specs read it without a schema: an object of free fields.
 *
 * The `any` is forced by `@japa/api-client` with the `@tuyau/core` registry: the route matches by
 * path and not by method, so `response.body()` is the union of all responses of that path, the
 * error ones included. It is the only `any` in the suite, and every spec inherits the type from
 * here.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- @tuyau/core registry unites the responses of the path
export type ResponseBody = Record<string, any>

/**
 * The body as the specs read it. With a `schema` from `@maiyu/shared` it is read through the
 * contract the frontend validates (`frontend.md` §3.3): a spec that reads a field the response
 * does not have fails here, with the path, instead of comparing against `undefined`. Without one,
 * the free `ResponseBody` above (shallow reads such as `.code`).
 *
 * `response.body()` is typed `any` by `@japa/api-client`; with a schema it lands in `unknown` and
 * leaves only through the schema, so no spec reads a field of an `any`.
 */
export function body(response: ApiResponse): ResponseBody
export function body<TSchema extends z.ZodType>(
  response: ApiResponse,
  schema: TSchema,
): z.output<TSchema>
export function body(response: ApiResponse, schema?: z.ZodType): unknown {
  const value: unknown = response.body()
  if (!schema) return value

  return schema.parse(value)
}

/**
 * The keys of a JSON object as the wire carries them, sorted. A schema parse strips what the
 * contract does not list, so a spec that proves a field is NOT leaked reads the raw object here.
 */
export function keysOf(value: unknown): string[] {
  if (typeof value !== 'object' || value === null) return []

  return Object.keys(value).sort()
}

/** The raw `key` of the JSON body, for the reads that must not go through a schema (`keysOf`). */
export function rawField(response: ApiResponse, key: string): unknown {
  const value: unknown = response.body()
  if (typeof value !== 'object' || value === null || !(key in value))
    return undefined

  return Reflect.get(value, key)
}

/** The raw array at `key` of the JSON body (empty when it is not one), for `keysOf`. */
export function rawItems(response: ApiResponse, key: string): unknown[] {
  const value = rawField(response, key)
  if (!Array.isArray(value)) return []

  return value
}

/** The cookie value as a string: `@japa/api-client` types it `any`. */
export function cookieValue(response: ApiResponse, name: string): string {
  const value: unknown = response.cookie(name)?.value
  if (typeof value !== 'string')
    throw new Error(`session cookie ${name} missing from the response`)

  return value
}

export type Session = {
  [SESSION_TOKEN.ACCESS]: string
  [SESSION_TOKEN.REFRESH]: string
}

/**
 * Authenticates over HTTP, by the e-mail or the phone (`login`), and returns the cookies to chain into the following
 * requests.
 *
 * Deliberately does **not** use the auth plugin's `loginAs`, which builds the session
 * by calling the guard from the inside and so never exercises the real path: the
 * sign-in validator, the token pair issuance and the cookie read by the guard. With
 * a real sign-in, a test proves the whole contract.
 */
export async function authenticate(
  client: ApiClient,
  login: string,
  password: string,
): Promise<Session> {
  const response = await client
    .post('/authentication/sign-in')
    .json({ login, password })

  response.assertStatus(204)

  return {
    [SESSION_TOKEN.ACCESS]: cookieValue(response, SESSION_TOKEN.ACCESS),
    [SESSION_TOKEN.REFRESH]: cookieValue(response, SESSION_TOKEN.REFRESH),
  }
}

/**
 * Empties the database and runs the seeders again; returns the teardown Japa registers.
 * `resetDatabase` (`tests/http-skeleton-fixtures.ts`) wraps it with what the project arranges
 * around the run.
 *
 * `truncate()` does NOT truncate: it runs the migrations and **returns** the function
 * that truncates, which Japa registers as the test teardown. Discarding that return
 * means the database is never cleaned, and a test sees the previous one's data.
 */
export async function truncateAndSeed() {
  const teardown = await testUtils.db().truncate()

  await testUtils.db().seed()

  return teardown
}
