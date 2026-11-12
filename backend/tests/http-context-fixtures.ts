import { HttpContext } from '@adonisjs/core/http'
import testUtils from '@adonisjs/core/services/test_utils'
import type { Group } from '@japa/runner/core'

import type { TenantScope } from '#core/tenant-scope'

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

/**
 * Lets a spec run its code as a given request scope: `TenantScope.current()` reads
 * `HttpContext.get()`, set only inside `server.handle`, so the spec hands it a test context carrying
 * the scope under test (`await within(TenantScope.ofCustomer(...))`), and the original comes back in
 * the cleanup. Without a call to `within`, the code runs as a system process, with no scope.
 * shortcut: stubs `get` like `insideHttpContext` stubs `getOrFail`, same upgrade path.
 */
export function scopedHttpContext(
  group: Group,
): (scope: TenantScope) => Promise<void> {
  group.each.setup(() => {
    const original = HttpContext.get.bind(HttpContext)

    return () => {
      HttpContext.get = original
    }
  })

  return async (scope) => {
    const context = await testUtils.createHttpContext()
    context.tenantScope = scope
    HttpContext.get = () => context
  }
}
