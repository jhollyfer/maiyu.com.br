import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { PLATFORM_ROLE, z } from '@maiyu/shared'

import E2eAccounts, {
  E2E_ACCOUNTS_MARKER,
  E2E_KIT_ACCOUNT_NAMES,
} from '#commands/e2e-accounts.command'
import type { KitAccountNameCollision } from '#commands/e2e-accounts.command'
import { TenantConfig } from '#config/tenant'
import Tenant from '#models/tenant'
import TenantMembership from '#models/tenant-membership'
import User from '#models/user'
import { ProjectE2eAccounts } from '#tests/e2e-project-accounts'
import { authenticate, resetDatabase } from '#tests/http-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'
import { DEFAULT_TENANT_SLUG, Tenants } from '#tests/tenants-fixtures'

const execFileAsync = promisify(execFile)

const ChildFailure = z.object({
  code: z.number(),
  stdout: z.string(),
  stderr: z.string(),
})

const Account = z.object({ login: z.string(), password: z.string() })

const Printed = z
  .object({ project: z.record(z.string(), Account) })
  .catchall(Account.nullable())

/**
 * The accounts of the E2E run (`node ace e2e:accounts`, DECISIONS.md #442): one per role, a random
 * password each run, and never in production.
 */
test.group('e2e > accounts', (group) => {
  group.each.setup(() => resetDatabase())

  async function run(inProduction = false, environment = 'production') {
    const ace = await app.container.make('ace')
    ace.ui.switchMode('raw')
    const command = await ace.create(E2eAccounts, [])
    const original = Object.getOwnPropertyDescriptor(app, 'nodeEnvironment')
    if (inProduction)
      Object.defineProperty(app, 'nodeEnvironment', {
        value: environment,
        configurable: true,
      })

    try {
      await command.exec()
    } finally {
      if (original) Object.defineProperty(app, 'nodeEnvironment', original)
      else Reflect.deleteProperty(app, 'nodeEnvironment')
    }

    return command
  }

  function printedOf(command: Awaited<ReturnType<typeof run>>) {
    const line = command.logger
      .getLogs()
      .map((log) => log.message)
      .find((message) => message.startsWith(E2E_ACCOUNTS_MARKER))
    if (!line) throw new Error('the command printed no accounts')

    return Printed.parse(JSON.parse(line.slice(E2E_ACCOUNTS_MARKER.length)))
  }

  /** The skeleton's accounts by role, without the `project` group. */
  function accountsOf(command: Awaited<ReturnType<typeof run>>) {
    return z
      .record(z.string(), Account.nullable())
      .parse(
        Object.fromEntries(
          Object.entries(printedOf(command)).filter(
            ([key]) => key !== 'project',
          ),
        ),
      )
  }

  function projectOf(command: Awaited<ReturnType<typeof run>>) {
    return printedOf(command).project
  }

  /** Swaps the project's extension point for one run and puts the original back. */
  async function withProject<T>(
    accounts: object,
    link: (userOf: (name: string) => User) => Promise<void>,
    body: () => Promise<T>,
  ) {
    const originalAccounts = Object.getOwnPropertyDescriptor(
      ProjectE2eAccounts,
      'accounts',
    )
    const originalLink = Object.getOwnPropertyDescriptor(
      ProjectE2eAccounts,
      'link',
    )
    Object.defineProperty(ProjectE2eAccounts, 'accounts', {
      value: accounts,
      configurable: true,
    })
    Object.defineProperty(ProjectE2eAccounts, 'link', {
      value: link,
      configurable: true,
    })
    try {
      return await body()
    } finally {
      if (originalAccounts)
        Object.defineProperty(ProjectE2eAccounts, 'accounts', originalAccounts)
      if (originalLink)
        Object.defineProperty(ProjectE2eAccounts, 'link', originalLink)
    }
  }

  test('prints an account per role and every one signs in', async ({
    client,
    assert,
  }) => {
    const command = await run()
    command.assertSucceeded()
    const accounts = accountsOf(command)

    const expected = [
      'platformOwner',
      'platformAdministrator',
      'staff',
      'customer',
    ]
    if (ROLE_FIXTURES.nonStaff !== null) expected.push('nonStaff')
    assert.sameMembers(
      Object.keys(accounts).filter((key) => accounts[key] !== null),
      expected,
    )
    for (const account of Object.values(accounts)) {
      if (account === null) continue
      await authenticate(client, account.login, account.password)
    }
  })

  test('the project accounts are created, linked after every account exists, and print under `project`', async ({
    client,
    assert,
  }) => {
    let usersWhenLinked = 0
    let linkedEmail: string | null | undefined
    const command = await withProject(
      {
        councilorA: { tenantRole: ROLE_FIXTURES.staff },
        councilorB: { tenantRole: ROLE_FIXTURES.staff },
      },
      async (userOf) => {
        usersWhenLinked = (await User.query()).length
        linkedEmail = userOf('councilorA').email
      },
      () => run(),
    )
    command.assertSucceeded()
    const project = projectOf(command)

    assert.sameMembers(Object.keys(project), ['councilorA', 'councilorB'])
    // The skeleton roles (4 or 5) and the two project accounts, all created before `link` ran.
    assert.isAtLeast(usersWhenLinked, 6)
    assert.equal(linkedEmail, project.councilorA?.login)
    for (const account of Object.values(project))
      await authenticate(client, account.login, account.password)
  })

  test('a failing link step prints no account', async ({ assert }) => {
    const command = await withProject(
      { councilorA: { tenantRole: ROLE_FIXTURES.staff } },
      () => Promise.reject(new Error('the link failed')),
      () => run(),
    )

    command.assertFailed()
    assert.isFalse(
      command.logger
        .getLogs()
        .some((log) => log.message.startsWith(E2E_ACCOUNTS_MARKER)),
    )
  })

  function printed(command: Awaited<ReturnType<typeof run>>) {
    return command.logger
      .getLogs()
      .some((log) => log.message.startsWith(E2E_ACCOUNTS_MARKER))
  }

  test('a project account named like a role of the kit is refused and nothing is created', async ({
    assert,
  }) => {
    const before = (await User.query()).length
    for (const name of E2E_KIT_ACCOUNT_NAMES) {
      const command = await withProject(
        { [name]: { tenantRole: ROLE_FIXTURES.staff } },
        () => Promise.resolve(),
        () => run(),
      )

      command.assertFailed()
      assert.isFalse(printed(command), name)
      assert.lengthOf(await User.query(), before, name)
    }
  })

  test('types: a project name equal to a role of the kit is a compile error', ({
    assert,
  }) => {
    // @ts-expect-error `staff` is a role of the kit: the collision type is not empty
    const bad: Record<
      KitAccountNameCollision<'staff' | 'councilorA'>,
      never
    > = {}
    const good: Record<KitAccountNameCollision<'councilorA'>, never> = {}

    assert.deepEqual({ ...bad, ...good }, {})
  })

  test('outside development and test it creates no project account either', async ({
    assert,
  }) => {
    const before = (await User.query()).length
    let linked = false
    const command = await withProject(
      { councilorA: { tenantRole: ROLE_FIXTURES.staff } },
      () => {
        linked = true

        return Promise.resolve()
      },
      () => run(true, 'staging'),
    )

    command.assertFailed()
    assert.isFalse(printed(command))
    assert.isFalse(linked)
    assert.lengthOf(await User.query(), before)
  })

  test('each project account has the role it declared', async ({ assert }) => {
    const tenant = await Tenants.fallback()
    const command = await withProject(
      {
        councilor: { tenantRole: ROLE_FIXTURES.staff },
        // A platform OWNER is accepted: the project asks for it by name, in a file that is its own.
        platformBoss: { platformRole: PLATFORM_ROLE.OWNER },
        platformStaff: { platformRole: PLATFORM_ROLE.ADMINISTRATOR },
      },
      () => Promise.resolve(),
      () => run(),
    )
    command.assertSucceeded()
    const project = projectOf(command)

    const councilor = await User.findByOrFail('email', project.councilor?.login)
    assert.equal(councilor.platformRole, PLATFORM_ROLE.USER)
    const membership = await Tenants.membershipOf(councilor, tenant)
    assert.equal(membership.role, ROLE_FIXTURES.staff)

    const boss = await User.findByOrFail('email', project.platformBoss?.login)
    assert.equal(boss.platformRole, PLATFORM_ROLE.OWNER)
    const staff = await User.findByOrFail('email', project.platformStaff?.login)
    assert.equal(staff.platformRole, PLATFORM_ROLE.ADMINISTRATOR)
    for (const user of [boss, staff])
      assert.isNull(
        await TenantMembership.query().where('userId', user.id).first(),
        'a platform account has no membership',
      )
  })

  /** The tenant the staff of the run is a member of, with `SINGLE_TENANT_SLUG` set or not. */
  async function staffTenantSlug(singleSlug: string | null) {
    app.container.swap(TenantConfig, () => new TenantConfig(singleSlug))
    try {
      const command = await run()
      command.assertSucceeded()
      const staff = await User.findByOrFail(
        'email',
        accountsOf(command).staff?.login,
      )
      const membership = await TenantMembership.query()
        .where('userId', staff.id)
        .firstOrFail()

      return (await Tenant.findOrFail(membership.tenantId)).slug
    } finally {
      // `resetDatabase` swapped the multi-tenant mode in; this puts it back for the next test.
      app.container.swap(TenantConfig, () => new TenantConfig(null))
    }
  }

  test('single-client mode: the staff of the run is a member of the tenant of SINGLE_TENANT_SLUG, so it sees what a visitor writes (DECISIONS.md #711)', async ({
    assert,
  }) => {
    assert.equal(await staffTenantSlug('cliente-unico'), 'cliente-unico')
  })

  test('multi-tenant mode: the staff of the run is a member of the default tenant', async ({
    assert,
  }) => {
    assert.equal(await staffTenantSlug(null), DEFAULT_TENANT_SLUG)
  })

  test('single-client mode reuses the tenant that already has the slug', async ({
    assert,
  }) => {
    const existing = await Tenants.create({ slug: 'cliente-unico' })

    assert.equal(await staffTenantSlug('cliente-unico'), existing.slug)
    assert.lengthOf(await Tenant.query().where('slug', 'cliente-unico'), 1)
  })

  test('the password is different on every run', async ({ assert }) => {
    const first = accountsOf(await run())
    const second = accountsOf(await run())

    assert.notEqual(first.staff?.password, second.staff?.password)
    assert.notEqual(first.staff?.login, second.staff?.login)
  })

  /**
   * A real child process, not `app.inProduction` swapped by hand: what matters is that the
   * `NODE_ENV` the process was started with (the one `process.env` carries, which wins over `.env`)
   * is what the command reads.
   */
  async function runChild(nodeEnv: string) {
    try {
      const { stdout, stderr } = await execFileAsync(
        'node',
        ['ace.js', 'e2e:accounts'],
        {
          cwd: app.makePath(),
          env: { ...process.env, NODE_ENV: nodeEnv },
        },
      )
      return { code: 0, output: `${stdout}${stderr}` }
    } catch (error) {
      const failure = ChildFailure.parse(error)
      return {
        code: failure.code,
        output: `${failure.stdout}${failure.stderr}`,
      }
    }
  }

  test('with NODE_ENV=production it creates nothing and fails', async ({
    assert,
  }) => {
    const result = await runChild('production')

    assert.notEqual(result.code, 0)
    assert.include(result.output, 'runs only in development and test')
    assert.notInclude(result.output, E2E_ACCOUNTS_MARKER)
  }).timeout(60_000)

  test('an environment outside the allow list is refused too', async ({
    assert,
  }) => {
    const command = await run(true, 'staging')

    command.assertFailed()
    assert.isFalse(
      command.logger
        .getLogs()
        .some((log) => log.message.startsWith(E2E_ACCOUNTS_MARKER)),
    )
  })
})
