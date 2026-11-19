import { test } from '@japa/runner'

import { PLATFORM_ROLE, type Actor } from '@maiyu/shared'

import AccountEmailConfirmUseCase from './confirm.use-case.ts'

import { EmailChangeMemoryRepository } from '#repositories/email-change/email-change.memory.repository'
import { EmailChangeRepository } from '#repositories/email-change/email-change.repository'
import { SessionRepository } from '#repositories/session/session.repository'
import { UnitOfWork } from '#repositories/unit-of-work/unit-of-work'
import { MemoryUnitOfWork } from '#repositories/unit-of-work/unit-of-work.memory'
import { UserRepository } from '#repositories/user/user.repository'
import { ClockContract } from '#services/clock/clock.contract'
import { ClockFake } from '#services/clock/clock.fake'
import EmailToken from '#services/email-change/email-token'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import {
  identityDoubles,
  seedUser,
  USER_ID,
} from '#tests/identity-unit-fixtures'

const ACTOR: Actor = {
  id: USER_ID,
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  tenant: null,
  avatarId: null,
}

const TOKEN = 'a'.repeat(64)
const OTHER_ID = 'ffffffff-ffff-4fff-8fff-ffffffffffff'

async function setup() {
  const doubles = identityDoubles()
  const changes = new EmailChangeMemoryRepository()
  const clock = new ClockFake()
  const useCase = await makeWithMemory(AccountEmailConfirmUseCase, [
    [UserRepository, doubles.users],
    [SessionRepository, doubles.sessions],
    [EmailChangeRepository, changes],
    [UnitOfWork, new MemoryUnitOfWork()],
    [ClockContract, clock],
  ])
  await seedUser(doubles.users)
  await changes.replace({
    userId: USER_ID,
    email: 'nova@mail.com',
    tokenHash: EmailToken.hash(TOKEN),
    expiresAt: clock.now().plus({ minutes: 60 }).toJSDate(),
  })

  return { ...doubles, changes, clock, useCase }
}

test.group('account/email > confirm (unit)', (group) => {
  insideHttpContext(group)

  test('the right token changes the e-mail, ends the old sessions and issues a new pair', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()

    const tokens = rightOf(
      await useCase.execute({ actor: ACTOR, token: TOKEN }),
    )

    assert.isString(tokens.accessToken)
    assert.deepEqual(sessions.revokedAll, [USER_ID])
    assert.deepEqual(sessions.issued, [USER_ID])
    assert.equal(
      (await users.findById(USER_ID))?.snapshot().email,
      'nova@mail.com',
    )
  })

  test('the token works once: the second try is 422 EMAIL_TOKEN_INVALID on token', async ({
    assert,
  }) => {
    const { useCase } = await setup()
    await useCase.execute({ actor: ACTOR, token: TOKEN })

    const again = await useCase.execute({ actor: ACTOR, token: TOKEN })

    assert.deepInclude(again.value, {
      status: 422,
      code: 'EMAIL_TOKEN_INVALID',
    })
    assert.deepInclude(again.value, {
      errors: {
        token: 'O código não confere ou já expirou. Peça a troca de novo.',
      },
    })
  })

  test('a wrong token changes nothing and keeps the request alive', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()

    const wrong = await useCase.execute({ actor: ACTOR, token: 'b'.repeat(64) })

    assert.deepInclude(wrong.value, { code: 'EMAIL_TOKEN_INVALID' })
    assert.deepEqual(sessions.revokedAll, [])
    assert.equal(
      (await users.findById(USER_ID))?.snapshot().email,
      'ana@mail.com',
    )
    assert.isTrue(
      (await useCase.execute({ actor: ACTOR, token: TOKEN })).isRight(),
    )
  })

  test('an expired token is 422 EMAIL_TOKEN_INVALID', async ({ assert }) => {
    const { clock, useCase } = await setup()
    clock.advance({ minutes: 61 })

    const result = await useCase.execute({ actor: ACTOR, token: TOKEN })

    assert.deepInclude(result.value, { code: 'EMAIL_TOKEN_INVALID' })
  })

  test('the token of another account does not open this one', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    await seedUser(users, { id: OTHER_ID, email: 'bia@mail.com' })

    const result = await useCase.execute({
      actor: { ...ACTOR, id: OTHER_ID },
      token: TOKEN,
    })

    assert.deepInclude(result.value, { code: 'EMAIL_TOKEN_INVALID' })
  })

  test('an address another account took meanwhile is 422 EMAIL_TAKEN', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()
    await seedUser(users, { id: OTHER_ID, email: 'nova@mail.com' })

    const result = await useCase.execute({ actor: ACTOR, token: TOKEN })

    assert.deepInclude(result.value, { status: 422, code: 'EMAIL_TAKEN' })
    assert.equal(
      (await users.findById(USER_ID))?.snapshot().email,
      'ana@mail.com',
    )
  })

  test('an account that vanished after the guard is 401', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      actor: { ...ACTOR, id: '00000000-0000-4000-8000-000000000000' },
      token: TOKEN,
    })

    assert.deepInclude(result.value, { status: 401 })
  })
})
