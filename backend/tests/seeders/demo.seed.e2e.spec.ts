import app from '@adonisjs/core/services/app'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'

import {
  ACTIVE_STATUS,
  PLATFORM_ROLE,
  PLATFORM_ROLES,
  TENANT_TYPES,
  USER_ROLES,
} from '@maiyu/shared'

import { DemoConfig } from '#database/demo/demo.config'
import City from '#models/city'
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
  return User.query().where('email', 'like', '%@demo.%')
}

function demoTenants() {
  return Tenant.query().where('demo', true)
}

function domain(): string {
  return DemoConfig.domain(
    env.get('APP_CLIENT_URL') ?? env.get('APP_SERVER_URL'),
  )
}

test.group('seeders > demo', (group) => {
  group.each.setup(async () => {
    const teardown = await resetDatabase()

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
    const city = await City.query().orderBy('slug', 'asc').firstOrFail()
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
    const city = await City.query().orderBy('slug', 'asc').firstOrFail()
    const real = await Tenants.create({ citySlug: city.slug })
    await seed(PASSWORD)
    const demos = await demoTenants()
    const tenants = await app.container.make(TenantLucidRepository)

    const cityWide = await tenants.resolvePublic(city.slug, null)
    assert.deepEqual(cityWide?.cityTenantIds, [real.id])
    assert.deepEqual(
      (
        await tenants.listPublic([real.id, ...demos.map((each) => each.id)])
      ).map((tenant) => tenant.id),
      [real.id],
    )

    const overview = await tenants.overview()
    assert.notIncludeMembers(
      overview.tenants.map((tenant) => tenant.id),
      demos.map((each) => each.id),
    )
    assert.equal(
      overview.cities.find((each) => each.id === city.id)?.tenants,
      1,
    )

    for (const demo of demos) {
      const direct = await tenants.resolvePublic(city.slug, demo.slug)
      assert.equal(direct?.tenantId, demo.id)
      assert.deepEqual(direct?.cityTenantIds, [demo.id])
    }
  })
})
