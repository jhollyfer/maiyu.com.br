import { HttpContext } from '@adonisjs/core/http'
import testUtils from '@adonisjs/core/services/test_utils'
import type { Group } from '@japa/runner/core'

/**
 * Runs every test of the group inside a test `HttpContext`, so a use case that logs
 * through `HttpContext.getOrFail().logger` (`DECISIONS.md` #314) reaches the 500 path
 * in a unit spec the same way it does in a request.
 *
 * The context is the one `testUtils.createHttpContext()` builds
 * (_doc-lib/adonisjs.md#guides/basics/http-context). The framework enters its async
 * local storage only inside `server.handle`, with no public way to enter it from a
 * test, so `getOrFail` answers with that context for the test and goes back to the
 * original in the cleanup.
 * shortcut: stubs `getOrFail` instead of the real store, upgrade when the framework
 * exposes a way to run a callback inside a context.
 */
export function insideHttpContext(group: Group): void {
  group.each.setup(async () => {
    const context = await testUtils.createHttpContext()
    const original = HttpContext.getOrFail.bind(HttpContext)

    HttpContext.getOrFail = () => context

    return () => {
      HttpContext.getOrFail = original
    }
  })
}
