import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import {
  ACTIVE_STATUS,
  PLATFORM_ROLE,
  PLATFORM_ROLES,
  TENANT_TYPES,
  USER_ROLES,
} from '@maiyu/shared'

import { TenantConfig } from '#config/tenant'
import { DemoSeed } from '#database/demo/demo-seed'
import { DemoConfig } from '#database/demo/demo.config'
import { DemoProject } from '#database/demo/demo.project'
import { UserFactory } from '#database/factories/user.factory'
import type City from '#models/city'
import Tenant from '#models/tenant'
import TenantMembership from '#models/tenant-membership'
import User from '#models/user'
import { TenantLucidRepository } from '#repositories/tenant/tenant.lucid.repository'
import env from '#start/env'
import { resetDatabase } from '#tests/http-fixtures'
import { TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

const PASSWORD = 'demo-password-16-chars'

/** What the demonstration writes, and no more: one of each (DECISIONS.md #802). */
const PLATFORM_ACCOUNTS = PLATFORM_ROLES.filter(
  (role) => role !== PLATFORM_ROLE.USER,
)
const ACCOUNTS = PLATFORM_ACCOUNTS.length + USER_ROLES.length + 1
const TENANTS = TENANT_TYPES.length
const MEMBERSHIPS = USER_ROLES.length * TENANTS

async function seed(password: string) {
  env.set('SEED_DEMO_PASSWORD', password)
  await testUtils.db().seed()
}

function demoUsers() {
  return User.query().where('demo', true)
}

function demoTenants() {
  return Tenant.query().where('demo', true)
}

/** The city the seeder puts the demo tenants in: the same resolution, from the same config. */
async function demoCity(): Promise<City> {
  const { seed } = await app.container.make(TenantConfig)
  const city = await DemoSeed.cityOf(seed?.city ?? null)
  if (!city) throw new Error('no city for the demo tenants')

  return city
}

function domain(): string {
  return DemoConfig.domain(
    env.get('APP_CLIENT_URL') ?? env.get('APP_SERVER_URL'),
  )
}

test.group('seeders > demo', (group) => {
  group.each.setup(async () => {
    const teardown = await resetDatabase()
    // Multi-tenant, whatever `TENANT_PROJECT.singleSlug` says (DECISIONS.md #410): the public
    // resolution below addresses the demo tenant by its slug. The seed stays the project's.
    const { seed: projectSeed } = await app.container.make(TenantConfig)
    app.container.swap(TenantConfig, () => new TenantConfig(null, projectSeed))

    return async () => {
      env.set('SEED_DEMO_PASSWORD', '')
      await teardown()
    }
  })

  test('without the key (empty or only spaces) it creates nothing', async ({
    assert,
  }) => {
    await seed('')
    await seed('   ')

    assert.lengthOf(await demoUsers(), 0)
    assert.lengthOf(await demoTenants(), 0)
  })

  test('a password under 16 characters is refused with no row and no throw', async ({
    assert,
  }) => {
    await seed('a'.repeat(15))

    assert.lengthOf(await demoUsers(), 0)
    assert.lengthOf(await demoTenants(), 0)
  })

  test('it creates exactly one account per role and one demo tenant per type', async ({
    assert,
  }) => {
    await seed(PASSWORD)

    const users = await demoUsers()
    assert.lengthOf(users, ACCOUNTS)
    assert.lengthOf(await demoTenants(), TENANTS)
    assert.lengthOf(
      await TenantMembership.query().whereIn(
        'userId',
        users.map((user) => user.id),
      ),
      MEMBERSHIPS,
    )

    const emails = users.map((user) => user.email)
    for (const role of USER_ROLES)
      assert.include(emails, `${DemoConfig.label(role)}@${domain()}`)
    for (const role of PLATFORM_ACCOUNTS)
      assert.include(emails, `platform-${DemoConfig.label(role)}@${domain()}`)
    assert.include(emails, `customer@${domain()}`)
    for (const user of users) {
      assert.equal(user.status, ACTIVE_STATUS.ACTIVE)
      assert.isTrue(await hash.verify(user.password, PASSWORD))
    }
  })

  test('a project that is not ready makes the seed skip everything, accounts included', async ({
    assert,
  }) => {
    const ready = DemoProject.ready.bind(DemoProject)
    DemoProject.ready = () => ({
      ok: false,
      reason: 'repository without tenant scope',
    })

    try {
      await seed(PASSWORD)
    } finally {
      DemoProject.ready = ready
    }

    assert.lengthOf(await User.query().where('email', 'like', '%@demo.%'), 0)
    assert.lengthOf(await demoTenants(), 0)
  })

  test('a real account under a demo e-mail is never adopted nor given a membership', async ({
    assert,
  }) => {
    const real = await UserFactory.merge({
      name: 'Real Owner',
      email: `platform-owner@${domain()}`,
    }).create()

    await seed(PASSWORD)

    assert.isFalse((await User.findOrFail(real.id)).demo)
    assert.lengthOf(
      await User.query()
        .where('email', 'like', '%@demo.%')
        .where('demo', false),
      1,
    )
  })

  test('an unmarked account under a demo e-mail is skipped, even when named Demo', async ({
    assert,
  }) => {
    await seed(PASSWORD)
    await User.query()
      .where('email', `customer@${domain()}`)
      .update({ demo: false })

    await seed(PASSWORD)

    assert.lengthOf(
      await User.query().where('email', 'like', '%@demo.%'),
      ACCOUNTS,
    )
    assert.lengthOf(await demoUsers(), ACCOUNTS - 1)
  })

  // DECISIONS.md #812: a column of the project the kit does not fill (a NOT NULL `users.role`)
  // makes the insert fail; the seed runs on every deploy and must not fall over for one account.
  test('an account that fails to insert is skipped with a warning and the seed goes on', async ({
    assert,
  }) => {
    const rejected = `customer@${domain()}`
    const constraint = 'demo_seed_rejects_one_account'
    // DDL takes no bind parameter: the literal is quoted by hand.
    await db.rawQuery(
      `alter table users add constraint ${constraint} check (email <> '${rejected.replaceAll("'", "''")}')`,
    )

    try {
      await seed(PASSWORD)
    } finally {
      await db.rawQuery(`alter table users drop constraint ${constraint}`)
    }

    assert.lengthOf(await User.query().where('email', rejected), 0)
    assert.lengthOf(await demoUsers(), ACCOUNTS - 1)
    assert.lengthOf(await demoTenants(), TENANTS)
    assert.lengthOf(await TenantMembership.all(), MEMBERSHIPS)
  })

  // DECISIONS.md #812: only an integrity constraint is skipped; a failure of another kind is the
  // deploy's problem and the seed rethrows it.
  test('a failure that is not a constraint violation stops the seed', async ({
    assert,
  }) => {
    // A trigger that raises (SQLSTATE `P0001`, outside class 23) stands for any failure that is
    // not an integrity constraint: it is not the account's fault, so the seed does not hide it.
    await db.rawQuery(
      `create function demo_seed_boom() returns trigger language plpgsql as $$ begin raise exception 'boom'; end $$`,
    )
    await db.rawQuery(
      'create trigger demo_seed_boom before insert on users for each row execute function demo_seed_boom()',
    )

    try {
      await assert.rejects(() => seed(PASSWORD), '"db:seed" failed')
    } finally {
      await db.rawQuery('drop trigger demo_seed_boom on users')
      await db.rawQuery('drop function demo_seed_boom()')
    }
  })

  test('the end customer is an account with no membership', async ({
    assert,
  }) => {
    await seed(PASSWORD)

    const customer = await User.findByOrFail('email', `customer@${domain()}`)

    assert.equal(customer.platformRole, PLATFORM_ROLE.USER)
    assert.lengthOf(
      await TenantMembership.query().where('userId', customer.id),
      0,
    )
  })

  test('a second run creates nothing and does not reset a changed password', async ({
    assert,
  }) => {
    await seed(PASSWORD)
    const [first] = await demoUsers()
    if (!first) return assert.fail('the first run created no account')
    first.password = await hash.make('changed-in-the-panel-1!')
    await first.save()
    const stored = (await User.findOrFail(first.id)).password

    await seed(PASSWORD)

    assert.lengthOf(await demoUsers(), ACCOUNTS)
    assert.lengthOf(await demoTenants(), TENANTS)
    assert.equal((await User.findOrFail(first.id)).password, stored)
    const memberships = await TenantMembership.query().whereIn(
      'tenantId',
      (await demoTenants()).map((tenant) => tenant.id),
    )
    assert.lengthOf(memberships, MEMBERSHIPS)
  })

  test('a real tenant that holds a demo slug is left alone', async ({
    assert,
  }) => {
    const city = await demoCity()
    const real = await Tenants.create({
      citySlug: city.slug,
      slug: DemoConfig.slug(TENANT_TYPE_FIXTURE),
    })

    await seed(PASSWORD)

    assert.isFalse((await Tenant.findOrFail(real.id)).demo)
    assert.lengthOf(
      await TenantMembership.query().where('tenantId', real.id),
      0,
    )
    assert.lengthOf(await demoTenants(), TENANTS - 1)
  })

  test('the demo tenant is in no public list or count, and opens by its slug', async ({
    assert,
  }) => {
    const city = await demoCity()
    await Tenants.create({ citySlug: city.slug })
    await seed(PASSWORD)
    const demos = await demoTenants()
    const tenants = await app.container.make(TenantLucidRepository)
    // Every tenant of the city that is not a demo one: the project's own seeded tenant is among them.
    const real = (
      await Tenant.query().where('cityId', city.id).where('demo', false)
    )
      .map((each) => each.id)
      .sort()

    const cityWide = await tenants.resolvePublic(city.slug, null)
    assert.deepEqual([...(cityWide?.cityTenantIds ?? [])].sort(), real)
    assert.deepEqual(
      (await tenants.listPublic([...real, ...demos.map((each) => each.id)]))
        .map((tenant) => tenant.id)
        .sort(),
      real,
    )

    const overview = await tenants.overview()
    assert.notIncludeMembers(
      overview.tenants.map((tenant) => tenant.id),
      demos.map((each) => each.id),
    )
    assert.equal(
      overview.cities.find((each) => each.id === city.id)?.tenants,
      real.length,
    )

    for (const demo of demos) {
      const direct = await tenants.resolvePublic(city.slug, demo.slug)
      assert.equal(direct?.tenantId, demo.id)
      assert.deepEqual(direct?.cityTenantIds, [demo.id])
    }
  })

  test('in the single-client mode the demo tenant is reached by signing in with a demo account', async ({
    assert,
  }) => {
    const { seed: projectSeed } = await app.container.make(TenantConfig)
    app.container.swap(
      TenantConfig,
      () => new TenantConfig('single', projectSeed),
    )
    await seed(PASSWORD)
    const tenants = await app.container.make(TenantLucidRepository)
    const member = await User.findByOrFail(
      'email',
      `${DemoConfig.label(USER_ROLES[0] ?? '')}@${domain()}`,
    )

    const memberships = await tenants.membershipsOf(member.id)

    assert.sameMembers(
      memberships.map((each) => each.id),
      (await demoTenants()).map((each) => each.id),
    )
  })
})
