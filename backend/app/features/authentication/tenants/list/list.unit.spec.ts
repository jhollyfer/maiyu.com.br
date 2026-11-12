import { test } from '@japa/runner'

import { PLATFORM_ROLE, type Actor } from '@maiyu/shared'

import AuthenticationTenantListUseCase from './list.use-case.ts'

import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import { ROLE_FIXTURES, TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

test.group('authentication/tenants > list (unit)', (group) => {
  insideHttpContext(group)

  test('lists the memberships with the city and the active one', async ({
    assert,
  }) => {
    const tenants = new TenantMemoryRepository(new SessionMemoryRepository())
      .addCity({ id: 'c1', name: 'Tabatinga', slug: 'tabatinga' })
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
    const useCase = await makeWithMemory(AuthenticationTenantListUseCase, [
      [TenantRepository, tenants],
    ])
    const actor: Actor = {
      id: 'u1',
      email: 'ana@mail.com',
      phone: null,
      platformRole: PLATFORM_ROLE.USER,
      tenant: {
        id: 't1',
        cityId: 'c1',
        role: ROLE_FIXTURES.staff,
        childIds: [],
      },
      avatarId: null,
    }

    const listed = rightOf(await useCase.execute({ actor }))

    assert.equal(listed.activeId, 't1')
    assert.deepEqual(listed.data[0]?.city, {
      id: 'c1',
      name: 'Tabatinga',
      slug: 'tabatinga',
    })
  })
})
