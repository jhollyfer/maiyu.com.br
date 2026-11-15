// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fromPartial } from '@total-typescript/shoehorn'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type * as Http from '#/integrations/tanstack-query/http'
import type { Api, ApiCall } from '#/integrations/tanstack-query/http'
import { m } from '#/paraglide/messages'
import { PLATFORM_ROLE } from '@maiyu/shared'
import type {
  AccountProfileShowResponse,
  AccountProfileUpdateResponse,
} from '@maiyu/shared'

import { AccountProfileForm } from './account-profile-form'

const invalidate = vi.fn()
const request =
  vi.fn<(call: ApiCall) => Promise<AccountProfileUpdateResponse>>()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate }),
  // Bloquear a navegação não é o assunto: exige um router montado.
  useBlocker: vi.fn(),
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
}))
vi.mock('#/integrations/tanstack-query/http', async (importOriginal) => ({
  ...(await importOriginal<typeof Http>()),
  request: (_schema: unknown, call: ApiCall) => request(call),
}))

const ACCOUNT: AccountProfileShowResponse = {
  id: '0f1e2d3c-4b5a-4987-8a6b-5c4d3e2f1a01',
  name: 'Ana Maria',
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  avatar: null,
  tenant: null,
}

const QUERY_CLIENT = new QueryClient()

/** O rótulo de campo obrigatório leva a marca e o "(obrigatório)" lido pelo leitor de tela. */
const LABEL_WITH_MARK = { exact: false }

beforeEach(() => {
  invalidate.mockReset()
  request.mockReset()
  vi.mocked(toast.info).mockReset()
  request.mockResolvedValue({ ...ACCOUNT, pendingEmail: null })
})

function renderForm(): void {
  render(
    <QueryClientProvider client={QUERY_CLIENT}>
      <AccountProfileForm account={ACCOUNT} />
    </QueryClientProvider>,
  )
}

/** O corpo que a mutation mandou no PUT: roda o `ApiCall` contra um cliente que só anota. */
async function sentBody(): Promise<unknown> {
  const put = vi.fn()
  await request.mock.calls[0]?.[0](fromPartial<Api>({ put }))

  return put.mock.calls[0]?.[1]
}

describe('AccountProfileForm', () => {
  it('abre com o nome da conta, o e-mail não se edita aqui', () => {
    renderForm()

    expect(
      screen.getByLabelText<HTMLInputElement>(
        m.kit_profile_name(),
        LABEL_WITH_MARK,
      ).value,
    ).toBe('Ana Maria')
    expect(screen.queryByLabelText(/e-?mail/i)).toBeNull()
  })

  it('sem a senha atual, marca o campo e não chama a API', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.click(screen.getByRole('button', { name: m.kit_save() }))

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0)
    expect(request).not.toHaveBeenCalled()
  })

  it('trocar só o nome manda o nome e a senha atual, e recarrega o router para a guarda reler a conta', async () => {
    const user = userEvent.setup()
    renderForm()

    const name = screen.getByLabelText(m.kit_profile_name(), LABEL_WITH_MARK)
    await user.clear(name)
    await user.type(name, 'Ana Souza')
    await user.type(
      screen.getByLabelText(m.kit_profile_current_password(), LABEL_WITH_MARK),
      'SenhaAtual#1',
    )
    await user.click(screen.getByRole('button', { name: m.kit_save() }))

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1))
    expect(await sentBody()).toEqual({
      body: { name: 'Ana Souza', currentPassword: 'SenhaAtual#1' },
    })
    expect(toast.info).not.toHaveBeenCalled()
  })

  it('trocar a senha avisa que a entrada será pedida de novo', async () => {
    const user = userEvent.setup()
    renderForm()

    await user.type(
      screen.getByLabelText(m.kit_profile_new_password()),
      'NovaSenha#2026',
    )
    await user.type(
      screen.getByLabelText(m.kit_profile_password_confirmation()),
      'NovaSenha#2026',
    )
    await user.type(
      screen.getByLabelText(m.kit_profile_current_password(), LABEL_WITH_MARK),
      'SenhaAtual#1',
    )
    await user.click(screen.getByRole('button', { name: m.kit_save() }))

    await waitFor(() =>
      expect(toast.info).toHaveBeenCalledWith(m.kit_profile_sign_in_again()),
    )
    expect(await sentBody()).toMatchObject({
      body: {
        password: 'NovaSenha#2026',
        passwordConfirmation: 'NovaSenha#2026',
      },
    })
  })
})
