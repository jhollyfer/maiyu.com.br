import { randomUUID } from 'node:crypto'

import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { test } from '@japa/runner'

import { ACTIVE_STATUS, PLATFORM_ROLE } from '@maiyu/shared'

import { UserLucidRepository } from './user.lucid.repository.ts'
import { UserMemoryRepository } from './user.memory.repository.ts'
import type { UserRepository } from './user.repository.ts'

import { User } from '#domain/user/user.entity'
import { SessionMemoryRepository } from '#repositories/session/session.memory.repository'
import { SessionRepository } from '#repositories/session/session.repository'
import { rightOf } from '#tests/either-fixtures'
import { resetDatabase, signInWithFactory } from '#tests/http-fixtures'

/**
 * The same contract in both implementations (`_standards/domain.md` §5.4): it is what
 * guarantees that the sign-in unit test, which runs on the in-memory one, does not pass
 * against a lying double. The account has two identities (DECISIONS.md #396).
 */
const IMPLEMENTATIONS = {
  lucid: (): Promise<UserRepository> => app.container.make(UserLucidRepository),
  memory: (): Promise<UserRepository> =>
    app.container.make(UserMemoryRepository),
} satisfies Record<string, () => Promise<UserRepository>>

function account(contact: {
  readonly email?: string | null
  readonly phone?: string | null
}): User {
  return rightOf(
    User.create({
      id: randomUUID(),
      name: 'Ana',
      password: 'Senha@123',
      platformRole: PLATFORM_ROLE.USER,
      now: new Date('2026-11-11T12:00:00Z'),
      ...contact,
    }),
  )
}

for (const [name, make] of Object.entries(IMPLEMENTATIONS)) {
  test.group(`UserRepository (${name})`, (group) => {
    group.each.setup(() => resetDatabase())

    test('an account with a phone and no e-mail is saved and read by the phone', async ({
      assert,
    }) => {
      const users = await make()
      const saved = account({ phone: '+5597991234567' })

      await users.save(saved)

      const found = await users.findByPhone('+5597991234567')
      assert.equal(found?.id, saved.id)
      assert.isNull(found?.snapshot().email)
      assert.isNull(await users.findByEmail('ana@mail.com'))
    })

    test('an account with only an e-mail is not found by any phone', async ({
      assert,
    }) => {
      const users = await make()
      await users.save(account({ email: 'ana@mail.com' }))

      assert.isNull(await users.findByPhone('+5597991234567'))
      assert.isNotNull(await users.findByEmail('ana@mail.com'))
    })

    test('the e-mail is found in any capitals, stored or typed', async ({
      assert,
    }) => {
      const users = await make()
      const saved = account({ email: 'Ana@Mail.com' })
      await users.save(saved)

      assert.equal((await users.findByEmail('ana@mail.com'))?.id, saved.id)
      assert.equal((await users.findByEmail('ANA@MAIL.COM'))?.id, saved.id)
      assert.isNull(await users.findByEmail('bia@mail.com'))
    })

    test('two accounts with no e-mail live together: the unique column ignores the NULLs', async ({
      assert,
    }) => {
      const users = await make()

      await users.save(account({ phone: '+5597991234567' }))
      await users.save(account({ phone: '+5597998887766' }))

      assert.isNotNull(await users.findByPhone('+5597991234567'))
      assert.isNotNull(await users.findByPhone('+5597998887766'))
    })
  })
}

/**
 * The same revocation in both implementations, each with its session store: the Lucid account
 * against the Lucid tokens (one transaction), the memory account against the memory tokens.
 */
const PAIRS = {
  lucid: async () => ({
    users: await app.container.make(UserLucidRepository),
    sessions: await app.container.make(SessionRepository),
  }),
  memory: async () => {
    const sessions = await app.container.make(SessionMemoryRepository)

    return {
      users: await app.container.make(UserMemoryRepository, [sessions]),
      sessions,
    }
  },
} satisfies Record<
  string,
  () => Promise<{ users: UserRepository; sessions: SessionRepository }>
>

for (const [name, pair] of Object.entries(PAIRS)) {
  test.group(`UserRepository (${name}) > session revocation`, (group) => {
    group.each.setup(() => resetDatabase())

    // An old cookie must not outlive the change it was granted before (_standards/backend.md §4.2).
    for (const [field, value] of [
      ['password', 'Outra@456'],
      ['platformRole', PLATFORM_ROLE.OWNER],
      ['email', 'nova@mail.com'],
      ['phone', '+5597998887766'],
      ['status', ACTIVE_STATUS.INACTIVE],
    ] as const) {
      test(`changing ${field} revokes every session; renaming does not`, async ({
        assert,
      }) => {
        const { users, sessions } = await pair()
        const saved = account({ email: 'ana@mail.com' })
        await users.save(saved)
        const stored = await users.findById(saved.id)
        if (!stored) return assert.fail('the account was saved')

        const kept = await sessions.issue(saved.id)
        await users.save(
          User.restore({ ...stored.snapshot(), name: 'Ana Maria' }),
        )
        assert.isNotNull(await sessions.readRefresh(kept?.refreshToken ?? ''))

        await users.save(User.restore({ ...stored.snapshot(), [field]: value }))
        assert.isNull(await sessions.readRefresh(kept?.refreshToken ?? ''))
      })
    }
  })
}

/**
 * The same revocation seen from the browser: the cookie of a session signed in before the change
 * answers 401 at the next request, after a new password and after a new platform role.
 */
test.group('UserRepository > old session after the change', (group) => {
  group.each.setup(() => resetDatabase())

  for (const change of [
    { password: 'Outra@456' },
    { platformRole: PLATFORM_ROLE.OWNER },
  ] as const) {
    test(`${Object.keys(change).join()} turns the old cookie into 401`, async ({
      client,
      assert,
    }) => {
      const { user, session } = await signInWithFactory(client, 'staff')
      const users = await app.container.make(UserLucidRepository)
      const stored = await users.findById(user.id)
      if (!stored) return assert.fail('the account exists')

      const before = await client
        .get('/authentication/tenants')
        .cookies(session)
      before.assertStatus(200)

      await users.save(User.restore({ ...stored.snapshot(), ...change }))

      const after = await client.get('/authentication/tenants').cookies(session)
      after.assertStatus(401)
    })
  }
})

/**
 * What only the database can hold: the kit has no sign-up route, so the `422` and the `409` of a
 * repeated phone belong to the project's sign-up use case (`_standards/domain.md` §6). These are the
 * facts it translates, proven against Postgres.
 */
test.group('UserRepository (database invariants)', (group) => {
  group.each.setup(() => resetDatabase())

  const row = (contact: Record<string, string | null>) => ({
    id: randomUUID(),
    name: 'Ana',
    password: 'x',
    platform_role: 'USER',
    status: 'ACTIVE',
    created_at: new Date(),
    ...contact,
  })

  test('an account with no e-mail and no phone is refused, by the entity and by the table', async ({
    assert,
  }) => {
    const born = User.create({
      id: randomUUID(),
      name: 'Ana',
      password: 'Senha@123',
      platformRole: PLATFORM_ROLE.USER,
      now: new Date(),
    })

    assert.deepEqual(born.value, { code: 'USER_CONTACT_REQUIRED' })
    await assert.rejects(
      () => db.table('users').insert(row({ email: null, phone: null })),
      /users_contact_required/,
    )
  })

  test('a repeated phone is refused by the unique index', async ({
    assert,
  }) => {
    await db.table('users').insert(row({ phone: '+5597991234567' }))

    await assert.rejects(
      () => db.table('users').insert(row({ phone: '+5597991234567' })),
      /users_phone_unique/,
    )
  })

  test('a phone outside E.164 is refused by the table', async ({ assert }) => {
    await assert.rejects(
      () => db.table('users').insert(row({ phone: '97991234567' })),
      /users_phone_e164/,
    )
  })
})
