import { describe, expect, it } from 'vitest'

import { ValidationFixture } from '../../validation-fixtures.js'
import {
  AuthenticationSessionSignInValidator,
  LoginIdentity,
} from './sessions.validator.js'

describe('AuthenticationSessionSignInValidator', () => {
  it('when given an email or a phone as login, it accepts both, without demanding the password policy', () => {
    for (const login of ['ana@exemplo.com', '(97) 99123-4567']) {
      const result = AuthenticationSessionSignInValidator.safeParse({
        login,
        password: 'abc',
      })

      expect(result.success).toBe(true)
    }
  })

  it('when the login is absent and the password absent, it refuses them, in Portuguese', () => {
    const result = AuthenticationSessionSignInValidator.safeParse({})

    expect(ValidationFixture.messages(result)).toEqual([
      { field: 'login', message: 'Informe o e-mail ou o celular' },
      { field: 'password', message: 'Informe a senha' },
    ])
  })

  it('when the password is blank, it treats it as absent', () => {
    const result = AuthenticationSessionSignInValidator.safeParse({
      login: 'ana@exemplo.com',
      password: '',
    })

    expect(ValidationFixture.messages(result)).toEqual([
      { field: 'password', message: 'Informe a senha' },
    ])
  })
})

describe('LoginIdentity', () => {
  it('when the login has an @, it is an email, lowercase and trimmed', () => {
    expect(LoginIdentity.of('  Ana@Exemplo.com ')).toEqual({
      kind: 'email',
      value: 'ana@exemplo.com',
    })
  })

  it('when the login has no @, it is a phone in E.164', () => {
    expect(LoginIdentity.of('(97) 99123-4567')).toEqual({
      kind: 'phone',
      value: '+5597991234567',
    })
  })
})
