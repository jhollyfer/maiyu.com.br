// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type * as Http from '#/integrations/tanstack-query/http'
import type { ApiCall } from '#/integrations/tanstack-query/http'
import {
  HTTPError,
  HTTPErrorCode,
  HTTPStatus,
} from '#/integrations/tanstack-query/http'
import { m } from '#/paraglide/messages'

import { SignInForm } from './sign-in-form'

const invalidate = vi.fn()
const send = vi.fn<(call: ApiCall) => Promise<void>>()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate }),
  // Bloquear a navegação não é o assunto: exige um router montado.
  useBlocker: vi.fn(),
}))
vi.mock('#/integrations/tanstack-query/http', async (importOriginal) => ({
  ...(await importOriginal<typeof Http>()),
  send: (call: ApiCall) => send(call),
}))

beforeEach(() => {
  invalidate.mockReset()
  send.mockReset()
})

const QUERY_CLIENT = new QueryClient()

function renderForm(): void {
  render(
    <QueryClientProvider client={QUERY_CLIENT}>
      <SignInForm />
    </QueryClientProvider>,
  )
}

async function fillAndSubmit(): Promise<void> {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(m.kit_sign_in_login()), 'ana@mail.com')
  await user.type(
    screen.getByLabelText(m.kit_sign_in_password()),
    'SenhaCerta#1',
  )
  await user.click(screen.getByRole('button', { name: m.kit_sign_in_submit() }))
}

function failure(status: number, code: string): HTTPError {
  return new HTTPError({ message: 'do servidor', status, code })
}

describe('SignInForm', () => {
  it('posta a credencial e deixa o destino para a guarda do layout, relendo o router', async () => {
    send.mockResolvedValue(undefined)
    renderForm()

    await fillAndSubmit()

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1))
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('sem preencher nada, marca os dois campos e não chama a API', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(
      screen.getByRole('button', { name: m.kit_sign_in_submit() }),
    )

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
    expect(send).not.toHaveBeenCalled()
  })

  it('credencial errada mostra a mensagem do kit, sem dizer qual campo falhou', async () => {
    send.mockRejectedValue(
      failure(HTTPStatus.UNAUTHORIZED, HTTPErrorCode.INVALID_CREDENTIALS),
    )
    renderForm()

    await fillAndSubmit()

    const alert = await screen.findByTestId('sign-in-error')
    expect(alert.textContent).toContain(m.kit_sign_in_invalid_credentials())
    expect(invalidate).not.toHaveBeenCalled()
  })

  it('o limite de tentativas (429) tem mensagem própria', async () => {
    send.mockRejectedValue(failure(HTTPStatus.TOO_MANY_REQUESTS, 'THROTTLED'))
    renderForm()

    await fillAndSubmit()

    const alert = await screen.findByTestId('sign-in-error')
    expect(alert.textContent).toContain(m.kit_sign_in_too_many_attempts())
  })
})
