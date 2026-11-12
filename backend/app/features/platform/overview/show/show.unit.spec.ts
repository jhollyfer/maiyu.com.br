import { test } from '@japa/runner'

import PlatformOverviewShowUseCase from './show.use-case.ts'

import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import { ROLE_FIXTURES, TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

test.group('platform/overview > show (unit)', (group) => {
  insideHttpContext(group)

  test('counts tenants per city and members per tenant', async ({ assert }) => {
    const tenants = new TenantMemoryRepository(new SessionMemoryRepository())
      .addCity({ id: 'c1', name: 'Tabatinga', slug: 'tabatinga' })
      .addCity({ id: 'c2', name: 'Atalaia do Norte', slug: 'atalaia-do-norte' })
      .addTenant({
        id: 't1',
        name: 'Escola',
        slug: 'escola',
        type: TENANT_TYPE_FIXTURE,
        cityId: 'c1',
        parentId: null,
      })
      .addMembership({
        userId: 'u1',
        tenantId: 't1',
        role: ROLE_FIXTURES.staff,
      })
      .addMembership({
        userId: 'u2',
        tenantId: 't1',
        role: ROLE_FIXTURES.staff,
      })
    const useCase = await makeWithMemory(PlatformOverviewShowUseCase, [
      [TenantRepository, tenants],
    ])

    const overview = rightOf(await useCase.execute())

    assert.deepEqual(
      overview.cities.map((city) => [city.slug, city.tenants]),
      [
        ['tabatinga', 1],
        ['atalaia-do-norte', 0],
      ],
    )
    assert.equal(overview.tenants[0]?.members, 2)
  })
})
