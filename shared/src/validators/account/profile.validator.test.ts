import { describe, expect, it } from 'vitest'

import { ValidationFixture } from '../../validation-fixtures.js'
import { AccountProfileUpdateValidator } from './profile.validator.js'

const NEW_PASSWORD = 'Nova@1234'

describe('AccountProfileUpdateValidator', () => {
  it('when the body has a new name and the current password, it accepts it', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      name: 'Dono Novo',
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

  it('when the body has neither name nor password, it refuses both fields', () => {
    const result = AccountProfileUpdateValidator.safeParse({})

    expect(ValidationFixture.fields(result)).toEqual(['name', 'password'])
  })

  it('when the body only carries the current password, it refuses the body', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['name', 'password'])
  })

  it('when the name changes without the current password, it refuses the current password', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      name: 'Dono Novo',
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

  it('when the name has 120 characters it accepts, and at 121 it refuses the name', () => {
    const accepted = AccountProfileUpdateValidator.safeParse({
      name: 'a'.repeat(120),
      currentPassword: 'Senha@123',
    })
    const refused = AccountProfileUpdateValidator.safeParse({
      name: 'a'.repeat(121),
      currentPassword: 'Senha@123',
    })

    expect(accepted.success).toBe(true)
    expect(ValidationFixture.fields(refused)).toEqual(['name'])
  })

  it('when the name is only spaces, it refuses the name', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      name: '   ',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['name'])
  })

  it('when the body carries an email, it ignores the key', () => {
    const result = AccountProfileUpdateValidator.safeParse({
      email: 'dono@exemplo.com',
      currentPassword: 'Senha@123',
    })

    expect(ValidationFixture.fields(result)).toEqual(['name', 'password'])
  })
})
