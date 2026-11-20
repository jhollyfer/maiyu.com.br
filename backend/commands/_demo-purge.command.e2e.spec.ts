import app from '@adonisjs/core/services/app'
import testUtils from '@adonisjs/core/services/test_utils'
import drive from '@adonisjs/drive/services/main'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import DemoPurgeCommand from '#commands/demo-purge.command'
import { DemoImage } from '#database/demo/demo-image'
import { UserFactory } from '#database/factories/user.factory'
import Storage from '#models/storage'
import Tenant from '#models/tenant'
import env from '#start/env'
import { resetDatabase } from '#tests/http-fixtures'
import { storageRow } from '#tests/storages-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

const PASSWORD = 'demo-password-16-chars'

async function run(arguments_: string[] = ['--force']) {
  const ace = await app.container.make('ace')
  ace.ui.switchMode('raw')
  const command = await ace.create(DemoPurgeCommand, arguments_)

  return command
}

/** Every row of the tables the demonstration writes, by id: what "as it was" means. */
async function snapshot() {
  const ids = async (table: string) =>
    (await db.from(table).select('id'))
      .map((row: { id: string }) => row.id)
      .sort()

  return {
    tenants: await ids('tenants'),
    users: await ids('users'),
    storages: await ids('storages'),
    memberships: await ids('tenant_memberships'),
  }
}

async function seedDemo() {
  env.set('SEED_DEMO_PASSWORD', PASSWORD)
  await testUtils.db().seed()
}

test.group('demo > purge', (group) => {
  group.each.setup(async () => {
    const teardown = await resetDatabase()

    return async () => {
      env.set('SEED_DEMO_PASSWORD', '')
      await teardown()
    }
  })

  test('it leaves the database and the bucket as they were before the demonstration', async ({
    assert,
  }) => {
    const real = await Tenants.create()
    await UserFactory.create()
    const realFile = await storageRow({ tenantId: real.id })
    const before = await snapshot()

    await seedDemo()
    const demo = await Tenant.query().where('demo', true).firstOrFail()
    const image = await DemoImage.of(demo, 'cover')
    assert.isTrue(await drive.use().exists(image.path))

    const command = await run()
    await command.exec()

    assert.deepEqual(await snapshot(), before)
    assert.isFalse(await drive.use().exists(image.path))
    assert.isNotNull(await Storage.find(realFile.id))
    assert.equal(command.exitCode ?? 0, 0)
  })

  test('it touches no account that only looks like a demo one', async ({
    assert,
  }) => {
    const sameName = await UserFactory.merge({
      name: 'Demo Someone',
      email: 'someone@example.com',
    }).create()
    const sameEmail = await UserFactory.merge({
      name: 'Real Person',
      email: 'person@demo.example.com',
    }).create()
    await seedDemo()

    const command = await run()
    await command.exec()

    assert.isNotNull(await db.from('users').where('id', sameName.id).first())
    assert.isNotNull(await db.from('users').where('id', sameEmail.id).first())
  })

  test('it is idempotent: with no demo left it deletes nothing', async ({
    assert,
  }) => {
    await seedDemo()
    const first = await run()
    await first.exec()
    const before = await snapshot()

    const second = await run()
    await second.exec()

    assert.deepEqual(await snapshot(), before)
    assert.isTrue(
      second.logger
        .getLogs()
        .some((log) =>
          log.message.includes('0 tenants, 0 files and 0 accounts'),
        ),
    )
  })

  test('--dry-run says what it would delete and deletes nothing', async ({
    assert,
  }) => {
    await seedDemo()
    const before = await snapshot()

    const command = await run(['--dry-run'])
    await command.exec()

    assert.deepEqual(await snapshot(), before)
    assert.isTrue(
      command.logger
        .getLogs()
        .some((log) => log.message.includes('would delete')),
    )
  })

  test('without --force it asks, and a refusal deletes nothing', async ({
    assert,
  }) => {
    await seedDemo()
    const before = await snapshot()

    const command = await run([])
    command.prompt
      .trap('Delete the demo records, files, tenants and accounts?')
      .reject()
    await command.exec()

    assert.deepEqual(await snapshot(), before)
  })

  test('without --force it deletes after the confirmation', async ({
    assert,
  }) => {
    await seedDemo()

    const command = await run([])
    command.prompt
      .trap('Delete the demo records, files, tenants and accounts?')
      .accept()
    await command.exec()

    assert.lengthOf(await Tenant.query().where('demo', true), 0)
  })
})
