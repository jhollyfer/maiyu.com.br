// @vitest-environment jsdom

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'

import { FormShell } from '#/components/common/form-shell/form-shell'
import {
  FormShellCard,
  FormShellContent,
} from '#/components/common/form-shell/form-shell-content'
import {
  FormShellActions,
  FormShellBack,
  FormShellDiscard,
  FormShellHeader,
  FormShellSubmit,
  FormShellTitle,
} from '#/components/common/form-shell/form-shell-header'
import { m } from '#/paraglide/messages'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: Readonly<{ to: string; children: React.ReactNode }>) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

function renderForm(
  isPending: boolean,
  onSubmit: React.ComponentProps<'form'>['onSubmit'] = undefined,
) {
  render(
    <FormShell formId="turma" backTo="/health-check" isPending={isPending}>
      <FormShellHeader>
        <FormShellBack />
        <FormShellTitle>Nova turma</FormShellTitle>
        <FormShellActions>
          <FormShellDiscard />
          <FormShellSubmit />
        </FormShellActions>
      </FormShellHeader>
      <FormShellContent onSubmit={onSubmit}>
        <FormShellCard>
          <label>
            Nome
            <input name="name" />
          </label>
        </FormShellCard>
      </FormShellContent>
    </FormShell>,
  )
}

describe('FormShell', () => {
  it('when the arrow and Descartar are used, go back to the same destination', () => {
    renderForm(false)

    expect(
      screen.getByRole('link', { name: m.kit_back() }).getAttribute('href'),
    ).toBe('/health-check')
    expect(
      screen.getByRole('link', { name: m.kit_discard() }).getAttribute('href'),
    ).toBe('/health-check')
  })

  it('renders the title as the h1 and points Salvar at the shell form', () => {
    renderForm(false)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Nova turma' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: m.kit_save() }).getAttribute('form'),
    ).toBe('turma')
  })

  it('when the header Salvar is clicked, submits the scrolling form', async () => {
    const onSubmit = vi.fn((event: React.SyntheticEvent) => {
      event.preventDefault()
    })
    renderForm(false, onSubmit)

    await userEvent.click(screen.getByRole('button', { name: m.kit_save() }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('when the mutation is in flight, locks Salvar', () => {
    renderForm(true)

    expect(
      screen
        .getByRole('button', { name: new RegExp(m.kit_save()) })
        .hasAttribute('disabled'),
    ).toBe(true)
  })

  it('renders the form as post, so a native submit puts no field in the URL', () => {
    renderForm(false)

    expect(
      screen.getByRole('textbox', { name: 'Nome' }).closest('form')?.method,
    ).toBe('post')
  })
})
