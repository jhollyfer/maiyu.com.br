import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import { ACTIVE_STATUS, PLATFORM_ROLE, USER_ROLES, z } from '@maiyu/shared'

import E2eAccounts from '#commands/e2e-accounts.command'
import E2eCleanup, {
  E2E_CLEANUP_MARKER,
  E2E_MARKER,
} from '#commands/e2e-cleanup.command'
import Tenant from '#models/tenant'
import TenantMembership from '#models/tenant-membership'
import User from '#models/user'
import { E2eGuard } from '#tests/e2e-guard'
import { E2E_ACCOUNT_EMAIL_PATTERN } from '#tests/e2e-identity'
import { ProjectE2eCleanup } from '#tests/e2e-project-cleanup'
import { resetDatabase } from '#tests/http-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

const Report = z.object({
  accounts: z.number(),
  tenants: z.number(),
  rows: z.record(z.string(), z.number()),
})

/**
 * What the E2E run leaves behind and `node ace e2e:cleanup` takes away (DECISIONS.md #713): the rows
 * the specs marked, in the tables the project declared, and the accounts with the E2E e-mail
 * (`e2e:accounts` made them, or a spec signed them up fresh, #819). Nothing without the marker goes, and production is refused.
 */
test.group('e2e > cleanup', (group) => {
  group.each.setup(async () => {
    const reset = await resetDatabase()
    await db.rawQuery(
      'create table e2e_probe (id serial primary key, title text not null)',
    )

    return async () => {
      await db.rawQuery('drop table if exists e2e_probe')
      await reset()
    }
  })

  async function exec(
    command: typeof E2eAccounts | typeof E2eCleanup,
    environment?: string,
  ) {
    const ace = await app.container.make('ace')
    ace.ui.switchMode('raw')
    const created = await ace.create(command, [])
    const original = Object.getOwnPropertyDescriptor(app, 'nodeEnvironment')
    if (environment)
      Object.defineProperty(app, 'nodeEnvironment', {
        value: environment,
        configurable: true,
      })

    try {
      await created.exec()
    } finally {
      if (original) Object.defineProperty(app, 'nodeEnvironment', original)
      else Reflect.deleteProperty(app, 'nodeEnvironment')
    }

    return created
  }

  /** Swaps the project's list of marked tables for one run and puts the original back. */
  async function withMarkers<T>(markers: object, body: () => Promise<T>) {
    const original = Object.getOwnPropertyDescriptor(
      ProjectE2eCleanup,
      'markers',
    )
    Object.defineProperty(ProjectE2eCleanup, 'markers', {
      value: markers,
      configurable: true,
    })
    try {
      return await body()
    } finally {
      if (original)
        Object.defineProperty(ProjectE2eCleanup, 'markers', original)
    }
  }

  const PROBE = [{ table: 'e2e_probe', column: 'title' }]

  async function titles() {
    const rows = z
      .array(z.object({ title: z.string() }))
      .parse(await db.from('e2e_probe').orderBy('id'))

    return rows.map((row) => row.title)
  }

  function reportOf(command: Awaited<ReturnType<typeof exec>>) {
    const line = command.logger
      .getLogs()
      .map((log) => log.message)
      .find((message) => message.startsWith(E2E_CLEANUP_MARKER))
    if (!line) throw new Error('the command printed no report')

    return Report.parse(JSON.parse(line.slice(E2E_CLEANUP_MARKER.length)))
  }

  async function emails() {
    const rows = await User.query().orderBy('email')
    return rows.map((row) => String(row.email))
  }

  test('deletes only the marked rows of the declared tables', async ({
    assert,
  }) => {
    await db
      .table('e2e_probe')
      .multiInsert([
        { title: `${E2E_MARKER}report one` },
        { title: 'a real report' },
        { title: `not ${E2E_MARKER}at the start` },
        { title: `${E2E_MARKER}two` },
      ])

    const command = await withMarkers(PROBE, () => exec(E2eCleanup))

    command.assertSucceeded()
    assert.deepEqual(await titles(), [
      'a real report',
      `not ${E2E_MARKER}at the start`,
    ])
    assert.equal(reportOf(command).rows['e2e_probe.title'], 2)
  })

  test('a table that is not declared is never touched, marker or not', async ({
    assert,
  }) => {
    await db.table('e2e_probe').insert({ title: `${E2E_MARKER}left alone` })

    const command = await exec(E2eCleanup)

    command.assertSucceeded()
    assert.deepEqual(await titles(), [`${E2E_MARKER}left alone`])
  })

  test('deletes the accounts e2e:accounts created, with their memberships, and keeps every other user', async ({
    assert,
  }) => {
    const kept = await User.create({
      name: 'A real person',
      email: 'real.person@example.com',
      password: 'Sup3r-secret!',
      platformRole: PLATFORM_ROLE.USER,
      status: ACTIVE_STATUS.ACTIVE,
    })
    // The name alone is not a marker: the e-mail of the account must be the one E2E makes.
    const namedLikeOne = await User.create({
      name: 'E2E but a person',
      email: 'someone@example.com',
      password: 'Sup3r-secret!',
      platformRole: PLATFORM_ROLE.USER,
      status: ACTIVE_STATUS.ACTIVE,
    })
    // Real accounts whose e-mail only looks like the E2E one (no label, other domain, a prefix).
    const lookalikes = await Promise.all(
      [
        'e2e-staff@example.com',
        'e2e-staff-0123abcd@example.org',
        'real-e2e-staff-0123abcd@example.com',
        'e2e-staff-0123abcd@example.com.br',
      ].map((email) =>
        User.create({
          name: 'E2E staff',
          email,
          password: 'Sup3r-secret!',
          platformRole: PLATFORM_ROLE.USER,
          status: ACTIVE_STATUS.ACTIVE,
        }),
      ),
    )
    // The memberships already there (the owner's, seeded in single-tenant mode, #410) stay: the
    // cleanup removes only those of the accounts `e2e:accounts` made.
    const seeded = (await TenantMembership.query()).length
    ;(await exec(E2eAccounts)).assertSucceeded()
    assert.isAbove((await TenantMembership.query()).length, seeded)

    const command = await exec(E2eCleanup)

    command.assertSucceeded()
    assert.isAtLeast(reportOf(command).accounts, 4)
    assert.sameMembers(
      (await emails()).filter((email) =>
        new RegExp(E2E_ACCOUNT_EMAIL_PATTERN, 'i').test(email),
      ),
      [],
    )
    assert.includeMembers(await emails(), [
      kept.email,
      namedLikeOne.email,
      ...lookalikes.map((each) => each.email),
    ])
    assert.lengthOf(await TenantMembership.query(), seeded)
  })

  test('deletes a fresh account a spec signed up, whatever name the sign-up copied, with the data tied to it, and keeps a real one of a similar name (DECISIONS.md #819)', async ({
    assert,
  }) => {
    // `User.email` is `string | null` in a project with phone-only accounts (DECISIONS.md #396): the
    // assertion uses the literal, not the model's field.
    const freshEmail = 'e2e-fresh-0a1b2c3d@example.com'
    const fresh = await User.create({
      name: 'Maria da Silva',
      email: freshEmail,
      password: 'Sup3r-secret!',
      platformRole: PLATFORM_ROLE.USER,
      status: ACTIVE_STATUS.ACTIVE,
    })
    const real = await User.create({
      name: 'Maria da Silva',
      email: 'maria.da.silva@example.com',
      password: 'Sup3r-secret!',
      platformRole: PLATFORM_ROLE.USER,
      status: ACTIVE_STATUS.ACTIVE,
    })
    const realWithE2eName = await User.create({
      name: 'E2E fresh',
      email: 'fresh@example.com',
      password: 'Sup3r-secret!',
      platformRole: PLATFORM_ROLE.USER,
      status: ACTIVE_STATUS.ACTIVE,
    })
    // Data tied to the account by a foreign key (`ON DELETE CASCADE`): it goes with the account.
    await db.table('email_changes').insert({
      user_id: fresh.id,
      new_email: 'new@example.com',
      token_hash: 'a'.repeat(64),
      expires_at: new Date(Date.now() + 60_000),
      created_at: new Date(),
    })
    await db.table('email_changes').insert({
      user_id: real.id,
      new_email: 'real.new@example.com',
      token_hash: 'b'.repeat(64),
      expires_at: new Date(Date.now() + 60_000),
      created_at: new Date(),
    })

    const command = await exec(E2eCleanup)

    command.assertSucceeded()
    assert.equal(reportOf(command).accounts, 1)
    const left = await emails()
    assert.notInclude(left, freshEmail)
    assert.includeMembers(left, [real.email, realWithE2eName.email])
    const changes = z
      .array(z.object({ user_id: z.string() }))
      .parse(await db.from('email_changes'))
    assert.deepEqual(
      changes.map((each) => each.user_id),
      [real.id],
    )
  })

  test('deletes the account that has only a phone, by the E2E phone, and keeps a real phone (DECISIONS.md #819)', async ({
    assert,
  }) => {
    const phoneOnly = (name: string, phone: string) =>
      User.create({
        name,
        phone,
        password: 'Sup3r-secret!',
        platformRole: PLATFORM_ROLE.USER,
        status: ACTIVE_STATUS.ACTIVE,
      })
    await phoneOnly('Maria', '+5592900001234')
    const real = await phoneOnly('Maria', '+5592991234567')
    // Shaped like the marker, but not it: the zeros are not right after the 9.
    const lookalike = await phoneOnly('Maria', '+5592991000012')

    const command = await exec(E2eCleanup)

    command.assertSucceeded()
    assert.equal(reportOf(command).accounts, 1)
    const left = (await User.query()).map((user) => user.phone)
    assert.notInclude(left, '+5592900001234')
    assert.includeMembers(left, [real.phone, lookalike.phone])
  })

  test('deletes the tenants named with the marker, with their memberships, and keeps a real tenant of a similar name (DECISIONS.md #819)', async ({
    assert,
  }) => {
    const marked = await Tenants.create()
    await marked.merge({ name: `${E2E_MARKER}Loja 1` }).save()
    const real = await Tenants.create()
    await real.merge({ name: 'E2E Consulting' }).save()
    const lower = await Tenants.create()
    await lower.merge({ name: 'Loja do E2E-' }).save()
    const person = await User.create({
      name: 'A real person',
      email: 'real.person@example.com',
      password: 'Sup3r-secret!',
      platformRole: PLATFORM_ROLE.USER,
      status: ACTIVE_STATUS.ACTIVE,
    })
    const [role] = USER_ROLES
    if (!role) return assert.fail('the project has no member role')
    await Tenants.addMember(person, marked, role)

    const command = await exec(E2eCleanup)

    command.assertSucceeded()
    assert.equal(reportOf(command).tenants, 1)
    assert.isNull(await Tenant.find(marked.id))
    assert.isNotNull(await Tenant.find(real.id))
    assert.isNotNull(await Tenant.find(lower.id))
    assert.isNotNull(await User.find(person.id))
    assert.lengthOf(
      await TenantMembership.query().where('tenantId', marked.id),
      0,
    )
  })

  test('is idempotent: a second run finds nothing and says zero', async ({
    assert,
  }) => {
    await db.table('e2e_probe').insert({ title: `${E2E_MARKER}once` })
    ;(await exec(E2eAccounts)).assertSucceeded()

    await withMarkers(PROBE, async () => {
      ;(await exec(E2eCleanup)).assertSucceeded()
      const second = await exec(E2eCleanup)

      second.assertSucceeded()
      assert.deepEqual(reportOf(second), {
        accounts: 0,
        tenants: 0,
        rows: { 'e2e_probe.title': 0 },
      })
    })
  })

  test('refuses production and any environment outside the allow list, deleting nothing', async ({
    assert,
  }) => {
    await db.table('e2e_probe').insert({ title: `${E2E_MARKER}stays` })
    ;(await exec(E2eAccounts)).assertSucceeded()
    const before = (await User.query()).length

    for (const environment of ['production', 'staging']) {
      const command = await withMarkers(PROBE, () =>
        exec(E2eCleanup, environment),
      )

      command.assertFailed()
      assert.isFalse(
        command.logger
          .getLogs()
          .some((log) => log.message.startsWith(E2E_CLEANUP_MARKER)),
        environment,
      )
    }
    assert.deepEqual(await titles(), [`${E2E_MARKER}stays`])
    assert.lengthOf(await User.query(), before)
  })

  function messagesOf(command: Awaited<ReturnType<typeof exec>>) {
    return command.logger
      .getLogs()
      .map((log) => log.message)
      .join('\n')
  }

  test('refuses, by its own validation and before the database, a table or column that is not a plain identifier', async ({
    assert,
  }) => {
    await db.table('e2e_probe').insert({ title: `${E2E_MARKER}stays` })

    // The first two the database would accept as they are: only the validation stops them.
    for (const bad of [
      { table: 'public.e2e_probe', column: 'title' },
      { table: 'e2e_probe as x', column: 'title' },
      { table: 'e2e_probe', column: 'title" or "1"="1' },
      { table: 'e2e_probe; drop table users', column: 'title' },
      { table: 'E2e_Probe', column: 'title' },
      { table: '', column: 'title' },
    ]) {
      const command = await withMarkers([bad], () => exec(E2eCleanup))

      command.assertFailed()
      assert.include(
        messagesOf(command),
        'E2E_CLEANUP_INVALID_MARKER',
        bad.table,
      )
    }
    assert.deepEqual(await titles(), [`${E2E_MARKER}stays`])
  })

  test('refuses the tables of the kit in the project list, deleting nothing', async ({
    assert,
  }) => {
    ;(await exec(E2eAccounts)).assertSucceeded()
    const before = (await User.query()).length

    for (const table of [
      ...E2eGuard.KIT_TABLES,
      ...ProjectE2eCleanup.skeletonTables,
    ]) {
      const command = await withMarkers([{ table, column: 'name' }], () =>
        exec(E2eCleanup),
      )

      command.assertFailed()
      assert.include(messagesOf(command), 'E2E_CLEANUP_KIT_TABLE', table)
    }
    assert.lengthOf(await User.query(), before)
  })

  /**
   * Runs `command` with the connection URL pointing at `url` and puts the real one back. The commands
   * read the URL the Lucid connection uses (`config/database.ts`, computed once at boot), so the swap
   * goes through the config, not through `env`.
   */
  async function withDatabaseUrl<T>(url: string, body: () => Promise<T>) {
    const key = 'database.connections.pg.connection.connectionString'
    const original = app.config.get<string | undefined>(key)
    app.config.set(key, url)
    try {
      return await body()
    } finally {
      app.config.set(key, original)
    }
  }

  test('a database that is not on loopback is refused even with NODE_ENV=development, by both commands', async ({
    assert,
  }) => {
    await db.table('e2e_probe').insert({ title: `${E2E_MARKER}stays` })
    const before = (await User.query()).length

    for (const environment of ['development', 'test']) {
      for (const command of [E2eCleanup, E2eAccounts]) {
        const ran = await withDatabaseUrl(
          'postgres://u:p@db.production.internal:5432/app',
          () => withMarkers(PROBE, () => exec(command, environment)),
        )

        ran.assertFailed()
        assert.include(messagesOf(ran), 'not loopback', command.commandName)
      }
    }
    assert.deepEqual(await titles(), [`${E2E_MARKER}stays`])
    assert.lengthOf(await User.query(), before)
  })

  test('a title that only starts with the letters E2E, without the hyphen, is not a marker', async ({
    assert,
  }) => {
    await db
      .table('e2e_probe')
      .multiInsert([{ title: 'E2E consulting' }, { title: `${E2E_MARKER}x` }])

    await withMarkers(PROBE, () => exec(E2eCleanup))

    assert.deepEqual(await titles(), ['E2E consulting'])
  })

  test('a failing delete undoes the whole run', async ({ assert }) => {
    await db.table('e2e_probe').insert({ title: `${E2E_MARKER}stays` })
    ;(await exec(E2eAccounts)).assertSucceeded()
    const before = (await User.query()).length

    // The second table does not exist: the transaction rolls back the first delete.
    await withMarkers(
      [PROBE[0], { table: 'no_such_table', column: 'title' }],
      async () => {
        try {
          await exec(E2eCleanup)
        } catch {
          // the command lets the database error through
        }
      },
    )

    assert.deepEqual(await titles(), [`${E2E_MARKER}stays`])
    assert.lengthOf(await User.query(), before)
  })
})
