import { describe, expect, it } from 'vitest'

import { ValidationFixture } from '../../validation-fixtures.js'
import { AccountProfileUpdateValidator } from './profile.validator.js'

describe('AccountProfileUpdateValidator', () => {
  it('when the body carries only the phone and the current password, it is enough', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      phone: '(97) 99123-4567',
      currentPassword: 'Senha@123',
    })

    expect(result.success).toBe(true)
    expect(result.data?.phone).toBe('+5597991234567')
  })

  it('when the body changes the phone without the current password, it asks for it', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      phone: '(97) 99123-4567',
    })

    expect(ValidationFixture.fields(result)).toEqual(['currentPassword'])
  })

  it('when the body changes nothing, it asks for the name, the phone, the password or the e-mail', () => {
    const result = AccountProfileUpdateValidator.safeParse({})

    expect(ValidationFixture.fields(result)).toEqual([
      'email',
      'name',
      'password',
      'phone',
    ])
  })

  it('when the phone is not a Brazilian number, it refuses at the field', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      phone: '123',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['phone'])
  })

  it('when the body carries only the avatar (or null to remove it), it is enough', () => {
    const avatarId = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'

    expect(
      AccountProfileUpdateValidator.safeParse({
        avatarId,
        currentPassword: 'Senha@123',
      }).success,
    ).toBe(true)
    expect(
      AccountProfileUpdateValidator.safeParse({
        avatarId: null,
        currentPassword: 'Senha@123',
      }).success,
    ).toBe(true)
  })

  it('when the avatar is not a uuid, it refuses at the field', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      avatarId: 'abc',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['avatarId'])
  })

  it('when the body carries a new e-mail, it lowercases it and asks for the current password', () => {
    const ok = AccountProfileUpdateValidator.safeParse({
      email: 'Nova@Mail.com',
      currentPassword: 'Senha@123',
    })

    expect(ok.data?.email).toBe('nova@mail.com')
    expect(
      ValidationFixture.fields(
        AccountProfileUpdateValidator.safeParse({ email: 'nova@mail.com' }),
      ),
    ).toEqual(['currentPassword'])
  })

  it('when the e-mail is not an address, it refuses at the field', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      email: 'nova',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['email'])
  })
})
