import app from '@adonisjs/core/services/app'
import { test } from '@japa/runner'

import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { SessionRepository } from '#repositories/session/session.repository'
import { UserLucidRepository } from '#repositories/user/user.lucid.repository'
import { UserMemoryRepository } from '#repositories/user/user.memory.repository'
import { makeWithMemory } from '#tests/container-fixtures'

/**
 * Every repository that takes `SessionRepository` is built by the container, with `@inject()`
 * and the abstract class as a value import: the metadata of a type-only import is `Object`, and
 * the container refuses it with `Cannot inject "[Function: Object]"`
 * (_doc-lib/adonisjs.md#guides/concepts/dependency-injection,
 * https://docs.adonisjs.com/guides/concepts/dependency-injection). It builds nothing against the
 * database: the e2e contract spec (`user.repository.e2e.spec.ts`) needs Postgres to say the same.
 */
test.group('UserRepository > built by the container', () => {
  test('the memory repository is built with the session store in place', async ({
    assert,
  }) => {
    const sessions = new SessionMemoryRepository()

    const users = await makeWithMemory(UserMemoryRepository, [
      [SessionRepository, sessions],
    ])

    assert.instanceOf(users, UserMemoryRepository)
  })

  test('the memory repository is built with the session binding of the provider', async ({
    assert,
  }) => {
    const users = await app.container.make(UserMemoryRepository)

    assert.instanceOf(users, UserMemoryRepository)
  })

  test('the Lucid repository is built with the session binding of the provider', async ({
    assert,
  }) => {
    const users = await app.container.make(UserLucidRepository)

    assert.instanceOf(users, UserLucidRepository)
  })
})
