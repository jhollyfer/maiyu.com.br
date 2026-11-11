import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import { SESSION_COOKIE, SESSION_TOKEN } from '#config/session-token'
import PrivateCacheMiddleware from '#middleware/private-cache.middleware'

/**
 * The decision of `private-cache.middleware.ts` on a bare context: the test
 * context skips the middleware stack, so `handle` is called by hand and `next`
 * plays the route.
 */
test.group('private-cache middleware', () => {
  async function run(route: (context: HttpContext) => void) {
    const middleware = await app.container.make(PrivateCacheMiddleware)
    const context = await testUtils.createHttpContext()

    await middleware.handle(context, async () => route(context))

    return context.response.getHeader('cache-control')
  }

  test('a response that writes the session cookie is private and not stored', async ({
    assert,
  }) => {
    const cacheControl = await run((context) => {
      context.response.cookie(SESSION_TOKEN.ACCESS, 'token', {
        ...SESSION_COOKIE,
        maxAge: SESSION_TOKEN.ACCESS_EXPIRY,
      })
    })

    assert.equal(cacheControl, 'private, no-store')
  })

  test('a response without a session gets no cache policy', async ({
    assert,
  }) => {
    const cacheControl = await run(() => {})

    assert.isUndefined(cacheControl)
  })

  test('another cookie is not a session', async ({ assert }) => {
    const cacheControl = await run((context) => {
      context.response.cookie('locale', 'en', SESSION_COOKIE)
    })

    assert.isUndefined(cacheControl)
  })

  test('the Cache-Control the route set wins', async ({ assert }) => {
    const cacheControl = await run((context) => {
      context.response.cookie(SESSION_TOKEN.REFRESH, 'token', {
        ...SESSION_COOKIE,
        maxAge: SESSION_TOKEN.REFRESH_EXPIRY,
      })
      context.response.header('Cache-Control', 'no-store')
    })

    assert.equal(cacheControl, 'no-store')
  })
})
