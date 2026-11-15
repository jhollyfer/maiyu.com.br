// @vitest-environment jsdom
import { useNavigate } from '@tanstack/react-router'
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { describe, expect, it } from 'vitest'

import { renderWithRouter } from '#/lib/render-with-router'

import { FormShellLeaveGuard } from './form-shell-leave-guard'

type Values = { name: string }

function EditPage(): React.JSX.Element {
  const form = useForm<Values>({ defaultValues: { name: '' } })
  const navigate = useNavigate()
  return (
    <>
      <input aria-label="Nome" {...form.register('name')} />
      <button
        type="button"
        onClick={() => {
          form.reset(form.getValues())
          void navigate({ to: '/health-check' })
        }}
      >
        Salvar
      </button>
      <button
        type="button"
        onClick={() => void navigate({ to: '/health-check' })}
      >
        Voltar
      </button>
      <FormShellLeaveGuard form={form} />
    </>
  )
}

function renderAt(): () => string {
  return renderWithRouter(
    [
      { path: '/groups/new', component: EditPage },
      {
        path: '/health-check',
        component: (): React.JSX.Element => <p>Lista</p>,
      },
    ],
    '/groups/new',
  )
}

describe('FormShellLeaveGuard', () => {
  it('leaves a pristine form without asking', async () => {
    const user = userEvent.setup()
    renderAt()

    await user.click(await screen.findByRole('button', { name: 'Voltar' }))

    expect(await screen.findByText('Lista')).toBeTruthy()
  })

  it('asks before leaving a dirty form, and stays on cancel', async () => {
    const user = userEvent.setup()
    const pathname = renderAt()

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(
      await screen.findByRole('alertdialog', { name: 'Sair sem salvar?' }),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Continuar editando' }))
    await act(async () => {})

    expect(pathname()).toBe('/groups/new')
  })

  it('leaves after confirming', async () => {
    const user = userEvent.setup()
    renderAt()

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    await user.click(
      await screen.findByRole('button', { name: 'Sair sem salvar' }),
    )

    expect(await screen.findByText('Lista')).toBeTruthy()
  })

  it('does not ask on the way out after saving', async () => {
    const user = userEvent.setup()
    renderAt()

    await user.type(await screen.findByLabelText('Nome'), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Lista')).toBeTruthy()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })
})
