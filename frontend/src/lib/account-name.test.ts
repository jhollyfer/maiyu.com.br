import { expect, test } from 'vitest'

import { AccountName } from './account-name'

test('iniciais do primeiro e do último nome, em maiúscula', () => {
  expect(AccountName.initials('Ana Maria Souza')).toBe('AS')
  expect(AccountName.initials('  joão   silva ')).toBe('JS')
})

test('uma palavra dá uma letra, e nome vazio dá vazio', () => {
  expect(AccountName.initials('Ana')).toBe('A')
  expect(AccountName.initials('   ')).toBe('')
})
