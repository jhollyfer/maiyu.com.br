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

  it('when the body changes nothing, it asks for the name, the phone or the password', () => {
    const result = AccountProfileUpdateValidator.safeParse({})

    expect(ValidationFixture.fields(result)).toEqual([
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
})
