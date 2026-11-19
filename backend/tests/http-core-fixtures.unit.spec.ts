import { readFileSync } from 'node:fs'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

/**
 * The HTTP fixtures core must not depend on the multi-tenant skeleton (DECISIONS.md #784): a
 * project without it compiles the specs and writes only `tests/http-skeleton-fixtures.ts`. A core
 * file that imports the tenant, the roles or the factory fails here, with its name.
 */
test.group('http fixtures core > no tenant (unit)', () => {
  const CORE = ['tests/http-core-fixtures.ts']
  const SKELETON = [
    /#config\/tenant/,
    /#models\/tenant/,
    /#models\/user/,
    /user\.factory/,
    /tenants-fixtures/,
    /role-fixtures/,
    /users-fixtures/,
    /PLATFORM_ROLE/,
    /TenantConfig/,
  ]

  test('the core files import nothing of the skeleton', ({ assert }) => {
    for (const file of CORE) {
      const source = readFileSync(app.makePath(file), 'utf8')
      for (const forbidden of SKELETON)
        assert.notMatch(source, forbidden, `${file} ${String(forbidden)}`)
    }
  })
})
