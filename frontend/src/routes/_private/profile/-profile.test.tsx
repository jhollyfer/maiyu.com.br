// @vitest-environment jsdom

import type * as Router from '@tanstack/react-router'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { m } from '#/paraglide/messages'
import { PLATFORM_ROLE } from '@maiyu/shared'
import type { AccountProfileShowResponse } from '@maiyu/shared'

import { Route } from './index.lazy'

const ACCOUNT: AccountProfileShowResponse = {
  id: '0f1e2d3c-4b5a-4987-8a6b-5c4d3e2f1a01',
  name: 'Ana Maria',
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  avatar: null,
  tenant: null,
}

const extra = vi.hoisted(() => ({
  content: '',
  received: new Array<unknown>(),
}))

vi.mock('@tanstack/react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof Router>()),
  // A sessão é do `_private`: aqui só a conta que o portão já pôs no contexto.
  getRouteApi: () => ({ useRouteContext: () => ({ account: ACCOUNT }) }),
}))
vi.mock('./-profile-extra', () => ({
  ProfileExtra: ({ account }: { account: AccountProfileShowResponse }) => {
    extra.received.push(account)
    return extra.content && <p>{extra.content}</p>
  },
}))
// O formulário tem teste próprio; aqui o assunto é o que a tela põe ao redor dele.
vi.mock(
  '#/components/common/account-profile-form/account-profile-form',
  () => ({ AccountProfileForm: () => <form aria-label="perfil" /> }),
)

function renderScreen(): void {
  const Screen = Route.options.component
  if (!Screen) throw new Error('a rota do perfil não tem componente')
  render(<Screen />)
}

describe('tela do perfil', () => {
  it('ponto do projeto vazio: depois do formulário não há nada', () => {
    extra.content = ''
    renderScreen()

    expect(
      screen.getByRole('heading', { name: m.kit_profile_title() }),
    ).toBeTruthy()
    const form = screen.getByRole('form', { name: 'perfil' })
    expect(form.nextSibling).toBeNull()
  })

  it('ponto do projeto preenchido: aparece logo abaixo do formulário e recebe a conta da sessão', () => {
    extra.content = 'Área do entregador'
    extra.received.length = 0
    renderScreen()

    const form = screen.getByRole('form', { name: 'perfil' })
    expect(form.nextSibling?.textContent).toBe('Área do entregador')
    expect(extra.received).toContain(ACCOUNT)
  })
})
