import { createHash } from 'node:crypto'

import type { HttpContext } from '@adonisjs/core/http'
import limiter from '@adonisjs/limiter/services/main'

import { LoginIdentity } from '@maiyu/shared'

import { SESSION_TOKEN } from '#config/session-token'
import { UserRepository } from '#repositories/user/user.repository'

/**
 * The house rate limits (DECISIONS.md #130, backend.md §4.10), the same in every project.
 *
 * A project does not edit this file: its own policies (contact form, checkout, export,
 * report lookup) live in `start/limiter.ts`, and a route imports each policy from the file
 * that declares it. A route without a session counts by IP, which is only the client's real
 * address with `TRUSTED_PROXIES` set (`core/trusted-proxies.ts`); a route with a session
 * counts by actor (_doc-lib/adonisjs.md#guides/security/rate-limiting,
 * https://docs.adonisjs.com/guides/security/rate-limiting).
 */

/**
 * The keys that are not the IP, testable without a database or an HTTP context.
 *
 * Every value from the request enters the key hashed: `rate_limits` (or Redis) and the
 * throttle log would otherwise hold e-mails and live refresh tokens in clear text.
 */
export class LimiterKey {
  /**
   * The sign-in account, by the normalized login (e-mail or phone, DECISIONS.md #396), so case,
   * spacing and the phone mask do not open new buckets. `null` without a usable login: inventing
   * a key would put every malformed request in one bucket, and twenty of them would lock the
   * sign-in of someone else.
   */
  static account(login: unknown): string | null {
    if (typeof login !== 'string') return null

    const normalized = LoginIdentity.of(login).value

    if (normalized.length === 0) return null

    return `signin:${LimiterKey.digest(normalized)}`
  }

  /**
   * The sign-in account by the account's own id, once the login names one: an account with an
   * e-mail and a phone is one bucket, not one per identity (DECISIONS.md #409).
   */
  static accountOf(userId: string): string {
    return `signin-user:${userId}`
  }

  /**
   * The second level of key: when the login names an account, the bucket is the account's id, so
   * its e-mail and its phone share it. A login that names nobody keeps the digest of the text.
   */
  static async accountBucket(
    context: HttpContext,
    login: string,
    fallback: string,
  ): Promise<string> {
    const identity = LoginIdentity.of(login)
    const users = await context.containerResolver.make(UserRepository)
    const finders = {
      email: (value: string) => users.findByEmail(value),
      phone: (value: string) => users.findByPhone(value),
    }
    const user = await finders[identity.kind](identity.value)

    return (user && LimiterKey.accountOf(user.id)) || fallback
  }

  /**
   * The refresh token itself, not the IP: the frontend SSR renews every session from the
   * same address, and a per-IP ceiling would lock renewal for everyone at once.
   */
  static refresh(token: unknown): string | null {
    if (typeof token !== 'string' || token.length === 0) return null

    return `refresh:${LimiterKey.digest(token)}`
  }

  /** The session user in a per-actor policy; the scope keeps one user's quotas apart. */
  static user(
    scope: string,
    user: { readonly id: string | number } | undefined,
  ): string | null {
    if (!user) return null

    return `${scope}:${user.id}`
  }

  private static digest(value: string): string {
    return createHash('sha256').update(value).digest('hex')
  }
}

/**
 * The sign-in door, by IP. `blockFor` turns the ceiling into a cost: without it the window
 * expires and the attacker tries five more times every minute, forever.
 */
export const signInThrottle = limiter.define('signIn', function () {
  return limiter.allowRequests(5).every('1 minute').blockFor('10 mins')
})

/** What `limiter.define` accepts back, named because the builder may not be `async` and return `null`. */
type AccountPolicy = ReturnType<typeof limiter.allowRequests>

/**
 * The same door, by account. A second policy and not an `ip:login` key: the joint key
 * would give each IP five attempts per account, making enumeration cheaper. Looser than
 * the IP one because this is the ceiling a person who forgot the password runs into.
 */
export const signInAccountThrottle = limiter.define(
  'signInAccount',
  function (context): Promise<AccountPolicy> | null {
    // Read before the validator runs, hence the normalization inside the key.
    const login: unknown = context.request.input('login')
    const key = LimiterKey.account(login)

    if (!key) return null

    return LimiterKey.accountBucket(context, String(login), key).then(
      (bucket) =>
        limiter
          .allowRequests(20)
          .every('1 hour')
          .blockFor('10 mins')
          .usingKey(bucket),
    )
  },
)

/**
 * The anonymous writes of the account flow (sign-up, password recovery, confirmation
 * resend), by IP. One shared bucket on purpose: each door alone would multiply what a
 * loop gets to write per address.
 */
export const signUpThrottle = limiter.define('signUp', function () {
  return limiter.allowRequests(10).every('1 hour')
})

/**
 * The session renewal, by the hash of the refresh token. Each token serves once (rotation
 * consumes it), so ten tries with the same one is already a loop. Without the cookie it
 * falls back to the IP: there is no session to renew and the answer is 401 anyway.
 */
export const refreshThrottle = limiter.define('refresh', function (context) {
  const key = LimiterKey.refresh(context.request.cookie(SESSION_TOKEN.REFRESH))

  if (!key) return limiter.allowRequests(30).every('1 minute')

  return limiter.allowRequests(10).every('1 minute').usingKey(key)
})

/**
 * The own-account edit (`PUT /account`), by user: it checks the current password, so
 * without a ceiling it is a password oracle for whoever stole a session cookie. Without a
 * user (route declared before `auth()`) it falls back to the IP instead of no limit.
 */
export const accountThrottle = limiter.define('account', function (context) {
  const throttle = limiter
    .allowRequests(10)
    .every('15 minutes')
    .blockFor('15 mins')
  const key = LimiterKey.user('account', context.auth.user)

  if (!key) return throttle

  return throttle.usingKey(key)
})

/**
 * The upload writes (open, sign parts, complete), by user: behind one NAT, a per-IP quota
 * would let one person exhaust everyone's. High because each part of a large file is a
 * request, and the ceiling counts requests, not files.
 */
export const uploadThrottle = limiter.define('upload', function (context) {
  const throttle = limiter.allowRequests(60).every('1 hour')
  const key = LimiterKey.user('upload', context.auth.user)

  if (!key) return throttle

  return throttle.usingKey(key)
})
