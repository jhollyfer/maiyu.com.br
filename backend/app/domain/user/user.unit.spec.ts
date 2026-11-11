import { test } from '@japa/runner'

import { ACTIVE_STATUS, USER_ROLE } from '@maiyu/shared'

import { User } from './user.entity.ts'

const BORN = new Date('2026-10-29T12:00:00Z')
const CHANGED = new Date('2026-11-11T09:00:00Z')

function owner(): User {
  return User.restore({
    id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
    name: 'Ana',
    email: 'ana@mail.com',
    password: '$argon2id$stored',
    role: USER_ROLE.ADMINISTRATOR,
    status: ACTIVE_STATUS.ACTIVE,
    createdAt: BORN,
    updatedAt: null,
  })
}

test.group('User > update', () => {
  test('a new e-mail is written, stamps the instant and asks to revoke the sessions', ({
    assert,
  }) => {
    const user = owner()

    user.update({ email: 'nova@mail.com' }, CHANGED)

    assert.deepInclude(user.snapshot(), {
      email: 'nova@mail.com',
      updatedAt: CHANGED,
    })
    assert.isTrue(user.credentials().revokeSessions)
  })

  test('the same e-mail changes nothing and does not ask to revoke the sessions', ({
    assert,
  }) => {
    const user = owner()

    user.update({ email: 'ana@mail.com' }, CHANGED)

    assert.deepInclude(user.snapshot(), {
      email: 'ana@mail.com',
      updatedAt: null,
    })
    assert.isFalse(user.credentials().revokeSessions)
  })

  test('a new password is held in plain text for the repository and asks to revoke the sessions', ({
    assert,
  }) => {
    const user = owner()

    user.update({ password: 'Nova@1234' }, CHANGED)

    assert.deepInclude(user.snapshot(), {
      password: 'Nova@1234',
      email: 'ana@mail.com',
      updatedAt: CHANGED,
    })
    assert.isTrue(user.credentials().revokeSessions)
  })

  test('an empty patch changes nothing', ({ assert }) => {
    const user = owner()

    user.update({}, CHANGED)

    assert.deepInclude(user.snapshot(), {
      password: '$argon2id$stored',
      updatedAt: null,
    })
    assert.isFalse(user.credentials().revokeSessions)
  })

  test('a rehydrated account never asks to revoke the sessions', ({
    assert,
  }) => {
    assert.isFalse(owner().credentials().revokeSessions)
  })
})
