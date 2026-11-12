import { test } from '@japa/runner'

import StorefrontTenantListUseCase from './list.use-case.ts'

import { TenantScope } from '#core/tenant-scope'
import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import { TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

test.group('storefront/tenants > list (unit)', (group) => {
  insideHttpContext(group)

  test('lists only the tenants of the scope', async ({ assert }) => {
    const tenant = {
      type: TENANT_TYPE_FIXTURE,
      cityId: 'c1',
      parentId: null,
    }
    const tenants = new TenantMemoryRepository(new SessionMemoryRepository())
      .addTenant({ ...tenant, id: 't1', name: 'Ana', slug: 'ana' })
      .addTenant({ ...tenant, id: 't2', name: 'Bia', slug: 'bia' })
    const useCase = await makeWithMemory(StorefrontTenantListUseCase, [
      [TenantRepository, tenants],
    ])

    const listed = rightOf(
      await useCase.execute({ scope: TenantScope.ofPublic(null, ['t2']) }),
    )

    assert.deepEqual(
      listed.map((each) => each.id),
      ['t2'],
    )
  })
})
