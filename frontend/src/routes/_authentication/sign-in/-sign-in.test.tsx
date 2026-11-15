// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { m } from '#/paraglide/messages'

import { Route } from './index.lazy'

const footer = vi.hoisted(() => ({ content: '' }))

vi.mock('./-sign-in-footer', () => ({
  SignInFooter: () => footer.content && <p>{footer.content}</p>,
}))
// O formulário tem teste próprio; aqui o assunto é o que a tela põe ao redor dele.
vi.mock('#/components/common/sign-in-form/sign-in-form', () => ({
  SignInForm: () => <form aria-label="entrada" />,
}))

function renderScreen(): void {
  const Screen = Route.options.component
  if (!Screen) throw new Error('a rota da entrada não tem componente')
  render(<Screen />)
}

describe('tela de entrada', () => {
  it('rodapé vazio: depois do formulário não há nada', () => {
    footer.content = ''
    renderScreen()

    expect(
      screen.getByRole('heading', { name: m.kit_sign_in_title() }),
    ).toBeTruthy()
    const form = screen.getByRole('form', { name: 'entrada' })
    expect(form.nextSibling).toBeNull()
  })

  it('rodapé do projeto: aparece logo abaixo do formulário', () => {
    footer.content = 'Ainda não tem conta?'
    renderScreen()

    const form = screen.getByRole('form', { name: 'entrada' })
    expect(form.nextSibling?.textContent).toBe('Ainda não tem conta?')
  })
})
