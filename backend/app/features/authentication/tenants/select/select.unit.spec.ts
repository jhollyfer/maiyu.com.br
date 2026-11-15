import { test } from '@japa/runner'

import { PLATFORM_ROLE, type Actor } from '@maiyu/shared'

import AuthenticationTenantSelectUseCase from './select.use-case.ts'

import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import { TenantRepository } from '#repositories/tenant/tenant.repository'
import { makeWithMemory } from '#tests/container-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import { ROLE_FIXTURES, TENANT_TYPE_FIXTURE } from '#tests/role-fixtures'

const ACTOR: Actor = {
  id: 'u1',
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  tenant: null,
  avatarId: null,
}

async function setup() {
  const tenant = {
    type: TENANT_TYPE_FIXTURE,
    cityId: 'c1',
    parentId: null,
  }
  const tenants = new TenantMemoryRepository(new SessionMemoryRepository())
    .addTenant({ ...tenant, id: 't1', name: 'Ana', slug: 'ana' })
    .addTenant({ ...tenant, id: 't2', name: 'Bia', slug: 'bia' })
    .addTenant({ ...tenant, id: 't3', name: 'Cia', slug: 'cia' })
    .addMembership({ userId: 'u1', tenantId: 't1', role: ROLE_FIXTURES.staff })
    .addMembership({ userId: 'u1', tenantId: 't2', role: ROLE_FIXTURES.staff })
  const useCase = await makeWithMemory(AuthenticationTenantSelectUseCase, [
    [TenantRepository, tenants],
  ])

  return { tenants, useCase }
}

test.group('authentication/tenants > select (unit)', (group) => {
  insideHttpContext(group)

  test('records a tenant the account is a member of', async ({ assert }) => {
    const { tenants, useCase } = await setup()

    const result = await useCase.execute({ actor: ACTOR, tenantId: 't2' })

    assert.isTrue(result.isRight())
    assert.equal(tenants.active.get('u1'), 't2')
  })

  test('a tenant without membership is 404 TENANT_NOT_FOUND', async ({
    assert,
  }) => {
    const { tenants, useCase } = await setup()

    const result = await useCase.execute({ actor: ACTOR, tenantId: 't3' })

    assert.deepInclude(result.value, { status: 404, code: 'TENANT_NOT_FOUND' })
    assert.isFalse(tenants.active.has('u1'))
  })
})
