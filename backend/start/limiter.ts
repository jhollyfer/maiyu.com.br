/**
 * Extension point (KIT.md §3.4): the project's own rate limits, one `limiter.define` per
 * policy (contact form, checkout, export, report lookup).
 *
 * The kit routes' limits (sign-in, sign-up, refresh, account, upload) live in
 * `start/limiter.base.ts`, which the sync overwrites; redefining one here would declare a
 * second policy under the same name and leave two ceilings to keep in step. A route imports
 * each policy from the file that declares it:
 *
 * ```ts
 * import limiter from '@adonisjs/limiter/services/main'
 *
 * export const contactThrottle = limiter.define('contact', function () {
 *   return limiter.allowRequests(5).every('1 hour')
 * })
 * ```
 *
 * _doc-lib/adonisjs.md#guides/security/rate-limiting,
 * https://docs.adonisjs.com/guides/security/rate-limiting
 */
import limiter from '@adonisjs/limiter/services/main'

import { LimiterKey } from '#start/limiter.base'

/**
 * The contact form, by IP: it has no session, so the address is the only key (the real one
 * only with `TRUSTED_PROXIES` set). Five an hour covers a person who retypes a message; without
 * a ceiling a loop would fill `contacts` with personal data nobody sent.
 */
export const contactThrottle = limiter.define('contact', function () {
  return limiter.allowRequests(5).every('1 hour')
})

/**
 * The owner's credential change (`PUT /account/profile`), by user: it checks the current
 * password, so without a ceiling it is a password oracle for whoever stole a session cookie.
 * Five in fifteen minutes, tighter than the kit's `accountThrottle` (ten), because this site has
 * one account and the owner changes a credential a few times in a lifetime. `blockFor` turns
 * the ceiling into a cost: the window alone would allow five more tries every quarter hour.
 */
export const accountUpdateThrottle = limiter.define(
  'accountUpdate',
  function (context) {
    const throttle = limiter
      .allowRequests(5)
      .every('15 minutes')
      .blockFor('15 mins')
    const key = LimiterKey.user('accountUpdate', context.auth.user)

    if (!key) return throttle

    return throttle.usingKey(key)
  },
)
