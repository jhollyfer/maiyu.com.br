import { readFileSync } from 'node:fs'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { E2eGuard } from '#tests/e2e-guard'
import { E2E_ACCOUNT_EMAIL_PATTERN, E2eIdentities } from '#tests/e2e-identity'

const LOCAL = 'postgres://u:p@localhost:5434/app'

test.group('tests > e2e-guard (unit)', () => {
  test('lets development and test run against a loopback database', ({
    assert,
  }) => {
    for (const environment of ['development', 'test'])
      for (const url of [LOCAL, 'postgres://u:p@127.0.0.1/app'])
        assert.isNull(
          E2eGuard.environmentRefusal('e2e:accounts', environment, url),
        )
  })

  test('refuses an environment outside the allow list, before reading the database', ({
    assert,
  }) => {
    for (const environment of ['production', 'staging', 'prod', ''])
      assert.include(
        E2eGuard.environmentRefusal('e2e:accounts', environment, LOCAL) ?? '',
        'runs only in development and test',
        environment,
      )
  })

  test('refuses a database that is not on loopback even in development', ({
    assert,
  }) => {
    for (const url of [
      'postgres://u:p@db.example.com:5432/app',
      'postgres://u:p@10.0.0.5/app',
      'postgres://u:p@localhost.evil.example/app',
      undefined,
    ])
      assert.include(
        E2eGuard.environmentRefusal('e2e:accounts', 'development', url) ?? '',
        'e2e:accounts refused',
        String(url),
      )
  })

  test('the tables of the skeleton are refused only where the project lists them', ({
    assert,
  }) => {
    const markers = [{ table: 'cities', column: 'name' }]

    assert.isNull(E2eGuard.markersRefusal(markers, []))
    assert.include(
      E2eGuard.markersRefusal(markers, ['tenants', 'cities']) ?? '',
      'E2E_CLEANUP_KIT_TABLE',
    )
    assert.include(
      E2eGuard.markersRefusal([{ table: 'users', column: 'name' }], []) ?? '',
      'E2E_CLEANUP_KIT_TABLE',
    )
  })
})

test.group('tests > e2e-identity (unit)', () => {
  test('the login matches the pattern e2e:cleanup deletes by, the name has the prefix', ({
    assert,
  }) => {
    const pattern = new RegExp(E2E_ACCOUNT_EMAIL_PATTERN, 'i')
    for (const label of ['staff', 'non-staff', 'councilorA']) {
      const identity = E2eIdentities.of(label)

      assert.match(identity.login, pattern)
      assert.equal(identity.name, `E2E ${label}`)
    }
  })

  test('the password is random per call and passes the policy classes', ({
    assert,
  }) => {
    const first = E2eIdentities.of('staff')
    const second = E2eIdentities.of('staff')

    assert.notEqual(first.password, second.password)
    assert.notEqual(first.login, second.login)
    // The random part may or may not have each class, so the fixed tail is what guarantees them.
    const tail = first.password.slice(-4)
    assert.match(tail, /[a-z]/)
    assert.match(tail, /[A-Z]/)
    assert.match(tail, /[0-9]/)
    assert.match(tail, /[^a-zA-Z0-9]/)
    assert.isAtLeast(first.password.length, 16)
  })
})

/**
 * The core of `e2e:accounts` and `e2e:cleanup` must not depend on the multi-tenant skeleton
 * (DECISIONS.md #778): a project without it compiles and runs them, and writes only the two
 * extension points. A file that imports the tenant, the role fixtures or the `platformRole` column
 * fails here, with its name.
 */
test.group('e2e core > no tenant (unit)', () => {
  const CORE = [
    'commands/e2e-accounts.command.ts',
    'commands/e2e-cleanup.command.ts',
    'tests/e2e-guard.ts',
    'tests/e2e-identity.ts',
  ]
  const SKELETON = [
    /#config\/tenant/,
    /#models\/tenant/,
    /#models\/user/,
    /tenants-fixtures/,
    /role-fixtures/,
    /PLATFORM_ROLE/,
    /platformRole/,
    /TenantConfig/,
  ]

  test('the core files import nothing of the skeleton', ({ assert }) => {
    for (const file of CORE) {
      const source = readFileSync(app.makePath(file), 'utf8')
      for (const forbidden of SKELETON)
        assert.notMatch(source, forbidden, `${file} ${String(forbidden)}`)
    }
  })

  test('the skeleton part is the one that names the tenant', ({ assert }) => {
    const source = readFileSync(
      app.makePath('tests/e2e-skeleton-accounts.ts'),
      'utf8',
    )

    assert.match(source, /tenants-fixtures/)
    assert.match(source, /platformRole/)
  })
})
