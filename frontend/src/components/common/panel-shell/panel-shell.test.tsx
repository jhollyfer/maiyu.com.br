// @vitest-environment jsdom

import { UserCircleIcon } from '@phosphor-icons/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '#/components/common/theme/theme-provider'
import { TooltipProvider } from '#/components/ui/tooltip'
import type * as Http from '#/integrations/tanstack-query/http'
import type { ApiCall } from '#/integrations/tanstack-query/http'
import type { PanelMenuGroup } from '#/lib/panel-menu'
import { renderWithRouter } from '#/lib/render-with-router'
import { m } from '#/paraglide/messages'
import { PLATFORM_ROLE, STAFF_USER_ROLES } from '@maiyu/shared'
import type { AccountProfileShowResponse } from '@maiyu/shared'

import { PanelShell, PanelShellContent, PanelShellInset } from './panel-shell'
import { PanelShellHeader } from './panel-shell-header'
import { PanelShellSidebar } from './panel-shell-sidebar'

const send = vi.fn<(call: ApiCall) => Promise<void>>()

vi.mock('#/integrations/tanstack-query/http', async (importOriginal) => ({
  ...(await importOriginal<typeof Http>()),
  send: (call: ApiCall) => send(call),
  // O seletor de vínculo lê a lista quando o menu abre: uma conta com um vínculo só, sem seletor.
  request: () => Promise.resolve({ activeId: null, data: [] }),
}))

const QUERY_CLIENT = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const [staff] = STAFF_USER_ROLES
if (!staff) throw new Error('STAFF_USER_ROLES has no member')

const ACCOUNT: AccountProfileShowResponse = {
  id: '0f1e2d3c-4b5a-4987-8a6b-5c4d3e2f1a01',
  name: 'Ana Maria Souza',
  email: 'ana@mail.com',
  phone: null,
  platformRole: PLATFORM_ROLE.USER,
  avatar: null,
  tenant: { id: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d', role: staff },
}

const item = (
  label: string,
  area?: PanelMenuGroup['items'][number]['area'],
) => ({ to: '/profile' as const, label, icon: UserCircleIcon, area })

const MENU: ReadonlyArray<PanelMenuGroup> = [
  {
    label: 'Operação',
    // Os dois destinos são o `/profile` que o router de teste tem: só o filtro por área está em jogo.
    items: [item('Meu perfil'), item('Só da plataforma', { platform: [] })],
  },
]

beforeEach(() => {
  send.mockReset()
  // O `useIsMobile` do `ui/sidebar` lê `matchMedia`, que o jsdom não tem.
  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
})

function Shell({
  badges,
}: Readonly<{ badges?: Record<string, number> }>): React.JSX.Element {
  return (
    <QueryClientProvider client={QUERY_CLIENT}>
      <ThemeProvider theme="system">
        <TooltipProvider>
          <PanelShell account={ACCOUNT} menu={MENU} badges={badges}>
            <PanelShellSidebar />
            <PanelShellInset>
              <PanelShellHeader />
              <PanelShellContent>o conteúdo da tela</PanelShellContent>
            </PanelShellInset>
          </PanelShell>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

function mount(badges?: Record<string, number>): () => string {
  return renderWithRouter(
    [
      { path: '/profile', component: () => <Shell badges={badges} /> },
      { path: '/sign-in', component: () => <p>entrada</p> },
    ],
    '/profile',
  )
}

describe('PanelShell', () => {
  it('o link de pular leva ao main, e o conteúdo da tela está nele', async () => {
    mount()

    const skip = await screen.findByRole('link', {
      name: m.kit_panel_skip_to_content(),
    })
    expect(skip.getAttribute('href')).toBe('#main-content')
    const main = screen.getByRole('main')
    expect(main.id).toBe('main-content')
    expect(within(main).getByText('o conteúdo da tela')).toBeTruthy()
  })

  it('o menu é filtrado pela conta: o item de área que ela não tem não aparece', async () => {
    mount()

    const navigation = await screen.findByRole('navigation', {
      name: m.kit_panel_navigation(),
    })

    expect(within(navigation).getByText('Meu perfil')).toBeTruthy()
    expect(within(navigation).queryByText('Só da plataforma')).toBeNull()
  })

  it('o item da rota aberta é anunciado como a página atual', async () => {
    mount()

    const navigation = await screen.findByRole('navigation', {
      name: m.kit_panel_navigation(),
    })

    expect(
      within(navigation)
        .getByRole('link', { name: 'Meu perfil' })
        .getAttribute('aria-current'),
    ).toBe('page')
  })

  it('o contador do projeto aparece no item pelo `to`', async () => {
    mount({ '/profile': 7 })

    const navigation = await screen.findByRole('navigation', {
      name: m.kit_panel_navigation(),
    })

    expect(within(navigation).getByText('7')).toBeTruthy()
  })

  it('o menu de conta mostra quem é e leva ao perfil', async () => {
    const user = userEvent.setup()
    mount()

    await user.click(
      await screen.findByRole('button', { name: /Menu da conta/ }),
    )

    expect(await screen.findByText('ana@mail.com')).toBeTruthy()
    expect(
      screen
        .getByRole('menuitem', { name: m.kit_panel_my_profile() })
        .getAttribute('href'),
    ).toBe('/profile')
  })

  it('sair pede confirmação: nada é enviado antes, e confirmar encerra a sessão e vai para a entrada', async () => {
    send.mockResolvedValue(undefined)
    const user = userEvent.setup()
    const pathname = mount()

    await user.click(
      await screen.findByRole('button', { name: /Menu da conta/ }),
    )
    await user.click(
      await screen.findByRole('menuitem', { name: m.kit_sign_out() }),
    )

    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText(m.kit_sign_out_title())).toBeTruthy()
    expect(send).not.toHaveBeenCalled()

    await user.click(
      within(dialog).getByRole('button', { name: m.kit_sign_out() }),
    )

    await waitFor(() => expect(pathname()).toBe('/sign-in'))
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('cancelar a saída não envia nada e fica na tela', async () => {
    const user = userEvent.setup()
    const pathname = mount()

    await user.click(
      await screen.findByRole('button', { name: /Menu da conta/ }),
    )
    await user.click(
      await screen.findByRole('menuitem', { name: m.kit_sign_out() }),
    )
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', {
        name: m.kit_cancel(),
      }),
    )

    expect(send).not.toHaveBeenCalled()
    expect(pathname()).toBe('/profile')
  })
})
