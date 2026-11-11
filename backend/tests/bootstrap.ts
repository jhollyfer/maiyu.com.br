import { authApiClient } from '@adonisjs/auth/plugins/api_client'
import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import { dbAssertions } from '@adonisjs/lucid/plugins/db'
import { ApiClient, apiClient } from '@japa/api-client'
import { assert } from '@japa/assert'
import { pluginAdonisJS } from '@japa/plugin-adonisjs'
import { disallowPinnedTests } from '@japa/runner/plugins'
import { spec } from '@japa/runner/reporters'
import type { Config } from '@japa/runner/types'

import type { Registry } from '../.adonisjs/client/registry/schema.d.ts'

import { corsOrigins } from '#config/cors'
import env from '#start/env'
import { DatabaseGuard } from '#tests/database-guard'

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */
declare module '@japa/api-client/types' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions, @typescript-eslint/no-empty-object-type -- declaration merging requires an `interface`, and the merge is the whole body
  interface RoutesRegistry extends Registry {}
}

/**
 * This file is imported by the "bin/test.ts" entrypoint file
 */

/**
 * The test client is not a browser and does not send `Origin`; the origin barrier
 * (`origin.middleware.ts`) would refuse every write. Every request goes out as if it
 * came from the first origin of `CORS_ORIGINS` in `.env.test`, unless the test already
 * declared a browser signal: its own `Origin`, or a `Sec-Fetch-Site`, which the barrier
 * only reads when `Origin` is absent. The test that measures a request without either
 * removes the filled header in its own setup hook, which runs after this one:
 * `.setup((request) => { request.request.unset('origin') })`.
 */
ApiClient.setup((request) => {
  // The hook runs at send time, after the test's `.header()`: it only fills in when missing.
  if (request.request.get('origin')) return
  if (request.request.get('sec-fetch-site')) return

  // The first allowlisted origin of `.env.test`, so a project whose frontend is not on
  // 5173 does not refuse every e2e write.
  const [origin] = corsOrigins
  if (origin) request.header('origin', origin)
})

/**
 * Configure Japa plugins in the plugins array.
 * Learn more - https://japa.dev/docs/runner-config#plugins-optional
 */
export const plugins: Config['plugins'] = [
  // A forgotten `.pin()` makes CI run only the pinned test and stay green
  // (_doc-lib/japa.md#docs/filtering-tests): in CI the run fails.
  disallowPinnedTests({ disallow: Boolean(process.env.CI) }),
  assert(),
  pluginAdonisJS(app),
  dbAssertions(app),
  apiClient(),
  authApiClient(app),
]

/**
 * Reporters. Japa ships no TAP reporter, and the specification audit engine reads
 * exactly `ok N - title` / `not ok N - title` to know which acceptance criteria
 * passed.
 *
 * Enabled by `ONP_TAP=1` instead of `--reporter=tap`: an environment variable crosses
 * `node ace test` without depending on flag forwarding.
 */
const REPORTERS = {
  spec: { activated: ['spec'], list: [spec()] },
  tap: {
    activated: ['tap'],
    list: [
      {
        name: 'tap',
        handler: (_runner, emitter) => {
          let count = 0
          // The report is the process output itself, read by the audit engine.
          const line = (text: string): void => {
            process.stdout.write(`${text}\n`)
          }

          emitter.on('runner:start', () => line('TAP version 13'))

          emitter.on('test:end', (test) => {
            count += 1
            const title = test.title.expanded

            // Skipped is not proof: it comes out as `ok ... # SKIP`, which the engine
            // recognizes and refuses as evidence.
            if (test.isTodo) {
              line(`ok ${count} - ${title} # TODO`)
              return
            }

            if (test.isSkipped) {
              line(
                `ok ${count} - ${title} # SKIP ${test.skipReason ?? ''}`.trimEnd(),
              )
              return
            }

            if (test.hasError) {
              line(`not ok ${count} - ${title}`)

              for (const { error } of test.errors) {
                line(`  # ${error.message.split('\n').join('\n  # ')}`)
              }

              return
            }

            line(`ok ${count} - ${title}`)
          })

          emitter.on('runner:end', () => line(`1..${count}`))
        },
      },
    ],
  },
} satisfies Record<string, Config['reporters']>

let reporterMode: keyof typeof REPORTERS = 'spec'
if (process.env.ONP_TAP === '1') reporterMode = 'tap'

export const reporters: Config['reporters'] = REPORTERS[reporterMode]

/**
 * Configure lifecycle function to run before and after all the
 * tests.
 *
 * The setup functions are executed before all the tests
 * The teardown functions are executed after all the tests
 */
export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  // Before any suite and the first migration: a database without `_test` brings the runner down.
  setup: [() => DatabaseGuard.assertTestDatabase(env.get('DATABASE_URL'))],
  teardown: [],
}

/**
 * Configure suites by tapping into the test suite instance.
 * Learn more - https://japa.dev/docs/test-suites#lifecycle-hooks
 */
export const configureSuite: Config['configureSuite'] = (suite) => {
  // Only the suite that talks to the database and HTTP starts them: `unit` runs
  // without either (_standards/architecture.md §8). Migrations run once, before the
  // suite: without that the schema would only appear as a side effect of the
  // `truncate()` in `resetDatabase()`, and specs that do not call it would have no
  // table in a freshly created database.
  if (['browser', 'functional', 'e2e'].includes(suite.name)) {
    suite.setup(() => testUtils.db().migrate())
    suite.setup(() => testUtils.httpServer().start())
  }
}
