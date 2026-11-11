import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient, ApiResponse } from '@japa/api-client'

import { SESSION_TOKEN } from '#config/session-token'
import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import type User from '#models/user'

/**
 * The body as the specs read it: an object of free fields.
 *
 * The `any` is forced by `@japa/api-client` with the `@tuyau/core` registry: the
 * route matches by path and not by method, so `response.body()` is the union of all
 * responses of that path - the error ones included. It is the only `any` in the
 * suite, and every spec inherits the type from here (`ResponseBody`).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- @tuyau/core registry unites the responses of the path
export type ResponseBody = Record<string, any>

export function body(response: ApiResponse): ResponseBody {
  // `body()` is typed `any`: it lands in `unknown` and leaves through the guard, so the lint
  // (`no-unsafe-return`) sees a narrowed value and not an `any` passed along.
  const value: unknown = response.body()
  if (!isResponseBody(value))
    throw new Error(`response body is not an object: ${String(value)}`)

  return value
}

function isResponseBody(value: unknown): value is ResponseBody {
  return typeof value === 'object' && value !== null
}

/** The cookie value as a string: `@japa/api-client` types it `any`. */
function cookieValue(response: ApiResponse, name: string): string {
  const value: unknown = response.cookie(name)?.value
  if (typeof value !== 'string')
    throw new Error(`session cookie ${name} missing from the sign-in response`)

  return value
}

export type Session = {
  [SESSION_TOKEN.ACCESS]: string
  [SESSION_TOKEN.REFRESH]: string
}

/**
 * Authenticates over HTTP and returns the cookies to chain into the following
 * requests.
 *
 * Deliberately does **not** use the auth plugin's `loginAs`, which builds the session
 * by calling the guard from the inside and so never exercises the real path: the
 * sign-in validator, the token pair issuance and the cookie read by the guard. With
 * a real sign-in, a test proves the whole contract.
 */
export async function authenticate(
  client: ApiClient,
  email: string,
  password: string,
): Promise<Session> {
  const response = await client
    .post('/authentication/sign-in')
    .json({ email, password })

  response.assertStatus(204)

  return {
    [SESSION_TOKEN.ACCESS]: cookieValue(response, SESSION_TOKEN.ACCESS),
    [SESSION_TOKEN.REFRESH]: cookieValue(response, SESSION_TOKEN.REFRESH),
  }
}

/**
 * An administrator's session, the most used. The account comes from the factory in the test
 * itself and not from the seeder: the seeder's owner depends on `SEED_OWNER_EMAIL` and
 * `SEED_OWNER_PASSWORD`, which the test environment does not have to define, and a fixed
 * e-mail here would match no account the project's seeder creates.
 */
export async function authenticateAsAdministrator(
  client: ApiClient,
): Promise<Session> {
  const { session } = await signInWithFactory(client, 'administrator')

  return session
}

/**
 * A session with the factory's default role, outside `STAFF_USER_ROLES` (project extension
 * point in `shared/src/enums/user-role.ts`): it reaches nothing of the administrative panel.
 * It is the other side of every panel permission assertion.
 */
export async function authenticateAsNonStaff(
  client: ApiClient,
): Promise<Session> {
  const { session } = await signInWithFactory(client)

  return session
}

/**
 * Creates the account through the factory and signs in with it. Returns the account
 * along with the session.
 */
export async function signInWithFactory(
  client: ApiClient,
  state?: 'administrator',
): Promise<{ user: User; session: Session }> {
  const factory = UserFactory.query()
  if (state) factory.apply(state)
  const user = await factory.create()

  return {
    user,
    session: await authenticate(client, user.email, FACTORY_PASSWORD),
  }
}

/**
 * Empties the database and runs the seeders again, so the data the project seeds (catalogs,
 * the owner when its keys are set) is back for the next test. Sessions do not depend on it:
 * they come from the factory (`signInWithFactory`).
 */
export async function resetDatabase() {
  // `truncate()` does NOT truncate: it runs the migrations and **returns** the function
  // that truncates, which Japa registers as the test teardown. Discarding that return
  // means the database is never cleaned, and a test sees the previous one's data.
  const teardown = await testUtils.db().truncate()

  await testUtils.db().seed()

  return teardown
}
