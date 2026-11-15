import hash from '@adonisjs/core/services/hash'
import { test } from '@japa/runner'

import { PLATFORM_ROLE, type Actor } from '@maiyu/shared'

import AccountProfileUpdateUseCase from './update.use-case.ts'

import { EmailChangeMemoryRepository } from '#repositories/email-change/email-change.memory.repository'
import { EmailChangeRepository } from '#repositories/email-change/email-change.repository'
import { SessionRepository } from '#repositories/session/session.repository'
import { StorageRepository } from '#repositories/storage/storage.repository'
import { UserRepository } from '#repositories/user/user.repository'
import { EmailChangeContract } from '#services/email-change/email-change.contract'
import { EmailChangeFake } from '#services/email-change/email-change.fake'
import EmailToken from '#services/email-change/email-token'
import { StorageContract } from '#services/storage/storage.contract'
import { makeWithMemory } from '#tests/container-fixtures'
import { rightOf } from '#tests/either-fixtures'
import { insideHttpContext } from '#tests/http-context-fixtures'
import {
  identityDoubles,
  PASSWORD,
  seedUser,
  USER_ID,
} from '#tests/identity-unit-fixtures'
import {
  FILE_ID,
  pendingFile,
  storageDoubles,
  uploadedFile,
} from '#tests/storages-unit-fixtures'

const PENDING_ID = '9b8a7c6d-5e4f-4b3a-8d2c-1f0e9d8c7b6a'
const OTHER_ID = '2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e'
const NOBODY_ID = '3c4d5e6f-7a8b-4c9d-8e1f-2a3b4c5d6e7f'

const ACTOR: Actor = {
  id: USER_ID,
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  tenant: null,
  avatarId: null,
}

const NEW_PASSWORD = 'Nova@12345'

async function setup(emailAvailable = true) {
  const doubles = identityDoubles()
  const files = storageDoubles()
  const emailChange = new EmailChangeFake(emailAvailable)
  const emailChanges = new EmailChangeMemoryRepository()
  const useCase = await makeWithMemory(AccountProfileUpdateUseCase, [
    [UserRepository, doubles.users],
    [SessionRepository, doubles.sessions],
    [StorageRepository, files.storages],
    [StorageContract, files.bucket],
    [EmailChangeContract, emailChange],
    [EmailChangeRepository, emailChanges],
  ])
  await seedUser(doubles.users)

  return { ...doubles, ...files, emailChange, emailChanges, useCase }
}

test.group('account/profile > update (unit)', (group) => {
  insideHttpContext(group)

  test('a new name keeps the sessions and the password', async ({ assert }) => {
    const { users, sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        name: 'Ana Maria',
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.name, 'Ana Maria')
    assert.isFalse(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [])
    const stored = await users.findById(USER_ID)
    assert.isTrue(
      await hash.verify(stored?.snapshot().password ?? '', PASSWORD),
    )
  })

  test('a new password is hashed and ends every session of the account', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        password: NEW_PASSWORD,
        currentPassword: PASSWORD,
      }),
    )

    assert.isTrue(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [USER_ID])
    const stored = await users.findById(USER_ID)
    assert.isTrue(
      await hash.verify(stored?.snapshot().password ?? '', NEW_PASSWORD),
    )
  })

  test('a wrong current password is 422 on currentPassword and changes nothing', async ({
    assert,
  }) => {
    const { users, useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      name: 'Outro',
      currentPassword: 'Errada@123',
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'CURRENT_PASSWORD_INVALID',
    })
    assert.equal((await users.findById(USER_ID))?.snapshot().name, 'Ana')
  })

  test('the new password equal to the current one is 422 PASSWORD_SAME_AS_CURRENT', async ({
    assert,
  }) => {
    const { sessions, useCase } = await setup()

    const result = await useCase.execute({
      actor: ACTOR,
      password: PASSWORD,
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'PASSWORD_SAME_AS_CURRENT',
    })
    assert.deepEqual(sessions.revokedAll, [])
  })

  test('a new phone is saved and ends every session of the account', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        phone: '+5597991234567',
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.phone, '+5597991234567')
    assert.isTrue(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [USER_ID])
    assert.equal(
      (await users.findById(USER_ID))?.snapshot().phone,
      '+5597991234567',
    )
  })

  test('the phone the account already has is not a change: the sessions stay', async ({
    assert,
  }) => {
    const doubles = identityDoubles()
    const useCase = await makeWithMemory(AccountProfileUpdateUseCase, [
      [UserRepository, doubles.users],
      [SessionRepository, doubles.sessions],
    ])
    await seedUser(doubles.users, { phone: '+5597991234567' })

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        phone: '+5597991234567',
        currentPassword: PASSWORD,
      }),
    )

    assert.isFalse(result.sessionsRevoked)
    assert.deepEqual(doubles.sessions.revokedAll, [])
  })

  test('a phone another account holds is 422 PHONE_TAKEN on phone and changes nothing', async ({
    assert,
  }) => {
    const { users, sessions, useCase } = await setup()
    await seedUser(users, {
      id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      email: 'bia@mail.com',
      phone: '+5597998887766',
    })

    const result = await useCase.execute({
      actor: ACTOR,
      phone: '+5597998887766',
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, { status: 422, code: 'PHONE_TAKEN' })
    assert.deepInclude(result.value, {
      errors: { phone: 'Este celular já está em uso por outra conta' },
    })
    assert.deepEqual(sessions.revokedAll, [])
    assert.isNull((await users.findById(USER_ID))?.snapshot().phone)
  })

  test('an account that vanished after the guard is 401', async ({
    assert,
  }) => {
    const { useCase } = await setup()

    const result = await useCase.execute({
      actor: { ...ACTOR, id: 'ffffffff-ffff-4fff-8fff-ffffffffffff' },
      name: 'Ana',
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, { status: 401 })
  })

  test('a photo the request owns is saved, comes back signed, and keeps the sessions', async ({
    assert,
  }) => {
    const { users, sessions, storages, useCase } = await setup()
    await storages.save(uploadedFile(FILE_ID, USER_ID))

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        avatarId: FILE_ID,
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.avatar?.id, FILE_ID)
    assert.isString(result.profile.avatar?.url)
    assert.isFalse(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [])
    assert.equal((await users.findById(USER_ID))?.snapshot().avatarId, FILE_ID)
  })

  test('a photo that does not exist, or is not confirmed, is 422 AVATAR_INVALID on avatarId', async ({
    assert,
  }) => {
    const { users, storages, useCase } = await setup()
    await storages.save(pendingFile({ id: PENDING_ID, uploadedBy: USER_ID }))

    for (const avatarId of [FILE_ID, PENDING_ID]) {
      const result = await useCase.execute({
        actor: ACTOR,
        avatarId,
        currentPassword: PASSWORD,
      })

      assert.deepInclude(result.value, { status: 422, code: 'AVATAR_INVALID' })
    }
    assert.isNull((await users.findById(USER_ID))?.snapshot().avatarId)
  })

  test('a confirmed photo another account uploaded, or one nobody owns, is 422 AVATAR_INVALID', async ({
    assert,
  }) => {
    const { users, storages, useCase } = await setup()
    await storages.save(uploadedFile(FILE_ID, OTHER_ID))
    await storages.save(uploadedFile(NOBODY_ID, null))

    for (const avatarId of [FILE_ID, NOBODY_ID]) {
      const result = await useCase.execute({
        actor: ACTOR,
        avatarId,
        currentPassword: PASSWORD,
      })

      assert.deepInclude(result.value, { status: 422, code: 'AVATAR_INVALID' })
    }
    assert.isNull((await users.findById(USER_ID))?.snapshot().avatarId)
  })

  test('null removes the photo', async ({ assert }) => {
    const { users, storages, useCase } = await setup()
    await storages.save(uploadedFile(FILE_ID, USER_ID))
    await useCase.execute({
      actor: ACTOR,
      avatarId: FILE_ID,
      currentPassword: PASSWORD,
    })

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        avatarId: null,
        currentPassword: PASSWORD,
      }),
    )

    assert.isNull(result.profile.avatar)
    assert.isNull((await users.findById(USER_ID))?.snapshot().avatarId)
  })

  test('a new e-mail asks for the confirmation: the e-mail stays, the sessions stay, the token goes out', async ({
    assert,
  }) => {
    const { users, sessions, emailChange, emailChanges, useCase } =
      await setup()

    const result = rightOf(
      await useCase.execute({
        actor: ACTOR,
        email: 'nova@mail.com',
        currentPassword: PASSWORD,
      }),
    )

    assert.equal(result.profile.pendingEmail, 'nova@mail.com')
    assert.equal(result.profile.email, 'ana@mail.com')
    assert.isFalse(result.sessionsRevoked)
    assert.deepEqual(sessions.revokedAll, [])
    const [delivery] = emailChange.delivered
    assert.equal(delivery?.to, 'nova@mail.com')
    const pending = await emailChanges.claim(
      USER_ID,
      EmailToken.hash(delivery?.token ?? ''),
      new Date(),
    )
    assert.equal(pending?.email, 'nova@mail.com')
    assert.equal(
      (await users.findById(USER_ID))?.snapshot().email,
      'ana@mail.com',
    )
  })

  test('without the e-mail block (or SMTP) the e-mail is 422 EMAIL_CHANGE_UNAVAILABLE and nothing is delivered', async ({
    assert,
  }) => {
    const { emailChange, useCase } = await setup(false)

    const result = await useCase.execute({
      actor: ACTOR,
      email: 'nova@mail.com',
      currentPassword: PASSWORD,
    })

    assert.deepInclude(result.value, {
      status: 422,
      code: 'EMAIL_CHANGE_UNAVAILABLE',
    })
    assert.deepEqual(emailChange.delivered, [])
  })

  test('the e-mail the account has is 422 EMAIL_SAME_AS_CURRENT, another account is 422 EMAIL_TAKEN', async ({
    assert,
  }) => {
    const { users, emailChange, useCase } = await setup()
    await seedUser(users, {
      id: 'ffffffff-ffff-4fff-8fff-ffffffffffff',
      email: 'bia@mail.com',
    })

    const same = await useCase.execute({
      actor: ACTOR,
      email: 'ana@mail.com',
      currentPassword: PASSWORD,
    })
    const taken = await useCase.execute({
      actor: ACTOR,
      email: 'bia@mail.com',
      currentPassword: PASSWORD,
    })

    assert.deepInclude(same.value, { code: 'EMAIL_SAME_AS_CURRENT' })
    assert.deepInclude(taken.value, { code: 'EMAIL_TAKEN' })
    assert.deepEqual(emailChange.delivered, [])
  })
})
