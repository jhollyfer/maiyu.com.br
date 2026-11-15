import type { HttpContext } from '@adonisjs/core/http'

import { SESSION_COOKIE, SESSION_TOKEN } from '#config/session-token'
import type { SessionTokens } from '#repositories/session/session.repository'

/**
 * The session transport: the token pair in an `httpOnly` cookie, with the attributes of
 * `config/session-token.ts` (`_standards/backend.md` §4.10, `DECISIONS.md` #339). It is HTTP
 * edge mechanics, not a service: it talks to nothing outside and has no dependency; it lives
 * in the root of `features/` because `authentication` (sign-in, refresh, sign-out) and
 * `account` (password change) use it, and a feature does not import another.
 *
 * Token never in the response body: the cookie travels on its own.
 */
export class SessionCookie {
  static write(response: HttpContext['response'], tokens: SessionTokens): void {
    response
      .cookie(SESSION_TOKEN.ACCESS, tokens.accessToken, {
        ...SESSION_COOKIE,
        maxAge: SESSION_TOKEN.ACCESS_EXPIRY,
      })
      .cookie(SESSION_TOKEN.REFRESH, tokens.refreshToken, {
        ...SESSION_COOKIE,
        maxAge: SESSION_TOKEN.REFRESH_EXPIRY,
      })
  }

  /** The refresh cookie as a string, or `undefined`: `request.cookie()` is typed `any`. */
  static readRefresh(request: HttpContext['request']): string | undefined {
    const value: unknown = request.cookie(SESSION_TOKEN.REFRESH)
    if (typeof value !== 'string') return undefined

    return value
  }

  /**
   * The SAME attributes as the issuing, not a bare `clearCookie`: without them the browser
   * creates a second empty host-only cookie and the domain one survives, so the sign-out
   * "works" in the response and the session is back on the next F5.
   */
  static clear(response: HttpContext['response']): void {
    response
      .clearCookie(SESSION_TOKEN.ACCESS, SESSION_COOKIE)
      .clearCookie(SESSION_TOKEN.REFRESH, SESSION_COOKIE)
  }
}
