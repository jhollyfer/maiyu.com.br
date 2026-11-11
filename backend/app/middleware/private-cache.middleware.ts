import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

import { SESSION_TOKEN } from '#config/session-token'

const SESSION_COOKIES: ReadonlyArray<string> = [
  SESSION_TOKEN.ACCESS,
  SESSION_TOKEN.REFRESH,
]

/**
 * A response tied to a session is never stored by a shared cache
 * (_standards/backend.md §5.7 item 8, cache deception; `DECISIONS.md` #339).
 *
 * "With a session" means the request carried a session cookie, or the response
 * writes one (sign-in, refresh, sign-out). The second case matters most: a proxy
 * that stored the sign-in response would hand its `Set-Cookie` to the next
 * visitor. A request without cookies keeps whatever cache policy its route
 * declares.
 *
 * The decision runs after `await next()`, in the upstream phase the middleware
 * guide names for header logic ("Adding headers in the upstream phase"), because
 * only then is the response built (_doc-lib/adonisjs.md#guides/basics/middleware,
 * https://docs.adonisjs.com/guides/basics/middleware). An error thrown
 * downstream is already a response by the time `next()` resolves, so the error
 * responses of a session are covered too. `safeHeader` keeps a `Cache-Control`
 * the route set itself.
 */
export default class PrivateCacheMiddleware {
  async handle(context: HttpContext, next: NextFn) {
    await next()

    if (!this.#carriesSession(context)) return

    context.response.safeHeader('Cache-Control', 'private, no-store')
  }

  #carriesSession(context: HttpContext): boolean {
    return (
      this.#requestHasSession(context) || this.#responseWritesSession(context)
    )
  }

  #requestHasSession(context: HttpContext): boolean {
    return SESSION_COOKIES.some((name) => {
      // `cookie()` returns `any`: read as `unknown` and only count a real value.
      const value: unknown = context.request.cookie(name)
      return value !== undefined && value !== null
    })
  }

  /**
   * `response.cookie()` appends to `set-cookie` right away, so the header is
   * readable here: one entry per cookie, each starting with `<name>=`. The
   * header comes back as a string, a list or nothing, so it is flattened into
   * one line per entry.
   */
  #responseWritesSession(context: HttpContext): boolean {
    const header: unknown = context.response.getHeader('set-cookie')
    const entries = [header].flat().join('\n').split('\n')

    return entries.some((entry) =>
      SESSION_COOKIES.some((name) => entry.startsWith(`${name}=`)),
    )
  }
}
