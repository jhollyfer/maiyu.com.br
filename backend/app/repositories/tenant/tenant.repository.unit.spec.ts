import { test } from '@japa/runner'

import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { SessionRepository } from '#repositories/session/session.repository'
import { TenantMemoryRepository } from '#repositories/tenant/tenant.memory.repository'
import { makeWithMemory } from '#tests/container-fixtures'

/**
 * Same rule as `UserRepository > built by the container`: the repository that takes
 * `SessionRepository` is built by the container, with the abstract class as a value import
 * (_doc-lib/adonisjs.md#guides/concepts/dependency-injection,
 * https://docs.adonisjs.com/guides/concepts/dependency-injection).
 */
test.group('TenantRepository > built by the container', () => {
  test('the tenant memory repository is built with the session store in place', async ({
    assert,
  }) => {
    const tenants = await makeWithMemory(TenantMemoryRepository, [
      [SessionRepository, new SessionMemoryRepository()],
    ])

    assert.instanceOf(tenants, TenantMemoryRepository)
  })
})
