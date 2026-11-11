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

/**
 * The contact form, by IP: it has no session, so the address is the only key (the real one
 * only with `TRUSTED_PROXIES` set). Five an hour covers a person who retypes a message; without
 * a ceiling a loop would fill `contacts` with personal data nobody sent.
 */
export const contactThrottle = limiter.define('contact', function () {
  return limiter.allowRequests(5).every('1 hour')
})
