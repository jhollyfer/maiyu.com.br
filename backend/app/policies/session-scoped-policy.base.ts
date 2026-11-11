import { AuthorizationResponse, BasePolicy } from '@adonisjs/bouncer'

/**
 * Policy base: the two denials the API returns, each with a stable `code` and a
 * translation key (`<module>.<fact_snake>`, the `code` is never the key,
 * `_standards/i18n.md` §3).
 *
 * The policy passes the translation key (`<module>.<fact_snake>`, DECISIONS.md #334) and the
 * `code`, and does not translate: `app/exceptions/handler.ts` translates the key in the request
 * language (#346). Bouncer's `AuthorizationResponse` carries a message, a status and a
 * translation identifier: the key goes in `.t()`, which the doc reserves for this, and the
 * `code` in the message, which the doc makes the fallback when the translation is missing
 * (_doc-lib/adonisjs.md#guides/auth/authorization, https://docs.adonisjs.com/guides/auth/authorization,
 * "When your application uses @adonisjs/i18n"). A key missing in a language thus shows the
 * code, never text in another language, and `lang.unit.spec.ts` keeps the keys complete.
 *
 * - `hidden`: the record's existence is a secret. A missing record and a record
 *   the `actor` cannot reach answer **the same** (same status, `code` and
 *   message), so the response does not allow enumerating ids
 *   (`_standards/backend.md` §4.6).
 * - `forbidden`: the `actor` sees the record and cannot act on it.
 */
export default abstract class SessionScopedPolicy extends BasePolicy {
  protected hidden(code: string, key: string): AuthorizationResponse {
    return AuthorizationResponse.deny(code, 404).t(key)
  }

  protected forbidden(code: string, key: string): AuthorizationResponse {
    return AuthorizationResponse.deny(code, 403).t(key)
  }
}
