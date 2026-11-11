// @vitest-environment jsdom
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from '@tanstack/react-router'
import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useForm } from 'react-hook-form'
import { afterEach, describe, expect, it } from 'vitest'

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

// `navigate` type-checks against the registered router, so the list is `/health-check`, a route
// the kit itself brings to every app; the edit path is free, since only `to` is typed.
// Returns the current pathname.
function renderAt(): () => string {
  const root = createRootRoute()
  const edit = createRoute({
    getParentRoute: () => root,
    path: '/groups/new',
    component: EditPage,
  })
  const list = createRoute({
    getParentRoute: () => root,
    path: '/health-check',
    component: (): React.JSX.Element => <p>Lista</p>,
  })
  const router = createRouter({
    routeTree: root.addChildren([edit, list]),
    history: createMemoryHistory({ initialEntries: ['/groups/new'] }),
  })
  render(<RouterProvider router={router} />)
  return (): string => router.state.location.pathname
}

afterEach(cleanup)

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
