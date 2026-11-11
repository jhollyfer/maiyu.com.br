import app from '@adonisjs/core/services/app'

import SameSite from '#core/same-site'
import env from '#start/env'

const domain = env.get('COOKIE_DOMAIN')

/**
 * Session cookie prefix (DECISIONS.md #320, backend.md §4.10): `__Host-` when the cookie is
 * host-only, `__Secure-` when there is a `COOKIE_DOMAIN`, because `__Host-` forbids `Domain`. The
 * browser refuses both without `Secure`, so outside production (local HTTP) the name has no
 * prefix (_doc-lib/adonisjs.md#guides/basics/cookies).
 */
let prefix = ''
if (app.inProduction && domain) prefix = '__Secure-'
if (app.inProduction && !domain) prefix = '__Host-'

/**
 * Session token names and lifetimes, in one place (DECISIONS.md #339).
 *
 * The token name is the cookie name, and it is not decoration: it is what the guard checks to
 * refuse a refresh token presented as an access token. Both come out of the same
 * `DbAccessTokensProvider` and are indistinguishable without it.
 */
export const SESSION_TOKEN = {
  DRIVER_NAME: 'cookie-access-tokens',
  ACCESS: `${prefix}access-token`,
  REFRESH: `${prefix}refresh-token`,
  ACCESS_EXPIRY: '1d',
  REFRESH_EXPIRY: '7d',
} as const

/** The attributes that identify the cookie, without the lifetime: issuing and clearing read the same. */
type CookieAttributes = {
  readonly httpOnly: true
  readonly secure: boolean
  readonly sameSite: 'lax' | 'none'
  readonly path: '/'
  readonly domain?: string
}

/**
 * `lax` unless the web app (`APP_CLIENT_URL`) and the API are on different sites. A missing or
 * invalid input falls to `lax`, never to `none` (`core/same-site.ts`).
 */
const clientUrl = env.get('APP_CLIENT_URL')
let sameSite: 'lax' | 'none' = 'lax'
if (app.inProduction && clientUrl)
  sameSite = SameSite.between(clientUrl, env.get('APP_SERVER_URL')).value

const base: CookieAttributes = {
  httpOnly: true,
  secure: app.inProduction,
  sameSite,
  path: '/',
}

// The `domain` key only exists with a value: an explicit `domain: undefined` reaches some proxies
// as the string "undefined" in `Set-Cookie`, and the browser discards the cookie.
let attributes: CookieAttributes = base
if (domain) attributes = { ...base, domain }

/**
 * The attributes of the session cookie, without the lifetime (DECISIONS.md #339). Issuing adds
 * the `maxAge` of each token; clearing reads exactly these, because deleting a cookie means
 * matching `name` + `domain` + `path`. Written only by
 * `features/authentication/_shared.session-cookie.ts`.
 */
export const SESSION_COOKIE: CookieAttributes = attributes
