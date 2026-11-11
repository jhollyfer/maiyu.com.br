import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { test } from '@japa/runner'

import {
  PROJECT_ANONYMOUS_WRITES,
  READ_ONLY_PUBLIC_PREFIXES,
} from '#core/openapi/public-routes'
import { AuthzCheck } from '#scripts/authz-check'

/**
 * The public surface net (_standards/backend.md §4.10): an anonymous route that is not `GET`
 * only exists if it is declared, and nothing under a read-only public prefix writes. It reads
 * the authorization baseline, which is what `authz:check` already enforces against
 * `openapi.json`, with the same protection label it writes.
 */
const BASELINE = readBaseline()

/** The kit's anonymous writes: signing in and renewing the session through the refresh cookie. */
const KIT_ANONYMOUS_WRITES = [
  'POST /authentication/refresh',
  'POST /authentication/sign-in',
] as const

const DECLARED_ANONYMOUS_WRITES = [
  ...KIT_ANONYMOUS_WRITES,
  ...PROJECT_ANONYMOUS_WRITES,
].sort()

/** `route -> protection`, as `authz:check` writes it; anything else fails here, not in a test. */
function readBaseline(): Record<string, string> {
  const file = join(import.meta.dirname, 'authz-baseline.json')
  // A new project has no baseline yet: say how to make it instead of a bare ENOENT.
  if (!existsSync(file))
    throw new Error(
      'authz-baseline.json missing: run `pnpm authz:check -- --write` once and commit it',
    )

  const read: unknown = JSON.parse(readFileSync(file, 'utf-8'))
  if (typeof read !== 'object' || read === null)
    throw new Error('authz-baseline.json is not an object')

  const baseline: Record<string, string> = {}
  for (const [route, protection] of Object.entries(read)) {
    if (typeof protection !== 'string')
      throw new Error(`authz-baseline.json: ${route} has no protection`)
    baseline[route] = protection
  }

  return baseline
}

function routesWhere(
  predicate: (route: string, protection: string) => boolean,
): string[] {
  return Object.entries(BASELINE)
    .filter(([route, protection]) => predicate(route, protection))
    .map(([route]) => route)
    .sort()
}

test.group('public routes (unit)', () => {
  test('an anonymous route that is not GET is in the declared list', ({
    assert,
  }) => {
    const writes = routesWhere(
      (route, protection) =>
        protection === AuthzCheck.ANONYMOUS && !route.startsWith('GET '),
    )

    assert.deepEqual(writes, DECLARED_ANONYMOUS_WRITES)
  })

  for (const prefix of READ_ONLY_PUBLIC_PREFIXES) {
    test(`nothing under ${prefix} writes`, ({ assert }) => {
      const writes = routesWhere(
        (route) => route.includes(` ${prefix}`) && !route.startsWith('GET '),
      )

      assert.deepEqual(writes, [])
    })

    test(`the scan sees ${prefix}: without a target, the guard would not guard`, ({
      assert,
    }) => {
      const routes = routesWhere((route) => route.includes(` ${prefix}`))

      assert.isAbove(routes.length, 0)
      assert.isTrue(
        routes.every((route) => BASELINE[route] === AuthzCheck.ANONYMOUS),
      )
    })
  }
})
