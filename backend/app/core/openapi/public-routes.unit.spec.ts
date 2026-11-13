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

/** Anonymous or optional session: both answer a caller with no session at all. */
function reachableByAnonymous(protection: string): boolean {
  return (
    protection === AuthzCheck.ANONYMOUS || protection === AuthzCheck.OPTIONAL
  )
}

/** Writes anyone can call, as `METHOD /path`, over a given baseline. */
function anonymousWritesOf(baseline: Record<string, string>): string[] {
  return Object.entries(baseline)
    .filter(
      ([route, protection]) =>
        reachableByAnonymous(protection) && !route.startsWith('GET '),
    )
    .map(([route]) => route)
    .sort()
}

/** Routes under a public prefix that the net would not accept as read-only and reachable. */
function prefixOffenders(
  baseline: Record<string, string>,
  prefix: string,
): string[] {
  return Object.entries(baseline)
    .filter(([route]) => route.includes(` ${prefix}`))
    .filter(
      ([route, protection]) =>
        !route.startsWith('GET ') || !reachableByAnonymous(protection),
    )
    .map(([route]) => route)
    .sort()
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
  test('an anonymous or optional-session route that is not GET is in the declared list', ({
    assert,
  }) => {
    assert.deepEqual(anonymousWritesOf(BASELINE), DECLARED_ANONYMOUS_WRITES)
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
      assert.deepEqual(prefixOffenders(BASELINE, prefix), [])
    })
  }
})

test.group(
  'public routes (unit) > optional session counts as anonymous',
  () => {
    test('a POST with silentAuth is a public write, so it must be declared', ({
      assert,
    }) => {
      const baseline = {
        'GET /storefront/cart': AuthzCheck.OPTIONAL,
        'POST /storefront/orders': AuthzCheck.OPTIONAL,
      }

      assert.deepEqual(anonymousWritesOf(baseline), ['POST /storefront/orders'])
      // Not in the declared list, so the net's comparison fails for it.
      assert.notDeepEqual(
        anonymousWritesOf(baseline),
        DECLARED_ANONYMOUS_WRITES,
      )
    })

    test('a declared POST with silentAuth passes', ({ assert }) => {
      const baseline = { 'POST /authentication/sign-in': AuthzCheck.OPTIONAL }

      assert.deepEqual(anonymousWritesOf(baseline), [
        'POST /authentication/sign-in',
      ])
      assert.includeMembers(
        DECLARED_ANONYMOUS_WRITES,
        anonymousWritesOf(baseline),
      )
    })

    test('an authenticated or role-gated write is not a public write', ({
      assert,
    }) => {
      assert.deepEqual(
        anonymousWritesOf({
          'POST /account': AuthzCheck.AUTHENTICATED,
          'POST /administrator/x': 'OWNER',
        }),
        [],
      )
    })

    test('a GET with optional session under a public prefix is accepted', ({
      assert,
    }) => {
      assert.deepEqual(
        prefixOffenders(
          {
            'GET /storefront/cart': AuthzCheck.OPTIONAL,
            'GET /storefront/notices': AuthzCheck.ANONYMOUS,
          },
          '/storefront',
        ),
        [],
      )
    })

    test('a GET that requires a session under a public prefix is not', ({
      assert,
    }) => {
      assert.deepEqual(
        prefixOffenders(
          { 'GET /storefront/mine': AuthzCheck.AUTHENTICATED },
          '/storefront',
        ),
        ['GET /storefront/mine'],
      )
    })
  },
)
