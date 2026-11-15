import { expect, test } from 'vitest'

import { AccountProfilePayload } from './account-profile-payload'
import type { AccountProfileFormValues } from './account-profile-payload'

const VALUES: AccountProfileFormValues = {
  name: 'Ana Maria',
  phone: '',
  password: '',
  passwordConfirmation: '',
  currentPassword: 'SenhaAtual#1',
}

test('o que ficou em branco fica fora do corpo: nome e senha atual vão sempre', () => {
  expect(AccountProfilePayload.of(VALUES)).toEqual({
    name: 'Ana Maria',
    currentPassword: 'SenhaAtual#1',
  })
})

test('celular e senha nova entram quando preenchidos, a senha com a confirmação', () => {
  expect(
    AccountProfilePayload.of({
      ...VALUES,
      phone: '97991234567',
      password: 'NovaSenha#2026',
      passwordConfirmation: 'NovaSenha#2026',
    }),
  ).toEqual({
    name: 'Ana Maria',
    phone: '97991234567',
    password: 'NovaSenha#2026',
    passwordConfirmation: 'NovaSenha#2026',
    currentPassword: 'SenhaAtual#1',
  })
})

test('o validator do shared aceita o formulário só com o nome e a senha atual', () => {
  expect(AccountProfilePayload.Validator.safeParse(VALUES).success).toBe(true)
})

test('sem a senha atual o erro cai no campo dela, pela regra única do shared', () => {
  const result = AccountProfilePayload.Validator.safeParse({
    ...VALUES,
    currentPassword: '',
  })

  expect(result.success).toBe(false)
  expect(result.error?.issues.map((issue) => issue.path)).toContainEqual([
    'currentPassword',
  ])
})

test('nome em branco é erro no campo do nome', () => {
  const result = AccountProfilePayload.Validator.safeParse({
    ...VALUES,
    name: '',
  })

  expect(result.error?.issues.map((issue) => issue.path)).toContainEqual([
    'name',
  ])
})

test('senha nova sem a confirmação igual é erro na confirmação', () => {
  const result = AccountProfilePayload.Validator.safeParse({
    ...VALUES,
    password: 'NovaSenha#2026',
    passwordConfirmation: 'Outra#2026x',
  })

  expect(result.error?.issues.map((issue) => issue.path)).toContainEqual([
    'passwordConfirmation',
  ])
})
