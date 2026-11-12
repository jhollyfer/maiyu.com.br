import { test } from '@japa/runner'

import { PLATFORM_ROLE } from '@maiyu/shared'

import { User } from '#domain/user/user.entity'
import { rightOf } from '#tests/either-fixtures'

const BASE = {
  id: 'u1',
  name: 'Ana',
  password: 'Senha@123',
  platformRole: PLATFORM_ROLE.USER,
  now: new Date('2026-11-11T12:00:00Z'),
}

test.group('domain > user (unit)', () => {
  test('an account with only an e-mail, or only a phone, is born', ({
    assert,
  }) => {
    const byEmail = rightOf(User.create({ ...BASE, email: 'ana@mail.com' }))
    const byPhone = rightOf(User.create({ ...BASE, phone: '+5597991234567' }))

    assert.deepInclude(byEmail.snapshot(), {
      email: 'ana@mail.com',
      phone: null,
    })
    assert.deepInclude(byPhone.snapshot(), {
      email: null,
      phone: '+5597991234567',
    })
  })

  test('an account without a name, or with a blank one, is refused', ({
    assert,
  }) => {
    for (const name of ['', '   '])
      assert.deepEqual(
        User.create({ ...BASE, name, email: 'ana@mail.com' }).value,
        { code: 'USER_NAME_EMPTY' },
      )
  })

  test('an account with neither is refused', ({ assert }) => {
    for (const contact of [{}, { email: null, phone: null }])
      assert.deepEqual(User.create({ ...BASE, ...contact }).value, {
        code: 'USER_CONTACT_REQUIRED',
      })
  })
})
