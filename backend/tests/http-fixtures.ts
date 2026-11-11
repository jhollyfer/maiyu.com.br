import testUtils from '@adonisjs/core/services/test_utils'
import type { ApiClient, ApiResponse } from '@japa/api-client'

import type { z } from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'
import { FACTORY_PASSWORD, UserFactory } from '#database/factories/user.factory'
import type User from '#models/user'

/**
 * The body read through the schema of the response, from `@maiyu/shared`: the same contract
 * the frontend validates (`frontend.md` §3.3), and a spec that reads a field the response does not
 * have fails here, with the path, instead of comparing against `undefined`.
 *
 * `response.body()` is typed `any` by `@japa/api-client`; it lands in `unknown` and leaves only
 * through the schema, so no spec reads a field of an `any`.
 */
export function body<TSchema extends z.ZodType>(
  response: ApiResponse,
  schema: TSchema,
): z.output<TSchema> {
  const value: unknown = response.body()

  return schema.parse(value)
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
