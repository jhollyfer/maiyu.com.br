import { describe, expect, it } from 'vitest'

import { ValidationFixture } from '../../validation-fixtures.js'
import { AccountProfileUpdateValidator } from './profile.validator.js'

const NEW_PASSWORD = 'Nova@1234'

describe('AccountProfileUpdateValidator', () => {
  it('when the body has a new email and the current password, it accepts it', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      email: 'dono@exemplo.com',
      currentPassword: 'Senha@123',
    })

    expect(result.success).toBe(true)
  })

  it('when the body has a new password, its confirmation and the current password, it accepts it', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      password: NEW_PASSWORD,
      passwordConfirmation: NEW_PASSWORD,
      currentPassword: 'Senha@123',
    })

    expect(result.success).toBe(true)
  })

  it('when the body has neither email nor password, it refuses both fields', () => {
    const result = AccountProfileUpdateValidator.safeParse({})

    expect(ValidationFixture.fields(result)).toEqual(['email', 'password'])
  })

  it('when the body only carries the current password, it refuses the body', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['email', 'password'])
  })

  it('when the email changes without the current password, it refuses the current password', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      email: 'dono@exemplo.com',
    })

    expect(ValidationFixture.messages(result)).toEqual([
      { field: 'currentPassword', message: 'Informe a senha atual' },
    ])
  })

  it('when the password changes without the current password, it refuses the current password', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      password: NEW_PASSWORD,
      passwordConfirmation: NEW_PASSWORD,
    })

    expect(ValidationFixture.fields(result)).toEqual(['currentPassword'])
  })

  it('when the new password breaks the policy, it refuses the password', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      password: 'fraca',
      passwordConfirmation: 'fraca',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['password'])
  })

  it('when the confirmation differs from the new password, it refuses the confirmation', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      password: NEW_PASSWORD,
      passwordConfirmation: 'Outra@1234',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.messages(result)).toEqual([
      { field: 'passwordConfirmation', message: 'As senhas não são iguais' },
    ])
  })

  it('when the email is malformed, it refuses the email', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      email: 'dono',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['email'])
  })

  it('when the email is blank, it reads it as missing and refuses it as required', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      email: '',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.messages(result)).toEqual([
      { field: 'email', message: 'Informe o e-mail' },
    ])
  })
})
