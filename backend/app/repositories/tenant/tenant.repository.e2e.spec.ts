import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { ACTIVE_STATUS } from '@maiyu/shared'

import { UserFactory } from '#database/factories/user.factory'
import { SessionRepository } from '#repositories/session/session.repository'
import { TenantLucidRepository } from '#repositories/tenant/tenant.lucid.repository'
import { resetDatabase } from '#tests/http-fixtures'
import { NO_ROLE_CHANGE, ROLE_CHANGE } from '#tests/role-fixtures'
import { Tenants } from '#tests/tenants-fixtures'

/**
 * The membership write ends the account's sessions by itself (DECISIONS.md #397): no caller has to
 * remember it, so a future path that writes a membership without the platform use case still
 * revokes, in the same transaction.
 */
test.group('TenantRepository (lucid) > membership ends sessions', (group) => {
  group.each.setup(() => resetDatabase())

  test('saving a new role and removing the membership revoke; the same role does not', async ({
    assert,
  }) => {
    if (!ROLE_CHANGE) return assert.fail('the project has two roles')
    const tenants = await app.container.make(TenantLucidRepository)
    const sessions = await app.container.make(SessionRepository)
    const tenant = await Tenants.create()
    const user = await UserFactory.create()

    const first = await tenants.saveMember(tenant.id, user.id, ROLE_CHANGE.from)
    const kept = await sessions.issue(user.id)
    const same = await tenants.saveMember(tenant.id, user.id, ROLE_CHANGE.from)
    assert.isFalse(same.changed)
    assert.isNotNull(await sessions.readRefresh(kept?.refreshToken ?? ''))

    await tenants.saveMember(tenant.id, user.id, ROLE_CHANGE.to)
    assert.isNull(await sessions.readRefresh(kept?.refreshToken ?? ''))

    const again = await sessions.issue(user.id)
    await tenants.removeMember(first.member.id)
    assert.isNull(await sessions.readRefresh(again?.refreshToken ?? ''))
  }).skip(ROLE_CHANGE === undefined, NO_ROLE_CHANGE)
})

/**
 * The single-client address (DECISIONS.md #399) against Postgres, where the repository reads the
 * rows: the in-memory double alone would let a wrong `where` pass (a mutation survived).
 */
test.group('TenantRepository (lucid) > resolveSingle', (group) => {
  group.each.setup(() => resetDatabase())

  test('an active tenant with the slug is the address', async ({ assert }) => {
    const tenants = await app.container.make(TenantLucidRepository)
    const tenant = await Tenants.create({ slug: 'unico' })

    const target = await tenants.resolveSingle('unico')

    assert.equal(target?.tenantId, tenant.id)
    assert.equal(target?.cityId, tenant.cityId)
    assert.deepEqual(target?.cityTenantIds, [tenant.id])
  })

  test('an inactive tenant, or none, is no address', async ({ assert }) => {
    const tenants = await app.container.make(TenantLucidRepository)
    await Tenants.create({ slug: 'parado', status: ACTIVE_STATUS.INACTIVE })

    assert.isNull(await tenants.resolveSingle('parado'))
    assert.isNull(await tenants.resolveSingle('ninguem'))
  })

  test('the same slug active in two cities is ambiguous, so no address', async ({
    assert,
  }) => {
    const tenants = await app.container.make(TenantLucidRepository)
    await Tenants.create({ slug: 'repetido' })
    await Tenants.create({ slug: 'repetido', citySlug: 'tabatinga' })

    assert.isNull(await tenants.resolveSingle('repetido'))
  })

  test('the inactive twin does not make the active one ambiguous', async ({
    assert,
  }) => {
    const tenants = await app.container.make(TenantLucidRepository)
    const active = await Tenants.create({ slug: 'gemeo' })
    await Tenants.create({
      slug: 'gemeo',
      citySlug: 'tabatinga',
      status: ACTIVE_STATUS.INACTIVE,
    })

    assert.equal((await tenants.resolveSingle('gemeo'))?.tenantId, active.id)
  })
})
