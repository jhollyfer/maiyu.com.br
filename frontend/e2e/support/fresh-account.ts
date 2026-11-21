import { randomBytes, randomInt, randomUUID } from 'node:crypto'

import { request as playwrightRequest } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'

import { ClientAddress } from './client-address'
import { E2eEnv } from './env'
import { SignInRetry } from './sign-in-retry'
import type { SignInRetryOptions } from './sign-in-retry'

/** The identity of a fresh account: the login `e2e:cleanup` recognizes, a random password, a name. */
export type FreshAccountIdentity = {
  readonly login: string
  readonly password: string
  readonly name: string
}

/** How the account is reached: by e-mail (the default) or, for a resident with no e-mail, by phone. */
export type FreshAccountContact = 'email' | 'phone'

export type FreshAccountOptions = {
  /** What the account is for (`reporter`, `buyer`): letters, digits and hyphens, it goes in the e-mail. */
  readonly label: string
  /** The login is an E2E e-mail (default) or an E2E phone: both are what `e2e:cleanup` deletes by. */
  readonly contact?: FreshAccountContact
  /**
   * The project's sign-up (its route and payload are the project's, `I/O do projeto entra por prop`):
   * registers `identity` through `context`, which already carries the client address. It throws, or the
   * `expect` of the spec fails, when the account is not created; the helper then does not sign in.
   */
  readonly signUp: (
    identity: FreshAccountIdentity,
    context: APIRequestContext,
  ) => Promise<void>
  /** The 429 policy of `SignInRetry`; the test injects a `sleep` so it does not wait for real. */
  readonly retry?: SignInRetryOptions
}

/** A fresh account and the context that is signed in with it (the session cookie is in `context`). */
export type FreshAccount = {
  readonly identity: FreshAccountIdentity
  readonly context: APIRequestContext
}

/**
 * The login of every E2E account, the same pattern `e2e:cleanup` deletes by
 * (`backend/tests/e2e-identity.ts`, `E2E_ACCOUNT_EMAIL_PATTERN`, DECISIONS.md #819): the e-mail is the
 * only marker, because a sign-up copies the name from the form. `scripts/e2e-sign-in-once.test.ts`
 * keeps the two texts equal.
 */
export const E2E_ACCOUNT_EMAIL_PATTERN =
  '^e2e-[a-z0-9-]+-[0-9a-f]{8}@example\\.com$'

/**
 * The phone of an E2E account with no e-mail (`backend/tests/e2e-identity.ts`,
 * `E2E_ACCOUNT_PHONE_PATTERN`): `+55`, DDD, `9`, `0000` and four digits. No real mobile number has a
 * `0` right after the 9, so `e2e:cleanup` can delete by it without touching a real resident.
 */
export const E2E_ACCOUNT_PHONE_PATTERN = '^\\+55[1-9][1-9]90000[0-9]{4}$'

/**
 * The one door, besides `auth.setup.ts` and the sign-in screen specs, through which a spec signs in
 * on the API (DECISIONS.md #819). The case it serves: the spec creates a NEW account by sign-up and
 * signs in once with it, because the endpoint it exercises needs a session. The account is born in
 * the spec, so its `signInAccountThrottle` bucket starts empty and it enters exactly once: that
 * keeps the intent of #712 (each account signs in once per run). What it is not for: a shared
 * account, which stays with the `setup` and its `storageState`.
 * `scripts/e2e-sign-in-once.test.ts` fails any other file that calls the API sign-in.
 *
 * Same cares as the setup: each account enters from its own address (`X-Forwarded-For`, #742) and the
 * 429 of the limiter is respected (`SignInRetry`), never worked around. The caller disposes of
 * `context` (`afterEach`/`finally`); the rows go with `e2e:cleanup`, by the e-mail.
 */
export class E2eFreshAccount {
  /** One identity per call: a new login and a new password. */
  static identityOf(
    label: string,
    contact: FreshAccountContact = 'email',
  ): FreshAccountIdentity {
    if (!/^[a-z0-9-]+$/i.test(label))
      throw new Error(
        `label "${label}" fora do padrão do e-mail de E2E (letras, números e hífen): o e2e:cleanup não acharia a conta`,
      )

    const logins: Record<FreshAccountContact, () => string> = {
      email: () => `e2e-${label}-${randomUUID().slice(0, 8)}@example.com`,
      phone: () =>
        `+55${randomInt(1, 10)}${randomInt(1, 10)}90000${randomInt(0, 10_000).toString().padStart(4, '0')}`,
    }

    return {
      login: logins[contact](),
      // 12 random characters plus one of each class the password policy asks for.
      password: `${randomBytes(9).toString('base64url')}aA1!`,
      name: `E2E ${label}`,
    }
  }

  /** Signs the account up (the project's `signUp`) and signs it in once. */
  static async create(options: FreshAccountOptions): Promise<FreshAccount> {
    const apiUrl = E2eEnv.apiUrl
    if (!apiUrl)
      throw new Error('E2E_API_URL ausente: a conta nova precisa da API')

    const identity = E2eFreshAccount.identityOf(options.label, options.contact)
    const context = await playwrightRequest.newContext({
      extraHTTPHeaders: { [ClientAddress.header]: ClientAddress.random() },
    })

    try {
      await options.signUp(identity, context)
      const answer = await SignInRetry.run(
        `conta nova ${options.label}`,
        async () => {
          const response = await context.post(
            `${apiUrl}/authentication/sign-in`,
            {
              data: { login: identity.login, password: identity.password },
              headers: { origin: E2eEnv.baseUrl },
            },
          )

          return {
            status: response.status(),
            retryAfter: response.headers()['retry-after'],
          }
        },
        options.retry,
      )
      if (answer.status !== 204)
        throw new Error(
          `entrada da conta nova ${options.label}: esperava 204, veio ${answer.status}`,
        )
    } catch (error) {
      await context.dispose()
      throw error
    }

    return { identity, context }
  }
}
