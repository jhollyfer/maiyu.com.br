// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { fromPartial } from '@total-typescript/shoehorn'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import type * as Http from '#/integrations/tanstack-query/http'
import type { Api, ApiCall } from '#/integrations/tanstack-query/http'
import { m } from '#/paraglide/messages'
import { STAFF_USER_ROLES, TENANT_TYPES } from '@maiyu/shared'
import type { AuthenticationTenantsResponse } from '@maiyu/shared'

import { TenantSwitcher } from './tenant-switcher'

const invalidate = vi.fn()
const send = vi.fn<(call: ApiCall) => Promise<void>>()
const request = vi.fn<() => Promise<AuthenticationTenantsResponse>>()

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({ invalidate }),
}))
vi.mock('#/integrations/tanstack-query/http', async (importOriginal) => ({
  ...(await importOriginal<typeof Http>()),
  send: (call: ApiCall) => send(call),
  request: () => request(),
}))

const QUERY_CLIENT = new QueryClient({
  defaultOptions: { queries: { retry: false } },
})

const FIRST = '0f1e2d3c-4b5a-4987-8a6b-5c4d3e2f1a01'
const SECOND = '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d'

// O tipo de tenant é do projeto (`shared/src/enums/tenant-type.ts`): o teste lê um, não o nomeia.
const [type] = TENANT_TYPES
if (!type) throw new Error('TENANT_TYPES has no member')
const [role] = STAFF_USER_ROLES
if (!role) throw new Error('STAFF_USER_ROLES has no member')

const tenant = (id: string, name: string) => ({
  id,
  name,
  slug: name.toLowerCase(),
  type,
  role,
  parentId: null,
  city: { id: SECOND, name: 'Cidade', slug: 'cidade' },
})

beforeEach(() => {
  invalidate.mockReset()
  send.mockReset()
  request.mockReset()
  QUERY_CLIENT.clear()
})

async function openMenu(): Promise<void> {
  render(
    <QueryClientProvider client={QUERY_CLIENT}>
      <DropdownMenu>
        <DropdownMenuTrigger>abrir</DropdownMenuTrigger>
        <DropdownMenuContent>
          <TenantSwitcher />
        </DropdownMenuContent>
      </DropdownMenu>
    </QueryClientProvider>,
  )
  await userEvent.setup().click(screen.getByRole('button', { name: 'abrir' }))
}

describe('TenantSwitcher', () => {
  it('com um vínculo só não há o que escolher: nada aparece', async () => {
    request.mockResolvedValue({
      activeId: FIRST,
      data: [tenant(FIRST, 'Alfa')],
    })

    await openMenu()

    await waitFor(() => expect(request).toHaveBeenCalled())
    expect(screen.queryByText(m.kit_tenant_switcher_label())).toBeNull()
  })

  it('com dois lista os vínculos e marca o ativo', async () => {
    request.mockResolvedValue({
      activeId: FIRST,
      data: [tenant(FIRST, 'Alfa'), tenant(SECOND, 'Beta')],
    })

    await openMenu()

    expect(
      (await screen.findByRole('menuitemradio', { name: 'Alfa' })).getAttribute(
        'aria-checked',
      ),
    ).toBe('true')
    expect(
      screen
        .getByRole('menuitemradio', { name: 'Beta' })
        .getAttribute('aria-checked'),
    ).toBe('false')
  })

  it('escolher outro manda o PUT do vínculo e recarrega o router, onde a guarda relê a conta', async () => {
    send.mockResolvedValue(undefined)
    request.mockResolvedValue({
      activeId: FIRST,
      data: [tenant(FIRST, 'Alfa'), tenant(SECOND, 'Beta')],
    })
    await openMenu()

    await userEvent
      .setup()
      .click(await screen.findByRole('menuitemradio', { name: 'Beta' }))

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1))
    const call = send.mock.calls[0]?.[0]
    const put = vi.fn()
    await call?.(fromPartial<Api>({ put }))
    expect(put).toHaveBeenCalledWith('/authentication/tenants/active', {
      body: { tenantId: SECOND },
    })
  })
})
