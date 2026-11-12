import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { z } from '@maiyu/shared'

import E2eAccounts, {
  E2E_ACCOUNTS_MARKER,
} from '#commands/e2e-accounts.command'
import { authenticate, resetDatabase } from '#tests/http-fixtures'
import { ROLE_FIXTURES } from '#tests/role-fixtures'

const execFileAsync = promisify(execFile)

const ChildFailure = z.object({
  code: z.number(),
  stdout: z.string(),
  stderr: z.string(),
})

const Accounts = z.record(
  z.string(),
  z.object({ login: z.string(), password: z.string() }).nullable(),
)

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

  function accountsOf(command: Awaited<ReturnType<typeof run>>) {
    const line = command.logger
      .getLogs()
      .map((log) => log.message)
      .find((message) => message.startsWith(E2E_ACCOUNTS_MARKER))
    if (!line) throw new Error('the command printed no accounts')

    return Accounts.parse(JSON.parse(line.slice(E2E_ACCOUNTS_MARKER.length)))
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
