// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react'
import { expect, test } from 'vitest'

import { m } from '#/paraglide/messages'

import {
  AuthShell,
  AuthShellContent,
  AuthShellDescription,
  AuthShellHeader,
  AuthShellTitle,
} from './auth-shell'

test('a tela de sessão é a página: um main, o h1 da tela e o crédito da casa', () => {
  render(
    <AuthShell>
      <AuthShellHeader>
        <AuthShellTitle>Entrar</AuthShellTitle>
        <AuthShellDescription>Use sua conta</AuthShellDescription>
      </AuthShellHeader>
      <AuthShellContent>formulário</AuthShellContent>
    </AuthShell>,
  )

  expect(screen.getAllByRole('main')).toHaveLength(1)
  expect(screen.getAllByRole('banner')).toHaveLength(1)
  expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
  // a marca no banner, o cartão no main, o crédito no contentinfo (fora do main)
  expect(screen.getByRole('banner').textContent).toContain(m.brand_name())
  expect(screen.getByRole('main').textContent).toContain('formulário')
  expect(screen.getByRole('main').textContent).not.toMatch(/maiyu/i)
  expect(
    screen.getByRole('contentinfo').querySelector('a')?.getAttribute('href'),
  ).toBe('https://maiyu.com.br')
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Entrar')
  expect(screen.getByText('Use sua conta')).toBeTruthy()
  expect(screen.getByText('formulário')).toBeTruthy()
  expect(
    screen.getByRole('link', { name: /maiyu/i }).getAttribute('href'),
  ).toBe('https://maiyu.com.br')
})

test('a marca do projeto abre a tela', () => {
  render(<AuthShell>x</AuthShell>)

  // No cabeçalho: projeto cuja marca tem o mesmo texto do crédito ("Maiyu") acharia dois.
  expect(
    within(screen.getByRole('banner')).getByText(m.brand_name()),
  ).toBeTruthy()
})
